import type { Color } from "./color";
import {
  type AngleString,
  type Fractional,
  type PixelString,
  type PixelValue,
  px,
} from "./units";

export type BlurString = `blur(${PixelString})`;

export type BrightnessString = `brightness(${Fractional})`;

export type ContrastString = `contrast(${Fractional})`;

export type GrayscaleString = `grayscale(${Fractional})`;

export type HueRotateString = `hue-rotate(${AngleString})`;

export type InvertString = `invert(${Fractional})`;

export type OpacityString = `opacity(${Fractional})`;

export type SaturateString = `saturate(${Fractional})`;

export type SepiaString = `sepia(${Fractional})`;

export type DropShadowString = `drop-shadow(${string})`;

export type FilterString =
  | BlurString
  | BrightnessString
  | ContrastString
  | GrayscaleString
  | HueRotateString
  | InvertString
  | OpacityString
  | SaturateString
  | SepiaString
  | DropShadowString;

/**
 * GTK CSS `blur()`. For blurring what's behind a widget, use
 * {@link backdropBlur} instead.
 *
 * @example
 * ```ts
 * blur(10) // "blur(10px)"
 * ```
 */
export const blur = (radius: PixelValue) => `blur(${px(radius)})` as BlurString;

/**
 * A `backdropFilter` that blurs what's behind the widget (since GTK 4.24.1).
 * The compositor's blur settings decide the strength, so it takes no radius.
 *
 * @example
 * ```ts
 * const style = { backdropFilter: backdropBlur() };
 * // backdrop-filter: "blur(10px)"
 * ```
 */
export const backdropBlur = () => blur(10);

/**
 * GTK CSS `brightness()`. `1` (or `"100%"`) leaves the input unchanged.
 *
 * @example
 * ```ts
 * brightness(1.2) // "brightness(1.2)"
 * ```
 */
export const brightness = (amount: Fractional) =>
  `brightness(${amount})` as BrightnessString;

/**
 * GTK CSS `contrast()`. `1` (or `"100%"`) leaves the input unchanged.
 *
 * @example
 * ```ts
 * contrast(0.8) // "contrast(0.8)"
 * ```
 */
export const contrast = (amount: Fractional) =>
  `contrast(${amount})` as ContrastString;

/**
 * GTK CSS `grayscale()`. `1` (or `"100%"`) is fully grayscale.
 *
 * @example
 * ```ts
 * grayscale(1) // "grayscale(1)"
 * ```
 */
export const grayscale = (amount: Fractional) =>
  `grayscale(${amount})` as GrayscaleString;

/**
 * GTK CSS `hue-rotate()`.
 *
 * @example
 * ```ts
 * hueRotate("90deg") // "hue-rotate(90deg)"
 * ```
 */
export const hueRotate = (angle: AngleString) =>
  `hue-rotate(${angle})` as HueRotateString;

/**
 * GTK CSS `invert()`. `1` (or `"100%"`) is fully inverted.
 *
 * @example
 * ```ts
 * invert(1) // "invert(1)"
 * ```
 */
export const invert = (amount: Fractional) =>
  `invert(${amount})` as InvertString;

/**
 * GTK CSS `opacity()`. Unlike the `opacity` property, it composes with
 * other filters.
 *
 * @example
 * ```ts
 * opacity(0.5) // "opacity(0.5)"
 * ```
 */
export const opacity = (amount: Fractional) =>
  `opacity(${amount})` as OpacityString;

/**
 * GTK CSS `saturate()`. `1` (or `"100%"`) leaves the input unchanged.
 *
 * @example
 * ```ts
 * saturate(1.5) // "saturate(1.5)"
 * ```
 */
export const saturate = (amount: Fractional) =>
  `saturate(${amount})` as SaturateString;

/**
 * GTK CSS `sepia()`. `1` (or `"100%"`) is fully sepia.
 *
 * @example
 * ```ts
 * sepia(1) // "sepia(1)"
 * ```
 */
export const sepia = (amount: Fractional) => `sepia(${amount})` as SepiaString;

export type DropShadowOptions = {
  /** Horizontal offset. Defaults to `0`. */
  x?: PixelValue;
  /** Vertical offset. Defaults to `0`. */
  y?: PixelValue;
  /** Blur radius. A hard-edged shadow when omitted. */
  radius?: PixelValue;
  /** Shadow color. `currentColor` when omitted. */
  color?: Color;
};

/**
 * GTK CSS `drop-shadow()`. Follows the content's shape (e.g. an icon's
 * outline), unlike `box-shadow`.
 *
 * @example
 * ```ts
 * dropShadow({ y: 2, radius: 4, color: "rgba(0, 0, 0, 0.5)" })
 * // "drop-shadow(0px 2px 4px rgba(0, 0, 0, 0.5))"
 * ```
 */
export const dropShadow = ({
  x = 0,
  y = 0,
  radius,
  color,
}: DropShadowOptions) =>
  `drop-shadow(${[
    px(x),
    px(y),
    radius === undefined ? undefined : px(radius),
    color,
  ]
    .filter((part) => part !== undefined)
    .join(" ")})` as DropShadowString;

/**
 * Composes a `filter`/`backdropFilter` value from filter functions.
 *
 * @example
 * ```ts
 * const style = { filter: filters(grayscale(1), opacity(0.5)) };
 * // filter: "grayscale(1) opacity(0.5)"
 * ```
 */
export const filters = (...filters: readonly FilterString[]) =>
  filters.join(" ");
