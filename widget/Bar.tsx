import app from "ags/gtk4/app";
import { Astal, Gdk } from "ags/gtk4";
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
      exclusivity={Astal.Exclusivity.EXCLUSIVE}
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
