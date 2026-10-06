import { IS_DEV } from "@lib/dev";
import { flagNames } from "@lib/flags";
import Lua from "@lib/lua";
import { notificationWorkspaceIds } from "@lib/notifications";
import {
  createMutable,
  createMutableFlags,
  Mutable,
  MutableFlags,
} from "@lib/state";
import AstalHyprland from "gi://AstalHyprland";
import AstalNotifd from "gi://AstalNotifd?version=0.1";
import {
  Accessor,
  createBinding,
  createEffect,
  createRoot,
  createState,
} from "gnim";

const Hyprland = AstalHyprland.get_default()!;
const Notifd = AstalNotifd.get_default();

export const WORKSPACE_FLAGS = {
  CLOSED: 0,
  OPEN: 1,
  FILLER: 2,
  FOCUSED: 4,
} as const;

/** One individual flag value from `WORKSPACE_FLAGS`. */
export type WorkspaceFlag =
  (typeof WORKSPACE_FLAGS)[keyof typeof WORKSPACE_FLAGS];

/** Any bitwise combination of `WorkspaceFlag`s. */
export type WorkspaceFlags = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export type WorkspaceId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

/**
 * Deliberately not the full `AstalNotifd.Notification[]` -- a workspace
 * badge only ever needs to answer "how many, and how bad", not render
 * anything, so there's no reason to hand widgets live GObject references
 * (and their per-field bindings) for notifications that aren't even the
 * ones being displayed.
 */
export type WorkspaceNotifications = {
  count: number;
  urgency: AstalNotifd.Urgency;
};

export type WorkspaceModel = {
  id: WorkspaceId;
  flags: MutableFlags<WorkspaceFlags>;
  notifications: Mutable<WorkspaceNotifications>;
};

const focus = (id: WorkspaceId) =>
  Hyprland.dispatch("hl.dsp.focus", Lua.stringify({ workspace: id }));

const WORKSPACES: WorkspaceModel[] = Array.from({ length: 10 }, (_, i) => ({
  id: (i + 1) as WorkspaceId,
  flags: createMutableFlags<WorkspaceFlags>(WORKSPACE_FLAGS.CLOSED),
  notifications: createMutable<WorkspaceNotifications>({
    count: 0,
    urgency: AstalNotifd.Urgency.LOW,
  }),
}));

const workspaces = new Accessor(() => WORKSPACES);

const openIds = createBinding(Hyprland, "workspaces").as((list) =>
  list.map((ws) => ws.id),
);
const focusedId = createBinding(Hyprland, "focusedWorkspace").as((ws) => ws.id);
const [maxId, setMaxId] = createState(focusedId.peek());

createRoot(() => {
  const notifications = createBinding(Notifd, "notifications");
  const clients = createBinding(Hyprland, "clients");

  createEffect(() => {
    const ids = openIds();
    const focused = focusedId();
    const max = ids.reduce((max, id) => Math.max(max, id), focused);

    WORKSPACES.forEach((ws) => {
      const isOpen = ids.includes(ws.id);
      const isFocused = ws.id === focused;
      const isFiller = !isOpen && ws.id <= max;

      const flags = (Number(isOpen && WORKSPACE_FLAGS.OPEN) |
        Number(isFiller && WORKSPACE_FLAGS.FILLER) |
        Number(isFocused && WORKSPACE_FLAGS.FOCUSED)) as WorkspaceFlags;

      ws.flags.set(flags);
    });

    setMaxId(max);
  });

  createEffect(() => {
    const allNotifications = notifications();
    const allClients = clients();
    const byWorkspace = new Map<WorkspaceId, WorkspaceNotifications>();

    for (const notification of allNotifications) {
      for (const id of notificationWorkspaceIds(notification, allClients)) {
        const summary = byWorkspace.get(id as WorkspaceId) ?? {
          count: 0,
          urgency: AstalNotifd.Urgency.LOW,
        };

        summary.count++;
        summary.urgency = Math.max(
          summary.urgency,
          notification.urgency,
        ) as AstalNotifd.Urgency;

        byWorkspace.set(id as WorkspaceId, summary);
      }
    }

    WORKSPACES.forEach((ws) => {
      ws.notifications.set(
        byWorkspace.get(ws.id) ?? {
          count: 0,
          urgency: AstalNotifd.Urgency.LOW,
        },
      );
    });
  });
});

export const createWorkspacesModel = () => ({
  focus,
  workspaces,
  focusedId,
  maxId,
  openIds,
});
