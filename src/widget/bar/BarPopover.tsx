import { alpha, defineStyle, translateY } from "@lib/css";
import { NiceWidgetProps } from "@lib/gtk";
import theme from "@theme";
import type { Node } from "ags";
import { Gtk } from "ags/gtk4";

const { palette } = theme.bar;

// Real (opaque) grays rather than `alpha(palette.text, …)` -- an
// alpha-blended "faint white" shifts with whatever's behind the popover
// (the wallpaper bleeding through `activeBackground`'s own transparency),
// so two "faint" elements meant to read as the same shade can end up
// looking different. A real gray stays exactly itself regardless.
const WEEKDAY_GRAY = "#8E8E93";
const OTHER_MONTH_GRAY = "#48484A";

const TABULAR_NUMBERS = '"tnum" 1';

type BarPopoverProps = {
  children?: Node | Node[];
  $?: (self: Gtk.Popover) => void;
};

/**
 * A `popover`, styled as a solid-black panel matching the bar itself,
 * instead of the system theme's default light popover chrome. Drawn with no
 * arrow -- `hasArrow={false}` just removes the `arrow` CSS node outright,
 * rather than trying to hide it with CSS. `set_offset` isn't a settable
 * property (no CSS equivalent either), so the gap from the bar has to be
 * applied imperatively via `$`.
 */
export default function BarPopover({ children, $ }: BarPopoverProps) {
  return (
    <popover
      class={popoverClass}
      hasArrow={false}
      $={(self) => {
        self.set_offset(0, 8);
        $?.(self);
      }}
    >
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
      padding: 0,
      borderRadius: 12,
      border: `1px solid ${alpha(palette.text, 0.1)}`,
    },
  },
})();

const calendarClass = defineStyle({
  class: "BarCalendar",
  style: {
    background: "transparent",
    color: palette.text,
    border: "none",
    "& > header": {
      background: "transparent",
      color: WEEKDAY_GRAY,
    },
    "& > header stack.month label": {
      fontSize: 10,
      fontWeight: "bold",
      textTransform: "uppercase",
    },
    "& > header label.year": {
      fontSize: 10,
      fontWeight: "bold",
      textTransform: "uppercase",
      fontFeatureSettings: TABULAR_NUMBERS,
    },
    "& > header button": {
      background: "transparent",
      color: WEEKDAY_GRAY,
      borderRadius: 9999,
    },
    "& > header button:hover": {
      background: alpha(palette.accent, 0.16),
      color: palette.text,
    },
    "& > header button:active": {
      color: palette.accent,
    },
    "& grid label": {
      color: palette.text,
      fontFeatureSettings: TABULAR_NUMBERS,
    },
    // Below ~9px, GTK clips the tops of these glyphs outright (confirmed
    // independent of weight/case/line-height) -- stick to 10+.
    // translateY (not margin) -- shifts the glyphs closer to the day-number
    // row below without pushing that row's own position down too.
    "& grid label.day-name": {
      color: WEEKDAY_GRAY,
      fontSize: 10,
      fontWeight: "bold",
      textTransform: "uppercase",
      transform: translateY(6),
    },
    "& grid label.week-number": {
      color: WEEKDAY_GRAY,
      fontSize: 10,
      fontWeight: "bold",
    },
    "& grid label.other-month": {
      color: OTHER_MONTH_GRAY,
    },
    "& grid label:selected": {
      background: palette.accent,
      color: palette.accentText,
      borderRadius: 9999,
    },
  },
})();
