import config from "@config";
import { defineStyle } from "@lib/css";
import { IS_DEV } from "@lib/dev";
import { withLayerBlur } from "@lib/hyprland";
import theme from "@theme";
import { Astal, Gdk } from "ags/gtk4";
import app from "ags/gtk4/app";

import BluetoothButton from "./BluetoothButton";
import Clock from "./Clock";
import LauncherButton from "./LauncherButton";
import VolumeButton from "./VolumeButton";
import NetworkButton from "./WifiButton";
import WindowTitle from "./WindowTitle";
import WorkspaceControls from "./WorkspaceControls";

const { TOP, LEFT, RIGHT } = Astal.WindowAnchor;

// In dev mode, the bar gets killed and relaunched on every source change.
// An EXCLUSIVE surface reserves screen space, so Hyprland re-tiles every
// other window each time that reservation appears/disappears. NORMAL still
// anchors the bar in place without reserving space, so restarts don't
// shuffle the rest of the layout.
const BAR_EXCLUSIVITY = IS_DEV
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
      namespace="bar"
      class={windowClass}
      gdkmonitor={monitor}
      exclusivity={BAR_EXCLUSIVITY}
      anchor={TOP | LEFT | RIGHT}
      application={app}
      $={withLayerBlur({ blurPopups: true })}
    >
      <centerbox class={containerClass}>
        <box $type="start" spacing={8}>
          <LauncherButton {...config.bar.launcher} />
          <WorkspaceControls {...config.bar.workspaces} />
        </box>
        <box $type="center">
          <WindowTitle {...config.bar.windowTitle} />
        </box>
        <box $type="end" spacing={4}>
          <NetworkButton {...config.bar.wifi} />
          <BluetoothButton {...config.bar.bluetooth} />
          <VolumeButton {...config.bar.audio} />
          <Clock {...config.bar.clock} calendar={config.bar.calendar} />
        </box>
      </centerbox>
    </window>
  );
}

const { palette, transition } = theme.bar;

const windowClass = defineStyle({
  style: {
    background: "transparent",
  },
})();

const containerClass = defineStyle({
  style: {
    padding: "4px 12px",
    background: palette.background,
    transition: `background ${transition.in}`,
    color: palette.text,
    "&:hover": {
      background: palette.activeBackground,
      transition: `background ${transition.out}`,
    },
  },
})();
