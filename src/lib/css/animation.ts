import { assert, isPlainObject } from "@lib/util";

import type { BackgroundProperties } from "./background";
import type { BorderProperties, OutlineProperties } from "./border";
import type { FontProperties } from "./font";
import { inlineCSS, installProvider, registerOnce } from "./provider";
import type { TextProperties } from "./text";
import { TransformProperties } from "./transform";
import type {
  CSSProperties,
  EffectProperties,
  KeyframesDefinition,
  KeyframeSelector,
  KeyframeSteps,
  MarginProperties,
  PaddingProperties,
} from "./types";
import type { DurationString } from "./units";

export type AnimationProperties = Partial<{
  animationName: string;
  animationDuration: DurationString;
  animationTimingFunction: Easing;
  animationIterationCount: AnimationIterationCount;
  animationDirection: AnimationDirection;
  animationPlayState: AnimationPlayState;
  animationDelay: DurationString;
  animationFillMode: AnimationFillMode;
  animation: string;
}>;

/** A named easing keyword, or a raw `cubic-bezier(...)`/`steps(...)` call. */
export type Easing =
  | "ease"
  | "linear"
  | "ease-in"
  | "ease-out"
  | "ease-in-out"
  | "step-start"
  | "step-end"
  | `cubic-bezier(${string})`
  | `linear(${string})`
  | `steps(${string})`;

/** The keywords accepted by `animation-direction`. */
export type AnimationDirection =
  "normal" | "reverse" | "alternate" | "alternate-reverse";

/** The keywords accepted by `animation-fill-mode`. */
export type AnimationFillMode = "none" | "forwards" | "backwards" | "both";

/**
 * The keywords accepted by `animation-play-state`. Not part of GTK's
 * `animation` shorthand -- confirmed against a real Gtk.CssProvider
 * ("Junk at end of value for animation") -- so set it as its own
 * declaration alongside one, never composed into it.
 */
export type AnimationPlayState = "running" | "paused";

/** The value accepted by `animation-iteration-count`. */
export type AnimationIterationCount = number | "infinite";

export type AnimatableProperties = MarginProperties &
  PaddingProperties &
  EffectProperties &
  Pick<FontProperties, "fontSize"> &
  Pick<OutlineProperties, "outlineWidth"> &
  Pick<TextProperties, "textShadow" | "color"> &
  Pick<TransformProperties, "transform"> &
  Pick<
    BackgroundProperties,
    | "background"
    | "backgroundColor"
    | "backgroundSize"
    | "backgroundPosition"
    | "backgroundImage"
  > &
  Pick<
    BorderProperties,
    | "borderImageSource"
    | Extract<
        keyof BorderProperties,
        `${string}Color` | `${string}Width` | `${string}Radius`
      >
  >;

export type AnimatableProperty = keyof AnimatableProperties;

/**
 * The `animation` shorthand's own timing components -- `defineAnimation()`'s
 * `defaults`, and the shape its returned function's `overrides` argument
 * partially replaces. `duration`/`delay` are written in milliseconds when
 * given as a bare number.
 *
 * `playState` is deliberately not here: GTK's `animation` shorthand
 * doesn't accept `animation-play-state` (confirmed against a real
 * Gtk.CssProvider -- "Junk at end of value for animation") -- set
 * `animationPlayState` as its own declaration alongside this instead.
 */
export type AnimationTiming = {
  duration: number | DurationString;
  delay?: number | DurationString;
  easing?: Easing;
  iterationCount?: AnimationIterationCount;
  direction?: AnimationDirection;
  fillMode?: AnimationFillMode;
};

/**
 * ...
 */
export type AnimationOverrides = Partial<AnimationTiming>;

/**
 * The function `defineAnimation()` returns -- much like the `cx()`
 * `defineStyle()` returns, but instead of variant names, it takes this
 * animation's per-call timing: `duration` (falling back to `defaults`'
 * when omitted) and an `overrides` object for the rest, each field falling
 * back to its own `defaults` counterpart when omitted.
 */
export type AnimationInstance = (overrides?: AnimationOverrides) => string;

/**
 * The input accepted by `defineAnimation()`: `keyframes` and `defaults`
 * split apart, with an optional `name` (shared with `defineKeyframes()`'s
 * own contract) at the top level alongside them.
 */
export type AnimationDefinition = {
  /**
   * An explicit `@keyframes` name. Auto-generated if omitted -- see
   * `defineKeyframes()`.
   */
  name?: string;
  keyframes: KeyframeSteps;
  /**
   * This animation's timing, used as-is by a bare call to the returned
   * function and as the fallback for any field an `overrides` call skips.
   */
  defaults: AnimationTiming;
};

const registeredKeyframes = new Set<string>();
let keyframeCounter = 0;

