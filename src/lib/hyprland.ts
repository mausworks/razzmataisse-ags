import Lua from "@lib/lua";
import type { Astal } from "ags/gtk4";
import AstalHyprland from "gi://AstalHyprland";
import GLib from "gi://GLib?version=2.0";

const Hyprland = AstalHyprland.get_default()!;

export type WindowCallback<W extends Astal.Window> = (window: W) => void;

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
 * Runs `argv` as a child of Hyprland rather than the shell, so it keeps
 * running after the shell exits. Fire-and-forget: failures aren't reported.
 *
 * @example
 * ```ts
 * execDetached(["xdg-open", "/path/to/file"]);
 * ```
 */
export const execDetached = (argv: readonly string[]) =>
  Hyprland.dispatch(
    "hl.dsp.exec_cmd",
    Lua.stringify(argv.map((arg) => GLib.shell_quote(arg)).join(" ")),
  );

export type PopupBlurOptions = {
  /** Blur skips pixels with alpha below this threshold. Defaults to `0.1`. */
  ignoreAlpha?: number;
};

const disableAnimations = (namespace: string) =>
  evalHyprlandLua(
    `hl.layer_rule(${Lua.stringify({
      name: `${namespace}-no-anim`,
      match: { namespace },
      no_anim: true,
    })})`,
  );

/** Hyprland only blurs layer popups via this rule; `backdropFilter` can't. */
const enablePopupBlur = (
  namespace: string,
  { ignoreAlpha = 0.1 }: PopupBlurOptions = {},
) =>
  evalHyprlandLua(
    `hl.layer_rule(${Lua.stringify({
      name: `blur-popups-${namespace}`,
      match: { namespace: `^${namespace}$` },
      ignore_alpha: ignoreAlpha,
      blur_popups: true,
    })})`,
  );

/**
 * Blurs the popups (e.g. popovers) of a layer-shell window, composed with
 * the window's own `$` ref callback. The popups' own `backdropFilter`
 * limits the blur to their visible panels.
 *
 * @example
 * ```tsx
 * <window namespace="bar" $={withPopupBlur()}>
 * ```
 */
export const withPopupBlur =
  <W extends Astal.Window>(
    options?: PopupBlurOptions,
    ref?: WindowCallback<W>,
  ) =>
  (window: W) => {
    enablePopupBlur(window.namespace, options);

    ref?.(window);
  };

export const withDisabledAnimations =
  <W extends Astal.Window>(ref?: WindowCallback<W>) =>
  (window: W) => {
    disableAnimations(window.namespace);

    ref?.(window);
  };
