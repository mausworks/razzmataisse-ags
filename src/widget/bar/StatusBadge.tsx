import { alpha, defineStyle } from "@lib/css";
import theme from "@theme";
import type { Accessor } from "ags";

const { palette } = theme.bar;

export type StatusBadgeProps = {
  on: Accessor<boolean>;
  onClicked?: () => void;
  tooltipText?: string;
};

/**
 * A small pill-shaped on/off indicator -- a less intrusive stand-in for a
 * `Gtk.Switch`, used for the Bluetooth/Wi-Fi power toggles. Doubles as the
 * click target for toggling.
 */
export default function StatusBadge({
  on,
  onClicked,
  tooltipText,
}: StatusBadgeProps) {
  return (
    <button
      class={cx(on.as((isOn) => (isOn ? "on" : "off")))}
      onClicked={onClicked}
      tooltipText={tooltipText}
    >
      <label label={on.as((isOn) => (isOn ? "on" : "off"))} />
    </button>
  );
}

const cx = defineStyle({
  class: "StatusBadge",
  style: {
    borderRadius: 9999,
    padding: "0px 8px",
    fontWeight: "bold",
    fontSize: 12,
    border: "none",
    boxShadow: "none",
    backgroundImage: "none",
    textShadow: "none",
  },
  variants: {
    on: {
      background: alpha(palette.success, 0.15),
      color: palette.success,
      "&:hover": { background: alpha(palette.success, 0.25) },
      "&:active": { background: alpha(palette.success, 0.35) },
    },
    off: {
      background: alpha(palette.danger, 0.15),
      color: palette.danger,
      "&:hover": { background: alpha(palette.danger, 0.25) },
      "&:active": { background: alpha(palette.danger, 0.35) },
    },
  },
});
