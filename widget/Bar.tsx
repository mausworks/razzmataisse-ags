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
import { alpha, shade } from "../lib/css/color";

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
    padding: "4px 12px",
    background: alpha(shade("@theme_bg_color", -0.8), 0.25),
    transition: "background 300ms ease-in",
    "&:hover": {
      background: alpha(shade("@theme_bg_color", -0.8), 0.5),
      transition: "background 600ms ease-out",
    },
  },
})();

const { TOP, LEFT, RIGHT } = Astal.WindowAnchor;

// In dev mode, the bar gets killed and relaunched on every source change.
// An EXCLUSIVE surface reserves screen space, so Hyprland re-tiles every
// other window each time that reservation appears/disappears. NORMAL still
// anchors the bar in place without reserving space, so restarts don't
// shuffle the rest of the layout.
const BAR_EXCLUSIVITY = GLib.getenv("AGS_DEV")
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
      exclusivity={BAR_EXCLUSIVITY}
      anchor={TOP | LEFT | RIGHT}
      application={app}
    >
      <centerbox class={containerClass}>
        <box $type="start" spacing={8}>
          <Workspaces />
        </box>
        <box $type="center">
          <WindowTitle />
        </box>
        <box $type="end" spacing={4}>
          <NetworkButton />
          <BluetoothButton />
          <VolumeButton />
          <Clock />
        </box>
      </centerbox>
    </window>
  );
}
