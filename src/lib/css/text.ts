import type { Color } from "./color";
import type { PixelValue } from "./units";

export type TextProperties = Partial<{
  color: Color | (string & {});
  caretColor: Color | (string & {});
  letterSpacing: PixelValue;
  textTransform: "uppercase" | "lowercase" | "capitalize" | "none";
  lineHeight: PixelValue;
  textDecorationLine: "underline" | "overline" | "line-through" | "none";
  textDecorationColor: Color | (string & {});
  textDecorationStyle: "solid" | "double" | "dotted" | "dashed" | "wavy";
  textShadow: string;
  textDecoration: string;
}>;
