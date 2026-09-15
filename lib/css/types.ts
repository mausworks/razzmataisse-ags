import { ThemeColor } from "../gtk";

/**
 * A raw CSS value, or a bare number. Numbers are formatted as a pixel
 * length for properties that call for one, and passed through unitless
 * otherwise -- see `LENGTH_PROPERTIES`.
 */
export type LengthValue = string | number;

/** The keywords accepted by `border-style` and `outline-style`. */
export type BorderStyle =
  "none" | "solid" | "double" | "groove" | "ridge" | "inset" | "outset";

/** The keywords accepted by `background-clip` and `background-origin`. */
export type BoxArea = "border-box" | "padding-box" | "content-box";

/** The keywords accepted by `background-repeat`. */
export type RepeatStyle = "repeat" | "repeat-x" | "repeat-y" | "no-repeat";

/** The keywords or numeric weight accepted by `font-weight`. */
export type FontWeight = "normal" | "bold" | "lighter" | "bolder" | number;

/** A pixel length string, e.g. `"8px"`. */
export type PXValue = `${number}px`;

/** A GTK theme color reference (`@name`), or any other CSS color string. */
export type CSSColor = `@${ThemeColor}` | (string & {});

/** A named easing keyword, or a raw `cubic-bezier(...)`/`steps(...)` call. */
export type TimingFunction =
  | "ease"
  | "linear"
  | "ease-in"
  | "ease-out"
  | "ease-in-out"
  | "step-start"
  | "step-end"
  | (string & {});

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

/**
 * GTK 4's standard CSS properties, camelCased and mapped to their value
 * types. See https://docs.gtk.org/gtk4/css-properties.html for the full
 * reference; `GTKCssProperties` covers the `-gtk-*` extensions.
 */
export type StandardCSSProperties = Partial<{
  color: CSSColor;
  opacity: number;
  filter: string;
  fontFamily: string;
  fontSize: LengthValue;
  fontStyle: "italic" | "oblique" | "normal";
  fontVariant: string;
  fontWeight: FontWeight;
  fontWidth: LengthValue;
  fontStretch: LengthValue;
  fontKerning: "auto" | "normal" | "none";
  fontVariantLigatures: string;
  fontVariantPosition: "normal" | "sub" | "super";
  fontVariantCaps: string;
  fontVariantNumeric: string;
  fontVariantAlternates: string;
  fontVariantEastAsian: string;
  fontFeatureSettings: string;
  fontVariationSettings: string;
  font: string;
  caretColor: CSSColor;
  letterSpacing: LengthValue;
  textTransform: "uppercase" | "lowercase" | "capitalize" | "none";
  lineHeight: LengthValue;
  textDecorationLine: "underline" | "overline" | "line-through" | "none";
  textDecorationColor: CSSColor;
  textDecorationStyle: "solid" | "double" | "dotted" | "dashed" | "wavy";
  textShadow: string;
  textDecoration: string;
  transform: string;
  transformOrigin: string;
  minWidth: LengthValue;
  minHeight: LengthValue;
  marginTop: LengthValue;
  marginRight: LengthValue;
  marginBottom: LengthValue;
  marginLeft: LengthValue;
  margin: LengthValue;
  paddingTop: LengthValue;
  paddingRight: LengthValue;
  paddingBottom: LengthValue;
  paddingLeft: LengthValue;
  padding: LengthValue;
  borderTopWidth: LengthValue;
  borderRightWidth: LengthValue;
  borderBottomWidth: LengthValue;
  borderLeftWidth: LengthValue;
  borderTopStyle: BorderStyle;
  borderRightStyle: BorderStyle;
  borderBottomStyle: BorderStyle;
  borderLeftStyle: BorderStyle;
  borderTopRightRadius: LengthValue;
  borderBottomRightRadius: LengthValue;
  borderBottomLeftRadius: LengthValue;
  borderTopLeftRadius: LengthValue;
  borderTopColor: CSSColor;
  borderRightColor: CSSColor;
  borderBottomColor: CSSColor;
  borderLeftColor: CSSColor;
  borderImageSource: string;
  borderImageRepeat: "repeat" | "stretch" | "round";
  borderImageSlice: LengthValue;
  borderImageWidth: LengthValue;
  borderWidth: LengthValue;
  borderStyle: string;
  borderColor: CSSColor;
  borderTop: string;
  borderRight: string;
  borderBottom: string;
  borderLeft: string;
  border: string;
  borderRadius: LengthValue;
  borderImage: string;
  outlineStyle: BorderStyle;
  outlineWidth: LengthValue;
  outlineColor: CSSColor;
  outlineOffset: LengthValue;
  outline: string;
  backgroundColor: CSSColor;
  backgroundClip: BoxArea;
  backgroundOrigin: BoxArea;
  backgroundSize: LengthValue | "cover" | "contain";
  backgroundPosition: string;
  backgroundRepeat: RepeatStyle;
  backgroundImage: string;
  boxShadow: string;
  backgroundBlendMode: BlendMode;
  background: string;
  transitionProperty: string;
  transitionDuration: string;
  transitionTimingFunction: TimingFunction;
  transitionDelay: string;
  transition: string;
  animationName: string;
  animationDuration: string;
  animationTimingFunction: TimingFunction;
  animationIterationCount: number | "infinite";
  animationDirection: "normal" | "reverse" | "alternate" | "alternate-reverse";
  animationPlayState: "running" | "paused";
  animationDelay: string;
  animationFillMode: "none" | "forwards" | "backwards" | "both";
  animation: string;
  borderSpacing: LengthValue;
}>;

/**
 * GTK 4's `-gtk-*` CSS extensions, camelCased without the leading dash
 * (e.g. `-gtk-icon-size` -> `gtkIconSize`) -- see `toKebab` for how the
 * dash is restored when generating CSS. See
 * https://docs.gtk.org/gtk4/css-properties.html for the full reference.
 */
export type GTKCssProperties = Partial<{
  gtkDpi: number;
  gtkSecondaryCaretColor: CSSColor;
  gtkIconSource: string;
  gtkIconSize: LengthValue;
  gtkIconStyle: "requested" | "regular" | "symbolic";
  gtkIconTransform: string;
  gtkIconPalette: string;
  gtkIconShadow: string;
  gtkIconFilter: string;
  gtkIconWeight: FontWeight;
}>;

/** Every CSS property `defineStyle` accepts, standard and GTK-specific alike. */
export type CSSProperties = StandardCSSProperties & GTKCssProperties;

/** The name of any property in `CSSProperties`. */
export type CSSProperty = keyof CSSProperties;

/** A nested selector key, e.g. `"&:hover"` or `"& > a"` -- see `StyleBlock`. */
export type Subselector = `&${string}`;

/**
 * A style block: CSS declarations, plus optional nested rules keyed by a
 * `Subselector`. `&` in a nested key is replaced with the enclosing rule's
 * own selector, and nested blocks may themselves nest further, e.g.
 * `{ "&:hover": { "& > a": { color: "red" } } }`.
 */
export type StyleBlock = CSSProperties & {
  [key: Subselector]: StyleBlock;
};

/** The input accepted by `defineStyle()`. */
export type CSSInput<V extends Record<string, StyleBlock>> = {
  /** The class name to register. */
  class: string;
  /** The base style, applied to every element with `class`. */
  style?: StyleBlock;
  /**
   * Named style blocks. Each variant is applied as an `<class>--<name>`
   * modifier class by the `cx()` function `defineStyle()` returns.
   */
  variants?: V;
};
