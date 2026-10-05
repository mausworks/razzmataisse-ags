import { alpha, defineStyle } from "@lib/css";
import { withLayerBlur } from "@lib/hyprland";
import {
  createLauncherModel,
  HOME,
  runResult,
  type SearchResult,
} from "@state/search";
import theme from "@theme";
import { Accessor, createComputed, createEffect, createState, For } from "ags";
import { Astal, Gdk, Gtk } from "ags/gtk4";
import app from "ags/gtk4/app";
import Gio from "gi://Gio?version=2.0";

const { palette } = theme.bar;

/** Matches `Bar.tsx`'s own bar height -- keeps the docked position flush. */
const BAR_HEIGHT = 34;
const DOCK_GAP = 12;
const DOCK_MARGIN_LEFT = 12;
const PANEL_WIDTH_DOCKED = 360;
const PANEL_WIDTH_ACTIVE = 460;

export type LauncherWindowProps = {
  monitor: Gdk.Monitor;
};

/**
 * A single global window (not one per monitor -- `app.toggle_window("launcher")`
 * only makes sense for one uniquely-named window), toggled by `LauncherButton`
 * and the `SUPER + Space` keybind (`ags toggle launcher`, see keybinds.lua).
 *
 * Docked at the far left below the bar (anchored `TOP | LEFT`) while the
 * query is empty; once typing starts, switches to no anchor at all, which
 * centers it on the whole screen. Hyprland's own `layers` animation (see
 * animations.lua) is what makes that transition a slide instead of a jump;
 * not something verifiable headlessly -- check it looks right live.
 */
type SearchMode = "search" | "dollar" | "hash" | "equals";

const PLACEHOLDER: Record<SearchMode, string> = {
  search: "Search apps and files, $cmd / #sudo cmd, or =calc…",
  dollar: "Command to run…",
  hash: "Command to run as root…",
  equals: "0",
};

// How wide (in px) the expression side of the calculator readout holds
// steady at -- `Gtk.Entry` always fills whatever box it's given (`halign`
// doesn't shrink it to content, confirmed live), so this reserves the
// space and `self.set_alignment(1)` (called from `onNotifyText`, see
// below) right-aligns the text within it. The "=" sign's position only
// ever depends on this fixed width, never on the result (which gets its
// own breathing room via padding instead, see calcResultBoxClass).
const CALC_EXPRESSION_WIDTH = 110;

