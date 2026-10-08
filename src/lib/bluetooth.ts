import AstalBluetooth from "gi://AstalBluetooth";
import Gio from "gi://Gio";

import { removeBatteryMonitor, startBatteryMonitor } from "./bluetooth-battery";

type BluetoothDeviceCallback = (
  self: AstalBluetooth.Device | null,
  result: Gio.AsyncResult,
) => void;

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
  call: (callback: BluetoothDeviceCallback) => void,
  finish: BluetoothDeviceCallback,
) =>
  new Promise<void>((resolve, reject) => {
    call((self, result) => {
      try {
        finish(self ?? device, result);
        resolve();
      } catch (error) {
        reject(error instanceof Error ? error : new Error(String(error)));
      }
    });
  });

export const connectBluetoothDevice = (device: AstalBluetooth.Device) =>
  promisifyDeviceCall(
    device,
    (callback) => {
      removeBatteryMonitor(device);
      device.connect_device(callback);
    },
    (self, result) => {
      self?.connect_device_finish(result);
      startBatteryMonitor(device);
    },
  );

export const disconnectBluetoothDevice = (device: AstalBluetooth.Device) =>
  promisifyDeviceCall(
    device,
    (callback) => {
      removeBatteryMonitor(device);
      device.disconnect_device(callback);
    },
    (self, result) => self?.disconnect_device_finish(result),
  );
