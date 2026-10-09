import {
  alpha,
  backdropBlur,
  defineAnimation,
  defineStyle,
  translateY,
} from "@lib/css";
import { withLayerAnimation } from "@lib/hyprland";
import { clamp } from "@lib/math";
import {
  createLauncherModel,
  HOME,
  launch,
  LauncherMode,
  type LauncherResult,
} from "@state/launcher";
import theme from "@theme";
import { Accessor, createComputed, createState, For, Node } from "ags";
import { Astal, Gdk, Gtk } from "ags/gtk4";
import app from "ags/gtk4/app";
import { timeout, Timer } from "ags/time";
import Gio from "gi://Gio?version=2.0";

const { palette } = theme.bar;

const PANEL_WIDTH_ACTIVE = 460;

export type LauncherProps = {
  monitor: Gdk.Monitor;
};

const MODE_PLACEHOLDER: Record<LauncherMode, string> = {
  search: "Launch apps, search files, or run commands…",
  exec: "Execute command…",
  calc: "0",
};

// Fixed fraction of the monitor's height, computed once -- *not* derived
// from the panel's own (content-dependent) height. Anything tied to the
// panel's actual size would shift this every time results/mode change
// it, which is exactly the "grows from the center" jumpiness this is
// replacing: active mode should settle near the center once and then
// only ever grow downward from there.
const ACTIVE_TOP_FRACTION = 0.4;
const TOGGLE_DURATION = 300;

type LauncherState = "open" | "opening" | "closed";

export default function Launcher({ monitor }: LauncherProps) {
  const { text, mode, results, update, reset } = createLauncherModel();
  const [selected, setSelected] = createState(0);
  const [state, setState] = createState<LauncherState>("closed");

  const close = () => {
    setState("closed");
  };

  const open = () => {
    if (state.peek() !== "closed") return;

    setState("opening");
    timeout(TOGGLE_DURATION, () => {
      if (state.peek() === "opening") setState("open");
    });
  };

  const moveSelection = (delta: number) => {
    const count = results.peek().length;

    if (count === 0) return;

    setSelected((current) => clamp(current + delta, 0, count - 1));
  };

  const launchSelected = () => {
    const result = results.peek().at(selected.peek());

    if (!result) return;

    launch(result);
    close();
  };

  return (
    <>
      <LauncherBackdrop state={state} monitor={monitor} onClick={close} />

      <LauncherWindow
        state={state}
        monitor={monitor}
        onOpen={open}
        onClose={close}
      >
        <box
          class={panelClass(state as never)}
          orientation={Gtk.Orientation.VERTICAL}
          spacing={8}
          widthRequest={PANEL_WIDTH_ACTIVE}
        >
          <box class={entryWrapperClass} spacing={8}>
            <box
              class={iconSlotClass}
              halign={Gtk.Align.CENTER}
              valign={Gtk.Align.CENTER}
            >
              <image
                iconName="search-symbolic"
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
              <LauncherInput
                text={text}
                mode={mode}
                onReset={reset}
                onChange={update}
                onLaunch={launchSelected}
                onClose={close}
                onUp={() => moveSelection(-1)}
                onDown={() => moveSelection(+1)}
              />
            </box>
          </box>

          <box orientation={Gtk.Orientation.VERTICAL} spacing={2}>
            <For each={results} id={(result) => result.id}>
              {(result, index) => (
                <ResultRow
                  result={result}
                  selected={createComputed(() => index() === selected())}
                />
              )}
            </For>
          </box>
        </box>
      </LauncherWindow>
    </>
  );
}

interface LauncherWindowProps {
  state: Accessor<LauncherState>;
  monitor: Gdk.Monitor;
  children: Node;
  /** Called when something else (e.g. `ags toggle`) shows the window. */
  onOpen: () => void;
  /** Called when something else hides the window. */
  onClose: () => void;
}

function LauncherWindow({
  state,
  monitor,
  children,
  onOpen,
  onClose,
}: LauncherWindowProps) {
  const activeMarginTop = Math.round(
    monitor.get_geometry().height * ACTIVE_TOP_FRACTION,
  );

  return (
    <window
      name="launcher"
      namespace="launcher"
      class={windowClass(state as never)}
      visible={state.as((s) => s !== "closed")}
      gdkmonitor={monitor}
      layer={Astal.Layer.OVERLAY}
      keymode={Astal.Keymode.ON_DEMAND}
      anchor={Astal.WindowAnchor.TOP}
      marginTop={activeMarginTop}
      application={app}
      onNotifyVisible={(self) => (self.visible ? onOpen() : onClose())}
      onNotifyIsActive={(self) => (self.visible = self.isActive)}
      $={withLayerAnimation("fade")}
    >
      {children}
    </window>
  );
}

