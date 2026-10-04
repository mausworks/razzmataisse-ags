import Lua from "@lib/lua";
import { createMutableFlags, MutableFlags } from "@lib/state";
import AstalHyprland from "gi://AstalHyprland";
import {
  Accessor,
  createBinding,
  createEffect,
  createMemo,
  createRoot,
} from "gnim";

const Hyprland = AstalHyprland.get_default()!;

export const WORKSPACE_FLAGS = {
  CLOSED: 1,
  OPEN: 2,
  FILLER: 4,
  FOCUSED: 8,
} as const;

/** One individual flag value from `WORKSPACE_FLAGS`. */
export type WorkspaceFlag =
  (typeof WORKSPACE_FLAGS)[keyof typeof WORKSPACE_FLAGS];

/** Any bitwise combination of `WorkspaceFlag`s. */
export type WorkspaceFlags = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export type WorkspaceId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export type WorkspaceModel = {
  id: WorkspaceId;
  flags: MutableFlags<WorkspaceFlags>;
};

export const createWorkspacesActions = () => {
  const focus = (id: WorkspaceId) =>
    Hyprland.dispatch("hl.dsp.focus", Lua.stringify({ workspace: id }));

  return { focus };
};

const WORKSPACES: WorkspaceModel[] = Array.from({ length: 10 }, (_, i) => ({
  id: (i + 1) as WorkspaceId,
  flags: createMutableFlags<WorkspaceFlags>(WORKSPACE_FLAGS.CLOSED),
}));

const workspaces = new Accessor(() => WORKSPACES);

const openIds = createBinding(Hyprland, "workspaces").as((list) =>
  list.map((ws) => ws.id),
);
const focusedId = createBinding(Hyprland, "focusedWorkspace").as((ws) => ws.id);
const maxId = createMemo(() =>
  openIds().reduce((max, id) => Math.max(max, id), focusedId()),
);

createRoot(() => {
  createEffect(() => {
    const focused = focusedId();
    const ids = openIds.peek();
    const max = maxId.peek();

    WORKSPACES.forEach((ws) => {
      const isOpen = ids.includes(ws.id);
      const isFiller = !isOpen && ws.id <= max;
      const isFocused = ws.id === focused;

      const flags = (Number(isOpen && WORKSPACE_FLAGS.OPEN) |
        Number(isFiller && WORKSPACE_FLAGS.FILLER) |
        Number(isFocused && WORKSPACE_FLAGS.FOCUSED)) as WorkspaceFlags;

      ws.flags.set(flags);
    });
  });
});

export const createWorkspacesModel = () => ({ workspaces, focusedId, maxId });
