import AstalBluetooth from "gi://AstalBluetooth";
import Gio from "gi://Gio";
import { Accessor, createState, onCleanup } from "gnim";

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
    call((self, res) => {
      try {
        finish(self ?? device, res);
        resolve();
      } catch (err) {
        reject(err instanceof Error ? err : new Error(String(err)));
      }
    });
  });

export const connectBluetoothDevice = (device: AstalBluetooth.Device) =>
  promisifyDeviceCall(
    device,
    (cb) => device.connect_device(cb),
    (self, res) => self?.connect_device_finish(res),
  );

export const disconnectBluetoothDevice = (device: AstalBluetooth.Device) =>
  promisifyDeviceCall(
    device,
    (cb) => device.disconnect_device(cb),
    (self, res) => self?.disconnect_device_finish(res),
  );

// Keyed by device address, not re-created per read/poll -- a `DBusProxy`
// with the default flags auto-subscribes to property-change notifications
// and keeps its cached properties fresh in the background on its own, so
// a reused proxy's `get_cached_property` call below doesn't even cost a
// D-Bus round trip most of the time, let alone the full introspection +
// initial-property-fetch handshake a freshly constructed one requires.
const batteryProxies = new Map<string, Gio.DBusProxy>();

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
const createBatteryProxy = (
  device: AstalBluetooth.Device,
): Gio.DBusProxy | null => {
  const cached = batteryProxies.get(device.address);
  if (cached) return cached;

  const path = `/org/bluez/hci0/dev_${device.address.replace(/:/g, "_")}`;

  try {
    const proxy = Gio.DBusProxy.new_for_bus_sync(
      Gio.BusType.SYSTEM,
      Gio.DBusProxyFlags.NONE,
      null,
      "org.bluez",
      path,
      "org.bluez.Battery1",
      null,
    );

    batteryProxies.set(device.address, proxy);

    return proxy;
  } catch {
    // Not cached on failure -- e.g. the device isn't connected yet, or
    // has no Battery1 interface at all -- so a later call (once it does)
    // gets to try again instead of being stuck with a permanent miss.
    return null;
  }
};

const unpackBatteryPercentage = (proxy: Gio.DBusProxy): number => {
  const percentage = proxy.get_cached_property("Percentage");

  return percentage ? Number(percentage.unpack()) / 100 : -1;
};

export const readBatteryLevel = (device: AstalBluetooth.Device): number => {
  const proxy = createBatteryProxy(device);

  return proxy ? unpackBatteryPercentage(proxy) : -1;
};

/**
 * Monitors the battery level of a Bluetooth device, returning an
 * `Accessor` that updates live off the battery proxy's own
 * `g-properties-changed` signal.
 *
 * Note: If the proxy can't be created at all (device not connected yet,
 * or genuinely has no battery), this just stays at -1 for the component's
 * lifetime rather than retrying.
 *
 * Call it again once the device's actually connected instead.
 */
export const monitorBatteryLevel = (
  device: AstalBluetooth.Device,
): Accessor<number> => {
  const proxy = createBatteryProxy(device);
  const [level, setLevel] = createState(
    proxy ? unpackBatteryPercentage(proxy) : -1,
  );

  if (proxy) {
    const handlerId = proxy.connect("g-properties-changed", () =>
      setLevel(unpackBatteryPercentage(proxy)),
    );

    onCleanup(() => {
      proxy.disconnect(handlerId);
    });
  }

  return level;
};
