import Pango from "gi://Pango"
import { createBinding } from "ags"
import AstalHyprland from "gi://AstalHyprland?version=0.1"
import { createStyle } from "../lib/createStyle"

const hyprland = AstalHyprland.get_default()!

const titleStyle = createStyle({ opacity: 0.7 })

export default function WindowTitle() {
  const title = createBinding(hyprland, "focusedClient", "title").as(
    (t) => t || "Desktop",
  )

  return (
    <label
      css={titleStyle}
      label={title}
      ellipsize={Pango.EllipsizeMode.END}
      maxWidthChars={60}
    />
  )
}
