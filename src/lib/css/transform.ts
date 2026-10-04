import {
  type AngleString,
  type PixelString,
  type PixelValue,
  px,
} from "./units";

export type TranslateXString = `translateX(${PixelString})`;

export type TranslateYString = `translateY(${PixelString})`;

export type TranslateZString = `translateZ(${PixelString})`;

export type TranslateString = `translate(${PixelString}, ${PixelString})`;

export type Translate3DString =
  `translate3d(${PixelString}, ${PixelString}, ${PixelString})`;

export type ScaleString = `scale(${number})` | `scale(${number}, ${number})`;

export type ScaleXString = `scaleX(${number})`;

export type ScaleYString = `scaleY(${number})`;

export type ScaleZString = `scaleZ(${number})`;

export type Scale3DString = `scale3d(${number}, ${number}, ${number})`;

export type RotateString = `rotate(${AngleString})`;

export type RotateXString = `rotateX(${AngleString})`;

export type RotateYString = `rotateY(${AngleString})`;

export type RotateZString = `rotateZ(${AngleString})`;

export type Rotate3DString =
  `rotate3d(${number}, ${number}, ${number}, ${AngleString})`;

export type SkewString =
  `skew(${AngleString})` | `skew(${AngleString}, ${AngleString})`;

export type SkewXString = `skewX(${AngleString})`;

export type SkewYString = `skewY(${AngleString})`;

export type PerspectiveString = `perspective(${PixelString})`;

export type MatrixString =
  `matrix(${number}, ${number}, ${number}, ${number}, ${number}, ${number})`;

export type TransformString =
  | TranslateXString
  | TranslateYString
  | TranslateZString
  | TranslateString
  | Translate3DString
  | ScaleString
  | ScaleXString
  | ScaleYString
  | ScaleZString
  | Scale3DString
  | RotateString
  | RotateXString
  | RotateYString
  | RotateZString
  | Rotate3DString
  | SkewString
  | SkewXString
  | SkewYString
  | PerspectiveString
  | MatrixString;

export type Point2D = readonly [number, number];

export type Point3D = readonly [number, number, number];

export type Matrix2D = readonly [
  [a: number, b: number, c: number],
  [d: number, tx: number, ty: number],
];

export type TransformProperties = {
  transform?: TransformString | ({} & string);
  transformOrigin?: string;
};

/**
 * GTK CSS `translateX()`.
 *
 * @example
 * ```ts
 * translateX(10) // "translateX(10px)"
 * ```
 */
export const translateX = (pixels: number) =>
  `translateX(${pixels}px)` as TranslateXString;

/**
 * GTK CSS `translateY()`.
 *
 * @example
 * ```ts
 * translateY(10) // "translateY(10px)"
 * ```
 */
export const translateY = (pixels: number) =>
  `translateY(${pixels}px)` as TranslateYString;

/**
 * GTK CSS `translateZ()`.
 *
 * @example
 * ```ts
 * translateZ(10) // "translateZ(10px)"
 * ```
 */
export const translateZ = (pixels: number) =>
  `translateZ(${pixels}px)` as TranslateZString;

/**
 * The 2-argument form of `translate()`. GTK rejects a 3rd argument here --
 * use `translate3d()` for that.
 *
 * @example
 * ```ts
 * translate(10, 20) // "translate(10px, 20px)"
 * ```
 */
export const translate = (x: number, y: number) =>
  `translate(${x}px, ${y}px)` as TranslateString;

/**
 * GTK CSS `translate3d()`.
 *
 * @example
 * ```ts
 * translate3d(10, 20, 30) // "translate3d(10px, 20px, 30px)"
 * ```
 */
export const translate3d = (x: number, y: number, z: number) =>
  `translate3d(${x}px, ${y}px, ${z}px)` as Translate3DString;

/**
 * GTK CSS `scale()`. A bare `x` scales both axes uniformly; pass `y` for a
 * non-uniform scale.
 *
 * @example
 * ```ts
 * scale(1.5) // "scale(1.5)"
 * scale(1.5, 0.5) // "scale(1.5, 0.5)"
 * ```
 */
export const scale = (x: number, y?: number) =>
  (y === undefined ? `scale(${x})` : `scale(${x}, ${y})`) as ScaleString;

/**
 * GTK CSS `scaleX()`.
 *
 * @example
 * ```ts
 * scaleX(1.5) // "scaleX(1.5)"
 * ```
 */
export const scaleX = (factor: number) => `scaleX(${factor})` as ScaleXString;

