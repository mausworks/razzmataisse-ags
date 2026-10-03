import { alpha, defineStyle } from "@lib/css";
import { NiceWidgetProps } from "@lib/gtk";
import theme from "@theme";
import type { Node } from "ags";
import { Gtk } from "ags/gtk4";

const { palette } = theme.bar;

type BarPopoverProps = {
  children?: Node | Node[];
  $?: (self: Gtk.Popover) => void;
};

/**
 * A `popover`, styled as a solid-black panel matching the bar itself,
 * instead of the system theme's default light popover chrome.
 *
 * GTK4's `Popover` CSS node tree is `popover.background` with two direct
 * children, `contents` and `arrow`; the outer node is left transparent so
 * only those two actually paint.
 */
export default function BarPopover({ children, $ }: BarPopoverProps) {
  return (
    <popover class={popoverClass} $={$}>
      {children}
    </popover>
  );
}

export type BarCalendarProps = NiceWidgetProps<propsof<typeof Gtk.Calendar>>;

/** A `Gtk.Calendar`, matched to the same dark palette, with week numbers on. */
export function BarCalendar(props: BarCalendarProps) {
  return <Gtk.Calendar showWeekNumbers {...props} class={calendarClass} />;
}

const popoverClass = defineStyle({
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

const calendarClass = defineStyle({
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
    "& grid label.week-number": {
      color: alpha(palette.text, 0.3),
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
