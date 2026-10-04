import type { Color } from "./color";
import type { PixelValue, PixelValues } from "./units";

/** The keywords accepted by `border-style` and `outline-style`. */
export type BorderStyle =
  "none" | "solid" | "double" | "groove" | "ridge" | "inset" | "outset";

export type BorderStyles =
  | BorderStyle
  | `${BorderStyle} ${BorderStyle}`
  | `${BorderStyle} ${BorderStyle} ${BorderStyle}`
  | `${BorderStyle} ${BorderStyle} ${BorderStyle} ${BorderStyle}`;

export type BorderProperties = Partial<{
  border: string;
  borderTop: string;
  borderRight: string;
  borderBottom: string;
  borderLeft: string;
  borderTopWidth: PixelValue;
  borderRightWidth: PixelValue;
  borderBottomWidth: PixelValue;
  borderLeftWidth: PixelValue;
  borderTopStyle: BorderStyle;
  borderRightStyle: BorderStyle;
  borderBottomStyle: BorderStyle;
  borderLeftStyle: BorderStyle;
  borderTopRightRadius: PixelValue;
  borderBottomRightRadius: PixelValue;
  borderBottomLeftRadius: PixelValue;
  borderTopLeftRadius: PixelValue;
  borderTopColor: Color | (string & {});
  borderRightColor: Color | (string & {});
  borderBottomColor: Color | (string & {});
  borderLeftColor: Color | (string & {});
  borderImageSource: string;
  borderImageRepeat: "repeat" | "stretch" | "round";
  borderImageSlice: PixelValue;
  borderImageWidth: PixelValue;
  borderWidth: PixelValue;
  borderStyle: BorderStyles;
  borderColor: Color | (string & {});
  borderRadius: PixelValue | PixelValues;
  borderImage: string;
  borderSpacing: PixelValue;
}>;

export type OutlineProperties = Partial<{
  outlineStyle: BorderStyle;
  outlineWidth: PixelValue;
  outlineColor: Color | (string & {});
  outlineOffset: PixelValue;
  outline: string;
}>;
