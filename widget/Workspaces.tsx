import { Gtk } from "ags/gtk4"
import { createBinding, For } from "ags"
import AstalHyprland from "gi://AstalHyprland?version=0.1"

const hyprland = AstalHyprland.get_default()!

export default function Workspaces() {
  const workspaces = createBinding(hyprland, "workspaces")
  const focused = createBinding(hyprland, "focusedWorkspace")

  const sorted = workspaces.as((ws) => [...ws].sort((a, b) => a.id - b.id))

  return (
    <box cssName="workspaces" spacing={4}>
      <For each={sorted}>
        {(ws) => (
          <button
            class={focused.as((f) => (f?.id === ws.id ? "focused" : ""))}
            onClicked={() => hyprland.dispatch("workspace", String(ws.id))}
          >
            <label label={String(ws.id)} />
          </button>
        )}
      </For>
    </box>
  )
}
