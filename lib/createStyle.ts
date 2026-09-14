type CSSValue = string | number

type CSSProps = Record<string, CSSValue | undefined>

const NUMERIC_AS_PX = new Set([
  "padding",
  "margin",
  "borderRadius",
  "borderWidth",
  "minWidth",
  "minHeight",
  "fontSize",
])

function toKebab(key: string): string {
  return key.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase()
}

function toCssValue(key: string, value: CSSValue): string {
  if (typeof value === "number") {
    return NUMERIC_AS_PX.has(key) ? `${value}px` : `${value}`
  }
  return value
}

/** Builds a GTK CSS declaration string from a typed object, e.g.
 *  createStyle({ borderRadius: 8, opacity: 0.5 }) -> "border-radius: 8px; opacity: 0.5;"
 *  Pass the result to a widget's `css` prop. */
export function createStyle(props: CSSProps): string {
  return Object.entries(props)
    .filter((entry): entry is [string, CSSValue] => entry[1] !== undefined)
    .map(([key, value]) => `${toKebab(key)}: ${toCssValue(key, value)};`)
    .join(" ")
}

/** Shared base look for plain <button> widgets across the bar. Spread this
 *  into a widget-specific style object passed to createStyle(). */
export const baseButton: CSSProps = { borderRadius: 8, margin: 2 }
