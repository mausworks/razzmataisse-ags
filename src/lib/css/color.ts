import type { ThemeColor } from "@lib/gtk";

import { Fraction } from "./units";

/** A 3, 4, 6, or 8-digit hex color. */
export type HexColor =
  | ({} & `#${string}`)
  | "#fff"
  | "#000"
  | "#0000"
  | "#0009"
  | "#fff9"
  | "#999"
  | "#f00"
  | "#0f0"
  | "#00f";

/**
 * The `currentColor` keyword.
 * Resolves to the element's own or inherited color.
 */
export type CurrentColor = "currentColor";

/** The `transparent` keyword. */
export type TransparentColor = "transparent";

/** The 16 original named CSS colors. */
export type BasicColorName =
  | "black"
  | "silver"
  | "gray"
  | "white"
  | "maroon"
  | "red"
  | "purple"
  | "fuchsia"
  | "green"
  | "lime"
  | "olive"
  | "yellow"
  | "navy"
  | "blue"
  | "teal"
  | "aqua";

/**
 * The most commonly used named CSS colors.
 *
 * Every {@link BasicColorName} plus a handful of popular extended keywords.
 * CSS defines around 150 in total. This isn't meant to be exhaustive.
 */
export type CommonColorName =
  `${BasicColorName}` | "orange" | "pink" | "brown" | "cyan";

/**
 * An RGB or RGBA color.
 *
 * Can be either the legacy comma-separated or the modern space-separated
 * syntax with optional `/ alpha`.
 */
export type RGBColor =
  | (
      | ({} & `rgb(${number} ${number} ${number})`)
      | ({} & `rgb(${number} ${number} ${number} / ${number})`)
      | ({} & `rgba(${number} ${number} ${number} / ${number})`)
      | ({} & `rgb(${number}, ${number}, ${number})`)
      | ({} & `rgb(${number}, ${number}, ${number}, ${number})`)
      | ({} & `rgba(${number}, ${number}, ${number}, ${number})`)
    )
  | "rgb(0 0 0)"
  | "rgb(255 255 255)"
  | "rgb(0 0 0 / 0)"
  | "rgb(0 0 0 / 0.1)"
  | "rgb(0 0 0 / 0.5)"
  | "rgb(255 255 255 / 0.1)"
  | "rgb(255 255 255 / 0.5)";

/**
 * An HSL/HSLA color.
 * Hue in degrees, saturation/lightness as percentages, alpha as a fraction.
 *
 * Can be either the legacy comma-separated or the modern space-separated
 * syntax with optional `/ alpha`.
 */
export type HSLColor =
  | (
      | ({} & `hsl(${number} ${number}% ${number}%)`)
      | ({} & `hsl(${number} ${number}% ${number}% / ${number})`)
      | ({} & `hsla(${number} ${number}% ${number}% / ${number})`)
      | ({} & `hsl(${number}, ${number}%, ${number}%)`)
      | ({} & `hsl(${number}, ${number}%, ${number}%, ${number})`)
      | ({} & `hsla(${number}, ${number}%, ${number}%, ${number})`)
    )
  | "hsl(0 0% 0% / 0)"
  | "hsl(0 0% 100% / 0.5)"
  | "hsl(0 0% 0%)"
  | "hsl(0 0% 100%)"
  | "hsl(0 100% 50%)";

/**
 * An HWB color.
 *
 * Hue in degrees, whiteness/blackness as percentages. */
export type HWBColor =
  | `hwb(${number} ${number}% ${number}%)`
  | `hwb(${number} ${number}% ${number}% / ${number})`;

/**
 * `oklab()`. Perceptual lightness plus `a`/`b` chroma axes, e.g.
 * `"oklab(59% 0.1 0.1)"`.
 */
export type OklabColor = `oklab(${string})`;

/**
 * `oklch()`. Perceptual lightness, chroma, and hue, e.g.
 * `"oklch(59% 0.15 50)"`.
 */
export type OklchColor = `oklch(${string})`;

/**
 * `color(<color-space> ...)`, e.g. `"color(srgb 1 0 0)"` or
 * `"color(display-p3 1 0 0)"`.
 */
export type ColorSpaceColor = `color(${string})`;

/** `color-mix(in <color-space>, color1, color2)`. */
export type ColorMixColor = `color-mix(${string})`;

