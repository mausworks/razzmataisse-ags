import AstalBluetooth from "gi://AstalBluetooth";
import Gio from "gi://Gio";
import { Accessor, createBinding } from "gnim";

import { createMutable, Mutable } from "./state";

interface BatteryMonitor {
  proxy: Gio.DBusProxy | null;
  state: Mutable<number>;
  unsubscribe: () => void;
}

// Keyed by device address, not re-created per read/poll -- a `DBusProxy`
// with the default flags auto-subscribes to property-change notifications
// and keeps its cached properties fresh in the background on its own, so
// a reused proxy's `get_cached_property` call below doesn't even cost a
// D-Bus round trip most of the time, let alone the full introspection +
// initial-property-fetch handshake a freshly constructed one requires.
const monitors = new Map<string, BatteryMonitor>();

export const monitorBatteryLevel = (device: AstalBluetooth.Device) => {
  const monitor = initBatteryMonitor(device);

  return monitor.state as Accessor<number>;
};

export const startBatteryMonitor = (device: AstalBluetooth.Device) =>
  void initBatteryMonitor(device);

export const removeBatteryMonitor = (device: AstalBluetooth.Device) => {
  const monitor = monitors.get(device.address);

  monitor?.unsubscribe();
  monitor?.state.set(-1);
};

/**
 * `AstalBluetooth`'s own `battery_percentage` can come back stuck at -1
 * for a device that was already connected (with its `Battery1` interface
 * already present) at the moment `AstalBluetooth` itself started up --
 * its startup scan enumerates each object's interfaces in whatever order
 * GDBus happens to return them, and if `Battery1` is processed before
 * `Device1` for the same object (both live on it), astal's
 * device-lookup-by-path comes up empty and the reading is dropped for
 * good, with no retry since it only runs once. A device connected *after*
 * astal's already running doesn't hit this -- Device1 and Battery1 then
 * arrive as two separate, correctly-ordered signals instead of one
 * unordered bulk scan. Reading `Battery1` directly ourselves, always,
 * sidesteps the bug (and the need to know about it) entirely, at the
 * cost of assuming a single "hci0" adapter (true for virtually every real
 * setup, including this one) -- a fully adapter-agnostic version would
 * need to walk bluez's whole object tree to find the matching device by
 * address instead of guessing the path.
 */
const initBatteryMonitor = (device: AstalBluetooth.Device) => {
  const monitor = monitors.get(device.address) ?? {
    proxy: null,
    state: createMutable(-1),
    unsubscribe: () => {},
  };

  if (monitor.proxy) {
    monitor.state.set(readBatteryPercentage(device, monitor.proxy));

    return monitor;
  }

  monitor.unsubscribe();
  monitor.proxy = createBatteryProxy(device);

  const updateBatteryLevel = () => {
    const value = readBatteryPercentage(device, monitor.proxy);

    monitor.state.set(value);
  };

  updateBatteryLevel();

  if (monitor.proxy) {
    const handle = monitor.proxy.connect(
      "g-properties-changed",
      updateBatteryLevel,
    );

    monitor.unsubscribe = () => {
      monitor.proxy?.disconnect(handle);
      monitor.proxy = null;
      monitor.unsubscribe = () => {};
    };
  } else {
    const binding = createBinding(device, "batteryPercentage");
    const unsubscribe = binding.subscribe(() => {
      monitor.state.set(binding.peek());
    });

    monitor.unsubscribe = () => {
      unsubscribe();
      monitor.proxy = null;
      monitor.unsubscribe = () => {};
    };
  }

  monitors.set(device.address, monitor);

  return monitor;
};

const readBatteryPercentage = (
  device: AstalBluetooth.Device,
  proxy: Gio.DBusProxy | null,
): number => {
  if (!proxy) return device.batteryPercentage;

  const percentage = proxy.get_cached_property("Percentage");
  const unpacked = Number(percentage?.unpack()) / 100;

  return isNaN(unpacked) ? -1 : unpacked;
};

const createBatteryProxy = (device: AstalBluetooth.Device) => {
  if (device.batteryPercentage !== -1) return null;

  const path = `/org/bluez/hci0/dev_${device.address.replace(/:/g, "_")}`;

  try {
    return Gio.DBusProxy.new_for_bus_sync(
      Gio.BusType.SYSTEM,
      Gio.DBusProxyFlags.NONE,
      null,
      "org.bluez",
      path,
      "org.bluez.Battery1",
      null,
    );
  } catch (error) {
    console.error(
      "Failed to create battery proxy for device",
      device.name,
      "\n",
      error,
    );

    return null;
  }
};
