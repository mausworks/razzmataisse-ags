import { alpha, defineStyle, lighter } from "@lib/css";
import { withLayerBlur } from "@lib/hyprland";
import { notificationWorkspaceIds } from "@lib/notifications";
import theme from "@theme";
import { createBinding, createComputed, For } from "ags";
import { Astal, Gdk, Gtk } from "ags/gtk4";
import app from "ags/gtk4/app";
import AstalHyprland from "gi://AstalHyprland";
import AstalNotifd from "gi://AstalNotifd?version=0.1";

const Notifd = AstalNotifd.get_default();
const Hyprland = AstalHyprland.get_default()!;

/**
 * A notification whose app has no open window at all (a system notification
 * -- battery, network -- or a background daemon) can't be attributed to any
 * workspace, so it's never filtered out. Only a notification that *can* be
 * matched to a window, but whose only matching window(s) are elsewhere, gets
 * hidden.
 */
const isOnActiveWorkspace = (
  notification: AstalNotifd.Notification,
  clients: AstalHyprland.Client[],
  activeWorkspace: AstalHyprland.Workspace,
): boolean => {
  const ids = notificationWorkspaceIds(notification, clients);
  return ids.length === 0 || ids.includes(activeWorkspace.id);
};

const { palette } = theme.bar;

/** Matches `Bar.tsx`'s own bar height -- keeps the docked position flush. */
const BAR_HEIGHT = 34;
const DOCK_GAP = 12;
const DOCK_MARGIN_RIGHT = 12;
const PANEL_WIDTH = 340;

export type NotificationWindowProps = {
  monitor: Gdk.Monitor;
};

/**
 * A single global window, docked top-right below the bar -- a plain stack
 * of cards, one per currently-unresolved notification *from the active
 * workspace* (see `isOnActiveWorkspace`) -- switching workspaces re-filters
 * the stack live, rather than just hiding/showing it wholesale. No history,
 * no do-not-disturb toggle, no action buttons yet; `AstalNotifd.Notifd`
 * already handles timeout-based auto-dismissal on its own (`ignoreTimeout`
 * defaults to `false`), so this only ever needs to mirror its
 * `notifications` list (filtered), not manage any dismissal timers itself.
 */
export default function NotificationWindow({
  monitor,
}: NotificationWindowProps) {
  const notifications = createBinding(Notifd, "notifications");
  const clients = createBinding(Hyprland, "clients");
  const focusedWorkspace = createBinding(Hyprland, "focusedWorkspace");

  const visibleNotifications = createComputed(() =>
    notifications().filter((notification) =>
      isOnActiveWorkspace(notification, clients(), focusedWorkspace()),
    ),
  );
  const hasNotifications = visibleNotifications.as((list) => list.length > 0);

  return (
    <window
      name="notifications"
      namespace="notifications"
      visible={hasNotifications}
      class={windowClass}
      gdkmonitor={monitor}
      layer={Astal.Layer.OVERLAY}
      anchor={Astal.WindowAnchor.TOP | Astal.WindowAnchor.RIGHT}
      marginTop={BAR_HEIGHT + DOCK_GAP}
      marginRight={DOCK_MARGIN_RIGHT}
      application={app}
      $={withLayerBlur()}
    >
      <box
        orientation={Gtk.Orientation.VERTICAL}
        spacing={8}
        widthRequest={PANEL_WIDTH}
      >
        <For
          each={visibleNotifications}
          id={(notification) => String(notification.id)}
        >
          {(notification) => <NotificationCard notification={notification} />}
        </For>
      </box>
    </window>
  );
}

type NotificationCardProps = {
  notification: AstalNotifd.Notification;
};

/**
 * Clicking anywhere on a card dismisses it -- notifications are immutable
 * enough in practice (and `dismiss()` cheap enough) that a dedicated close
 * button would just be a smaller, fussier version of the same target.
 *
 * Fields are read via `createBinding`, not plain property access: a
 * notification can be *replaced* (same `id`, new content -- e.g. a
 * progress update) rather than resolved-and-reposted, which `<For>`'s
 * `id`-based keying means reuses this same card instead of remounting it.
 * A one-time read would go stale on that update; a binding doesn't.
 */
function NotificationCard({ notification }: NotificationCardProps) {
  const appIcon = createBinding(notification, "appIcon");
  const summary = createBinding(notification, "summary");
  const body = createBinding(notification, "body");

  return (
    <button class={cardClass} onClicked={() => notification.dismiss()}>
      <box spacing={8}>
        <image
          iconName={appIcon.as((icon) => icon || "dialog-information-symbolic")}
          valign={Gtk.Align.START}
        />
        <box orientation={Gtk.Orientation.VERTICAL} hexpand>
          <label
            label={summary}
            halign={Gtk.Align.START}
            ellipsize={3}
            hexpand
          />
          <label
            label={body}
            visible={body.as((text) => text.length > 0)}
            halign={Gtk.Align.START}
            ellipsize={3}
            hexpand
            class={bodyClass}
          />
        </box>
      </box>
    </button>
  );
}

const windowClass = defineStyle({
  style: {
    background: "transparent",
  },
})();

const cardClass = defineStyle({
  style: {
    background: palette.activeBackground,
    color: palette.text,
    border: `1px solid ${alpha(palette.text, 0.1)}`,
    borderRadius: 12,
    padding: 12,
    boxShadow: "none",
    "&:hover": {
      background: lighter(palette.activeBackground),
    },
  },
})();

const bodyClass = defineStyle({
  style: {
    color: "#8E8E93",
    fontSize: 11,
  },
})();
