import app from "ags/gtk4/app"
import { Astal, Gtk, Gdk } from "ags/gtk4"
import { createStyle } from "../lib/createStyle"
import Workspaces from "./Workspaces"
import WindowTitle from "./WindowTitle"
import Clock from "./Clock"
import NetworkButton from "./Network"
import BluetoothButton from "./Bluetooth"
import VolumeButton from "./Volume"

const windowStyle = createStyle({
  background: "transparent",
  color: "@theme_fg_color",
  fontWeight: "bold",
})

const centerboxStyle = createStyle({
  background: "@theme_bg_color",
  borderRadius: 10,
  margin: 8,
})

export default function Bar(gdkmonitor: Gdk.Monitor) {
  const { TOP, LEFT, RIGHT } = Astal.WindowAnchor

  return (
    <window
      visible
      name="bar"
      css={windowStyle}
      gdkmonitor={gdkmonitor}
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
  )
}
