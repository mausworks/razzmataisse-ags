import { alpha, defineStyle } from "@lib/css";
import { withLayerBlur } from "@lib/hyprland";
import {
  createLauncherModel,
  HOME,
  launch,
  LauncherMode,
  type LauncherResult,
} from "@state/launcher";
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

const MODE_PLACEHOLDER: Record<LauncherMode, string> = {
  search: "Launch apps, search files, or run commands…",
  exec: "Execute command…",
  calc: "0",
};

export default function LauncherWindow({ monitor }: LauncherWindowProps) {
  const { text, mode, results, update, reset } = createLauncherModel();
  const isActive = text.as((value) => value.length > 0);

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
  let window: Gtk.Window | undefined;

  createEffect(() => {
    const width = isActive() ? PANEL_WIDTH_ACTIVE : PANEL_WIDTH_DOCKED;
    results();
    window?.set_default_size(width, -1);
  });

  const runSelected = () => {
    const selected = results.peek()[selectedIndex.peek()];

    if (selected) launch(selected);

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
        if (!self.visible) return;

        reset();
        entry?.set_text("");
        entry?.grab_focus();
      }}
      $={withLayerBlur((self) => {
        window = self;

        const controller = new Gtk.EventControllerKey();

        controller.connect("key-pressed", (_, key) => {
          switch (key) {
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
                reset();
              }
              return false;
            default:
              return false;
          }
        });
        self.add_controller(controller);
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
              class={accentIconClass}
              visible={mode.as((current) => current === "exec")}
            />
            <image
              iconName="accessories-calculator-symbolic"
              class={accentIconClass}
              visible={mode.as((current) => current === "calc")}
            />
          </box>
          <box hexpand>
            <entry
              text={text}
              class={entryFieldClass(
                mode.as((current) => current === "calc" && "calc"),
              )}
              hexpand
              placeholderText={mode.as((current) => MODE_PLACEHOLDER[current])}
              $={(self: Gtk.Entry) => (entry = self)}
              onNotifyText={(self) => {
                update(self.text);
                self.set_position(-1);
              }}
              onActivate={runSelected}
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
                  launch(result);
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
  result: LauncherResult;
  selected: Accessor<boolean>;
  onRun: () => void;
};

function ResultRow({ result, selected, onRun }: ResultRowProps) {
  const subtitle = resultSubtitle(result);
  const icon = result.type !== "calc" && resultIcon(result);

  return (
    <button
      class={rowClass(selected.as((isSelected) => isSelected && "selected"))}
      onClicked={onRun}
      hexpand
      halign={Gtk.Align.FILL}
    >
      <box spacing={8} hexpand>
        {result.type === "calc" ? (
          <label label="=" class={calcRowGlyphClass} />
        ) : typeof icon === "string" ? (
          <image iconName={icon} />
        ) : (
          <image gicon={icon as Gio.Icon} />
        )}
        <box orientation={Gtk.Orientation.VERTICAL} hexpand>
          <label
            label={resultTitle(result)}
            halign={Gtk.Align.START}
            ellipsize={3}
            hexpand
            class={result.type === "calc" ? calcAnswerClass : ""}
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

const resultIcon = (
  result: Exclude<LauncherResult, { type: "calc" }>,
): string | Gio.Icon => {
  switch (result.type) {
    case "app":
      return result.app.iconName || "application-x-executable-symbolic";
    case "file":
      return fileIcon(result.path);
    case "exec":
      return "utilities-terminal-symbolic";
  }
};

const resultTitle = (result: LauncherResult): string => {
  switch (result.type) {
    case "app":
      return result.app.name;
    case "file":
      return result.path.split("/").pop() ?? result.path;
    case "exec":
      return `! ${result.command}`;
    case "calc":
      return result.value;
  }
};

const resultSubtitle = (result: LauncherResult): string | false => {
  switch (result.type) {
    case "app":
      return result.app.description || false;
    case "file":
      return formatPath(result.path);
    case "exec":
      return "Run in a terminal";
    case "calc":
      return "Press enter to copy.";
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
    },
  },
});

const calcRowGlyphClass = defineStyle({
  style: {
    color: palette.accent,
    fontFamily: "monospace",
    fontWeight: "bold",
  },
})();

const calcAnswerClass = defineStyle({
  style: {
    fontFamily: "monospace",
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
