import type { Color } from "./color";
import type { FontWeight } from "./font";
import type { PixelString } from "./units";

/**
 * GTK 4's `-gtk-*` CSS extensions, camelCased without the leading dash
 * (e.g. `-gtk-icon-size` -> `gtkIconSize`) -- see `toKebab` for how the
 * dash is restored when generating CSS. See
 * https://docs.gtk.org/gtk4/css-properties.html for the full reference.
 */
export type GTKCssProperties = Partial<{
  gtkDpi: number;
  gtkSecondaryCaretColor: Color | (string & {});
  gtkIconSource: string;
  gtkIconSize: PixelString | number;
  gtkIconStyle: "requested" | "regular" | "symbolic";
  gtkIconTransform: string;
  gtkIconPalette: string;
  gtkIconShadow: string;
  gtkIconFilter: string;
  gtkIconWeight: FontWeight;
}>;
