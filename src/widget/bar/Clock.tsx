import { defineStyle, type DurationString, ms } from "@lib/css";
import { createPoll } from "ags/time";
import { For } from "gnim";

import { BarMenuButton } from "./BarButton";
import BarCalendar from "./BarCalendar";
import BarPopover from "./BarPopover";

const labelClass = defineStyle({
  style: {
    fontFeatureSettings: '"tnum" 1',
  },
})();

export type CalendarProps = {
  visible?: boolean;
  showWeekNumbers?: boolean;
};

export type ClockProps = {
  visible?: boolean;
  dateFormat?: string;
  timeFormat?: string;
  /**
   * A `DurationString` ("1s", "500ms"), but accepted as plain `string` so
   * `config.json`'s own value (schema-validated to that same shape, but
   * widened by `resolveJsonModule`) can be spread straight in.
   */
  interval?: DurationString | (string & {});
  calendar?: CalendarProps;
};

export default function Clock({
  visible = true,
  dateFormat = "%a %d %b",
  timeFormat = "%H:%M",
  interval = "1s",
  calendar: { visible: calendarVisible = true, showWeekNumbers = true } = {},
}: ClockProps) {
  const fullDate = createPoll(
    "",
    parseFloat(ms(interval as DurationString)),
    `date +'${dateFormat} | ${timeFormat}'`,
  ).as((value) => value.split(" | "));

  return (
    <BarMenuButton variant="text" visible={visible}>
      <box spacing={8}>
        <For each={fullDate} id={(part) => part}>
          {(part) => <label label={part} class={labelClass} />}
        </For>
      </box>
      {calendarVisible && (
        <BarPopover>
          <BarCalendar showWeekNumbers={showWeekNumbers} />
        </BarPopover>
      )}
    </BarMenuButton>
  );
}
