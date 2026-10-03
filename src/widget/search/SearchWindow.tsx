import { alpha, defineStyle } from "@lib/css";
import { createSearchModel, runResult, type SearchResult } from "@state/search";
import theme from "@theme";
import { For } from "ags";
import { Astal, Gdk, Gtk } from "ags/gtk4";
import app from "ags/gtk4/app";

const { palette } = theme.bar;

/** Matches `Bar.tsx`'s own bar height -- keeps the docked position flush. */
const BAR_HEIGHT = 34;
const DOCK_GAP = 12;
const PANEL_WIDTH = 480;

export type SearchWindowProps = {
  monitor: Gdk.Monitor;
};

/**
 * A single global window (not one per monitor -- `app.toggle_window("search")`
 * only makes sense for one uniquely-named window), toggled by `SearchButton`
 * and the `SUPER + Space` keybind (`ags toggle search`, see keybinds.lua).
 *
 * Docked below the bar (anchored `TOP`, which also centers it horizontally
 * since no `LEFT`/`RIGHT` anchor is set) while the query is empty; once
 * typing starts, switches to no anchor at all, which centers it on the
 * whole screen -- the same horizontal centering throughout, just losing the
 * `TOP` anchor so it jumps to the middle. Hyprland's own `layers` animation
 * (see animations.lua) is what makes that transition a slide instead of a
 * jump; not something verifiable headlessly -- check it looks right live.
 */
export default function SearchWindow({ monitor }: SearchWindowProps) {
  const { query, results, setText, reset } = createSearchModel();
  const isActive = query.as((text) => text.length > 0);

  let entry: Gtk.Entry | undefined;

  return (
    <window
      name="search"
      namespace="search"
      visible={false}
      class={windowClass}
      gdkmonitor={monitor}
      layer={Astal.Layer.OVERLAY}
      keymode={Astal.Keymode.ON_DEMAND}
      anchor={isActive.as((active) =>
        active ? Astal.WindowAnchor.NONE : Astal.WindowAnchor.TOP,
      )}
      marginTop={BAR_HEIGHT + DOCK_GAP}
      application={app}
      onNotifyVisible={(self) => {
        if (self.visible) {
          reset();
          entry?.grab_focus();
        }
      }}
      $={(self) => {
        const keys = new Gtk.EventControllerKey();
        keys.connect("key-pressed", (_self, keyval) => {
          if (keyval !== Gdk.KEY_Escape) return false;
          self.visible = false;
          return true;
        });
        self.add_controller(keys);
      }}
    >
      <box
        class={panelClass}
        orientation={Gtk.Orientation.VERTICAL}
        spacing={8}
        widthRequest={PANEL_WIDTH}
      >
        <entry
          class={entryClass}
          placeholderText="Search apps and files, or $cmd / #sudo cmd…"
          text={query}
          $={(self: Gtk.Entry) => (entry = self)}
          onNotifyText={(self) => setText(self.text)}
          onActivate={() => {
            const first = results.peek()[0];
            if (first) runResult(first);
            app.get_window("search")!.visible = false;
          }}
        />

        <box orientation={Gtk.Orientation.VERTICAL} spacing={2}>
          <For each={results} id={(result) => result.id}>
            {(result) => (
              <ResultRow
                result={result}
                onRun={() => {
                  runResult(result);
                  app.get_window("search")!.visible = false;
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
  onRun: () => void;
};

function ResultRow({ result, onRun }: ResultRowProps) {
  const subtitle = resultSubtitle(result);

  return (
    <button class={rowClass} onClicked={onRun}>
      <box spacing={8}>
        <image iconName={resultIcon(result)} />
        <box orientation={Gtk.Orientation.VERTICAL} hexpand>
          <label
            label={resultTitle(result)}
            halign={Gtk.Align.START}
            ellipsize={3}
          />
          {subtitle && (
            <label
              label={subtitle}
              halign={Gtk.Align.START}
              ellipsize={3}
              class={subtitleClass}
            />
          )}
        </box>
      </box>
    </button>
  );
}

const resultIcon = (result: SearchResult): string => {
  switch (result.type) {
    case "app":
      return result.app.iconName || "application-x-executable-symbolic";
    case "file":
      return result.matchKind === "content"
        ? "edit-find-symbolic"
        : "text-x-generic-symbolic";
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
      return result.path;
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

const entryClass = defineStyle({
  style: {
    background: alpha(palette.text, 0.08),
    color: palette.text,
    border: "none",
    boxShadow: "none",
    borderRadius: 9999,
    padding: "6px 12px",
    fontSize: 14,
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
})();

// A real (opaque) gray, not `alpha(palette.text, …)` -- see BarPopover.tsx
// for why: an alpha-blended fade shifts with whatever's behind it.
const subtitleClass = defineStyle({
  style: {
    color: "#8E8E93",
    fontSize: 11,
  },
})();
