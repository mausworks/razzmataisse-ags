import { createBinding, For } from "ags";
import AstalHyprland from "gi://AstalHyprland?version=0.1";
import Pill from "./Pill";

const hyprland = AstalHyprland.get_default()!;

export default function Workspaces() {
  const focused = createBinding(hyprland, "focusedWorkspace");
  const workspaces = createBinding(hyprland, "workspaces").as((ws) =>
    [...ws].sort((left, right) => left.id - right.id),
  );

  return (
    <box spacing={4}>
      <For each={workspaces}>
        {(ws) => (
          <Pill
            variant={focused.as((focusedWs) =>
              focusedWs?.id === ws.id ? "focused" : undefined,
            )}
            onClicked={() => hyprland.dispatch("workspace", String(ws.id))}
          >
            <label label={String(ws.id)} />
          </Pill>
        )}
      </For>
    </box>
  );
}
