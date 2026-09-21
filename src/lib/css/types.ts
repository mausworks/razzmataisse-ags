import type { ThemeColor } from "@lib/gtk";
import type { Accessor } from "ags";

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
export type CSSPixels = `${number}px`;

/** A percentage length string, e.g. `"50%"`. */
export type CSSPercentage = `${number}%`;

/** A GTK theme color reference (`@name`), or any other CSS color string. */
export type CSSColor = `@${ThemeColor}` | (string & {});

export type FontFeatureSettingName = "liga" | "tnum" | "scmp" | "swsh";

export type FontFeatureSettingValue = "on" | "off" | `${number}`;

export type FontFeatureSetting =
  | `"${FontFeatureSettingName}"`
  | `"${FontFeatureSettingName}" ${FontFeatureSettingValue}`;

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

/** A CSS `<time>` value, e.g. `"300ms"` or `"0.3s"` -- what `duration` and
 * `delay` take in `TransitionTiming` and GTK's `transition` property. */
export type CSSDuration = `${number}ms` | `${number}s`;

/**
 * A `transition` property's timing, either as a raw string written in
 * GTK's own `duration [easing] [delay]` order (e.g. `"300ms ease-out"`),
 * or as a structured object serialized in that same order -- see
 * `transitions()` in `@lib/css/transition`.
 */
export type TransitionTiming =
  | string
  | {
      duration: CSSDuration;
      easing?: TimingFunction;
      delay?: CSSDuration;
    };

/** One `transitions()` argument: the property to transition, and its
 * (possibly independent from any other entry's) timing. */
export type TransitionEntry = readonly [
  property: string,
  timing: TransitionTiming,
];

/** An angle value, e.g. `"45deg"` or `"0.5turn"` -- what `rotate()` takes. */
export type CSSAngle =
  `${number}deg` | `${number}rad` | `${number}grad` | `${number}turn`;

export type TranslateX = `translateX(${CSSPixels})`;

export type TranslateY = `translateY(${CSSPixels})`;

export type TranslateZ = `translateZ(${CSSPixels})`;

/** The 2-argument form of `translate()` -- GTK rejects a 3rd argument here;
 * use `Translate3d` for that. */
export type Translate = `translate(${CSSPixels}, ${CSSPixels})`;

export type Translate3d =
  `translate3d(${CSSPixels}, ${CSSPixels}, ${CSSPixels})`;

export type Scale = `scale(${number})` | `scale(${number}, ${number})`;

export type ScaleX = `scaleX(${number})`;

export type ScaleY = `scaleY(${number})`;

export type ScaleZ = `scaleZ(${number})`;

export type Scale3d = `scale3d(${number}, ${number}, ${number})`;

export type Rotate = `rotate(${CSSAngle})`;

export type RotateX = `rotateX(${CSSAngle})`;

export type RotateY = `rotateY(${CSSAngle})`;

export type RotateZ = `rotateZ(${CSSAngle})`;

export type Rotate3d = `rotate3d(${number}, ${number}, ${number}, ${CSSAngle})`;

export type Skew = `skew(${CSSAngle})` | `skew(${CSSAngle}, ${CSSAngle})`;

export type SkewX = `skewX(${CSSAngle})`;

export type SkewY = `skewY(${CSSAngle})`;

export type Perspective = `perspective(${CSSPixels})`;

export type Matrix =
  `matrix(${number}, ${number}, ${number}, ${number}, ${number}, ${number})`;

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

export type CSSBackgroundProperties = Partial<{
  background: CSSColor | string;
  backgroundColor: CSSColor;
  backgroundClip: BoxArea;
  backgroundOrigin: BoxArea;
  backgroundSize: LengthValue | "cover" | "contain";
  backgroundPosition: string;
  backgroundRepeat: RepeatStyle;
  backgroundImage: string;
  backgroundBlendMode: BlendMode;
}>;

