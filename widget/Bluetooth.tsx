import { Gtk } from "ags/gtk4"
import { createBinding, createComputed, For } from "ags"
import AstalBluetooth from "gi://AstalBluetooth?version=0.1"
import { createStyle, baseButton } from "../lib/createStyle"

const bluetooth = AstalBluetooth.get_default()!
const buttonStyle = createStyle(baseButton)

export default function BluetoothButton() {
  const isPowered = createBinding(bluetooth, "isPowered")
  const isConnected = createBinding(bluetooth, "isConnected")
  const devices = createBinding(bluetooth, "devices")

  const iconName = createComputed(() => {
    if (!isPowered()) {
      return "bluetooth-disabled-symbolic"
    } else if (isConnected()) {
      return "bluetooth-active-symbolic"
    } else {
      return "bluetooth-symbolic"
    }
  })

  const knownDevices = devices.as((list) =>
    [...list].filter((device) => device.paired || device.connected),
  )

  const toggle = (device: AstalBluetooth.Device) =>
    device.connected
      ? device.disconnect_device().catch((err) => console.error(err))
      : device.connect_device().catch((err) => console.error(err))

  return (
    <menubutton>
      <image iconName={iconName} />
      <popover>
        <box orientation={Gtk.Orientation.VERTICAL} spacing={8} widthRequest={220}>
          <box spacing={8}>
            <label label="Bluetooth" hexpand halign={Gtk.Align.START} />
            <switch
              active={isPowered}
              onNotifyActive={(self) => {
                if (bluetooth.adapter) bluetooth.adapter.powered = self.active
              }}
            />
          </box>

          <box orientation={Gtk.Orientation.VERTICAL} spacing={2}>
            <For each={knownDevices}>
              {(device) => (
                <button css={buttonStyle} onClicked={() => toggle(device)}>
                  <box spacing={6}>
                    <label
                      label={createBinding(device, "alias")}
                      hexpand
                      halign={Gtk.Align.START}
                    />
                    <label
                      label={createBinding(device, "connected").as((deviceConnected) =>
                        deviceConnected ? "Connected" : "",
                      )}
                    />
                  </box>
                </button>
              )}
            </For>
          </box>
        </box>
      </popover>
    </menubutton>
  )
}
