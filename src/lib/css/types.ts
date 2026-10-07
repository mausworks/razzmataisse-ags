import type { Accessor } from "ags";

import type { AnimatableProperties, AnimationProperties } from "./animation";
import type { BackgroundProperties } from "./background";
import type { BorderProperties, OutlineProperties } from "./border";
import type { FontProperties } from "./font";
import type { GTKCssProperties } from "./gtk-extensions";
import type { TextProperties } from "./text";
import type { TransformProperties } from "./transform";
import type { TransitionProperties as TransitionProperties } from "./transition";
import type { Fraction, PixelValue } from "./units";

/** The value type of any single property in `CSSProperties`. */
export type CSSPropertyValue = CSSProperties[CSSProperty];

export type MarginProperties = Partial<{
  /** Unlike its per-side siblings, the shorthand also accepts 2-4
   * space-separated values, e.g. `"4px 12px"`. */
  margin: PixelValue | string;
  marginTop: PixelValue;
  marginRight: PixelValue;
  marginBottom: PixelValue;
  marginLeft: PixelValue;
}>;

export type PaddingProperties = Partial<{
  /** Unlike its per-side siblings, the shorthand also accepts 2-4
   * space-separated values, e.g. `"4px 12px"`. */
  padding: PixelValue | string;
  paddingTop: PixelValue;
  paddingRight: PixelValue;
  paddingBottom: PixelValue;
  paddingLeft: PixelValue;
}>;

export type SizingProperties = Partial<{
  minWidth: PixelValue;
  minHeight: PixelValue;
}>;

/**
 * Effects and compositing properties -- not tied to any one box edge or
 * content type, unlike the background/border/text property groups.
 */
export type EffectProperties = Partial<{
  opacity: Fraction;
  filter: string;
  boxShadow: string;
}>;

/**
 * GTK 4's standard CSS properties, camelCased and mapped to their value
 * types. See https://docs.gtk.org/gtk4/css-properties.html for the full
 * reference; `GTKCssProperties` covers the `-gtk-*` extensions.
 */
export type StandardCSSProperties = BackgroundProperties &
  MarginProperties &
  PaddingProperties &
  TransitionProperties &
  AnimationProperties &
  FontProperties &
  TextProperties &
  TransformProperties &
  BorderProperties &
  OutlineProperties &
  SizingProperties &
  EffectProperties;

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
  class?: string;
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

/**
 * A `@keyframes` step selector -- either the `from`/`to` keywords or an
 * explicit percentage, e.g. `"50%"`.
 */
export type KeyframeSelector = "from" | "to" | `${number}%`;

/**
 * One `@keyframes` block's steps, keyed by selector -- steps can be
 * written with `"from"`/`"to"`, percentages, or a mix of both.
 */
export type KeyframeSteps = Partial<
  Record<KeyframeSelector, AnimatableProperties>
>;

/**
 * The input accepted by `defineKeyframes()`: `KeyframeSteps` plus an
 * optional explicit `name` (auto-generated from a counter otherwise).
 */
export type KeyframesDefinition = KeyframeSteps & {
  /**
   * An explicit `@keyframes` name. Auto-generated (`keyframes-1`,
   * `keyframes-2`, ...) if omitted.
   */
  name?: string;
};

export type VariantAccessorArgument<V extends PropertyKey> =
  | Accessor<V | falsy>
  | Accessor<(V | falsy)[]>
  | readonly VariantAccessorArgument<V>[];

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

/**
 * Everything a `ClassComposer`'s arguments accept, for reuse as a
 * component's own `variant` prop type -- like `VariantsOf`, but also
 * allows falsy values, `Accessor`s, and nested arrays of either, matching
 * `cx()` itself.
 */
export type CXProp<T> =
  T extends CX<infer V>
    ? VariantArgument<V> | VariantAccessorArgument<V>
    : never;
