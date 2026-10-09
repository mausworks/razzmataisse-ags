import config from "@config";
import { evaluateMathExpression } from "@lib/calculator";
import { copyToClipboard } from "@lib/clipboard";
import { fileSearch } from "@lib/file-search";
import { globToRegExp } from "@lib/glob";
import { execDetached } from "@lib/hyprland";
import { HOME } from "@lib/path";
import { createState } from "ags";
import { timeout, Timer } from "ags/time";
import AstalApps from "gi://AstalApps?version=0.1";
import GioUnix from "gi://GioUnix?version=2.0";
import GLib from "gi://GLib?version=2.0";

const { roots, ignoreGlobs, ignoredDesktopEntries } = config.search;

export type LauncherMode = "search" | "exec" | "calc";

export const LAUNCHER_PREFIX = {
  "!": "exec",
  "=": "calc",
} as Record<string, LauncherMode>;

export const parseLauncherMode = (input: string): LauncherMode =>
  LAUNCHER_PREFIX[input[0]] ?? "search";

const ignoredEntryPatterns = ignoredDesktopEntries.map((pattern) =>
  globToRegExp(pattern, "i"),
);

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

const frequents = loadFrequency();

const saveFrequents = () => {
  GLib.mkdir_with_parents(CACHE_DIR, 0o755);
  GLib.file_set_contents(FREQUENCY_FILE, JSON.stringify(frequents));
};

const recordFrequency = (id: string) => {
  frequents[id] = (frequents[id] ?? 0) + 1;
  saveFrequents();
};

export type AppResult = { type: "app"; id: string; app: AstalApps.Application };

export type ExecResult = {
  type: "exec";
  id: string;
  command: string;
};

export type FileResult = {
  type: "file";
  id: string;
  path: string;
  matchedOn: "name" | "content";
};

export type CalcResult = {
  id: string;
  type: "calc";
  value: string;
};

export type LauncherResult = AppResult | FileResult | ExecResult | CalcResult;

const TOP_N = 10;

const byFrequency = (left: LauncherResult, right: LauncherResult) =>
  (frequents[right.id] ?? 0) - (frequents[left.id] ?? 0);

const getTopResults = (): LauncherResult[] =>
  Apps.get_list()
    .filter((app) => !isIgnoredApp(app))
    .map((app) => ({ type: "app", id: app.entry, app }) as AppResult)
    .sort(byFrequency)
    .slice(0, TOP_N);

const searchApps = (query: string): LauncherResult[] =>
  Apps.fuzzy_query(query)
    .filter((app) => !isIgnoredApp(app))
    .slice(0, TOP_N)
    .map((app) => ({ type: "app", id: app.entry, app }) as AppResult)
    .sort(byFrequency);

/** `~/foo` -> `/home/maus/foo`; (rip)grep itself never expands this. */
const expandRoot = (root: string): string =>
  root === "~"
    ? HOME
    : root.startsWith("~/")
      ? `${HOME}${root.slice(1)}`
      : root;

const searchRoots = roots.map(expandRoot);

const MAX_FILE_RESULTS = 8;

/**
 * Searches file names and file contents under `config.search.roots` via
 * `rg`. Both run in parallel; ripgrep exits non-zero on "no matches",
 * which `execAsync` treats as a rejection, so that's swallowed into an
 * empty result rather than surfaced as an error.
 */
const searchFiles = async (query: string): Promise<FileResult[]> => {
  const [nameMatches, contentMatches] = await Promise.all([
    fileSearch({ glob: `*${query}*`, ignoreGlobs, roots: searchRoots }),
    fileSearch({ content: query, ignoreGlobs, roots: searchRoots }),
  ]);

  const seen = new Set(nameMatches);

  return [
    ...nameMatches.map((path): FileResult => ({
      type: "file",
      id: `name:${path}`,
      path,
      matchedOn: "name",
    })),
    ...contentMatches
      .filter((path) => !seen.has(path))
      .map((path): FileResult => ({
        type: "file",
        id: `content:${path}`,
        path,
        matchedOn: "content",
      })),
  ].slice(0, MAX_FILE_RESULTS);
};

const parseCommand = (command: string): LauncherResult | null => {
  return command ? { type: "exec", id: `cmd:${command}`, command } : null;
};

// `app.app` is broken in AstalApps' GIR, hence the lookup via `entry`.
const launchApp = (app: AstalApps.Application) => {
  const path = GioUnix.DesktopAppInfo.new(app.entry)?.get_filename();

  if (path) execDetached(["gio", "launch", path]);
  else console.error(`no desktop file for ${app.name}`);
};

const launchCommand = (command: string) =>
  execDetached([
    "kitty",
    "sh",
    "-c",
    `${command}; echo; echo "[exited $?]"; exec $SHELL`,
  ]);

export const launch = (result: LauncherResult) => {
  recordFrequency(result.id);

  if (result.type === "app") {
    launchApp(result.app);
  } else if (result.type === "file") {
    execDetached(["xdg-open", result.path]);
  } else if (result.type === "exec") {
    launchCommand(result.command);
  } else if (result.type === "calc") {
    copyToClipboard(result.value);
  }
};

export const createLauncherModel = () => {
  const [text, setText] = createState("");
  const [results, setResults] = createState<LauncherResult[]>(getTopResults());
  const [mode, setMode] = createState<LauncherMode>("search");

  let debounceTimer: Timer | null = null;
  let generation = 0;

  const handleCalc = (expression: string) => {
    const id = ++generation;

    evaluateMathExpression(expression)
      .then((result) => {
        if (id !== generation) return;

        setResults([
          { id: `calc:${expression}`, type: "calc", value: result ?? "0" },
        ]);
      })
      .catch((err) => console.error("math evaluation failed:", err));
  };

  const handleSearch = (query: string) => {
    if (!query) {
      setResults(getTopResults());
      return;
    }

    const id = ++generation;

    setResults(searchApps(query));

    debounceTimer = timeout(200, () => {
      searchFiles(query)
        .then((fileResults) => {
          if (id !== generation) return;

          setResults((state) => [...state, ...fileResults]);
        })
        .catch((err) => console.error("file search failed:", err));
    });
  };

  const processUpdate = () => {
    const newText = text.peek();
    const newMode = mode.peek();

    if (newMode === "calc") {
      handleCalc(newText.trim() || "0");
    } else if (newMode === "search") {
      handleSearch(newText);
    } else if (newMode === "exec") {
      const command = parseCommand(newText);

      setResults(command ? [command] : []);
    }
  };

  const update = (input: string) => {
    debounceTimer?.cancel();

    if (mode.peek() === "search") {
      const newMode = parseLauncherMode(input);
      const newText = newMode === "search" ? input : input.slice(1).trim();

      setText(newText);
      setMode(newMode);
    } else {
      setText(input);
    }

    processUpdate();
  };

  const reset = () => {
    setMode("search");
    update("");
  };

  return { mode, text, results, update, reset };
};
