import { alpha, defineStyle } from "@lib/css";
import theme from "@theme";

const { palette } = theme.bar;

/**
 * Shared look for every bar popover menu (network, bluetooth, volume,
 * clock/calendar) -- a solid-black panel matching the bar itself, rather
 * than GTK's/the system theme's default light popover chrome.
 *
 * GTK4's `Popover` CSS node tree is `popover.background` with two direct
 * children, `contents` and `arrow`; the outer node is left transparent so
 * only those two actually paint.
 */
export const popoverClass = defineStyle({
  class: "BarPopover",
  style: {
    background: "transparent",
    boxShadow: "none",
    "& > contents": {
      background: palette.activeBackground,
      color: palette.text,
      padding: 12,
      borderRadius: 12,
      border: `1px solid ${alpha(palette.text, 0.1)}`,
    },
    "& > arrow": {
      background: palette.activeBackground,
    },
  },
})();

/** Matches `Gtk.Calendar` to the same dark palette as the rest of the bar. */
export const calendarClass = defineStyle({
  class: "BarCalendar",
  style: {
    background: "transparent",
    color: palette.text,
    "& > header": {
      background: "transparent",
      color: palette.text,
    },
    "& > header button": {
      background: "transparent",
      color: palette.text,
      borderRadius: 9999,
    },
    "& > header button:hover": {
      background: alpha(palette.accent, 0.16),
    },
    "& grid label": {
      color: palette.text,
    },
    "& grid label.other-month": {
      color: alpha(palette.text, 0.3),
    },
    "& grid label:selected": {
      background: palette.accent,
      color: palette.accentText,
      borderRadius: 9999,
    },
  },
})();
