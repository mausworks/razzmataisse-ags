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
  launch,
  LauncherMode,
  LauncherResult,
} from "@state/launcher";
import theme from "@theme";
import { Accessor, createComputed, createState, For, Node } from "ags";
import { Astal, Gdk, Gtk } from "ags/gtk4";
import app from "ags/gtk4/app";
import { timeout, Timer } from "ags/time";

import LauncherResultCard from "./LauncherResultCard";

const { palette } = theme.bar;

const MODE_PLACEHOLDER: Record<LauncherMode, string> = {
  search: "Launch apps, search files, or run commands…",
  exec: "Execute command",
  calc: "0",
};

// Fixed fraction of the monitor's height, computed once -- *not* derived
// from the panel's own (content-dependent) height. Anything tied to the
// panel's actual size would shift this every time results/mode change
// it, which is exactly the "grows from the center" jumpiness this is
// replacing: active mode should settle near the center once and then
// only ever grow downward from there.
const ACTIVE_TOP_FRACTION = 0.35;
const TOGGLE_DURATION = 300;
const MODE_ICON_SIZE = 20;
const LAUNCHER_WIDTH = 460;

type LauncherState = "open" | "opening" | "closed";

export interface LauncherProps {
  monitor: Gdk.Monitor;
}

export default function Launcher({ monitor }: LauncherProps) {
  const { text, mode, results, update, reset } = createLauncherModel();
  const [selected, setSelected] = createState(0);
  const [state, setState] = createState<LauncherState>("closed");

  const onLaunch = (result: LauncherResult) => {
    launch(result);
    close();
  };

  const close = () => {
    setState("closed");
    timeout(100, reset);
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

    onLaunch(result);
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
          class={columnClass(state as never)}
          orientation={Gtk.Orientation.VERTICAL}
          spacing={12}
          widthRequest={LAUNCHER_WIDTH}
          valign={Gtk.Align.START}
        >
          <box class={entryWrapperClass} spacing={12} hexpand>
            <LauncherModeIcon mode={mode} />

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

          <box orientation={Gtk.Orientation.VERTICAL} spacing={6}>
            <For each={results} id={(result) => result.id}>
              {(result, index) => (
                <LauncherResultCard
                  result={result}
                  selected={createComputed(() => index() === selected())}
                  onClick={onLaunch}
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
      anchor={Astal.WindowAnchor.TOP | Astal.WindowAnchor.BOTTOM}
      marginTop={activeMarginTop}
      application={app}
      onNotifyVisible={(self) => (self.visible ? onOpen() : onClose())}
      onNotifyIsActive={(self) => (self.visible = self.isActive)}
      $={withLayerAnimation("fade", (self) => {
        const click = new Gtk.GestureClick({ button: 0 });
        click.connect("pressed", (_, x, y) => {
          const target = self.pick(x, y, Gtk.PickFlags.DEFAULT);
          if (!target || target === self || target === self.child) onClose();
        });
        self.add_controller(click);
      })}
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

interface LauncherModeIconProps {
  mode: Accessor<LauncherMode>;
}

function LauncherModeIcon({ mode }: LauncherModeIconProps) {
  return (
    <box
      class={iconSlotClass}
      halign={Gtk.Align.CENTER}
      valign={Gtk.Align.CENTER}
    >
      <image
        pixelSize={MODE_ICON_SIZE}
        iconName="search-symbolic"
        visible={mode.as((current) => current === "search")}
      />
      <image
        pixelSize={MODE_ICON_SIZE}
        iconName="utilities-terminal-symbolic"
        visible={mode.as((current) => current === "exec")}
      />
      <image
        pixelSize={MODE_ICON_SIZE}
        iconName="calculator-symbolic"
        visible={mode.as((current) => current === "calc")}
      />
    </box>
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
        mode.as((current) => current !== "search" && "monospace"),
      )}
      $={(self) => {
        entry = self;
        self.add_controller(controller);
      }}
    />
  );
}

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
    padding: 48,
  },
});

const backdropClass = defineStyle({
  style: {
    background: alpha("#000", 0.4),
  },
})();

const columnClass = defineStyle({
  style: {
    transformOrigin: "top center",
  },
  variants: {
    opening: {
      animation: slideIn(),
    },
  },
});

const entryWrapperClass = defineStyle({
  style: {
    background: palette.activeBackground,
    backdropFilter: backdropBlur(),
    color: palette.text,
    border: `1px solid ${alpha(palette.text, 0.1)}`,
    borderRadius: 9999,
    padding: "12px 18px",
    boxShadow: [
      `0 12px 32px 4px ${alpha("#000", 0.35)}`,
      `0 2px 6px ${alpha("#000", 0.3)}`,
    ].join(", "),
  },
})();

const iconSlotClass = defineStyle({
  style: {
    minWidth: MODE_ICON_SIZE,
    minHeight: MODE_ICON_SIZE,
  },
})();

const entryFieldClass = defineStyle({
  style: {
    background: "transparent",
    color: palette.text,
    border: "none",
    boxShadow: "none",
    padding: 0,
    fontSize: 16,
    fontWeight: 500,
  },
  variants: {
    monospace: {
      fontFamily: "monospace",
    },
  },
});
