import { alpha, defineStyle, translateY } from "@lib/css";
import { NiceWidgetProps } from "@lib/gtk";
import theme from "@theme";
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

export type BarCalendarProps = NiceWidgetProps<propsof<typeof Gtk.Calendar>>;

/** A `Gtk.Calendar`, matched to the same dark palette, with week numbers on. */
export default function BarCalendar(props: BarCalendarProps) {
  return <Gtk.Calendar showWeekNumbers {...props} class={calendarClass} />;
}

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
      color: alpha(palette.text, 0.85),
      fontWeight: 500,
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
      background: alpha(palette.accent, 0.16),
      color: palette.accent,
      fontWeight: "bold",
    },
  },
})();
