import app from "ags/gtk4/app"
import { Astal, Gtk, Gdk } from "ags/gtk4"
import Workspaces from "./Workspaces"
import WindowTitle from "./WindowTitle"
import Clock from "./Clock"
import NetworkButton from "./Network"
import BluetoothButton from "./Bluetooth"
import VolumeButton from "./Volume"

export default function Bar(gdkmonitor: Gdk.Monitor) {
  const { TOP, LEFT, RIGHT } = Astal.WindowAnchor

  return (
    <window
      visible
      name="bar"
      class="Bar"
      gdkmonitor={gdkmonitor}
      exclusivity={Astal.Exclusivity.EXCLUSIVE}
      anchor={TOP | LEFT | RIGHT}
      application={app}
    >
      <centerbox cssName="centerbox">
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
