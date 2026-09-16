import Pango from "gi://Pango";
import { createBinding } from "ags";
import AstalHyprland from "gi://AstalHyprland?version=0.1";
import { defineStyle } from "../lib/css";

const Hyprland = AstalHyprland.get_default()!;

const titleClass = defineStyle({
  class: "WindowTitle",
  style: {
    opacity: 0.7,
    fontWeight: "normal",
  },
})();

export default function WindowTitle() {
  const title = createBinding(Hyprland, "focusedClient", "title").as(
    (clientTitle) => clientTitle || "Desktop",
  );

  return (
    <label
      class={titleClass}
      label={title}
      ellipsize={Pango.EllipsizeMode.END}
      maxWidthChars={60}
    />
  );
}
