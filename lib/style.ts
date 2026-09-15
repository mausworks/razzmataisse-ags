import { Gtk, Gdk } from "ags/gtk4";
import { assert, isPlainObject } from "./util";

export type CSSValue = string | number;

type BorderStyleValue =
  "none" | "solid" | "double" | "groove" | "ridge" | "inset" | "outset";

type BoxArea = "border-box" | "padding-box" | "content-box";

type RepeatStyle = "repeat" | "repeat-x" | "repeat-y" | "no-repeat";

type FontWeightValue = "normal" | "bold" | "lighter" | "bolder" | number;

/** A named easing keyword, or a raw `cubic-bezier(...)`/`steps(...)` call. */
type TimingFunction =
  | "ease"
  | "linear"
  | "ease-in"
  | "ease-out"
  | "ease-in-out"
  | "step-start"
  | "step-end"
  | (string & {});

type BlendMode =
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
 * GTK 4's supported CSS properties, camelCased, mapped to their value types,
 * per https://docs.gtk.org/gtk4/css-properties.html -- `-gtk-`-prefixed
 * properties drop the leading dash and keep the `gtk` prefix lower-case
 * (e.g. `-gtk-icon-size` -> `gtkIconSize`), matching this file's `toKebab`.
 *
 * Properties with an open-ended grammar (`<color>`, `<image>`, `<shadow>`,
 * shorthands, ...) are typed as `string` -- GTK's CSS value syntax isn't
 * worth modeling precisely for those.
 */
export type CSSProperties = Partial<{
  // Standard CSS properties
  color: string;
  opacity: number;
  filter: string;
  fontFamily: string;
  fontSize: CSSValue;
  fontStyle: "italic" | "oblique" | "normal";
  fontVariant: string;
  fontWeight: FontWeightValue;
  fontWidth: CSSValue;
  fontStretch: CSSValue;
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
  caretColor: string;
  letterSpacing: CSSValue;
  textTransform: "uppercase" | "lowercase" | "capitalize" | "none";
  lineHeight: CSSValue;
  textDecorationLine: "underline" | "overline" | "line-through" | "none";
  textDecorationColor: string;
  textDecorationStyle: "solid" | "double" | "dotted" | "dashed" | "wavy";
  textShadow: string;
  textDecoration: string;
  transform: string;
  transformOrigin: string;
  minWidth: CSSValue;
  minHeight: CSSValue;
  marginTop: CSSValue;
  marginRight: CSSValue;
  marginBottom: CSSValue;
  marginLeft: CSSValue;
  margin: CSSValue;
  paddingTop: CSSValue;
  paddingRight: CSSValue;
  paddingBottom: CSSValue;
  paddingLeft: CSSValue;
  padding: CSSValue;
  borderTopWidth: CSSValue;
  borderRightWidth: CSSValue;
  borderBottomWidth: CSSValue;
  borderLeftWidth: CSSValue;
  borderTopStyle: BorderStyleValue;
  borderRightStyle: BorderStyleValue;
  borderBottomStyle: BorderStyleValue;
  borderLeftStyle: BorderStyleValue;
  borderTopRightRadius: CSSValue;
  borderBottomRightRadius: CSSValue;
  borderBottomLeftRadius: CSSValue;
  borderTopLeftRadius: CSSValue;
  borderTopColor: string;
  borderRightColor: string;
  borderBottomColor: string;
  borderLeftColor: string;
  borderImageSource: string;
  borderImageRepeat: "repeat" | "stretch" | "round";
  borderImageSlice: CSSValue;
  borderImageWidth: CSSValue;
  borderWidth: CSSValue;
  borderStyle: string;
  borderColor: string;
  borderTop: string;
  borderRight: string;
  borderBottom: string;
  borderLeft: string;
  border: string;
  borderRadius: CSSValue;
  borderImage: string;
  outlineStyle: BorderStyleValue;
  outlineWidth: CSSValue;
  outlineColor: string;
  outlineOffset: CSSValue;
  outline: string;
  backgroundColor: string;
  backgroundClip: BoxArea;
  backgroundOrigin: BoxArea;
  backgroundSize: CSSValue | "cover" | "contain";
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
  borderSpacing: CSSValue;
  // GTK-specific properties (kept as "-gtk-*" in the generated CSS)
  gtkDpi: number;
  gtkSecondaryCaretColor: string;
  gtkIconSource: string;
  gtkIconSize: CSSValue;
  gtkIconStyle: "requested" | "regular" | "symbolic";
  gtkIconTransform: string;
  gtkIconPalette: string;
  gtkIconShadow: string;
  gtkIconFilter: string;
  gtkIconWeight: FontWeightValue;
}>;

export type CSSProperty = keyof CSSProperties;

export type Subselector = `&${string}`;

/**
 * A style block: flat declarations, plus optional nested rules for keys
 * starting with `"&"` (e.g. `"&:hover"`, `"&> a"`), following common
 * CSS-in-JS convention. `&` is replaced with the rule's own selector.
 * Nested values are themselves style blocks, and may nest further (e.g.
 * `"&:hover": { "& > a": { ... } }`) -- never raw CSS strings.
 */
export type StyleBlock = CSSProperties & {
  [key: Subselector]: StyleBlock;
};

export type PXValue = `${number}px`;

export type CSSInput<V extends Record<string, StyleBlock>> = {
  class: string;
  style?: StyleBlock;
  variants?: V;
};

export const toPX = (value: number) => `${value}px` as PXValue;

