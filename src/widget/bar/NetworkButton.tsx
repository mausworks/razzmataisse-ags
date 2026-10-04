import { defineStyle } from "@lib/css";
import theme from "@theme";
import { createBinding, createComputed, For } from "ags";
import { Gtk } from "ags/gtk4";
import { execAsync } from "ags/process";
import { interval } from "ags/time";
import AstalNetwork from "gi://AstalNetwork?version=0.1";

import BarPopover from "./BarPopover";
import Pill, { MenuPill } from "./Pill";
import StatusBadge from "./StatusBadge";

const Network = AstalNetwork.get_default();

const createNetworkModel = () => {
  const hasWifi = createBinding(Network, "wifi").as((wifi) => wifi != null);

  const wifiIcon = createBinding(Network, "wifi", "iconName");
  const wiredIcon = createBinding(Network, "wired", "iconName");

  const iconName = createComputed(
    () => wifiIcon() ?? wiredIcon() ?? "network-offline-symbolic",
  );

  const enabled = createBinding(Network, "wifi", "enabled").as(
    (wifiEnabled) => wifiEnabled ?? false,
  );

  // Keeps each SSID's position stable across rescans, below.
  const orderedSsids: string[] = [];

  const accessPoints = createBinding(Network, "wifi", "accessPoints").as(
    (list) => {
      const bySsid = new Map<string, AstalNetwork.AccessPoint>();
      for (const ap of list ?? []) {
        if (!ap.ssid) continue;
        const existing = bySsid.get(ap.ssid);
        if (!existing || ap.strength > existing.strength)
          bySsid.set(ap.ssid, ap);
      }

      // The automatic rescan (see `interval` below) re-triggers this on its
      // own schedule, including while the popover is open -- re-sorting by
      // strength every time would reshuffle the list under a user who's
      // mid-click. Instead, newly-seen SSIDs are appended (sorted by
      // strength among themselves), but an SSID already in `orderedSsids`
      // keeps its position regardless of later strength changes.
      const seen = new Set(bySsid.keys());
      for (let i = orderedSsids.length - 1; i >= 0; i--) {
        if (!seen.has(orderedSsids[i])) orderedSsids.splice(i, 1);
      }
      const newSsids = [...seen]
        .filter((ssid) => !orderedSsids.includes(ssid))
        .sort((a, b) => bySsid.get(b)!.strength - bySsid.get(a)!.strength);
      orderedSsids.push(...newSsids);

      return orderedSsids.map((ssid) => bySsid.get(ssid)!);
    },
  );

  const activeBssid = createBinding(Network, "wifi", "activeAccessPoint").as(
    (ap) => ap?.bssid ?? null,
  );

  return { iconName, enabled, accessPoints, activeBssid, hasWifi };
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

  const toggle = (ap: AstalNetwork.AccessPoint, activeBssid: string | null) =>
    ap.bssid === activeBssid ? disconnect(ap.ssid!) : connect(ap.ssid!);

  interval(5000, () => wifi?.scan());

  return { enable, disable, toggle };
};

export type NetworkButtonProps = {
  visible?: boolean;
};

export default function NetworkButton({ visible = true }: NetworkButtonProps) {
  const { iconName, enabled, accessPoints, activeBssid, hasWifi } =
    createNetworkModel();
  const { enable, disable, toggle } = createWifiActions();

  return (
    <MenuPill variant="icon" visible={hasWifi.as((has) => visible && has)}>
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
            <label label="Wi-Fi" hexpand halign={Gtk.Align.START} />
            <StatusBadge
              on={enabled}
              onClicked={() => (enabled.peek() ? disable() : enable())}
            />
          </box>

          <box
            orientation={Gtk.Orientation.VERTICAL}
            spacing={2}
            marginBottom={8}
            visible={enabled}
          >
            <For each={accessPoints} id={(ap) => ap.bssid}>
              {(ap) => (
                <Pill onClicked={() => toggle(ap, activeBssid.peek())}>
                  <box spacing={6}>
                    <image
                      iconName={createBinding(ap, "iconName")}
                      class={activeBssid.as((bssid) =>
                        bssid === ap.bssid ? activeApClass : "",
                      )}
                    />
                    <label
                      label={ap.ssid ?? ""}
                      hexpand
                      halign={Gtk.Align.START}
                      class={activeBssid.as((bssid) =>
                        bssid === ap.bssid ? activeApClass : "",
                      )}
                    />
                    <label
                      label={createBinding(ap, "strength").as(
                        (apStrength) => `${apStrength}%`,
                      )}
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

const activeApClass = defineStyle({
  style: {
    color: theme.bar.palette.accent,
    fontWeight: "bold",
  },
})();