const isKeyframeSelector = (key: string): key is KeyframeSelector =>
  key === "from" || key === "to" || /^\d+(\.\d+)?%$/.test(key);

/**
 * Defines a `@keyframes` block and returns its name -- explicit via `name`,
 * or auto-generated (`keyframes-1`, `keyframes-2`, ...) otherwise. Steps
 * may be written with `"from"`/`"to"`, percentages, or a mix of both.
 *
 * Must be called exactly once per name, at module scope -- the same
 * contract as `defineStyle()` (see its own doc comment), enforced by the
 * same `local/require-define-scope` ESLint rule.
 *
 * @example
 * ```ts
 * const fadeIn = defineKeyframes({ from: { opacity: 0 }, to: { opacity: 1 } });
 * ```
 */
export const defineKeyframes = ({
  name,
  ...steps
}: KeyframesDefinition): string => {
  const keyframeName = name ?? `kf${(++keyframeCounter).toString(36)}`;

  registerOnce(
    registeredKeyframes,
    keyframeName,
    `defineKeyframes: "${keyframeName}" is already registered. defineKeyframes() ` +
      `must be called exactly once per name, at module scope.`,
  );

  const body = Object.entries(steps)
    .map(([selector, declarations]) => {
      assert(
        isKeyframeSelector(selector),
        `defineKeyframes: "${selector}" isn't a valid keyframe selector -- use ` +
          `"from", "to", or a percentage (e.g. "50%").`,
      );
      assert(
        isPlainObject(declarations),
        `defineKeyframes: "${selector}" must be a declarations object, got ${typeof declarations}.`,
      );
      return `${selector} { ${inlineCSS(declarations as CSSProperties)} }`;
    })
    .join("\n");

  installProvider(`@keyframes ${keyframeName} {\n${body}\n}`);

  return keyframeName;
};

const formatDuration = (value: number | DurationString): DurationString =>
  typeof value === "number" ? `${value}ms` : value;

/**
 * Defines a `@keyframes` block (see `defineKeyframes()`) and returns a
 * function for composing it with the `animation` shorthand's own timing --
 * much like the `cx()` `defineStyle()` returns, but instead of variant
 * names, its arguments are this animation's per-call timing: an optional
 * `duration` (falling back to `defaults.duration`) and an `overrides`
 * object for the rest, each field falling back to its `defaults`
 * counterpart. Called bare, it uses `defaults` as-is.
 *
 * Must be called exactly once, at module scope -- same contract (and the
 * same `local/require-define-scope` ESLint rule) as `defineStyle()`.
 *
 * GTK's `animation` shorthand doesn't accept `animation-play-state`
 * (confirmed against a real Gtk.CssProvider) -- set that as its own
 * `animationPlayState` declaration alongside this one if needed.
 *
 * @example
 * ```ts
 * const fadeIn = defineAnimation({
 *   name: "fadeIn",
 *   keyframes: {
 *     from: { transform: translateX(-100), opacity: 0 },
 *     to: { transform: translateX(0), opacity: 1 },
 *   },
 *   defaults: { duration: 300, easing: "ease-out" },
 * });
 *
 * const cx = defineStyle({
 *   class: "Toast",
 *   style: { animation: fadeIn() }, // "fadeIn 300ms ease-out"
 *   variants: {
 *     slow: { animation: fadeIn(600) }, // "fadeIn 600ms ease-out"
 *     bounced: { animation: fadeIn(undefined, { easing: "ease-in" }) },
 *   },
 * });
 * ```
 */
export const defineAnimation = ({
  name,
  keyframes,
  defaults,
}: AnimationDefinition): AnimationInstance => {
  const keyframeName = defineKeyframes({ ...keyframes, name });

  return (overrides = {}) => {
    const { duration, easing, delay, iterationCount, direction, fillMode } = {
      ...defaults,
      ...overrides,
    };

    return [
      keyframeName,
      formatDuration(duration),
      easing,
      delay === undefined ? undefined : formatDuration(delay),
      iterationCount,
      direction,
      fillMode,
    ]
      .filter((part) => part !== undefined)
      .join(" ");
  };
};

/**
 * Composes an `animation` value from any number of already-built animation
 * strings -- each one the result of calling a `defineAnimation()` instance.
 *
 * GTK CSS's `animation` property, like `transition`, is genuinely
 * comma-separated for multiple animations -- there's no parse-error-
 * triggering mistake here, just somewhere to combine more than one
 * `defineAnimation()` result without hand-joining strings.
 *
 * @example
 * ```ts
 * animations(fadeIn(), slideOut(200))
 * // "fadeIn 300ms ease-out, slideOut 200ms linear"
 * ```
 */
export const animations = (...animations: readonly string[]): string =>
  animations.join(", ");
