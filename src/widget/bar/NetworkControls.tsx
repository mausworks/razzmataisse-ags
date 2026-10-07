import { Accessor, createBinding, createComputed, For } from "ags";
import { Gtk } from "ags/gtk4";
import { execAsync } from "ags/process";
import { createPoll } from "ags/time";
import AstalNetwork from "gi://AstalNetwork?version=0.1";

import { BarMenuButton } from "./BarButton";
import BarPopover, {
  BarPopoverHeader,
  BarPopoverList,
  BarPopoverListItem,
} from "./BarPopover";
import StatusBadge from "./StatusBadge";

const Network = AstalNetwork.get_default();

export type NetworkButtonProps = {
  visible?: boolean;
};

export default function NetworkControls({
  visible = true,
}: NetworkButtonProps) {
  const { icon, enabled, accessPoints, activeBSSID, hasWifi } =
    createWifiModel();
  const { enable, disable, toggle } = createWifiActions();

  return (
    <BarMenuButton variant="icon" visible={hasWifi.as((has) => visible && has)}>
      <image iconName={icon} />
      <BarPopover>
        <BarPopoverHeader>
          <label label="Wi-Fi" hexpand halign={Gtk.Align.START} />
          <StatusBadge
            on={enabled}
            onClicked={() => (enabled.peek() ? disable() : enable())}
          />
        </BarPopoverHeader>

        <BarPopoverList visible={hasWifi}>
          <For each={accessPoints} id={(ap) => ap.bssid}>
            {(ap) => (
              <WifiOption
                ap={ap}
                isActive={createComputed(() => activeBSSID() === ap.bssid)}
                toggle={toggle}
              />
            )}
          </For>
        </BarPopoverList>
      </BarPopover>
    </BarMenuButton>
  );
}

interface WifiOptionProps {
  ap: AstalNetwork.AccessPoint;
  isActive: Accessor<boolean>;
  toggle: (ap: AstalNetwork.AccessPoint) => void;
}

function WifiOption({ ap, isActive, toggle }: WifiOptionProps) {
  const icon = createBinding(ap, "iconName");
  const tooltipText = createBinding(ap, "strength").as(
    (apStrength) => `${apStrength}%`,
  );

  return (
    <BarPopoverListItem
      variant={isActive() ? "active" : undefined}
      onClicked={() => toggle(ap)}
    >
      <image iconName={icon} tooltipText={tooltipText} />
      <label label={ap.ssid ?? ""} hexpand halign={Gtk.Align.START} />
    </BarPopoverListItem>
  );
}

const createWifiModel = () => {
  const hasWifi = createBinding(Network, "wifi").as((wifi) => wifi != null);
  const wifiIcon = createBinding(Network, "wifi", "iconName");
  const wiredIcon = createBinding(Network, "wired", "iconName");
  const icon = createComputed(
    () => wifiIcon() ?? wiredIcon() ?? "network-offline-symbolic",
  );
  const enabled = createBinding(Network, "wifi", "enabled").as(
    (wifiEnabled) => wifiEnabled ?? false,
  );

  // Keeps each SSID's position stable across rescans, below.
  const orderedSSIDs = [] as string[];

  const accessPoints = createBinding(Network, "wifi", "accessPoints").as(
    (list) => {
      const bySSID = new Map<string, AstalNetwork.AccessPoint>();
      for (const ap of list ?? []) {
        if (!ap.ssid) continue;

        const existing = bySSID.get(ap.ssid);

        if (!existing || ap.strength > existing.strength) {
          bySSID.set(ap.ssid, ap);
        }
      }

      // The automatic rescan (see `interval` below) re-triggers this on its
      // own schedule, including while the popover is open -- re-sorting by
      // strength every time would reshuffle the list under a user who's
      // mid-click. Instead, newly-seen SSIDs are appended (sorted by
      // strength among themselves), but an SSID already in `orderedSSIDs`
      // keeps its position regardless of later strength changes.
      const seen = new Set(bySSID.keys());

      for (let i = orderedSSIDs.length - 1; i >= 0; i--) {
        if (!seen.has(orderedSSIDs[i])) orderedSSIDs.splice(i, 1);
      }

      const newSSIDs = [...seen]
        .filter((ssid) => !orderedSSIDs.includes(ssid))
        .sort((a, b) => bySSID.get(b)!.strength - bySSID.get(a)!.strength);

      orderedSSIDs.push(...newSSIDs);

      return orderedSSIDs.map((ssid) => bySSID.get(ssid)!);
    },
  );

  const activeBSSID = createBinding(Network, "wifi", "activeAccessPoint").as(
    (ap) => ap?.bssid ?? null,
  );

  return { icon, enabled, accessPoints, activeBSSID, hasWifi };
};

const createWifiActions = () => {
  const { wifi } = Network;

  const enable = () => {
    if (!wifi) return;

    wifi.enabled = true;
  };

  const disable = () => {
    if (!wifi) return;

    wifi.enabled = false;
  };

  const connect = (ssid: string) =>
    execAsync(["nmcli", "device", "wifi", "connect", ssid]).catch((err) =>
      console.error(`failed to connect to ${ssid}:`, err),
    );

  const disconnect = (ssid: string) =>
    execAsync(["nmcli", "connection", "down", "id", ssid]).catch((err) =>
      console.error(`failed to disconnect from ${ssid}:`, err),
    );

  const toggle = (ap: AstalNetwork.AccessPoint) =>
    ap.bssid === wifi?.activeAccessPoint?.bssid
      ? disconnect(ap.ssid!)
      : connect(ap.ssid!);

  createPoll(wifi?.scan(), 5000, () => wifi?.scan());

  return { enable, disable, toggle };
};