/**
 * Any GTK4-supported CSS color: a GTK theme color reference (`@name`), a
 * named CSS color keyword (e.g. `"red"`), `currentColor`/`transparent`, a
 * hex color, an `rgb()`/`hsl()`/`hwb()`/`oklab()`/`oklch()`/`color()`/
 * `color-mix()` value (including their relative-color and `calc()` forms),
 * or any other CSS color filter ({@link alpha}, {@link mix}, ...).
 */
export type Color =
  | `@${ThemeColor}`
  | HexColor
  | RGBColor
  | HSLColor
  | HWBColor
  | OklabColor
  | OklchColor
  | ColorSpaceColor
  | ColorMixColor
  | CommonColorName
  | CurrentColor
  | TransparentColor
  | ColorFilter;

/** See {@link alpha}. */
export type AlphaColorFilter = `alpha(${string}, ${number})`;

/** See {@link mix}. */
export type MixColorFilter = `mix(${string}, ${string}, ${number})`;

/** See {@link shade}. */
export type ShadeColorFilter = `shade(${string}, ${number})`;

/** See {@link lighter}. */
export type LighterColorFilter = `lighter(${string})`;

/** See {@link darker}. */
export type DarkerColorFilter = `darker(${string})`;

/**
 * Any GTK CSS color transform function: {@link alpha}, {@link mix},
 * {@link shade}, {@link lighter}, or {@link darker}.
 *
 * Each is itself a valid {@link Color}, so filters compose
 * (e.g. `alpha(lighter("@accent_color"), 0.5)`).
 */
export type ColorFilter =
  | AlphaColorFilter
  | MixColorFilter
  | ShadeColorFilter
  | LighterColorFilter
  | DarkerColorFilter;

/**
 * GTK CSS `alpha()`. `color` with its alpha channel scaled by `factor`
 * (0-1). See https://docs.gtk.org/gtk4/css-overview.html#colors.
 *
 * @param color A GTK theme color reference (`@name`) or any other CSS color.
 * @param factor The alpha channel to scale to, from `0` (transparent) to
 * `1` (opaque).
 *
 * @example
 * ```ts
 * alpha("@accent_color", 0.5) // "alpha(@accent_color, 0.5)"
 * ```
 */
export const alpha = (color: Color | string, factor: Fraction) =>
  `alpha(${color}, ${factor})` as AlphaColorFilter;

/**
 * GTK CSS `mix()`. Linear interpolation between `color1` and `color2`,
 * `factor` (0-1) of the way from the former to the latter.
 *
 * @param first The color at `factor === 0`.
 * @param second The color at `factor === 1`.
 * @param factor How far from `color1` towards `color2`, from `0` to `1`.
 *
 * @example
 * ```ts
 * mix("@accent_color", "@warning_color", 0.3)
 * // "mix(@accent_color, @warning_color, 0.3)"
 * ```
 */
export const mix = (
  first: Color | ({} & string),
  second: Color | ({} & string),
  factor: Fraction = 0.5,
) => `mix(${first}, ${second}, ${factor})` as MixColorFilter;

/**
 * GTK CSS `shade()`. `color` scaled towards white or black. `factor` > 1
 * lightens, `factor` < 1 darkens.
 *
 * @param color The color to scale.
 * @param factor The scaling factor. `1` leaves `color` unchanged.
 *
 * @example
 * ```ts
 * shade("@accent_color", 1.2) // lightened
 * shade("@accent_color", 0.8) // darkened
 * ```
 */
export const shade = (
  color: Color | ({} & string),
  factor: number,
): ShadeColorFilter => `shade(${color}, ${factor})` as ShadeColorFilter;

/**
 * GTK CSS `lighter()`. A lighter variant of `color`.
 *
 * @example
 * ```ts
 * lighter("@accent_color") // "lighter(@accent_color)"
 * ```
 */
export const lighter = (color: Color | ({} & string)) =>
  `lighter(${color})` as LighterColorFilter;

/**
 * GTK CSS `darker()`. A darker variant of `color`.
 *
 * @example
 * ```ts
 * darker("@accent_color") // "darker(@accent_color)"
 * ```
 */
export const darker = (color: Color | ({} & string)) =>
  `darker(${color})` as DarkerColorFilter;
