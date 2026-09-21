import { assert, isPlainObject } from "@lib/util";
import { Accessor, createComputed } from "ags";
import { Gdk, Gtk } from "ags/gtk4";

import type {
  CSSPixels,
  CSSProperties,
  CSSProperty,
  CX,
  CXProp,
  LengthValue,
  StyleBlock,
  StyleDefinition,
  Subselector,
  VariantArgument,
  VariantDefinition,
} from "./types";

export * from "./types";

/** Formats a number as a pixel length string. */
export const toPX = (value: number) => `${value}px` as CSSPixels;

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

/**
 * Wraps a dynamically-computed selector (e.g. built from another class's
 * `cx()` output) and its declarations into a single-key `StyleBlock`
 * fragment, meant to be `...`spread into a `style` object -- not written
 * as a computed `[key]` alongside that object's own literal keys.
 *
 * That distinction matters: a computed key whose type isn't a specific
 * string literal (which a runtime-built selector never is) makes
 * TypeScript fall back to a single merged index signature for the *whole*
 * enclosing object literal, including its unrelated literal keys (a
 * `borderRadius: number` alongside it would then itself have to satisfy
 * `StyleBlock`, and fail to). Spreading in an already-typed fragment
 * avoids that inference path entirely.
 *
 * @example
 * ```ts
 * const style = {
 *   borderRadius: 9999,
 *   "&:hover": { opacity: 0.8 },
 *   ...subselector(`:hover .${otherCX()}`, { color: "red" }),
 * };
 * ```
 */
export const subselector = <S extends string>(
  selector: S,
  block: StyleBlock,
): StyleBlock => ({ [`& ${selector}`]: block }) as StyleBlock;

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
export const defineStyle = <V extends VariantDefinition = never>({
  class: className,
  style = {},
  variants,
}: StyleDefinition<V>) => {
  if (registeredClasses.has(className)) {
    throw new Error(
      `defineStyle: class "${className}" is already registered. defineStyle() must ` +
        `be called exactly once per class name, at module scope.`,
    );
  }
  registeredClasses.add(className);

  const selector = (...variant: (keyof V)[]) =>
    !variant.length
      ? `.${className}`
      : `.${className}.${variant.map((v) => `${className}--${v as string}`).join(".")}`;

  const rules = [buildRules(`.${className}`, style)];

  if (variants) {
    Object.entries(variants).forEach(([name, block]) =>
      rules.push(buildRules(selector(name), block)),
    );
  }

  const provider = new Gtk.CssProvider();
  provider.load_from_string(rules.join("\n"));
  Gtk.StyleContext.add_provider_for_display(
    Gdk.Display.get_default()!,
    provider,
    Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION,
  );

  const compose = (variants: Array<keyof V>) =>
    [
      className,
      ...variants
        .filter((name): name is keyof V => Boolean(name))
        .map((name) => `${className}--${String(name)}`),
    ].join(" ");

  // Recursively checks the whole argument tree -- not just the top-level
  // arguments -- since an array can itself hold an `Accessor` (or another
  // array holding one), any of which makes the composed result reactive.
  const isReactive = (value: VariantArgument<keyof V>): boolean =>
    value instanceof Accessor ||
    (Array.isArray(value) && value.some(isReactive));

  // Recursively unwraps `Accessor`s and flattens nested arrays into a flat
  // list of variant names (and falsy values, still left for `compose` to
  // filter). Unwrapping happens by calling the `Accessor`, so this must
  // only ever run inside `createComputed` when the tree is reactive, for
  // dependency tracking to pick up the read.
  const flatten = (value: VariantArgument<keyof V>): Array<keyof V> => {
    if (value instanceof Accessor) return flatten(value());
    if (Array.isArray(value)) return value.flatMap(flatten);

    // TS can't narrow away the array branch of a self-referential generic
    // alias like `VariantTree<V>` from an `Array.isArray` guard -- the
    // two checks above are exhaustive for everything else `VariantTree`
    // allows, so this is a plain `VariantInput` by elimination.
    return [value] as Array<keyof V>;
  };

  const cx = (...variants: CXProp<string>) =>
    isReactive(variants)
      ? createComputed(() => compose(flatten(variants)))
      : compose(flatten(variants));

  return Object.assign(cx, { selector }) as CX<keyof V>;
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
      declarations[key as CSSProperty] = value as never;
    }
  }

  return { declarations, nested };
};

/**
 * Splits a selector list on its top-level commas -- ones not inside a
 * pseudo-class's parens, e.g. `:not(a, b)` -- so each branch can have `&`
 * resolved independently.
 */
const splitSelectorList = (text: string): string[] => {
  const branches: string[] = [];
  let depth = 0;
  let start = 0;

  for (let i = 0; i < text.length; i++) {
    if (text[i] === "(") {
      depth++;
    } else if (text[i] === ")") {
      depth--;
    } else if (text[i] === "," && depth === 0) {
      branches.push(text.slice(start, i));
      start = i + 1;
    }
  }

  branches.push(text.slice(start));

  return branches.map((branch) => branch.trim());
};

/**
 * Resolves a nested rule's `&`-prefixed key against its enclosing selector.
 * Both may be comma-separated selector lists (e.g. a key of
 * `"&,&:not(button) > button"` under an enclosing selector that is itself
 * a list from an outer resolution) -- every combination of a key branch's
 * `&`s substituted with a selector branch is expanded, so a further-nested
 * key (e.g. `"&:hover"`) still reaches every branch instead of only the
 * last one.
 */
const resolveSelector = (selector: string, key: string): string =>
  splitSelectorList(key)
    .flatMap((keyBranch) =>
      splitSelectorList(selector).map((selectorBranch) =>
        keyBranch.replace(/&/g, selectorBranch),
      ),
    )
    .join(", ");

const buildRules = (selector: string, block: StyleBlock): string => {
  const { declarations, nested } = splitStyleBlock(block);
  const rules = [`${selector} { ${inlineCSS(declarations)} }`];

  for (const [key, childBlock] of Object.entries(nested)) {
    rules.push(buildRules(resolveSelector(selector, key), childBlock));
  }

  return rules.join("\n");
};