export type CSSMarginProperties = Partial<{
  marginTop: LengthValue;
  marginRight: LengthValue;
  marginBottom: LengthValue;
  marginLeft: LengthValue;
  margin: LengthValue;
}>;

export type CSSPaddingProperties = Partial<{
  paddingTop: LengthValue;
  paddingRight: LengthValue;
  paddingBottom: LengthValue;
  paddingLeft: LengthValue;
  padding: LengthValue;
}>;

/**
 * GTK 4's standard CSS properties, camelCased and mapped to their value
 * types. See https://docs.gtk.org/gtk4/css-properties.html for the full
 * reference; `GTKCssProperties` covers the `-gtk-*` extensions.
 */
export type StandardCSSProperties = CSSBackgroundProperties &
  CSSMarginProperties &
  CSSPaddingProperties &
  Partial<{
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
    fontFeatureSettings: FontFeatureSetting | (string & {});
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
    boxShadow: string;
    transitionProperty: string;
    transitionDuration: string;
    transitionTimingFunction: TimingFunction;
    transitionDelay: string;
    transition: string;
    animationName: string;
    animationDuration: string;
    animationTimingFunction: TimingFunction;
    animationIterationCount: number | "infinite";
    animationDirection:
      "normal" | "reverse" | "alternate" | "alternate-reverse";
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

/**
 * A nested selector key, e.g. `"&:hover"` or `"& > a"` -- see `StyleBlock`.
 * May itself be a comma-separated selector list, e.g.
 * `"&,&:not(button) > button"`; each branch gets `&` resolved separately.
 */
export type Subselector = `&${string}`;

/**
 * A style block: CSS declarations, plus optional nested rules keyed by a
 * `Subselector`. `&` in a nested key is replaced with the enclosing rule's
 * own selector, and nested blocks may themselves nest further, e.g.
 * `{ "&:hover": { "& > a": { color: "red" } } }`. Resolution is
 * comma-list-aware in both directions, so hover/active rules nested under a
 * multi-branch key still reach every branch, e.g.
 * `{ "&,&:not(button) > button": { "&:hover": { ... } } }` produces
 * `.Class:hover, .Class:not(button) > button:hover`.
 */
export type StyleBlock = CSSProperties & {
  [key: Subselector]: StyleBlock;
};

/** The input accepted by `defineStyle()`. */
export type StyleDefinition<V extends VariantDefinition> = {
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

export type VariantDefinition = {
  [variant: PropertyKey]: StyleBlock;
};

export type VariantAccessorArgument<V extends PropertyKey> =
  Accessor<V | falsy> | readonly VariantAccessorArgument<V>[];

export type VariantArgument<V extends PropertyKey> =
  V | falsy | readonly VariantArgument<V>[];

export type CXParameters<V extends PropertyKey> = Array<
  VariantArgument<V> | VariantAccessorArgument<V>
>;

/**
 * The `cx()` function `defineStyle()` returns: given any combination of
 * variant names, composes the class list to apply. Falsy arguments are
 * skipped, so conditional variants can be written as `cx(active && "active")`.
 * Given anything reactive anywhere in the argument tree (an `Accessor`, or
 * an array containing one), returns a reactive `Accessor<string>` instead
 * of a plain `string`.
 */
export type CX<V extends PropertyKey> = {
  (...variants: VariantArgument<V>[]): string;
  (...variants: CXParameters<V>): Accessor<string>;
} & {
  selector: (...variants: (keyof V)[]) => string;
};

/** The variant names a `ClassComposer` accepts. */
export type CXVariant<T> = T extends CX<infer V> ? V : never;

/**
 * Everything a `ClassComposer`'s arguments accept, for reuse as a
 * component's own `variant` prop type -- like `VariantsOf`, but also
 * allows falsy values, `Accessor`s, and nested arrays of either, matching
 * `cx()` itself.
 */
export type CXProp<T> = T extends CX<infer V> ? VariantArgument<V> : never;
