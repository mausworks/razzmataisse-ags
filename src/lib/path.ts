import GLib from "gi://GLib?version=2.0";

export const HOME = GLib.get_home_dir();

/**
 * Abbreviates the user's home directory to `~`.
 *
 * @example
 * ```ts
 * abbreviatePath("/home/maus/foo") // "~/foo"
 * ```
 */
export const abbreviateHome = (path: string): string =>
  path === HOME
    ? "~"
    : path.startsWith(`${HOME}/`)
      ? `~${path.slice(HOME.length)}`
      : path;

/**
 * Shortens `path` to at most `maxLength` characters (where possible) by
 * eliding middle segments. The filename is always kept whole, and as many
 * leading segments as fit are kept from the root.
 *
 * @example
 * ```ts
 * compactPath("~/really/long/path/to/some/deeply/nested/file.rs", 30)
 * // "~/really/long/path/…/file.rs"
 * ```
 */
export const compactPath = (path: string, maxLength = 48): string => {
  if (path.length <= maxLength) return path;

  const isAbsolute = path.startsWith("/");
  const segments = path.split("/").filter(Boolean);
  if (segments.length <= 1) return path;

  const prefix = isAbsolute ? "/" : "";
  const tail = segments[segments.length - 1]!;

  let head = segments[0]!;
  let i = 1;
  if (head === "~" && segments.length > 1) {
    head = `${head}/${segments[1]}`;
    i = 2;
  }
  for (; i < segments.length - 1; i++) {
    const candidate = `${head}/${segments[i]}`;
    if (`${prefix}${candidate}/…/${tail}`.length > maxLength) break;
    head = candidate;
  }

  const compacted = `${prefix}${head}/…/${tail}`;
  return compacted.length < path.length ? compacted : path;
};

/** {@link abbreviateHome}, then {@link compactPath}. */
export const ellipsizePath = (path: string, maxLength?: number) =>
  compactPath(abbreviateHome(path), maxLength);