/**
 * Properties whose value is a `<length>` (per
 * https://docs.gtk.org/gtk4/css-properties.html) -- a bare number is
 * treated as a pixel length here. Properties where a bare number is
 * already valid CSS on its own (e.g. `lineHeight`, `opacity`,
 * `borderImageWidth`) are deliberately left out.
 */
const LENGTH_PROPERTIES = new Set<CSSProperty>([
  "fontSize",
  "letterSpacing",
  "minWidth",
  "minHeight",
  "marginTop",
  "marginRight",
  "marginBottom",
  "marginLeft",
  "margin",
  "paddingTop",
  "paddingRight",
  "paddingBottom",
  "paddingLeft",
  "padding",
  "borderTopWidth",
  "borderRightWidth",
  "borderBottomWidth",
  "borderLeftWidth",
  "borderWidth",
  "borderTopRightRadius",
  "borderBottomRightRadius",
  "borderBottomLeftRadius",
  "borderTopLeftRadius",
  "borderRadius",
  "outlineWidth",
  "outlineOffset",
  "backgroundSize",
  "borderSpacing",
  "gtkIconSize",
]);

const transformNumber = (key: string, value: number) =>
  LENGTH_PROPERTIES.has(key as CSSProperty) ? toPX(value) : String(value);

const toKebab = (key: string) => {
  const kebab = key.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
  return kebab.startsWith("gtk-") ? `-${kebab}` : kebab;
};

const stringifyCSSValue = (key: string, value: CSSValue) =>
  typeof value === "number" ? transformNumber(key, value) : value;

/**
 * Builds a GTK CSS declaration string from a typed object. Pass the result
 * to a widget's `css` prop.
 *
 * @example
 * ```ts
 * createStyle({ borderRadius: 8, opacity: 0.5 })
 * // "border-radius: 8px; opacity: 0.5;"
 * ```
 */
export const createStyle = (props: CSSProperties) =>
  Object.entries(props)
    .filter((entry): entry is [string, CSSValue] => entry[1] !== undefined)
    .map(([key, value]) => `${toKebab(key)}: ${stringifyCSSValue(key, value)};`)
    .join(" ");

const isSubselector = (key: string): key is Subselector => key.startsWith("&");

const splitStyleBlock = (block: StyleBlock) => {
  const declarations: CSSProperties = {};
  const nested: Record<string, StyleBlock> = {};

  for (const [key, value] of Object.entries(block)) {
    if (isSubselector(key)) {
      assert(
        isPlainObject(value),
        `createCSS: "${key}" must be a declarations object, got ${typeof value}.`,
      );
      nested[key] = value as StyleBlock;
    } else {
      assert(
        !isPlainObject(value),
        `createCSS: "${key}" holds an object, not a CSS value. Only "&"-` +
          `prefixed keys may (e.g. "&:hover") -- did you forget the "&"?`,
      );
      // A per-key write into a heterogeneous Partial<{...}> can't be typed
      // soundly with a dynamic key -- TS only accepts `undefined` there.
      (declarations as Record<string, CSSValue | undefined>)[key] = value as
        CSSValue | undefined;
    }
  }

  return { declarations, nested };
};

const buildRules = (selector: string, block: StyleBlock): string => {
  const { declarations, nested } = splitStyleBlock(block);
  const rules = [`${selector} { ${createStyle(declarations)} }`];

  for (const [key, childBlock] of Object.entries(nested)) {
    rules.push(buildRules(key.replace(/^&/, selector), childBlock));
  }

  return rules.join("\n");
};

const registeredClasses = new Set<string>();

/**
 * Registers a GTK stylesheet once, globally, at
 * `STYLE_PROVIDER_PRIORITY_APPLICATION`, and returns a `cx()` function that
 * builds the right combination of class names for a set of active variants.
 * Falsy arguments are filtered out, `classnames`-style, so conditional
 * variants can be written as `cx(active && "active")`.
 *
 * Must be called exactly once per class name, at module scope -- never
 * inside a render function, or you'll re-register (and throw) every time
 * that function runs.
 *
 * Supports nested pseudo-classes/selectors via `"&"`-prefixed keys, like
 * most CSS-in-JS libraries (e.g. `{ "&:hover": { opacity: 1 } }`). Plain CSS
 * strings are not supported -- everything is a typed declarations object.
 *
 * @example
 * ```ts
 * const cx = createCSS({
 *   class: "Pill",
 *   style: { opacity: 0.5, "&:hover": { opacity: 0.8 } },
 *   variants: { focused: { opacity: 1 } },
 * })
 * cx() // "Pill"
 * cx("focused") // "Pill Pill--focused"
 * cx(isFocused && "focused") // conditional, classnames-style
 * ```
 */
export const createCSS = <V extends Record<string, StyleBlock>>({
  class: className,
  style = {},
  variants = {} as V,
}: CSSInput<V>) => {
  if (registeredClasses.has(className)) {
    throw new Error(
      `createCSS: class "${className}" is already registered. createCSS() ` +
        `must be called exactly once per class name, at module scope.`,
    );
  }
  registeredClasses.add(className);

  const rules = [buildRules(`.${className}`, style)];

  for (const [name, block] of Object.entries(variants)) {
    rules.push(buildRules(`.${className}--${name}`, block));
  }

  const provider = new Gtk.CssProvider();
  provider.load_from_string(rules.join("\n"));
  Gtk.StyleContext.add_provider_for_display(
    Gdk.Display.get_default()!,
    provider,
    Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION,
  );

  return (
    ...activeVariants: Array<keyof V | undefined | null | false | 0 | "">
  ) =>
    [
      className,
      ...activeVariants
        .filter((name): name is keyof V => Boolean(name))
        .map((name) => `${className}--${String(name)}`),
    ].join(" ");
};
