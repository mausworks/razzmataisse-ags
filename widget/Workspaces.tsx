import { Gtk } from "ags/gtk4"
import { createBinding, For } from "ags"
import AstalHyprland from "gi://AstalHyprland?version=0.1"
import { createStyle, baseButton } from "../lib/createStyle"

const hyprland = AstalHyprland.get_default()!

const pillStyle = createStyle({ ...baseButton, minWidth: 24, padding: "2px 4px", opacity: 0.5 })
const pillFocusedStyle = createStyle({
  ...baseButton,
  minWidth: 24,
  padding: "2px 4px",
  opacity: 1,
  background: "alpha(@theme_fg_color, 0.15)",
})

export default function Workspaces() {
  const workspaces = createBinding(hyprland, "workspaces")
  const focused = createBinding(hyprland, "focusedWorkspace")

  const sorted = workspaces.as((ws) => [...ws].sort((a, b) => a.id - b.id))

  return (
    <box spacing={4}>
      <For each={sorted}>
        {(ws) => (
          <button
            css={focused.as((f) => (f?.id === ws.id ? pillFocusedStyle : pillStyle))}
            onClicked={() => hyprland.dispatch("workspace", String(ws.id))}
          >
            <label label={String(ws.id)} />
          </button>
        )}
      </For>
    </box>
  )
}
