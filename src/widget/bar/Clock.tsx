import { defineStyle } from "@lib/css";
import { Gtk } from "ags/gtk4";
import { createPoll } from "ags/time";
import { For } from "gnim";

import { MenuPill } from "./Pill";
import { calendarClass, popoverClass } from "./popover";

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
      <popover class={popoverClass}>
        <Gtk.Calendar class={calendarClass} />
      </popover>
    </MenuPill>
  );
}
