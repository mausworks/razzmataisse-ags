import { defineStyle } from "@lib/css";
import theme from "@theme";
import { createBinding, createComputed, For } from "ags";
import { Gtk } from "ags/gtk4";
import AstalBluetooth from "gi://AstalBluetooth?version=0.1";
import type Gio from "gi://Gio?version=2.0";

import BarPopover from "./BarPopover";
import Pill, { MenuPill } from "./Pill";
import StatusBadge from "./StatusBadge";

const Bluetooth = AstalBluetooth.get_default()!;

const createBluetoothModel = () => {
  const hasAdapter = createBinding(Bluetooth, "adapter").as(
    (adapter) => adapter != null,
  );

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

  return { iconName, powered, knownDevices, hasAdapter };
};

/**
 * `AstalBluetooth.Device#connect_device`/`disconnect_device` are typed as
 * zero-arg-returns-a-`Promise` methods, matching GJS's usual async-method
 * convention -- but calling them that way throws synchronously instead
 * (`TypeError: At least 1 argument required, but only 0 passed`), before
 * any `.catch()` can even attach, so clicking a device silently did
 * nothing. Driving the explicit `(self, result) => ...; foo_finish(result)`
 * form works, so that's done by hand here and wrapped back into a Promise.
 */
const promisifyDeviceCall = (
  device: AstalBluetooth.Device,
  call: (
    callback: (
      self: AstalBluetooth.Device | null,
      res: Gio.AsyncResult,
    ) => void,
  ) => void,
  finish: (self: AstalBluetooth.Device, res: Gio.AsyncResult) => void,
) =>
  new Promise<void>((resolve, reject) => {
    call((self, res) => {
      try {
        finish(self ?? device, res);
        resolve();
      } catch (err) {
        reject(err instanceof Error ? err : new Error(String(err)));
      }
    });
  });

const createBluetoothActions = () => {
  const enable = () => {
    if (Bluetooth.adapter) Bluetooth.adapter.powered = true;
  };

  const disable = () => {
    if (Bluetooth.adapter) Bluetooth.adapter.powered = false;
  };

  const toggle = (device: AstalBluetooth.Device) =>
    (device.connected
      ? promisifyDeviceCall(
          device,
          (cb) => device.disconnect_device(cb),
          (self, res) => self.disconnect_device_finish(res),
        )
      : promisifyDeviceCall(
          device,
          (cb) => device.connect_device(cb),
          (self, res) => self.connect_device_finish(res),
        )
    ).catch((err) => console.error(`bluetooth toggle failed:`, err));

  return { enable, disable, toggle };
};

export type BluetoothButtonProps = {
  visible?: boolean;
};

export default function BluetoothButton({
  visible = true,
}: BluetoothButtonProps) {
  const { iconName, powered, knownDevices, hasAdapter } =
    createBluetoothModel();
  const { enable, disable, toggle } = createBluetoothActions();

  return (
    <MenuPill variant="icon" visible={hasAdapter.as((has) => visible && has)}>
      <image iconName={iconName} />
      <BarPopover>
        <box
          orientation={Gtk.Orientation.VERTICAL}
          spacing={8}
          widthRequest={220}
          marginStart={8}
          marginEnd={8}
        >
          <box spacing={8} marginTop={8} marginStart={4} marginEnd={4}>
            <label label="Bluetooth" hexpand halign={Gtk.Align.START} />
            <StatusBadge
              on={powered}
              onClicked={() => (powered.peek() ? disable() : enable())}
            />
          </box>

          <box
            orientation={Gtk.Orientation.VERTICAL}
            spacing={2}
            marginBottom={8}
            visible={powered}
          >
            <For each={knownDevices} id={(device) => device.address}>
              {(device) => (
                <Pill onClicked={() => toggle(device)}>
                  <box spacing={6}>
                    <image
                      iconName={createBinding(device, "icon").as(
                        (icon) => `${icon}-symbolic`,
                      )}
                    />
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
                      class={connectedLabelClass}
                    />
                  </box>
                </Pill>
              )}
            </For>
          </box>
        </box>
      </BarPopover>
    </MenuPill>
  );
}

const connectedLabelClass = defineStyle({
  style: {
    color: theme.bar.palette.accent,
    fontWeight: "bold",
  },
})();
