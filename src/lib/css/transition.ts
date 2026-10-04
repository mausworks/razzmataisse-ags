import type { AnimatableProperty, Easing } from "./animation";
import type { DurationString } from "./units";

export type TransitionTimingString =
  | DurationString
  | `${DurationString} ${Easing}`
  | `${DurationString} ${DurationString}`
  | `${DurationString} ${DurationString} ${Easing}`;

export type TransitionTimingOptions = {
  duration: DurationString;
  easing?: Easing;
  delay?: DurationString;
};

/**
 * A `transition` property's timing, either as a raw string written in
 * GTK's own `duration [easing] [delay]` order (e.g. `"300ms ease-out"`),
 * or as a structured object serialized in that same order -- see
 * `transitions()` below.
 */
export type TransitionTiming = TransitionTimingString | TransitionTimingOptions;

/**
 * One `transitions()` argument: the property to transition, and its
 * (possibly independent from any other entry's) timing.
 */
export type Transitions = {
  [P in AnimatableProperty]?: TransitionTiming;
};

export type TransitionProperties = Partial<{
  transition: string;
  transitionProperty: string;
  transitionDuration: DurationString;
  transitionTimingFunction: Easing;
  transitionDelay: DurationString;
}>;

const resolveTiming = (timing: TransitionTiming): string =>
  typeof timing === "string"
    ? timing
    : [timing.duration, timing.easing, timing.delay].filter(Boolean).join(" ");

/**
 *
 * @example
 * ```ts
 * transitions({
 *   background: "300ms ease-out",
 *   color: { duration: 200, easing: "linear" }
 * });
 * // "background 300ms ease-out, color 200ms linear"
 * ```
 */
export const transitions = (entries: Transitions): string =>
  Object.entries(entries)
    .filter(([, timing]) => Boolean(timing))
    .map(([property, timing]) => `${property} ${resolveTiming(timing)}`)
    .join(", ");
