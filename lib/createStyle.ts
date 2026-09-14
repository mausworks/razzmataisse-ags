type CSSValue = string | number;

type CSSProps = Record<string, CSSValue | undefined>;

const NUMERIC_AS_PX = new Set([
  "padding",
  "margin",
  "borderRadius",
  "borderWidth",
  "minWidth",
  "minHeight",
  "fontSize",
]);

const toKebab = (key: string) =>
  key.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();

const stringifyCSSValue = (key: string, value: CSSValue) => {
  if (typeof value !== "number") {
    return value;
  } else if (NUMERIC_AS_PX.has(key)) {
    return `${value}px`;
  } else {
    return `${value}`;
  }
};

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
export const createStyle = (props: CSSProps) =>
  Object.entries(props)
    .filter((entry): entry is [string, CSSValue] => entry[1] !== undefined)
    .map(([key, value]) => `${toKebab(key)}: ${stringifyCSSValue(key, value)};`)
    .join(" ");

/**
 * Shared base look for plain `<button>` widgets across the bar. Spread this
 * into a widget-specific style object passed to `createStyle()`.
 */
export const baseButton: CSSProps = { borderRadius: 8, margin: 2 };
