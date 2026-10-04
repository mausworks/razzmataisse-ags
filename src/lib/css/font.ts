import type { PercentageString, PixelValue } from "./units";

/** The keywords or numeric weight accepted by `font-weight`. */
export type FontWeight = "normal" | "bold" | "lighter" | "bolder" | number;

export type FontFeatureSettingName = "liga" | "tnum" | "scmp" | "swsh";

export type FontFeatureSettingValue = "on" | "off" | `${number}`;

export type FontFeatureSetting =
  | `"${FontFeatureSettingName}"`
  | `"${FontFeatureSettingName}" ${FontFeatureSettingValue}`;

export type FontProperties = Partial<{
  fontFamily: string;
  /** Also accepts the absolute/relative size keywords, e.g. `"small"`. */
  fontSize:
    | PixelValue
    | PercentageString
    | "xx-small"
    | "x-small"
    | "small"
    | "medium"
    | "large"
    | "x-large"
    | "xx-large"
    | "smaller"
    | "larger";
  fontStyle: "italic" | "oblique" | "normal";
  fontVariant: string;
  fontWeight: FontWeight;
  fontWidth: PixelValue;
  fontStretch: PixelValue;
  fontKerning: "auto" | "normal" | "none";
  fontVariantLigatures: string;
  fontVariantPosition: "normal" | "sub" | "super";
  fontVariantCaps: string;
  fontVariantNumeric: string;
  fontVariantAlternates: string;
  fontVariantEastAsian: string;
  fontFeatureSettings: FontFeatureSetting;
  fontVariationSettings: string;
  font: string;
}>;
