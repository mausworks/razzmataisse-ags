import { createState } from "ags";
import { execAsync } from "ags/process";
import AstalApps from "gi://AstalApps?version=0.1";
import GLib from "gi://GLib?version=2.0";

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
  | { type: "command"; id: string; cmd: string; sudo: boolean };

const TOP_N = 10;

const byFrequency = (left: SearchResult, right: SearchResult) =>
  (frequency[right.id] ?? 0) - (frequency[left.id] ?? 0);

const topResults = (): SearchResult[] =>
  Apps.get_list()
    .map((app): SearchResult => ({ type: "app", id: app.entry, app }))
    .sort(byFrequency)
    .slice(0, TOP_N);

const searchApps = (query: string): SearchResult[] =>
  Apps.fuzzy_query(query)
    .slice(0, TOP_N)
    .map((app) => ({ type: "app", id: app.entry, app }) as const);

const HOME = GLib.get_home_dir();

// Directories that are either huge, binary, or not meaningfully "yours" --
// searching them wastes time and buries real results under e.g. toolchain
// caches and browser extension bundles. Bare names (no slash) match
// anywhere in the tree, not just at $HOME's top level.
const IGNORE_GLOBS = [
  "!.git",
  "!.cache",
  "!.local/share/Trash",
  "!node_modules",
  "!.npm",
  "!.cargo",
  "!.rustup",
  "!.bun",
  "!.vscode",
  "!.models",
  "!.ollama",
  "!.docker",
  "!.mozilla",
  "!BraveSoftware",
  "!chromium",
  "!google-chrome",
];

const MAX_FILE_RESULTS = 8;

/**
 * Filenames and file contents under $HOME, via `rg` (not installed by
 * default on this system -- see the user-facing note in SearchWindow.tsx).
 * Both run in parallel; ripgrep exits non-zero on "no matches", which
 * `execAsync` treats as a rejection, so that's swallowed into an empty
 * result rather than surfaced as an error.
 */
const searchFiles = async (query: string): Promise<SearchResult[]> => {
  const globArgs = IGNORE_GLOBS.flatMap((glob) => ["-g", glob]);

  const [names, contents] = await Promise.all([
    execAsync([
      "rg",
      "--files",
      "--hidden",
      "--iglob",
      `*${query}*`,
      ...globArgs,
      HOME,
    ]).catch(() => ""),
    execAsync([
      "rg",
      "--hidden",
      "--files-with-matches",
      "--ignore-case",
      "--max-count=1",
      ...globArgs,
      query,
      HOME,
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

export const runResult = (result: SearchResult) => {
  recordLaunch(result.id);

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
      // `exec $SHELL` after the command keeps the terminal open to show
      // its output/exit status instead of flashing shut immediately.
      execAsync([
        "kitty",
        "sh",
        "-c",
        `${shellCmd}; echo; echo "[exited $?]"; exec $SHELL`,
      ]).catch((err) => console.error(`failed to run ${shellCmd}:`, err));
      break;
    }
  }
};

export const createSearchModel = () => {
  const [query, setQuery] = createState("");
  const [results, setResults] = createState<SearchResult[]>(topResults());

  let debounceTimer: ReturnType<typeof setTimeout> | undefined;
  let searchToken = 0;

  const search = (text: string) => {
    const command = parseCommand(text);
    if (command) {
      setResults([command]);
      return;
    }

    if (!text) {
      setResults(topResults());
      return;
    }

    setResults(searchApps(text));

    if (debounceTimer) clearTimeout(debounceTimer);
    const token = ++searchToken;
    debounceTimer = setTimeout(() => {
      searchFiles(text)
        .then((fileResults) => {
          // A later keystroke already started a newer search -- these
          // results are for a query that's no longer current.
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
