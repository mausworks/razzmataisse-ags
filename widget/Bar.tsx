import app from "ags/gtk4/app";
import { Astal, Gdk } from "ags/gtk4";
import { createStyle } from "../lib/style";
import Workspaces from "./Workspaces";
import WindowTitle from "./WindowTitle";
import Clock from "./Clock";
import NetworkButton from "./NetworkButton";
import BluetoothButton from "./BluetoothButton";
import VolumeButton from "./VolumeButton";

const windowStyle = createStyle({
  background: "transparent",
  color: "@theme_fg_color",
  fontWeight: "bold",
});

const centerboxStyle = createStyle({
  padding: "0 12px",
});

const { TOP, LEFT, RIGHT } = Astal.WindowAnchor;

export interface BarProps {
  monitor: Gdk.Monitor;
};

export default function Bar({ monitor }: BarProps) {
  return (
    <window
      visible
      name="bar"
      css={windowStyle}
      gdkmonitor={monitor}
      exclusivity={Astal.Exclusivity.EXCLUSIVE}
      anchor={TOP | LEFT | RIGHT}
      application={app}
    >
      <centerbox css={centerboxStyle}>
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