export default function LauncherWindow({ monitor }: LauncherWindowProps) {
  const { query, results, calcResult, setText, reset } = createLauncherModel();
  const isActive = query.as((text) => text.length > 0);

  const [mode, setMode] = createState<SearchMode>("search");

  const [selectedIndex, setSelectedIndex] = createState(0);
  createEffect(() => {
    results();
    setSelectedIndex(0);
  });

  const moveSelection = (delta: number) => {
    const count = results.peek().length;
    if (count === 0) return;
    setSelectedIndex((current) =>
      Math.max(0, Math.min(count - 1, current + delta)),
    );
  };

  let entry: Gtk.Entry | undefined;
  let win: Gtk.Window | undefined;

  createEffect(() => {
    const width = isActive() ? PANEL_WIDTH_ACTIVE : PANEL_WIDTH_DOCKED;
    results();
    win?.set_default_size(width, -1);
  });

  const runSelected = () => {
    const selected = results.peek()[selectedIndex.peek()];
    if (selected) runResult(selected);
    app.get_window("launcher")!.visible = false;
  };

  return (
    <window
      name="launcher"
      namespace="launcher"
      visible={false}
      class={windowClass}
      gdkmonitor={monitor}
      layer={Astal.Layer.OVERLAY}
      keymode={Astal.Keymode.ON_DEMAND}
      anchor={isActive.as((active) =>
        active
          ? Astal.WindowAnchor.NONE
          : Astal.WindowAnchor.TOP | Astal.WindowAnchor.LEFT,
      )}
      marginTop={BAR_HEIGHT + DOCK_GAP}
      marginLeft={DOCK_MARGIN_LEFT}
      application={app}
      onNotifyVisible={(self) => {
        if (self.visible) {
          setMode("search");
          reset();
          entry?.set_text("");
          entry?.grab_focus();
        }
      }}
      $={withLayerBlur((self) => {
        win = self;
        const keys = new Gtk.EventControllerKey();
        keys.connect("key-pressed", (_self, keyval) => {
          switch (keyval) {
            case Gdk.KEY_Escape:
              self.visible = false;
              return true;
            case Gdk.KEY_Up:
              moveSelection(-1);
              return true;
            case Gdk.KEY_Down:
              moveSelection(1);
              return true;
            case Gdk.KEY_BackSpace:
              if (mode.peek() !== "search" && !entry?.text) {
                setMode("search");
                setText("");
              }
              return false;
            default:
              return false;
          }
        });
        self.add_controller(keys);
      })}
    >
      <box
        class={panelClass}
        orientation={Gtk.Orientation.VERTICAL}
        spacing={8}
        widthRequest={isActive.as((active) =>
          active ? PANEL_WIDTH_ACTIVE : PANEL_WIDTH_DOCKED,
        )}
      >
        <box class={entryWrapperClass} spacing={8}>
          <box
            class={iconSlotClass}
            halign={Gtk.Align.CENTER}
            valign={Gtk.Align.CENTER}
          >
            <image
              iconName="go-next-symbolic"
              visible={mode.as((current) => current === "search")}
            />
            <image
              iconName="utilities-terminal-symbolic"
              class={mode.as((current) =>
                current === "hash" ? dangerIconClass : accentIconClass,
              )}
              visible={mode.as(
                (current) => current === "dollar" || current === "hash",
              )}
            />
            <image
              iconName="accessories-calculator-symbolic"
              class={accentIconClass}
              visible={mode.as((current) => current === "equals")}
            />
          </box>
          <box
            widthRequest={mode.as((current) =>
              current === "equals" ? CALC_EXPRESSION_WIDTH : -1,
            )}
          >
            <entry
              class={entryFieldClass(
                mode.as((current) => current === "equals" && "calc"),
              )}
              hexpand={mode.as((current) => current !== "equals")}
              placeholderText={mode.as((current) => PLACEHOLDER[current])}
              $={(self: Gtk.Entry) => (entry = self)}
              onNotifyText={(self) => {
                const typed = self.text;
                const currentMode = mode.peek();

                if (
                  currentMode === "search" &&
                  (typed.startsWith("$") ||
                    typed.startsWith("#") ||
                    typed.startsWith("="))
                ) {
                  const prefix = typed[0] as "$" | "#" | "=";
                  const rest = typed.slice(1);
                  const newMode =
                    prefix === "$"
                      ? "dollar"
                      : prefix === "#"
                        ? "hash"
                        : "equals";
                  setMode(newMode);
                  self.set_alignment(newMode === "equals" ? 1 : 0);
                  self.set_text(rest);
                  // `set_text()` leaves the cursor at position 0 -- with
                  // nothing typed yet that's invisible, but it means the
                  // very first real keystroke starts from a cursor at the
                  // *start*, and GTK's keep-the-cursor-visible scrolling
                  // then anchors the view to the left from then on,
                  // overriding `xalign` for the rest of the session.
                  self.set_position(-1);
                  setText(prefix + rest);
                  return;
                }

                const prefix =
                  currentMode === "dollar"
                    ? "$"
                    : currentMode === "hash"
                      ? "#"
                      : currentMode === "equals"
                        ? "="
                        : "";
                setText(prefix + typed);
              }}
              onActivate={runSelected}
            />
          </box>
          <box visible={mode.as((current) => current === "equals")}>
            <label label="=" class={calcGlyphClass} />
          </box>
          <box
            class={calcResultBoxClass}
            visible={mode.as((current) => current === "equals")}
          >
            <label
              label={calcResult.as((result) => result ?? "0")}
              class={calcResultClass}
              xalign={0.5}
              hexpand
            />
          </box>
        </box>

        <box orientation={Gtk.Orientation.VERTICAL} spacing={2}>
          <For each={results} id={(result) => result.id}>
            {(result, index) => (
              <ResultRow
                result={result}
                selected={createComputed(() => index() === selectedIndex())}
                onRun={() => {
                  runResult(result);
                  app.get_window("launcher")!.visible = false;
                }}
              />
            )}
          </For>
        </box>
      </box>
    </window>
  );
}

