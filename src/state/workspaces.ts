import Lua from "@lib/lua";
import AstalHyprland from "gi://AstalHyprland";
import { createBinding } from "gnim";

const Hyprland = AstalHyprland.get_default()!;

const MAX_WORKSPACE_ID = 10;

export type WorkspaceId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export type WorkspaceModel = {
  id: WorkspaceId;
  isFocused: boolean;
  isFiller: boolean;
  isEmpty: boolean;
};

export const createWorkspacesActions = () => {
  const focus = (id: WorkspaceId) =>
    Hyprland.dispatch("hl.dsp.focus", Lua.stringify({ workspace: id }));

  return { focus };
};

const createEmptyWorkspaces = () =>
  Array.from({ length: MAX_WORKSPACE_ID }, (_, i) => ({
    id: (i + 1) as WorkspaceId,
    isEmpty: true,
    isFocused: false,
    isFiller: false,
  })) as WorkspaceModel[];

export const createWorkspacesModel = () => {
  const focusedId = createBinding(Hyprland, "focusedWorkspace").as(
    (ws) => ws.id as WorkspaceId,
  );
  const open = createBinding(Hyprland, "workspaces");
  const maxId = open.as((list) =>
    list.reduce((val, { id }) => Math.max(val, id), 1),
  );
  const workspaces = open.as((list) => {
    const workspaces = createEmptyWorkspaces();
    const focused = focusedId();
    const max = maxId();

    for (const ws of list) {
      workspaces[ws.id - 1].isEmpty = false;
      workspaces[ws.id - 1].isFocused = ws.id === focused;
    }

    for (let id = 1 as WorkspaceId; id <= max; id++) {
      if (workspaces[id - 1].isEmpty) {
        workspaces[id - 1].isFiller = true;
      }
    }

    return workspaces;
  });

  return { workspaces, focusedId, maxId };
};