/**
 * GTK CSS `scaleY()`.
 *
 * @example
 * ```ts
 * scaleY(1.5) // "scaleY(1.5)"
 * ```
 */
export const scaleY = (factor: number) => `scaleY(${factor})` as ScaleYString;

/**
 * GTK CSS `scaleZ()`.
 *
 * @example
 * ```ts
 * scaleZ(1.5) // "scaleZ(1.5)"
 * ```
 */
export const scaleZ = (factor: number) => `scaleZ(${factor})` as ScaleZString;

/**
 * GTK CSS `scale3d()`.
 *
 * @example
 * ```ts
 * scale3d(1.5, 0.5, 1) // "scale3d(1.5, 0.5, 1)"
 * ```
 */
export const scale3d = (x: number, y: number, z: number) =>
  `scale3d(${x}, ${y}, ${z})` as Scale3DString;

/**
 * GTK CSS `rotate()`.
 *
 * @example
 * ```ts
 * rotate("45deg") // "rotate(45deg)"
 * ```
 */
export const rotate = (angle: AngleString) =>
  `rotate(${angle})` as RotateString;

/**
 * GTK CSS `rotateX()`.
 *
 * @example
 * ```ts
 * rotateX("45deg") // "rotateX(45deg)"
 * ```
 */
export const rotateX = (angle: AngleString) =>
  `rotateX(${angle})` as RotateXString;

/**
 * GTK CSS `rotateY()`.
 *
 * @example
 * ```ts
 * rotateY("45deg") // "rotateY(45deg)"
 * ```
 */
export const rotateY = (angle: AngleString) =>
  `rotateY(${angle})` as RotateYString;

/**
 * GTK CSS `rotateZ()`.
 *
 * @example
 * ```ts
 * rotateZ("45deg") // "rotateZ(45deg)"
 * ```
 */
export const rotateZ = (angle: AngleString) =>
  `rotateZ(${angle})` as RotateZString;

/**
 * GTK CSS `rotate3d()` -- rotates by `angle` around the axis vector
 * `(x, y, z)`.
 *
 * @example
 * ```ts
 * rotate3d(0, 1, 0, "45deg") // "rotate3d(0, 1, 0, 45deg)"
 * ```
 */
export const rotate3d = (x: number, y: number, z: number, angle: AngleString) =>
  `rotate3d(${x}, ${y}, ${z}, ${angle})` as Rotate3DString;

/**
 * GTK CSS `skew()`. A bare `x` skews only the X axis; pass `y` to skew both.
 *
 * @example
 * ```ts
 * skew("10deg") // "skew(10deg)"
 * skew("10deg", "5deg") // "skew(10deg, 5deg)"
 * ```
 */
export const skew = (x: AngleString, y?: AngleString) =>
  (y === undefined ? `skew(${x})` : `skew(${x}, ${y})`) as SkewString;

/**
 * GTK CSS `skewX()`.
 *
 * @example
 * ```ts
 * skewX("10deg") // "skewX(10deg)"
 * ```
 */
export const skewX = (angle: AngleString) => `skewX(${angle})` as SkewXString;

/**
 * GTK CSS `skewY()`.
 *
 * @example
 * ```ts
 * skewY("10deg") // "skewY(10deg)"
 * ```
 */
export const skewY = (angle: AngleString) => `skewY(${angle})` as SkewYString;

/**
 * GTK CSS `perspective()`.
 *
 * @example
 * ```ts
 * perspective(400) // "perspective(400px)"
 * ```
 */
export const perspective = (pixels: PixelValue) =>
  `perspective(${px(pixels)})` as PerspectiveString;

/**
 * Returns a CSS 2D transformation {@link MatrixString} string.
 *
 * @example
 * ```ts
 * matrix([
 *    [1.2, 0.2, -1],
 *    [0.9, 0, 20]
 * ]) // "matrix(1, 0, 0, 1, 10, 20)"
 * ```
 */
export const matrix = ([[a, b, c], [d, tx, ty]]: Matrix2D): MatrixString =>
  `matrix(${a}, ${b}, ${c}, ${d}, ${tx}, ${ty})`;

/**
 * Composes a `transform` value from any number of individual transform
 * functions, e.g. `transforms(translateX(10), rotate("45deg"))` ->
 * `"translateX(10px) rotate(45deg)"`.
 *
 * @example
 * ```ts
 * const style = { transform: transforms(translateX(10), scale(1.2)) };
 * // transform: "translateX(10px) scale(1.2)"
 * ```
 */
export const transforms = (...transforms: readonly TransformString[]) =>
  transforms.join(" ");
