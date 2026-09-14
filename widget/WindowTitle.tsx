import Pango from "gi://Pango"
import { createBinding } from "ags"
import AstalHyprland from "gi://AstalHyprland?version=0.1"

const hyprland = AstalHyprland.get_default()!

export default function WindowTitle() {
  const title = createBinding(hyprland, "focusedClient", "title").as(
    (t) => t || "Desktop",
  )

  return (
    <label
      cssName="window-title"
      label={title}
      ellipsize={Pango.EllipsizeMode.END}
      maxWidthChars={60}
    />
  )
}
