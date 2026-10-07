import { supportedIcon } from "@lib/icon-theme";
import { shortest } from "@lib/string";
import { createBinding, createComputed, createEffect, For } from "ags";
import { Gtk } from "ags/gtk4";
import AstalWp from "gi://AstalWp?version=0.1";
import Pango from "gi://Pango";

import BarButton, { BarMenuButton } from "./BarButton";
import BarPopover, {
  BarPopoverHeader,
  BarPopoverList,
  BarPopoverListItem,
} from "./BarPopover";

export type AudioControlsProps = {
  visible?: boolean;
};

export default function AudioControls({ visible = true }: AudioControlsProps) {
  const { icon, volume, hasSpeaker, speakers } = createAudioModel();
  const { toggleMute, setVolume, selectSpeaker } = createAudioActions();

  createEffect(() => {
    console.log(volume());
  });

  return (
    <BarMenuButton
      variant="icon"
      visible={hasSpeaker.as((has) => visible && has)}
    >
      <image iconName={icon} />

      <BarPopover halign={Gtk.Align.START} hexpand={false}>
        <BarPopoverHeader>
          <slider
            hexpand
            min={0}
            max={1}
            value={volume}
            onValueChanged={({ value }) => setVolume(value)}
          />

          <BarButton onClicked={toggleMute}>
            <image iconName={icon} />
          </BarButton>
        </BarPopoverHeader>

        <BarPopoverList orientation={Gtk.Orientation.VERTICAL} spacing={2}>
          <For each={speakers} id={(speaker) => String(speaker.id)}>
            {(speaker) => (
              <SpeakerOption speaker={speaker} onSelect={selectSpeaker} />
            )}
          </For>
        </BarPopoverList>
      </BarPopover>
    </BarMenuButton>
  );
}

interface SpeakerOptionProps {
  speaker: AstalWp.Endpoint;
  onSelect: (speaker: AstalWp.Endpoint) => void;
}

function SpeakerOption({ speaker, onSelect }: SpeakerOptionProps) {
  const name = getSpeakerName(speaker);
  const icon = getSpeakerIcon(speaker);

  return (
    <BarPopoverListItem
      variant={speaker.isDefault ? "active" : undefined}
      onClicked={() => onSelect(speaker)}
    >
      <box halign={Gtk.Align.FILL} spacing={6}>
        <image iconName={icon} hexpand={false} halign={Gtk.Align.START} />
        <label
          label={name ?? ""}
          ellipsize={Pango.EllipsizeMode.END}
          maxWidthChars={22}
        />
      </box>
    </BarPopoverListItem>
  );
}

const getSpeakerName = ({ name, description, device }: AstalWp.Endpoint) =>
  shortest(name, description, device?.description)?.split("[")[0].trim() ??
  "Unknown";

const getSpeakerIcon = ({ name, icon, device }: AstalWp.Endpoint) => {
  if (icon.includes("headset")) {
    return supportedIcon(icon, device?.icon) ?? "audio-headset-symbolic";
  } else if (icon.includes("headphones")) {
    return supportedIcon(icon, device?.icon) ?? "audio-headphones-symbolic";
  } else if (name?.includes("HDMI") || device?.description?.includes("HDMI")) {
    return supportedIcon(icon, device?.icon) ?? "display-symbolic";
  } else {
    return supportedIcon(icon, device?.icon) ?? "audio-card-symbolic";
  }
};

const createAudioModel = () => {
  const wp = AstalWp.get_default()!;

  const muted = createBinding(wp, "defaultSpeaker", "mute");
  const hasSpeaker = createBinding(wp, "defaultSpeaker").as(
    (speaker) => speaker != null,
  );
  const volumeIcon = createBinding(wp, "defaultSpeaker", "volumeIcon").as(
    (icon) => supportedIcon(icon) ?? "audio-volume-muted-symbolic",
  );
  const volume = createBinding(wp, "defaultSpeaker", "volume").as(
    (volumeValue) => volumeValue ?? 0,
  );
  const speakers = createBinding(wp.audio, "speakers").as((list) =>
    (list ?? []).sort((left, right) =>
      left.isDefault === right.isDefault ? 0 : left.isDefault ? -1 : 1,
    ),
  );

  const icon = createComputed(() =>
    volume() < 0.01 || muted() ? "audio-volume-muted-symbolic" : volumeIcon(),
  );

  return {
    icon,
    volume,
    muted,
    hasSpeaker,
    speakers,
  };
};

const createAudioActions = () => {
  const { defaultSpeaker } = AstalWp.get_default()!;

  const toggleMute = () => {
    if (!defaultSpeaker) return;

    defaultSpeaker.mute = !defaultSpeaker.mute;
  };

  const setVolume = (value: number) => {
    if (!defaultSpeaker) return;

    defaultSpeaker.volume = value;
  };

  // Setting `isDefault = false` is a documented no-op (AstalWp only lets
  // you *elect* a new default, not un-elect the current one) -- selecting
  // a different speaker here is itself what demotes the old one.
  const selectSpeaker = (speaker: AstalWp.Endpoint) => {
    defaultSpeaker.isDefault = false;
    speaker.isDefault = true;
  };

  return { toggleMute, setVolume, selectSpeaker };
};
