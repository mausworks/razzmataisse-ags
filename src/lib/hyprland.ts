import Lua from "@lib/lua";
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

/**
 * GTK4 has no `backdrop-filter`/blur-behind-the-element at all -- only a
 * `filter` that blurs a widget's own rendered content, not what's behind
 * it. Layer-shell surfaces (unlike regular translucent windows, which blur
 * automatically when `decoration.blur.enabled` is on) need an explicit
 * `layer_rule` to opt into Hyprland's compositor-side blur instead.
 * `ignoreAlpha` matters whenever the surface itself is fairly transparent
 * (as our panels are) -- without it, the blur fades out along with the
 * alpha instead of showing through it.
 *
 * Confirmed idempotent (re-registering the same `name` repeatedly is a
 * no-op, not an error), so safe to call unconditionally on every launch
 * rather than needing to track whether it's already been set up.
 */
export const enableLayerBlur = (namespace: string, ignoreAlpha = 0.1) =>
  evalHyprlandLua(
    `hl.layer_rule(${Lua.stringify({
      name: `blur-${namespace}`,
      match: { namespace },
      blur: true,
      ignore_alpha: ignoreAlpha,
    })})`,
  );
