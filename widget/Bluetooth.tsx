import { Gtk } from "ags/gtk4"
import { createBinding, createComputed, For } from "ags"
import AstalBluetooth from "gi://AstalBluetooth?version=0.1"

const bluetooth = AstalBluetooth.get_default()!

export default function BluetoothButton() {
  const isPowered = createBinding(bluetooth, "isPowered")
  const isConnected = createBinding(bluetooth, "isConnected")
  const devices = createBinding(bluetooth, "devices")

  const iconName = createComputed(() => {
    if (!isPowered()) return "bluetooth-disabled-symbolic"
    if (isConnected()) return "bluetooth-active-symbolic"
    return "bluetooth-symbolic"
  })

  const knownDevices = devices.as((list) =>
    [...list].filter((d) => d.paired || d.connected),
  )

  function toggle(device: AstalBluetooth.Device) {
    if (device.connected) {
      device.disconnect_device().catch((err) => console.error(err))
    } else {
      device.connect_device().catch((err) => console.error(err))
    }
  }

  return (
    <menubutton cssName="bluetooth">
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
                <button onClicked={() => toggle(device)}>
                  <box spacing={6}>
                    <label
                      label={createBinding(device, "alias")}
                      hexpand
                      halign={Gtk.Align.START}
                    />
                    <label
                      label={createBinding(device, "connected").as((c) =>
                        c ? "Connected" : "",
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
