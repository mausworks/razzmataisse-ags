import AstalHyprland from "gi://AstalHyprland";
import AstalNotifd from "gi://AstalNotifd?version=0.1";

/**
 * A notification carries no window/PID of its own to match against -- just
 * `appName`/`desktopEntry` -- so the best we can do is compare those
 * against each client's WM class (case-insensitively; exact casing drifts
 * between an app's desktop-entry id and its reported class often enough
 * that an exact-case match would miss real matches).
 */
const matchesApp = (
  client: AstalHyprland.Client,
  notification: AstalNotifd.Notification,
): boolean => {
  const windowClass = client.class.toLowerCase();
  return [notification.desktopEntry, notification.appName]
    .filter(Boolean)
    .some((identifier) => identifier.toLowerCase() === windowClass);
};

/**
 * Workspace ids whose open windows match `notification`'s app -- empty if
 * the notification can't be attributed to any particular workspace (a
 * system notification, e.g. battery/network, or a background daemon with
 * no window at all). A notification whose app has windows open on more
 * than one workspace is attributed to all of them, not just one.
 */
export const notificationWorkspaceIds = (
  notification: AstalNotifd.Notification,
  clients: AstalHyprland.Client[],
): number[] => [
  ...new Set(
    clients
      .filter((client) => matchesApp(client, notification))
      .map((client) => client.workspace.id),
  ),
];