type ResultRowProps = {
  result: SearchResult;
  selected: Accessor<boolean>;
  onRun: () => void;
};

function ResultRow({ result, selected, onRun }: ResultRowProps) {
  const subtitle = resultSubtitle(result);
  const icon = resultIcon(result);

  return (
    <button
      class={rowClass(selected.as((isSelected) => isSelected && "selected"))}
      onClicked={onRun}
      hexpand
      halign={Gtk.Align.FILL}
    >
      <box spacing={8} hexpand>
        {typeof icon === "string" ? (
          <image iconName={icon} />
        ) : (
          <image gicon={icon} />
        )}
        <box orientation={Gtk.Orientation.VERTICAL} hexpand>
          <label
            label={resultTitle(result)}
            halign={Gtk.Align.START}
            ellipsize={3}
            hexpand
          />
          {subtitle && (
            <label
              label={subtitle}
              halign={Gtk.Align.START}
              ellipsize={3}
              hexpand
              class={subtitleClass}
            />
          )}
        </box>
      </box>
    </button>
  );
}

/** `/home/maus/foo` -> `~/foo`. Only the user's own home, never hard-coded. */
const prettifyPath = (path: string): string =>
  path === HOME
    ? "~"
    : path.startsWith(`${HOME}/`)
      ? `~${path.slice(HOME.length)}`
      : path;

const COMPACT_MAX_LENGTH = 48;

/**
 * `~/really/long/path/to/some/deeply/nested/file.rs` ->
 * `~/really/…/nested/file.rs` -- keeps the filename (the part you actually
 * care about) whole and grows a head from the root for as many segments as
 * still fit, eliding whatever's left in the middle. Driven by total string
 * length rather than segment count -- a path with just two segments can
 * still be too long to show in full if those segments' names are long
 * (e.g. `/<some-really-long-directory-name>/file.lol`), while a path with
 * many short segments might not need compacting at all. Run on an
 * already-`prettifyPath`'d string.
 */
const compactPath = (path: string): string => {
  if (path.length <= COMPACT_MAX_LENGTH) return path;

  const isAbsolute = path.startsWith("/");
  const segments = path.split("/").filter(Boolean);
  if (segments.length <= 1) return path;

  const prefix = isAbsolute ? "/" : "";
  const tail = segments[segments.length - 1]!;

  let head = segments[0]!;
  let i = 1;
  if (head === "~" && segments.length > 1) {
    head = `${head}/${segments[1]}`;
    i = 2;
  }
  for (; i < segments.length - 1; i++) {
    const candidate = `${head}/${segments[i]}`;
    if (`${prefix}${candidate}/…/${tail}`.length > COMPACT_MAX_LENGTH) break;
    head = candidate;
  }

  const compacted = `${prefix}${head}/…/${tail}`;
  return compacted.length < path.length ? compacted : path;
};

const formatPath = (path: string) => compactPath(prettifyPath(path));

const EXTENSION_ICON_OVERRIDES: Record<string, string[]> = {
  ts: ["text-x-javascript", "text-x-generic"],
  tsx: ["text-x-javascript", "text-x-generic"],
  jsx: ["text-x-javascript", "text-x-generic"],
};

