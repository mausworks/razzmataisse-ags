import { Gtk } from "ags/gtk4"
import { createBinding, createComputed, For } from "ags"
import { execAsync } from "ags/process"
import AstalNetwork from "gi://AstalNetwork?version=0.1"
import { createStyle, baseButton } from "../lib/createStyle"

const network = AstalNetwork.get_default()
const buttonStyle = createStyle(baseButton)

export default function NetworkButton() {
  const wifi = createBinding(network, "wifi")
  const wifiIcon = createBinding(network, "wifi", "iconName")
  const wiredIcon = createBinding(network, "wired", "iconName")
  const wifiEnabled = createBinding(network, "wifi", "enabled")
  const ssid = createBinding(network, "wifi", "ssid")
  const strength = createBinding(network, "wifi", "strength")
  const accessPoints = createBinding(network, "wifi", "accessPoints")

  const iconName = createComputed(
    () => wifiIcon() ?? wiredIcon() ?? "network-offline-symbolic",
  )

  const statusLabel = createComputed(() => {
    const s = ssid()
    if (s) return `${s}  (${strength()}%)`
    return wiredIcon() ? "Wired connection" : "Not connected"
  })

  const apList = accessPoints.as((list) => {
    const bySsid = new Map<string, AstalNetwork.AccessPoint>()
    for (const ap of list ?? []) {
      if (!ap.ssid) continue
      const existing = bySsid.get(ap.ssid)
      if (!existing || ap.strength > existing.strength) bySsid.set(ap.ssid, ap)
    }
    return [...bySsid.values()].sort((a, b) => b.strength - a.strength)
  })

  function connect(ssid: string) {
    execAsync(["nmcli", "device", "wifi", "connect", ssid]).catch((err) =>
      console.error(`failed to connect to ${ssid}:`, err),
    )
  }

  return (
    <menubutton>
      <image iconName={iconName} />
      <popover>
        <box orientation={Gtk.Orientation.VERTICAL} spacing={8} widthRequest={220}>
          <label label={statusLabel} halign={Gtk.Align.START} />

          <box spacing={8}>
            <label label="Wi-Fi" hexpand halign={Gtk.Align.START} />
            <switch
              active={wifiEnabled.as((v) => v ?? false)}
              onNotifyActive={(self) => {
                if (network.wifi) network.wifi.enabled = self.active
              }}
            />
            <button
              css={buttonStyle}
              onClicked={() => network.wifi?.scan()}
              tooltipText="Scan"
            >
              <image iconName="view-refresh-symbolic" />
            </button>
          </box>

          <box orientation={Gtk.Orientation.VERTICAL} spacing={2}>
            <For each={apList}>
              {(ap) => (
                <button css={buttonStyle} onClicked={() => connect(ap.ssid!)}>
                  <box spacing={6}>
                    <image iconName={createBinding(ap, "iconName")} />
                    <label label={ap.ssid ?? ""} hexpand halign={Gtk.Align.START} />
                    <label label={createBinding(ap, "strength").as((s) => `${s}%`)} />
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
