import type { Color } from "./color";
import type { PixelValue } from "./units";

/** The keywords accepted by `background-clip` and `background-origin`. */
export type BoxArea = "border-box" | "padding-box" | "content-box";

/** The keywords accepted by `background-repeat`. */
export type RepeatStyle = "repeat" | "repeat-x" | "repeat-y" | "no-repeat";

/** The keywords accepted by `background-blend-mode`. */
export type BlendMode =
  | "normal"
  | "multiply"
  | "screen"
  | "overlay"
  | "darken"
  | "lighten"
  | "color-dodge"
  | "color-burn"
  | "hard-light"
  | "soft-light"
  | "difference"
  | "exclusion"
  | "hue"
  | "saturation"
  | "color"
  | "luminosity";

export type BackgroundProperties = Partial<{
  background: Color | (string & {});
  backgroundColor: Color | (string & {});
  backgroundClip: BoxArea;
  backgroundOrigin: BoxArea;
  backgroundSize: PixelValue | "cover" | "contain";
  backgroundPosition: string;
  backgroundRepeat: RepeatStyle;
  backgroundImage: string;
  backgroundBlendMode: BlendMode;
}>;
