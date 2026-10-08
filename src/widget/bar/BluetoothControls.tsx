import {
  connectBluetoothDevice,
  disconnectBluetoothDevice,
} from "@lib/bluetooth";
import { monitorBatteryLevel } from "@lib/bluetooth-battery";
import { defineStyle } from "@lib/css";
import { supportedIcon } from "@lib/icon-theme";
import theme from "@theme";
import {
  Accessor,
  createBinding,
  createComputed,
  createEffect,
  createState,
  For,
} from "ags";
import { Gtk } from "ags/gtk4";
import AstalBluetooth from "gi://AstalBluetooth?version=0.1";

import { BarMenuButton } from "./BarButton";
import BarPopover, {
  BarPopoverHeader,
  BarPopoverList,
  BarPopoverListItem,
} from "./BarPopover";
import StatusBadge from "./StatusBadge";

const Bluetooth = AstalBluetooth.get_default()!;

const { palette } = theme.bar;

const createBluetoothModel = () => {
  const hasAdapter = createBinding(Bluetooth, "adapter").as(Boolean);
  const powered = createBinding(Bluetooth, "isPowered");
  const isConnected = createBinding(Bluetooth, "isConnected");
  const devices = createBinding(Bluetooth, "devices");
  const icon = createComputed(() => {
    if (!powered()) {
      return "bluetooth-disabled-symbolic";
    } else if (isConnected()) {
      return "bluetooth-active-symbolic";
    } else {
      return "bluetooth-symbolic";
    }
  });

  const knownDevices = devices.as((list) =>
    [...list]
      .sort((a, b) => (b.connected ? 1 : 0) - (a.connected ? 1 : 0))
      .filter((device) => device.paired || device.connected),
  );

  return { icon, powered, knownDevices, hasAdapter };
};

const createBluetoothActions = () => {
  const enable = () => {
    if (Bluetooth.adapter) Bluetooth.adapter.powered = true;
  };

  const disable = () => {
    if (Bluetooth.adapter) Bluetooth.adapter.powered = false;
  };

  const toggle = (device: AstalBluetooth.Device) =>
    (device.connected
      ? disconnectBluetoothDevice(device)
      : connectBluetoothDevice(device)
    ).catch((error) => console.error("bluetooth toggle failed:", error));

  return { enable, disable, toggle };
};

export type BluetoothControlsProps = {
  visible?: boolean;
};

export default function BluetoothControls({
  visible = true,
}: BluetoothControlsProps) {
  const { icon, powered, knownDevices, hasAdapter } = createBluetoothModel();
  const { enable, disable, toggle } = createBluetoothActions();

  return (
    <BarMenuButton
      variant="icon"
      visible={hasAdapter.as((has) => visible && has)}
    >
      <image iconName={icon} />
      <BarPopover>
        <BarPopoverHeader>
          <label label="Bluetooth" hexpand halign={Gtk.Align.START} />
          <StatusBadge
            on={powered}
            onClicked={() => (powered.peek() ? disable() : enable())}
          />
        </BarPopoverHeader>

        <BarPopoverList
          orientation={Gtk.Orientation.VERTICAL}
          visible={powered}
        >
          <For each={knownDevices} id={(device) => device.address}>
            {(device) => <DeviceOption device={device} onClicked={toggle} />}
          </For>
        </BarPopoverList>
      </BarPopover>
    </BarMenuButton>
  );
}

interface DeviceListItemProps {
  device: AstalBluetooth.Device;
  onClicked: (device: AstalBluetooth.Device) => Promise<void>;
}

function DeviceOption({ device, onClicked }: DeviceListItemProps) {
  const isConnected = createBinding(device, "connected");
  const isConnecting = createBinding(device, "connecting");
  const [loading, setLoading] = createState(isConnecting());
  const alias = createBinding(device, "alias");
  const battery = monitorBatteryLevel(device);
  const icon = createBinding(device, "icon").as(
    (icon) => supportedIcon(`${icon}-symbolic`, icon) ?? "bluetooth-symbolic",
  );

  createEffect(() => {
    if (isConnecting()) {
      setLoading(true);
    } else {
      isConnected();
      setLoading(false);
    }
  });

  return (
    <BarPopoverListItem
      variant={[
        isConnected.as((is) => is && "active"),
        loading.as((is) => is && "loading"),
      ]}
      onClicked={() => {
        setLoading(true);
        onClicked(device).finally(() => setLoading(false));
      }}
    >
      <image iconName={icon} />
      <label label={alias} hexpand halign={Gtk.Align.START} />
      <BatteryIcon
        battery={battery}
        visible={createComputed(() => !loading() && isConnected())}
      />
    </BarPopoverListItem>
  );
}

interface BatteryIconProps extends propsof<typeof Gtk.Image> {
  battery: Accessor<number>;
}

function BatteryIcon({ battery, ...props }: BatteryIconProps) {
  const iconName = createComputed(() => {
    const factor = battery();

    if (factor === -1) return "battery-missing-symbolic";

    const level = Math.round((factor * 100) / 10) * 10;

    return `battery-level-${level}-symbolic`;
  });

  return (
    <image
      class={batteryIconClass}
      tooltipText={battery.as((value) =>
        value !== -1 ? `${Math.round(value * 100)} %` : "N/A",
      )}
      iconName={iconName.as(
        (name) => supportedIcon(name) ?? "battery-symbolic",
      )}
      {...props}
    />
  );
}

const batteryIconClass = defineStyle({
  style: {
    color: palette.text,
  },
})();
