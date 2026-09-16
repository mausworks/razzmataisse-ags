import { Gtk } from "ags/gtk4";
import { createPoll } from "ags/time";
import { MenuPill } from "./Pill";

export default function Clock() {
  const time = createPoll("", 1000, "date +'%H:%M  %a %d %b'");

  return (
    <box hexpand halign={Gtk.Align.CENTER}>
      <MenuPill>
        <label label={time} />
        <popover>
          <Gtk.Calendar />
        </popover>
      </MenuPill>
    </box>
  );
}
