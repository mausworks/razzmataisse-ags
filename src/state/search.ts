import config from "@config";
import { createState } from "ags";
import { execAsync, subprocess } from "ags/process";
import AstalApps from "gi://AstalApps?version=0.1";
import GLib from "gi://GLib?version=2.0";

const { grepCommand, roots, ignoreGlobs, ignoredDesktopEntries } =
  config.search;

/** `*cmake*` -> case-insensitive "contains cmake", not a full glob dialect. */
const globToRegExp = (glob: string): RegExp =>
  new RegExp(
    `^${glob.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*")}$`,
    "i",
  );

const ignoredEntryPatterns = ignoredDesktopEntries.map(globToRegExp);

const isIgnoredApp = (app: AstalApps.Application): boolean =>
  ignoredEntryPatterns.some(
    (pattern) => pattern.test(app.entry) || pattern.test(app.name),
  );

const Apps = new AstalApps.Apps();

const CACHE_DIR = `${GLib.get_user_cache_dir()}/razzmataisse-ags`;
const FREQUENCY_FILE = `${CACHE_DIR}/search-frequency.json`;

/**
 * `AstalApps.Application#frequency` is tracked in-memory by the library and
 * read from this same cache file at startup, but nothing in the library
 * actually writes it back out -- `.launch()` increments it and that's it,
 * so it resets every time the process restarts (which `dev.sh` does on
 * every source change, and happens on every login besides). Tracked here
 * instead, keyed by each result's stable `id`, persisted on every launch.
 */
const loadFrequency = (): Record<string, number> => {
  try {
    const [ok, contents] = GLib.file_get_contents(FREQUENCY_FILE);
    if (!ok) return {};

    return JSON.parse(new TextDecoder().decode(contents));
  } catch {
    return {};
  }
};

const frequency = loadFrequency();

const saveFrequency = () => {
  GLib.mkdir_with_parents(CACHE_DIR, 0o755);
  GLib.file_set_contents(FREQUENCY_FILE, JSON.stringify(frequency));
};

const recordLaunch = (id: string) => {
  frequency[id] = (frequency[id] ?? 0) + 1;
  saveFrequency();
};

export type SearchResult =
  | { type: "app"; id: string; app: AstalApps.Application }
  | { type: "file"; id: string; path: string; matchKind: "name" | "content" }
  | { type: "command"; id: string; cmd: string; sudo: boolean }
  | { type: "calc"; id: string; expression: string; result: string };

const TOP_N = 10;

const byFrequency = (left: SearchResult, right: SearchResult) =>
  (frequency[right.id] ?? 0) - (frequency[left.id] ?? 0);

const topResults = (): SearchResult[] =>
  Apps.get_list()
    .filter((app) => !isIgnoredApp(app))
    .map((app): SearchResult => ({ type: "app", id: app.entry, app }))
    .sort(byFrequency)
    .slice(0, TOP_N);

const searchApps = (query: string): SearchResult[] =>
  Apps.fuzzy_query(query)
    .filter((app) => !isIgnoredApp(app))
    .slice(0, TOP_N)
    .map((app) => ({ type: "app", id: app.entry, app }) as const);

export const HOME = GLib.get_home_dir();

/** `~/foo` -> `/home/maus/foo`; ripgrep itself never expands this. */
const expandRoot = (root: string): string =>
  root === "~"
    ? HOME
    : root.startsWith("~/")
      ? `${HOME}${root.slice(1)}`
      : root;

const searchRoots = roots.map(expandRoot);

const MAX_FILE_RESULTS = 8;

/**
 * Filenames and file contents under `config.search.roots`, via
 * `config.search.grepCommand` (`rg` by default).
 * `grepCommand` only swaps which binary gets run, not the dialect, so it's
 * really "point at a different/renamed ripgrep build" rather than "use any
 * grep-like tool". Both run in parallel; ripgrep exits non-zero on "no
 * matches", which `execAsync` treats as a rejection, so that's swallowed
 * into an empty result rather than surfaced as an error.
 */
const searchFiles = async (query: string): Promise<SearchResult[]> => {
  const globArgs = ignoreGlobs.flatMap((glob) => ["-g", glob]);

  const [names, contents] = await Promise.all([
    execAsync([
      grepCommand,
      "--files",
      "--hidden",
      "--iglob",
      `*${query}*`,
      ...globArgs,
      ...searchRoots,
    ]).catch(() => ""),
    execAsync([
      grepCommand,
      "--hidden",
      "--files-with-matches",
      "--ignore-case",
      "--max-count=1",
      ...globArgs,
      query,
      ...searchRoots,
    ]).catch(() => ""),
  ]);

  const nameMatches = names
    .split("\n")
    .filter(Boolean)
    .slice(0, MAX_FILE_RESULTS);
  const seen = new Set(nameMatches);

  const contentMatches = contents
    .split("\n")
    .filter((path) => path && !seen.has(path))
    .slice(0, MAX_FILE_RESULTS);

  return [
    ...nameMatches.map((path): SearchResult => ({
      type: "file",
      id: `name:${path}`,
      path,
      matchKind: "name",
    })),
    ...contentMatches.map((path): SearchResult => ({
      type: "file",
      id: `content:${path}`,
      path,
      matchKind: "content",
    })),
  ];
};

