import { defineStyle } from "@lib/css";
import { createPoll } from "ags/time";
import { For } from "gnim";

import BarPopover, { BarCalendar } from "./BarPopover";
import { MenuPill } from "./Pill";

const labelClass = defineStyle({
  style: {
    fontFeatureSettings: '"tnum" 1',
  },
})();

export default function Clock({
  dateFormat = "%a %d %b",
  timeFormat = "%H:%M",
}) {
  const fullDate = createPoll(
    "",
    1000,
    `date +'${dateFormat} | ${timeFormat}'`,
  ).as((value) => value.split(" | "));

  return (
    <MenuPill variant="text">
      <box spacing={8}>
        <For each={fullDate} id={(part) => part}>
          {(part) => <label label={part} class={labelClass} />}
        </For>
      </box>
      <BarPopover>
        <BarCalendar />
      </BarPopover>
    </MenuPill>
  );
}
