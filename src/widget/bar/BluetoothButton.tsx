import { createBinding, createComputed, For } from "ags";
import { Gtk } from "ags/gtk4";
import AstalBluetooth from "gi://AstalBluetooth?version=0.1";

import Pill, { MenuPill } from "./Pill";
import { popoverClass } from "./popover";

const Bluetooth = AstalBluetooth.get_default()!;

const createBluetoothModel = () => {
  const powered = createBinding(Bluetooth, "isPowered");
  const isConnected = createBinding(Bluetooth, "isConnected");
  const devices = createBinding(Bluetooth, "devices");

  const iconName = createComputed(() => {
    if (!powered()) {
      return "bluetooth-disabled-symbolic";
    } else if (isConnected()) {
      return "bluetooth-active-symbolic";
    } else {
      return "bluetooth-symbolic";
    }
  });

  const knownDevices = devices.as((list) =>
    [...list].filter((device) => device.paired || device.connected),
  );

  return { iconName, powered, knownDevices };
};

const createBluetoothActions = () => {
  const enable = () => {
    if (Bluetooth.adapter) Bluetooth.adapter.powered = true;
  };

  const disable = () => {
    if (Bluetooth.adapter) Bluetooth.adapter.powered = false;
  };

  const toggle = (device: AstalBluetooth.Device) =>
    device.connected
      ? device.disconnect_device().catch((err) => console.error(err))
      : device.connect_device().catch((err) => console.error(err));

  return { enable, disable, toggle };
};

export default function BluetoothButton() {
  const { iconName, powered, knownDevices } = createBluetoothModel();
  const { enable, disable, toggle } = createBluetoothActions();

  return (
    <MenuPill variant="icon">
      <image iconName={iconName} />
      <popover class={popoverClass}>
        <box
          orientation={Gtk.Orientation.VERTICAL}
          spacing={8}
          widthRequest={220}
        >
          <box spacing={8}>
            <label label="Bluetooth" hexpand halign={Gtk.Align.START} />
            <switch
              active={powered}
              onNotifyActive={(self) => (self.active ? enable() : disable())}
            />
          </box>

          <box orientation={Gtk.Orientation.VERTICAL} spacing={2}>
            <For each={knownDevices} id={(device) => device.address}>
              {(device) => (
                <Pill onClicked={() => toggle(device)}>
                  <box spacing={6}>
                    <label
                      label={createBinding(device, "alias")}
                      hexpand
                      halign={Gtk.Align.START}
                    />
                    <label
                      label={createBinding(device, "connected").as(
                        (deviceConnected) =>
                          deviceConnected ? "Connected" : "",
                      )}
                    />
                  </box>
                </Pill>
              )}
            </For>
          </box>
        </box>
      </popover>
    </MenuPill>
  );
}
