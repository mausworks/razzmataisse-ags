import type { CSSColor } from "./types";

/**
 * GTK CSS `alpha()` -- `color` with its alpha channel scaled by `factor`
 * (0-1). See https://docs.gtk.org/gtk4/css-overview.html#colors.
 */
export const alpha = (color: CSSColor, factor: number): CSSColor =>
  `alpha(${color}, ${factor})`;

/**
 * GTK CSS `mix()` -- linear interpolation between `color1` and `color2`,
 * `factor` (0-1) of the way from the former to the latter.
 */
export const mix = (
  color1: CSSColor,
  color2: CSSColor,
  factor: number,
): CSSColor => `mix(${color1}, ${color2}, ${factor})`;

/**
 * GTK CSS `shade()` -- `color` scaled towards white or black; `factor` > 1
 * lightens, `factor` < 1 darkens.
 */
export const shade = (color: CSSColor, factor: number): CSSColor =>
  `shade(${color}, ${factor})`;

/** GTK CSS `lighter()` -- a lighter variant of `color`. */
export const lighter = (color: CSSColor): CSSColor => `lighter(${color})`;

/** GTK CSS `darker()` -- a darker variant of `color`. */
export const darker = (color: CSSColor): CSSColor => `darker(${color})`;
