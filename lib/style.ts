import { Gtk, Gdk } from "ags/gtk4";
import { hasKey, isPlainObject } from "./util";

export type CSSValue = string | number;

/** Flat CSS declarations, e.g. `{ borderRadius: 8, opacity: 0.5 }`. */
export type CSSDeclarations = Record<string, CSSValue | undefined>;

/**
 * A style block: flat declarations, plus optional nested rules for keys
 * starting with `"&"` (e.g. `"&:hover"`, `"&> a"`), following common
 * CSS-in-JS convention. `&` is replaced with the rule's own selector.
 * Nested values are declarations objects, never raw CSS strings.
 */
export type StyleBlock = Record<string, CSSValue | CSSDeclarations | undefined>;

export type Subselector = `&${string}`;

export type PXValue = `${number}px`;

export type CSSInput<V extends Record<string, StyleBlock>> = {
  class: string;
  style?: StyleBlock;
  variants?: V;
};

export const toPX = (value: number) => `${value}px` as PXValue;

const TRANSFORM_NUMBER = {
  "padding": toPX,
  "margin": toPX,
  "borderRadius": toPX,
  "borderWidth": toPX,
  "minWidth": toPX,
  "minHeight": toPX,
  "fontSize": toPX,
} as const;

const transformNumber = (key: string, value: number) =>
  hasKey(TRANSFORM_NUMBER, key) ? TRANSFORM_NUMBER[key](value) : String(value);

const toKebab = (key: string) =>
  key.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();

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
export const createStyle = (props: CSSDeclarations) =>
  Object.entries(props)
    .filter((entry): entry is [string, CSSValue] => entry[1] !== undefined)
    .map(([key, value]) => `${toKebab(key)}: ${stringifyCSSValue(key, value)};`)
    .join(" ");

const isSubselector = (key: string): key is Subselector => key.startsWith("&");

const splitStyleBlock = (block: StyleBlock) => {
  const declarations: CSSDeclarations = {};
  const nested: Record<string, CSSDeclarations> = {};

  for (const [key, value] of Object.entries(block)) {
    if (isSubselector(key)) {
      if (!isPlainObject(value)) {
        throw new Error(
          `createCSS: "${key}" must be a declarations object, got ${typeof value}.`,
        );
      }
      for (const nestedKey of Object.keys(value)) {
        if (isSubselector(nestedKey)) {
          throw new Error(
            `createCSS: "${key}" contains "${nestedKey}" -- "&"-nesting is ` +
              `only supported one level deep.`,
          );
        }
      }
      nested[key] = value as CSSDeclarations;
    } else if (isPlainObject(value)) {
      throw new Error(
        `createCSS: "${key}" holds an object, not a CSS value. Only "&"-` +
          `prefixed keys may (e.g. "&:hover") -- did you forget the "&"?`,
      );
    } else {
      declarations[key] = value;
    }
  }

  return { declarations, nested };
};

const buildRules = (selector: string, block: StyleBlock) => {
  const { declarations, nested } = splitStyleBlock(block);
  const rules = [`${selector} { ${createStyle(declarations)} }`];

  for (const [key, props] of Object.entries(nested)) {
    rules.push(`${key.replace(/^&/, selector)} { ${createStyle(props)} }`);
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

  return (...activeVariants: Array<keyof V | undefined | null | false | 0 | "">) =>
    [
      className,
      ...activeVariants
        .filter((name): name is keyof V => Boolean(name))
        .map((name) => `${className}--${String(name)}`),
    ].join(" ");
};