interface LauncherBackdropProps {
  monitor: Gdk.Monitor;
  state: Accessor<LauncherState>;
  onClick: () => void;
}

/**
 * Invisible full-screen layer just below the launcher; any click on it
 * (i.e. outside the launcher) calls `onClick`.
 */
function LauncherBackdrop({ monitor, onClick, state }: LauncherBackdropProps) {
  const { TOP, BOTTOM, LEFT, RIGHT } = Astal.WindowAnchor;

  return (
    <window
      name="launcher-backdrop"
      namespace="launcher-backdrop"
      visible={state.as((s) => s !== "closed")}
      class={backdropClass}
      gdkmonitor={monitor}
      layer={Astal.Layer.TOP}
      exclusivity={Astal.Exclusivity.IGNORE}
      anchor={TOP | BOTTOM | LEFT | RIGHT}
      application={app}
      $={withLayerAnimation("fade", (self) => {
        const click = new Gtk.GestureClick({ button: 0 });
        click.connect("pressed", onClick);
        self.add_controller(click);
      })}
    />
  );
}

interface LauncherInputProps {
  text: Accessor<string>;
  mode: Accessor<LauncherMode>;
  onReset?: () => void;
  onChange?: (input: string) => void;
  onLaunch?: () => void;
  onClose?: () => void;
  onUp?: () => void;
  onDown?: () => void;
}

function LauncherInput({
  text,
  mode,
  onReset,
  onChange,
  onLaunch,
  onClose,
  onUp,
  onDown,
}: LauncherInputProps) {
  let entry: Gtk.Entry | null = null;
  let timer: Timer | null = null;

  const controller = new Gtk.EventControllerKey({
    propagationPhase: Gtk.PropagationPhase.CAPTURE,
  });
  controller.connect("key-pressed", (_, key) => {
    timer?.cancel();
    timer = timeout(5, () => {
      if (entry?.text !== text.peek()) {
        entry?.set_text(text.peek());
      }
    });

    const shouldReset =
      key === Gdk.KEY_BackSpace && mode.peek() !== "search" && !entry?.text;

    if (shouldReset) {
      onReset?.();
    } else if (key === Gdk.KEY_Escape) {
      onClose?.();
    } else if (key === Gdk.KEY_Return) {
      onLaunch?.();
    } else if (key === Gdk.KEY_Up) {
      onUp?.();
    } else if (key === Gdk.KEY_Down) {
      onDown?.();
    }
  });

  return (
    <entry
      hexpand
      text={text}
      onChanged={({ text }) => onChange?.(text)}
      placeholderText={mode.as((current) => MODE_PLACEHOLDER[current])}
      class={entryFieldClass(
        mode.as((current) => current === "calc" && "calc"),
      )}
      $={(self) => {
        entry = self;
        self.add_controller(controller);
      }}
    />
  );
}

interface ResultRowProps {
  result: LauncherResult;
  selected: Accessor<boolean>;
}

function ResultRow({ result, selected }: ResultRowProps) {
  const subtitle = resultSubtitle(result);
  const icon = result.type !== "calc" && resultIcon(result);

  return (
    <button
      focusable={false}
      class={rowClass(selected.as((isSelected) => isSelected && "selected"))}
      onClicked={() => launch(result)}
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
      return "Press enter to copy";
  }
};

const slideIn = defineAnimation({
  keyframes: {
    from: { transform: translateY(-24) },
    to: { transform: translateY(0) },
  },
  defaults: {
    duration: TOGGLE_DURATION * 0.9,
    easing: "ease-out",
    fillMode: "both",
  },
});

const windowClass = defineStyle({
  style: {
    background: "transparent",
    paddingTop: 32,
  },
});

const backdropClass = defineStyle({
  style: {
    background: alpha("#000", 0.4),
  },
})();

const panelClass = defineStyle({
  style: {
    transformOrigin: "top center",
    background: palette.activeBackground,
    backdropFilter: backdropBlur(),
    color: palette.text,
    padding: 12,
    borderRadius: 12,
    border: `1px solid ${alpha(palette.text, 0.1)}`,
  },
  variants: {
    opening: {
      animation: slideIn(),
    },
  },
});

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
