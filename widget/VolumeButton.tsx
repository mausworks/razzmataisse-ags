import { Astal } from "ags/gtk4";
import { createBinding } from "ags";
import AstalWp from "gi://AstalWp?version=0.1";
import Pill, { MenuPill } from "./Pill";

const createVolumeModel = () => {
  const wp = AstalWp.get_default()!;

  const iconName = createBinding(wp, "defaultSpeaker", "volumeIcon").as(
    (icon) => icon ?? "audio-volume-muted-symbolic",
  );

  const volume = createBinding(wp, "defaultSpeaker", "volume").as(
    (volumeValue) => volumeValue ?? 0,
  );

  const muteIconName = createBinding(wp, "defaultSpeaker", "mute").as(
    (muted) =>
      muted ? "audio-volume-muted-symbolic" : "audio-volume-high-symbolic",
  );

  return { iconName, volume, muteIconName };
};

const createVolumeActions = () => {
  const { defaultSpeaker } = AstalWp.get_default()!;

  const toggleMute = () => {
    if (!defaultSpeaker) return;

    defaultSpeaker.mute = !defaultSpeaker.mute;
  };

  const setVolume = (value: number) => {
    if (!defaultSpeaker) return;

    defaultSpeaker.volume = value;
  };

  return { toggleMute, setVolume };
};

export default function VolumeButton() {
  const { iconName, volume, muteIconName } = createVolumeModel();
  const { toggleMute, setVolume } = createVolumeActions();

  return (
    <MenuPill variant="icon">
      <image iconName={iconName} />
      <popover>
        <box spacing={8} widthRequest={200}>
          <Pill onClicked={toggleMute}>
            <image iconName={muteIconName} />
          </Pill>

          <slider
            hexpand
            min={0}
            max={1}
            value={volume}
            onValueChanged={({ value }: Astal.Slider) => setVolume(value)}
          />
        </box>
      </popover>
    </MenuPill>
  );
}
