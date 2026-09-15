import app from "ags/gtk4/app";
import { Astal, Gdk } from "ags/gtk4";
import GLib from "gi://GLib";
import { defineStyle } from "../lib/css";
import Workspaces from "./Workspaces";
import WindowTitle from "./WindowTitle";
import Clock from "./Clock";
import NetworkButton from "./NetworkButton";
import BluetoothButton from "./BluetoothButton";
import VolumeButton from "./VolumeButton";

const windowClass = defineStyle({
  class: "Bar",
  style: {
    background: "transparent",
    color: "@theme_fg_color",
    fontWeight: "bold",
  },
})();

const containerClass = defineStyle({
  class: "BarContainer",
  style: {
    padding: "0 12px",
  },
})();

const { TOP, LEFT, RIGHT } = Astal.WindowAnchor;

// In dev mode, the bar gets killed and relaunched on every source change.
// An EXCLUSIVE surface reserves screen space, so Hyprland re-tiles every
// other window each time that reservation appears/disappears. NORMAL still
// anchors the bar in place without reserving space, so restarts don't
// shuffle the rest of the layout.
const exclusivity = GLib.getenv("AGS_DEV")
  ? Astal.Exclusivity.NORMAL
  : Astal.Exclusivity.EXCLUSIVE;

export type BarProps = {
  monitor: Gdk.Monitor;
};

export default function Bar({ monitor }: BarProps) {
  return (
    <window
      visible
      name="bar"
      class={windowClass}
      gdkmonitor={monitor}
      exclusivity={exclusivity}
      anchor={TOP | LEFT | RIGHT}
      application={app}
    >
      <centerbox class={containerClass}>
        <box $type="start" spacing={8}>
          <Workspaces />
          <WindowTitle />
        </box>
        <Clock $type="center" />
        <box $type="end" spacing={4}>
          <NetworkButton />
          <BluetoothButton />
          <VolumeButton />
        </box>
      </centerbox>
    </window>
  );
}