/**
 * Resolves a file path to a themed icon via the desktop's own mime-type
 * database rather than a hand-maintained extension table -- the installed
 * icon theme (WhiteSur, here) ships icons for most common source languages
 * (Rust, Python, Go, Ruby, C/C++, CSS, HTML, Markdown, …) under their mime
 * type's name already, and `Gio.content_type_get_icon` returns a themed
 * icon with its own specific -> generic fallback chain built in, so an
 * unrecognized extension just degrades to the theme's generic file icon
 * instead of nothing.
 */
const fileIcon = (path: string): Gio.Icon => {
  const ext = path.split(".").pop()?.toLowerCase();
  const override = ext && EXTENSION_ICON_OVERRIDES[ext];
  if (override) return Gio.ThemedIcon.new_from_names(override);

  const [contentType] = Gio.content_type_guess(path, null);
  return Gio.content_type_get_icon(contentType);
};

const resultIcon = (result: SearchResult): string | Gio.Icon => {
  switch (result.type) {
    case "app":
      return result.app.iconName || "application-x-executable-symbolic";
    case "file":
      return fileIcon(result.path);
    case "command":
      return result.sudo
        ? "dialog-password-symbolic"
        : "utilities-terminal-symbolic";
  }
};

const resultTitle = (result: SearchResult): string => {
  switch (result.type) {
    case "app":
      return result.app.name;
    case "file":
      return result.path.split("/").pop() ?? result.path;
    case "command":
      return `${result.sudo ? "#" : "$"} ${result.cmd}`;
  }
};

const resultSubtitle = (result: SearchResult): string | false => {
  switch (result.type) {
    case "app":
      return result.app.description || false;
    case "file":
      return formatPath(result.path);
    case "command":
      return result.sudo ? "Run as root in a terminal" : "Run in a terminal";
  }
};

const windowClass = defineStyle({
  style: {
    background: "transparent",
  },
})();

const panelClass = defineStyle({
  style: {
    background: palette.activeBackground,
    color: palette.text,
    padding: 12,
    borderRadius: 12,
    border: `1px solid ${alpha(palette.text, 0.1)}`,
  },
})();

const entryWrapperClass = defineStyle({
  style: {
    background: alpha(palette.text, 0.08),
    borderRadius: 9999,
    padding: "6px 14px",
  },
})();

const iconSlotClass = defineStyle({
  style: {
    minWidth: 16,
    minHeight: 16,
  },
})();

const accentIconClass = defineStyle({
  style: {
    color: palette.accent,
  },
})();

const dangerIconClass = defineStyle({
  style: {
    color: palette.danger,
  },
})();

const entryFieldClass = defineStyle({
  style: {
    background: "transparent",
    color: palette.text,
    border: "none",
    boxShadow: "none",
    padding: 0,
    fontSize: 14,
  },
  variants: {
    calc: {
      fontFamily: "monospace",
      fontSize: 16,
    },
  },
});

const calcGlyphClass = defineStyle({
  style: {
    color: alpha(palette.text, 0.5),
    fontFamily: "monospace",
    fontSize: 16,
  },
})();

const calcResultClass = defineStyle({
  style: {
    color: palette.text,
    fontFamily: "monospace",
    fontWeight: "bold",
    fontSize: 16,
  },
})();

// ~2em (at the 16px calc font size above) of breathing room on each side
// of the result, approximated in px since GTK CSS has no em unit.
const calcResultBoxClass = defineStyle({
  style: {
    padding: "0 32px",
  },
})();

const rowClass = defineStyle({
  style: {
    background: "transparent",
    border: "none",
    boxShadow: "none",
    borderRadius: 8,
    padding: "4px 8px",
    "&:hover": {
      background: alpha(palette.text, 0.08),
    },
    "&:active": {
      background: alpha(palette.accent, 0.16),
    },
  },
  variants: {
    selected: {
      background: alpha(palette.accent, 0.16),
    },
  },
});

const subtitleClass = defineStyle({
  style: {
    color: "#8E8E93",
    fontSize: 11,
  },
})();
