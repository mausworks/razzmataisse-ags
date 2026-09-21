import {
  CSSAngle,
  Matrix,
  Perspective,
  Rotate,
  Rotate3d,
  RotateX,
  RotateY,
  RotateZ,
  Scale,
  Scale3d,
  ScaleX,
  ScaleY,
  ScaleZ,
  Skew,
  SkewX,
  SkewY,
  Translate,
  Translate3d,
  TranslateX,
  TranslateY,
  TranslateZ,
} from "./types";

export type Transform =
  | TranslateX
  | TranslateY
  | TranslateZ
  | Translate
  | Translate3d
  | Scale
  | ScaleX
  | ScaleY
  | ScaleZ
  | Scale3d
  | Rotate
  | RotateX
  | RotateY
  | RotateZ
  | Rotate3d
  | Skew
  | SkewX
  | SkewY
  | Perspective
  | Matrix;

export const translateX = (pixels: number): TranslateX =>
  `translateX(${pixels}px)`;

export const translateY = (pixels: number): TranslateY =>
  `translateY(${pixels}px)`;

export const translateZ = (pixels: number): TranslateZ =>
  `translateZ(${pixels}px)`;

/** The 2-argument form of `translate()`. GTK rejects a 3rd argument here --
 * use `translate3d()` for that. */
export const translate = (x: number, y: number): Translate =>
  `translate(${x}px, ${y}px)`;

export const translate3d = (x: number, y: number, z: number): Translate3d =>
  `translate3d(${x}px, ${y}px, ${z}px)`;

export const scale = (x: number, y?: number): Scale =>
  y === undefined ? `scale(${x})` : `scale(${x}, ${y})`;

export const scaleX = (factor: number): ScaleX => `scaleX(${factor})`;

export const scaleY = (factor: number): ScaleY => `scaleY(${factor})`;

export const scaleZ = (factor: number): ScaleZ => `scaleZ(${factor})`;

export const scale3d = (x: number, y: number, z: number): Scale3d =>
  `scale3d(${x}, ${y}, ${z})`;

export const rotate = (angle: CSSAngle): Rotate => `rotate(${angle})`;

export const rotateX = (angle: CSSAngle): RotateX => `rotateX(${angle})`;

export const rotateY = (angle: CSSAngle): RotateY => `rotateY(${angle})`;

export const rotateZ = (angle: CSSAngle): RotateZ => `rotateZ(${angle})`;

export const rotate3d = (
  x: number,
  y: number,
  z: number,
  angle: CSSAngle,
): Rotate3d => `rotate3d(${x}, ${y}, ${z}, ${angle})`;

export const skew = (x: CSSAngle, y?: CSSAngle): Skew =>
  y === undefined ? `skew(${x})` : `skew(${x}, ${y})`;

export const skewX = (angle: CSSAngle): SkewX => `skewX(${angle})`;

export const skewY = (angle: CSSAngle): SkewY => `skewY(${angle})`;

export const perspective = (pixels: number): Perspective =>
  `perspective(${pixels}px)`;

export const matrix = (
  a: number,
  b: number,
  c: number,
  d: number,
  e: number,
  f: number,
): Matrix => `matrix(${a}, ${b}, ${c}, ${d}, ${e}, ${f})`;

export const transforms = (...transforms: readonly Transform[]) =>
  transforms.join(" ");