/** `$<command>` runs it in a terminal; `#<command>` runs it as root. */
const parseCommand = (query: string): SearchResult | null => {
  const sudo = query.startsWith("#");
  if (!sudo && !query.startsWith("$")) return null;

  const cmd = query.slice(1).trim();
  return cmd ? { type: "command", id: `cmd:${cmd}`, cmd, sudo } : null;
};

/**
 * A deliberately narrow allowlist -- digits, the basic arithmetic
 * operators, parens, decimals, and whitespace -- rather than trying to
 * recognize `bc`'s full syntax (variables, functions like `sqrt(...)`,
 * ...). Keeps plain searches (app names, filenames) from ever reaching
 * `bc` at all, which matters more than covering everything `bc` accepts.
 */
const MATH_EXPRESSION = /^[\d\s+\-*/%^().]+$/;

const looksLikeMath = (query: string): boolean =>
  /\d/.test(query) && /[+\-*/%^]/.test(query) && MATH_EXPRESSION.test(query);

/**
 * Pipes `expression` through `bc -l` and resolves its output, or `null` if
 * `bc` produced nothing usable (a parse error, divide-by-zero, etc. go to
 * stderr, not stdout). `bc` is interactive -- it keeps reading from stdin
 * until told to stop -- so the expression is followed by `quit` rather
 * than closing stdin, which `Process` has no way to do from here anyway.
 *
 * The two `write()` calls must be chained, not fired together: `bc`'s
 * stdin is a single `GDataOutputStream`, and a second `write_bytes_async`
 * issued before the first's callback has fired rejects outright instead
 * of queuing.
 */
const evaluateMath = (expression: string): Promise<string | null> =>
  new Promise((resolve) => {
    let output = "";
    let failed = false;

    const proc = subprocess(
      ["bc", "-l", "-q"],
      (stdout) => {
        output += (output ? "\n" : "") + stdout;
      },
      () => {
        failed = true;
      },
    );

    proc.connect("exit", () => {
      resolve(!failed && output.trim() ? output.trim() : null);
    });

    proc
      .write(`${expression}\n`)
      .then(() => proc.write("quit\n"))
      .catch(() => resolve(null));
  });

export const runResult = (result: SearchResult) => {
  if (result.type !== "calc") recordLaunch(result.id);

  switch (result.type) {
    case "app":
      result.app.launch();
      break;
    case "file":
      execAsync(["xdg-open", result.path]).catch((err) =>
        console.error(`failed to open ${result.path}:`, err),
      );
      break;
    case "command": {
      const shellCmd = result.sudo ? `sudo ${result.cmd}` : result.cmd;
      execAsync([
        "kitty",
        "sh",
        "-c",
        `${shellCmd}; echo; echo "[exited $?]"; exec $SHELL`,
      ]).catch((err) => console.error(`failed to run ${shellCmd}:`, err));
      break;
    }
    case "calc":
      execAsync(["wl-copy", result.result]).catch((err) =>
        console.error(`failed to copy ${result.result}:`, err),
      );
      break;
  }
};

export const createLauncherModel = () => {
  const [query, setQuery] = createState("");
  const [results, setResults] = createState<SearchResult[]>(topResults());

  let debounceTimer: ReturnType<typeof setTimeout> | undefined;
  let searchToken = 0;

  const search = (text: string) => {
    if (debounceTimer) clearTimeout(debounceTimer);

    if (text.startsWith("$") || text.startsWith("#")) {
      const command = parseCommand(text);
      setResults(command ? [command] : []);
      return;
    }

    if (!text) {
      setResults(topResults());
      return;
    }

    setResults(searchApps(text));

    const token = ++searchToken;

    if (looksLikeMath(text)) {
      evaluateMath(text)
        .then((result) => {
          if (token !== searchToken || result === null) return;
          setResults((current) => [
            { type: "calc", id: `calc:${text}`, expression: text, result },
            ...current,
          ]);
        })
        .catch((err) => console.error("math evaluation failed:", err));
    }

    debounceTimer = setTimeout(() => {
      searchFiles(text)
        .then((fileResults) => {
          if (token !== searchToken) return;
          setResults((current) => [...current, ...fileResults]);
        })
        .catch((err) => console.error("file search failed:", err));
    }, 200);
  };

  const setText = (text: string) => {
    setQuery(text);
    search(text);
  };

  const reset = () => setText("");

  return { query, results, setText, reset };
};
