import { Accessor, createComputed } from "ags";
import { Gtk, Gdk } from "ags/gtk4";
import { assert, isPlainObject } from "../util";
import type {
  CSSProperty,
  CSSProperties,
  LengthValue,
  PXValue,
  StyleBlock,
  CSSInput,
  Subselector,
  ClassComposer,
  VariantInput,
} from "./types";

export * from "./types";

/** Formats a number as a pixel length string. */
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

const stringifyCSSValue = (key: string, value: LengthValue) =>
  typeof value === "number" ? transformNumber(key, value) : value;

/**
 * Serializes a flat declarations object into a CSS declaration-list string
 * for a widget's `css` prop. An escape hatch for one-off inline styling --
 * prefer `defineStyle` for anything reused across instances or variants.
 *
 * @example
 * ```ts
 * inlineCSS({ borderRadius: 8, opacity: 0.5 })
 * // "border-radius: 8px; opacity: 0.5;"
 * ```
 */
export const inlineCSS = (props: CSSProperties) =>
  Object.entries(props)
    .filter((entry): entry is [string, LengthValue] => entry[1] !== undefined)
    .map(([key, value]) => `${toKebab(key)}: ${stringifyCSSValue(key, value)};`)
    .join(" ");

const registeredClasses = new Set<string>();

/**
 * Defines a GTK CSS class, plus any number of named variants, and returns a
 * `cx()` function for composing the resulting class names.
 *
 * Must be called exactly once per class name, at module scope -- calling it
 * from inside a render function re-registers (and throws) on every run.
 *
 * @returns A function that, given any combination of variant names, returns
 * the class list to apply. Falsy arguments are skipped, so conditional
 * variants can be written as `cx(active && "active")`. Given a mix of plain
 * variant names and `Accessor`s of them, returns a reactive
 * `Accessor<string>` instead, recomputed whenever any of them change.
 * @throws If `class` was already registered by an earlier call.
 *
 * @example
 * ```ts
 * const cx = defineStyle({
 *   class: "Pill",
 *   style: { opacity: 0.5, "&:hover": { opacity: 0.8 } },
 *   variants: { focused: { opacity: 1 } },
 * })
 * cx() // "Pill"
 * cx("focused") // "Pill Pill--focused"
 * cx(isFocused && "focused") // conditional, classnames-style
 * cx(focused.as((f) => f?.id === ws.id && "focused")) // Accessor<string>
 * ```
 */
export const defineStyle = <V extends Record<string, StyleBlock>>({
  class: className,
  style = {},
  variants = {} as V,
}: CSSInput<V>) => {
  if (registeredClasses.has(className)) {
    throw new Error(
      `defineStyle: class "${className}" is already registered. defineStyle() must ` +
        `be called exactly once per class name, at module scope.`,
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

  const compose = (variants: Array<VariantInput<V>>) =>
    [
      className,
      ...variants
        .filter((name): name is keyof V => Boolean(name))
        .map((name) => `${className}--${String(name)}`),
    ].join(" ");

  const cx = (
    ...variants: Array<VariantInput<V> | Accessor<VariantInput<V>>>
  ) => {
    if (!variants.some((variant) => variant instanceof Accessor)) {
      return compose(variants as Array<VariantInput<V>>);
    }

    return createComputed(() =>
      compose(
        variants.map((variant) =>
          variant instanceof Accessor ? variant() : variant,
        ),
      ),
    );
  };

  return cx as ClassComposer<V>;
};

const isSubselector = (key: string): key is Subselector => key.startsWith("&");

const splitStyleBlock = (block: StyleBlock) => {
  const declarations: CSSProperties = {};
  const nested: Record<string, StyleBlock> = {};

  for (const [key, value] of Object.entries(block)) {
    if (isSubselector(key)) {
      assert(
        isPlainObject(value),
        `defineStyle: "${key}" must be a declarations object, got ${typeof value}.`,
      );
      nested[key] = value as StyleBlock;
    } else {
      assert(
        !isPlainObject(value),
        `defineStyle: "${key}" holds an object, not a CSS value. Only "&"-` +
          `prefixed keys may (e.g. "&:hover") -- did you forget the "&"?`,
      );
      // A per-key write into a heterogeneous Partial<{...}> can't be typed
      // soundly with a dynamic key -- TS only accepts `undefined` there.
      (declarations as Record<string, LengthValue | undefined>)[key] = value as
        LengthValue | undefined;
    }
  }

  return { declarations, nested };
};

const buildRules = (selector: string, block: StyleBlock): string => {
  const { declarations, nested } = splitStyleBlock(block);
  const rules = [`${selector} { ${inlineCSS(declarations)} }`];

  for (const [key, childBlock] of Object.entries(nested)) {
    rules.push(buildRules(key.replace(/^&/, selector), childBlock));
  }

  return rules.join("\n");
};
