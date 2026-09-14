import { Astal, Gtk } from "ags/gtk4"
import { createBinding } from "ags"
import AstalWp from "gi://AstalWp?version=0.1"

const wp = AstalWp.get_default()!

export default function VolumeButton() {
  const volumeIcon = createBinding(wp, "defaultSpeaker", "volumeIcon")
  const volume = createBinding(wp, "defaultSpeaker", "volume")
  const mute = createBinding(wp, "defaultSpeaker", "mute")

  return (
    <menubutton cssName="volume">
      <image iconName={volumeIcon.as((i) => i ?? "audio-volume-muted-symbolic")} />
      <popover>
        <box spacing={8} widthRequest={200}>
          <button
            onClicked={() => {
              const speaker = wp.defaultSpeaker
              if (speaker) speaker.mute = !speaker.mute
            }}
          >
            <image
              iconName={mute.as((m) =>
                m ? "audio-volume-muted-symbolic" : "audio-volume-high-symbolic",
              )}
            />
          </button>
          <slider
            hexpand
            min={0}
            max={1}
            value={volume.as((v) => v ?? 0)}
            onValueChanged={(self: Astal.Slider) => {
              const speaker = wp.defaultSpeaker
              if (speaker) speaker.volume = self.value
            }}
          />
        </box>
      </popover>
    </menubutton>
  )
}
