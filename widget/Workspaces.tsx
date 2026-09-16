import { createBinding, For } from "ags";
import AstalHyprland from "gi://AstalHyprland?version=0.1";
import Pill from "./Pill";
import Lua from "../lib/lua";
import { defineStyle } from "../lib/css";

const Hyprland = AstalHyprland.get_default()!;

const labelClass = defineStyle({
  class: "WorkspaceLabel",
  style: {
    fontFeatureSettings: '"tnum" 1',
  },
})();

export default function Workspaces() {
  const active = createBinding(Hyprland, "focusedWorkspace");
  const workspaces = createBinding(Hyprland, "workspaces").as((ws) =>
    [...ws].sort((left, right) => left.id - right.id),
  );

  return (
    <box spacing={4}>
      <For each={workspaces}>
        {(ws) => (
          <Pill
            variant={active.as(({ id }) =>
              id === ws.id
                ? (["active", "icon"] as const)
                : (["icon"] as const),
            )}
            onClicked={() =>
              Hyprland.dispatch(
                "hl.dsp.focus",
                Lua.stringify({ workspace: ws.id }),
              )
            }
          >
            <label class={labelClass} label={String(ws.id)} />
          </Pill>
        )}
      </For>
    </box>
  );
}
