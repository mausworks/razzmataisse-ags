import { Gdk, Gtk } from "ags/gtk4";

import type { CSSProperties, CSSProperty, CSSPropertyValue } from "./types";
import { px } from "./units";

/**
 * Properties whose value is a `<length>` (per
 * https://docs.gtk.org/gtk4/css-properties.html) -- a bare number is
 * treated as a pixel length here. Properties where a bare number is
 * already valid CSS on its own (e.g. `lineHeight`, `opacity`,
 * `borderImageWidth`) are deliberately left out.
 */
const LENGTH_PROPERTIES = new Set<CSSProperty>([
  "fontSize",
  "letterSpacing",
  "minWidth",
  "minHeight",
  "marginTop",
  "marginRight",
  "marginBottom",
  "marginLeft",
  "margin",
  "paddingTop",
  "paddingRight",
  "paddingBottom",
  "paddingLeft",
  "padding",
  "borderTopWidth",
  "borderRightWidth",
  "borderBottomWidth",
  "borderLeftWidth",
  "borderWidth",
  "borderTopRightRadius",
  "borderBottomRightRadius",
  "borderBottomLeftRadius",
  "borderTopLeftRadius",
  "borderRadius",
  "outlineWidth",
  "outlineOffset",
  "backgroundSize",
  "borderSpacing",
  "gtkIconSize",
]);

const transformNumber = (key: string, value: number) =>
  LENGTH_PROPERTIES.has(key as CSSProperty) ? px(value) : String(value);

const kebabCache = new Map<string, string>();

const toKebab = (key: string) => {
  const cached = kebabCache.get(key);
  if (cached !== undefined) {
    return cached;
  } else {
    const kebab = key.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
    const result = kebab.startsWith("gtk-") ? `-${kebab}` : kebab;
    kebabCache.set(key, result);

    return result;
  }
};

const stringifyCSSValue = (key: string, value: CSSPropertyValue) =>
  typeof value === "number" ? transformNumber(key, value) : value;

/**
 * Serializes a flat declarations object into a CSS declaration-list string
 * for a widget's `css` prop. An escape hatch for one-off inline styling --
 * prefer `defineStyle` for anything reused across instances or variants.
 *
 * @example
 * ```ts
 * inlineCSS({ borderRadius: 8, opacity: 0.5 })
 * // "border-radius: 8px; opacity: 0.5;"
 * ```
 */
export const inlineCSS = (props: CSSProperties) =>
  Object.entries(props)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => `${toKebab(key)}: ${stringifyCSSValue(key, value)};`)
    .join(" ");

/**
 * Throws `message` if `name` is already in `registry`, otherwise adds it.
 * The shared "must be called exactly once" guard behind `defineStyle()` and
 * `defineKeyframes()`.
 */
export const registerOnce = (
  registry: Set<string>,
  name: string,
  message: string,
) => {
  if (registry.has(name)) throw new Error(message);
  registry.add(name);
};

let cachedDisplay: Gdk.Display | undefined;

/**
 * One above `GTK_STYLE_PROVIDER_PRIORITY_USER` (800) -- the priority GTK
 * itself reserves for `$XDG_CONFIG_HOME/gtk-4.0/gtk.css`, specifically so
 * that file always gets "the last word" over applications. GTK theme
 * installers (e.g. WhiteSur's `--libadwaita` step) write straight into that
 * file though, so on a themed system it isn't really the user's own
 * deliberate override -- it's the theme's, and it was silently beating
 * every one of our own `GTK_STYLE_PROVIDER_PRIORITY_APPLICATION` rules
 * regardless of selector specificity (priority tier is checked before
 * specificity). Going one above it is the only way our styles reliably win.
 */
const PROVIDER_PRIORITY = Gtk.STYLE_PROVIDER_PRIORITY_USER + 1;

/**
 * Loads `css` and installs it application-wide, reusing the one default
 * `Gdk.Display` across every `defineStyle`/`defineKeyframes` registration.
 */
export const installProvider = (css: string) => {
  cachedDisplay ??= Gdk.Display.get_default()!;

  const provider = new Gtk.CssProvider();
  provider.load_from_string(css);
  Gtk.StyleContext.add_provider_for_display(
    cachedDisplay,
    provider,
    PROVIDER_PRIORITY,
  );
};
