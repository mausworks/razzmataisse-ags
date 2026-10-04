import Lua from "@lib/lua";
import type { Astal } from "ags/gtk4";
import AstalHyprland from "gi://AstalHyprland";

const Hyprland = AstalHyprland.get_default()!;

/**
 * Hyprland's own Lua config functions (`hl.*`) aren't config-file-only --
 * an `eval <lua>` IPC message (what the `hyprctl eval` CLI itself sends,
 * just without going through a subprocess to get there) runs the same
 * code against the already-running compositor, so a widget can register
 * whatever compositor-side behavior it needs for itself directly, instead
 * of requiring a matching hand-maintained entry in the separate Hyprland
 * dotfiles to stay in sync with.
 *
 * `AstalHyprland.Hyprland#message_async` is typed as the usual GJS
 * zero-arg-returns-a-Promise async method, but -- like
 * `AstalBluetooth.Device#connect_device` elsewhere in this codebase --
 * calling it that way throws synchronously instead (a broken GIR
 * annotation, not a usage mistake). The plain synchronous `message()` sidesteps
 * it, and blocking here is fine: this only ever runs once per widget, at
 * construction.
 */
const evalHyprlandLua = (lua: string) => {
  const reply = Hyprland.message(`eval ${lua}`);
  if (reply !== "ok") console.error(`hyprctl eval failed: ${lua}\n${reply}`);
};

export type LayerBlurOptions = {
  /**
   * Whenever the surface itself is fairly transparent (as our panels are),
   * blur fades out along with the alpha instead of showing through it --
   * this makes blur ignore alpha below the given threshold instead.
   * Defaults to `0.1`.
   */
  ignoreAlpha?: number;
  /**
   * Blur against a fixed snapshot of the desktop background instead of
   * whatever's actually layered behind the surface -- cheaper, but can
   * look wrong wherever another blurred layer would otherwise show
   * through. Defaults to `false`.
   */
  xray?: boolean;
  /** Also blur this layer's own popups (e.g. tooltips). Defaults to `false`. */
  blurPopups?: boolean;
};

/**
 * GTK4 has no `backdrop-filter`/blur-behind-the-element at all -- only a
 * `filter` that blurs a widget's own rendered content, not what's behind
 * it. Layer-shell surfaces (unlike regular translucent windows, which blur
 * automatically when `decoration.blur.enabled` is on) need an explicit
 * `layer_rule` to opt into Hyprland's compositor-side blur instead.
 *
 * Confirmed idempotent server-side (re-registering the same `name`
 * repeatedly is a no-op, not an error) -- `withLayerBlur` below still
 * guards against calling this redundantly, to skip the IPC round-trip
 * rather than rely on that.
 */
const enableLayerBlur = (
  namespace: string,
  {
    ignoreAlpha = 0.1,
    xray = false,
    blurPopups = false,
  }: LayerBlurOptions = {},
) =>
  evalHyprlandLua(
    `hl.layer_rule(${Lua.stringify({
      name: `blur-${namespace}`,
      match: { namespace },
      blur: true,
      ignore_alpha: ignoreAlpha,
      xray,
      blur_popups: blurPopups,
    })})`,
  );

const blurredNamespaces = new Set<string>();

/**
 * Wraps a `<window>`'s own `$` ref callback so blur is registered exactly
 * once -- tied to that window's actual GTK construction (its `$` fires
 * once per real widget, not once per time the enclosing component
 * function happens to run), and guarded by `blurredNamespaces` on top of
 * that regardless, in case something ever makes those not one-to-one
 * (e.g. the same namespace reused across monitors). Reads the namespace
 * off `self` (already set by the time `$` fires, since it's filled from
 * the `<window namespace="...">` prop) rather than taking it as a second
 * source of truth that could drift from what the window actually has.
 *
 * @example
 * ```tsx
 * <window namespace="bar" $={withLayerBlur()}>
 * // or composed with the window's own ref logic:
 * <window namespace="search" $={withLayerBlur((self) => { ... })}>
 * ```
 */
export const withLayerBlur =
  <W extends Astal.Window>(
    ref?: (self: W) => void,
    options?: LayerBlurOptions,
  ) =>
  (self: W) => {
    if (!blurredNamespaces.has(self.namespace)) {
      blurredNamespaces.add(self.namespace);
      enableLayerBlur(self.namespace, options);
    }
    ref?.(self);
  };
