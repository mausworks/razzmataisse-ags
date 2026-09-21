import type { TransitionEntry, TransitionTiming } from "./types";

const resolveTiming = (timing: TransitionTiming): string =>
  typeof timing === "string"
    ? timing
    : [timing.duration, timing.easing, timing.delay].filter(Boolean).join(" ");

/**
 * Composes a `transition` value from any number of independent
 * `[property, timing]` pairs, e.g.
 * `transitions(["background", "300ms ease-out"], ["color", { duration: "200ms", easing: "linear" }])`
 * -> `"background 300ms ease-out, color 200ms linear"`.
 *
 * Each entry's `timing` is either a raw string, written in GTK's own
 * `duration [easing] [delay]` order, or the same shape as a structured
 * object -- entries don't need to share a timing (pass the same value for
 * more than one entry if they do).
 *
 * Unlike `transforms`' functions, GTK CSS's `transition` property is
 * genuinely, correctly comma-separated for multiple properties -- there's
 * no equivalent parse-error-triggering mistake here, just the repetition
 * of retyping the same timing per property by hand.
 */
export const transitions = (...entries: readonly TransitionEntry[]): string =>
  entries
    .map(([property, timing]) => `${property} ${resolveTiming(timing)}`)
    .join(", ");
