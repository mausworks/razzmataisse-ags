import { alpha, defineStyle, lighter } from "@lib/css";
import { withLayerBlur } from "@lib/hyprland";
import theme from "@theme";
import { createBinding, For } from "ags";
import { Astal, Gdk, Gtk } from "ags/gtk4";
import app from "ags/gtk4/app";
import AstalNotifd from "gi://AstalNotifd?version=0.1";

const Notifd = AstalNotifd.get_default();

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
 * of cards, one per currently-unresolved notification. No history, no
 * do-not-disturb toggle, no action buttons yet; `AstalNotifd.Notifd`
 * already handles timeout-based auto-dismissal on its own (`ignoreTimeout`
 * defaults to `false`), so this only ever needs to mirror its
 * `notifications` list, not manage any dismissal timers itself.
 */
export default function NotificationWindow({
  monitor,
}: NotificationWindowProps) {
  const notifications = createBinding(Notifd, "notifications");
  const hasNotifications = notifications.as((list) => list.length > 0);

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
          each={notifications}
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
