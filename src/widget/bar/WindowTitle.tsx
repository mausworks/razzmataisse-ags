import { defineStyle } from "@lib/css";
import { createBinding } from "ags";
import AstalHyprland from "gi://AstalHyprland?version=0.1";
import Pango from "gi://Pango";

const Hyprland = AstalHyprland.get_default()!;

const titleClass = defineStyle({
  style: {
    opacity: 0.7,
    fontWeight: "normal",
  },
})();

export type WindowTitleProps = {
  visible?: boolean;
  default?: string;
};

export default function WindowTitle({
  visible = true,
  default: defaultTitle = "Desktop",
}: WindowTitleProps) {
  const title = createBinding(Hyprland, "focusedClient", "title").as(
    (clientTitle) => clientTitle || defaultTitle,
  );

  return (
    <label
      visible={visible}
      class={titleClass}
      label={title}
      ellipsize={Pango.EllipsizeMode.END}
      maxWidthChars={60}
    />
  );
}
