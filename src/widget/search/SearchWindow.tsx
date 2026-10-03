import { alpha, defineStyle } from "@lib/css";
import { createSearchModel, runResult, type SearchResult } from "@state/search";
import theme from "@theme";
import { Accessor, createComputed, createEffect, createState, For } from "ags";
import { Astal, Gdk, Gtk } from "ags/gtk4";
import app from "ags/gtk4/app";

const { palette } = theme.bar;

/** Matches `Bar.tsx`'s own bar height -- keeps the docked position flush. */
const BAR_HEIGHT = 34;
const DOCK_GAP = 12;
// Matches the bar's own `containerClass` padding, so the docked panel lines
// up under the search button instead of the window's left edge.
const DOCK_MARGIN_LEFT = 12;
const PANEL_WIDTH = 480;

export type SearchWindowProps = {
  monitor: Gdk.Monitor;
};

/**
 * A single global window (not one per monitor -- `app.toggle_window("search")`
 * only makes sense for one uniquely-named window), toggled by `SearchButton`
 * and the `SUPER + Space` keybind (`ags toggle search`, see keybinds.lua).
 *
 * Docked at the far left below the bar (anchored `TOP | LEFT`) while the
 * query is empty; once typing starts, switches to no anchor at all, which
 * centers it on the whole screen. Hyprland's own `layers` animation (see
 * animations.lua) is what makes that transition a slide instead of a jump;
 * not something verifiable headlessly -- check it looks right live.
 */
type SearchMode = "search" | "dollar" | "hash";

const PLACEHOLDER: Record<SearchMode, string> = {
  search: "Search apps and files, or $cmd / #sudo cmd…",
  dollar: "Command to run…",
  hash: "Command to run as root…",
};

export default function SearchWindow({ monitor }: SearchWindowProps) {
  const { query, results, setText, reset } = createSearchModel();
  const isActive = query.as((text) => text.length > 0);

  // The "$"/"#" prefix is never shown in the entry itself once it's
  // switched the icon over -- that'd be showing the same thing twice. So
  // unlike `query` (the full, logical "$cmd" text search.ts works with),
  // `mode` can't just be derived from the entry's own text content anymore
  // (the prefix character isn't in there after the swap) -- it's tracked
  // explicitly, with the entry and the model's `query` kept in sync by
  // hand in onNotifyText below.
  const [mode, setMode] = createState<SearchMode>("search");

  const [selectedIndex, setSelectedIndex] = createState(0);
  // A new set of results (new query, or a fresh rescan) should always start
  // back at the top, not wherever the previous list happened to leave it.
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

  // GTK4 (layer-shell surfaces included) sizes a window to its content's
  // natural size automatically -- but only grows; once allocated at some
  // size it doesn't shrink back down on its own when that content gets
  // smaller, leaving dead space below a short result list. Resetting the
  // default size back to "natural" on every result-count change forces a
  // fresh measurement instead of treating the largest-ever size as a floor.
  createEffect(() => {
    results();
    win?.set_default_size(-1, -1);
  });

  const runSelected = () => {
    const selected = results.peek()[selectedIndex.peek()];
    if (selected) runResult(selected);
    app.get_window("search")!.visible = false;
  };

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
      $={(self) => {
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
              // The prefix itself isn't in the entry's text, so there's
              // nothing left for a normal backspace to delete once the
              // field reads empty -- that keypress is the signal to drop
              // back to search mode instead.
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
      }}
    >
      <box
        class={panelClass}
        orientation={Gtk.Orientation.VERTICAL}
        spacing={8}
        widthRequest={PANEL_WIDTH}
      >
        <box class={entryWrapperClass} spacing={8}>
          <box
            class={iconSlotClass}
            halign={Gtk.Align.CENTER}
            valign={Gtk.Align.CENTER}
          >
            <image
              iconName="system-search-symbolic"
              visible={mode.as((current) => current === "search")}
            />
            <label
              label="$"
              class={glyphClass}
              visible={mode.as((current) => current === "dollar")}
            />
            <label
              label="#"
              class={glyphClass}
              visible={mode.as((current) => current === "hash")}
            />
          </box>
          <entry
            class={entryFieldClass}
            hexpand
            placeholderText={mode.as((current) => PLACEHOLDER[current])}
            $={(self: Gtk.Entry) => (entry = self)}
            onNotifyText={(self) => {
              const typed = self.text;
              const currentMode = mode.peek();

              if (
                currentMode === "search" &&
                (typed.startsWith("$") || typed.startsWith("#"))
              ) {
                const prefix = typed[0] as "$" | "#";
                const rest = typed.slice(1);
                setMode(prefix === "$" ? "dollar" : "hash");
                // Triggers this same handler again with `rest`, which the
                // mode switch above means falls through to the branch
                // below instead -- setText() still runs once either way.
                self.set_text(rest);
                setText(prefix + rest);
                return;
              }

              const prefix =
                currentMode === "dollar"
                  ? "$"
                  : currentMode === "hash"
                    ? "#"
                    : "";
              setText(prefix + typed);
            }}
            onActivate={runSelected}
          />
        </box>

        <box orientation={Gtk.Orientation.VERTICAL} spacing={2}>
          <For each={results} id={(result) => result.id}>
            {(result, index) => (
              <ResultRow
                result={result}
                selected={createComputed(() => index() === selectedIndex())}
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
  selected: Accessor<boolean>;
  onRun: () => void;
};

function ResultRow({ result, selected, onRun }: ResultRowProps) {
  const subtitle = resultSubtitle(result);

  return (
    <button
      class={rowClass(selected.as((isSelected) => isSelected && "selected"))}
      onClicked={onRun}
    >
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

const entryWrapperClass = defineStyle({
  style: {
    background: alpha(palette.text, 0.08),
    borderRadius: 9999,
    padding: "6px 14px",
  },
})();

// Fixed size so the row doesn't twitch horizontally when swapping between
// the image icon and the "$"/"#" glyph -- their natural sizes differ.
const iconSlotClass = defineStyle({
  style: {
    minWidth: 16,
    minHeight: 16,
  },
})();

const glyphClass = defineStyle({
  style: {
    color: palette.text,
    fontWeight: "bold",
    fontSize: 14,
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
    // The keyboard-navigated row, independent of actual pointer hover.
    selected: {
      background: alpha(palette.accent, 0.16),
    },
  },
});

// A real (opaque) gray, not `alpha(palette.text, …)` -- see BarPopover.tsx
// for why: an alpha-blended fade shifts with whatever's behind it.
const subtitleClass = defineStyle({
  style: {
    color: "#8E8E93",
    fontSize: 11,
  },
})();
