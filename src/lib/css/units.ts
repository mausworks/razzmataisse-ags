/** Number of pixels, with units. */
export type PixelString =
  | ({} & `${number}px`)
  | "0px"
  | "1px"
  | "2px"
  | "4px"
  | "8px"
  | "16px"
  | "24px";

/** Expresses a length in pixels, with or without units. */
export type PixelValue =
  ({} & number) | 0 | 1 | 2 | 4 | 8 | 16 | 24 | PixelString;

/** Up to four pixel units. */
export type PixelValues =
  | (
      | ({} & `${number}px ${number}px`)
      | ({} & `${number}px ${number}px ${number}px`)
      | ({} & `${number}px ${number}px ${number}px ${number}px`)
    )
  | "12px 24px"
  | "0px 24px"
  | "24px 0px"
  | "0px 24px 12px"
  | "0px 0px 12px 12px";

/** A unitless fraction. */
export type Fraction = ({} & number) | 0 | 0.25 | 0.5 | 0.75 | 1;

/** An integer between 0-255. */
export type Byte = ({} & number) | 0 | 16 | 32 | 64 | 128 | 255;

/** A percentage value. */
export type PercentageString =
  ({} & `${number}%`) | "0%" | "25%" | "50%" | "75%" | "100%";

/** A fraction or percentage value, e.g. `0.5` or `"50%"`. */
export type Fractional = Fraction | PercentageString;

/** A duration in seconds. */
export type SecondsString =
  | ({} & `${number}s`)
  | "0s"
  | "0.1s"
  | "0.3s"
  | "0.5s"
  | "1s"
  | "2s"
  | "3s"
  | "5s";

/** A duration in milliseconds. */
export type MillisecondsString =
  | ({} & `${number}ms`)
  | "50ms"
  | "100ms"
  | "150ms"
  | "200ms"
  | "300ms"
  | "500ms";

/** A duration in seconds or milliseconds. */
export type DurationString = SecondsString | MillisecondsString;

/** A degree value e.g. `"180deg"` (= `"0.5turn"`). */
export type DegreesString =
  | ({} & `${number}deg`)
  | "0deg"
  | "45deg"
  | "90deg"
  | "180deg"
  | "270deg"
  | "360deg";

/** Number of full turns, e.g. `"0.5turn"` (= `"180deg"`). */
export type TurnsString =
  | ({} & `${number}turn`)
  | "0turn"
  | "0.25turn"
  | "0.5turn"
  | "0.75turn"
  | "1turn";

/** A radian value e.g. `"3.14152rad"` (= `"180deg"`). */
export type RadiansString = `${number}rad`;

/** A gradian value e.g. `"200grad"` (= `"180deg"`). */
export type GradiansString = `${number}grad`;

/**
 * An angle expressed as a {@link DegreesString},
 * {@link RadiansString}, {@link GradiansString} or {@link TurnsString}.
 */
export type AngleString =
  DegreesString | RadiansString | GradiansString | TurnsString;

/**
 * Formats a number as a {@link PixelString},
 * or passes {@link PixelString} through unchanged.
 *
 * @example
 * ```ts
 * px(8) // "8px"
 * px("12px") // "12px"
 * ```
 */
export const px = (value: PixelValue): PixelString =>
  typeof value === "number" ? `${value}px` : value;

/**
 * Formats a {@link Fraction} as a {@link PercentageString},
 * or passes a {@link PercentageString} through unchanged.
 *
 * @param value A fraction or percentage value, e.g. `0.5` or `"50%"`.
 * @example
 * ```ts
 * percent(0.5) // "50%"
 * percent("25%") // "25%"
 * ```
 */
export const percent = (value: Fractional): PercentageString =>
  typeof value === "number" ? `${value * 100}%` : value;

/**
 * Formats a number as a {@link DegreesString},
 * or passes a {@link DegreesString} through unchanged.
 *
 * @example
 * ```ts
 * deg(90) // "90deg"
 * deg("90deg") // "90deg"
 * ```
 */
export const deg = (value: number | DegreesString): DegreesString =>
  typeof value === "number" ? `${value}deg` : value;

/**
 * Formats a number as a {@link TurnsString},
 * or passes a {@link TurnsString} through unchanged.
 *
 * @example
 * ```ts
 * turns(0.5) // "0.5turn"
 * turns("1turn") // "1turn"
 * ```
 */
export const turns = (value: number | TurnsString): TurnsString =>
  typeof value === "number" ? `${value}turn` : value;

/**
 * Formats a number as a {@link RadiansString},
 * or passes a {@link RadiansString} through unchanged.
 *
 * @example
 * ```ts
 * rad(Math.PI) // "3.141592653589793rad"
 * rad("1.57079rad") // "1.57079rad"
 * ```
 */
export const rad = (value: number | RadiansString): RadiansString =>
  typeof value === "number" ? `${value}rad` : value;

/**
 * Formats a number as a {@link GradiansString},
 * or passes a {@link GradiansString} through unchanged.
 *
 * @example
 * ```ts
 * grad(200) // "200grad"
 * grad("400grad") // "400grad"
 * ```
 */
export const grad = (value: number | GradiansString): GradiansString =>
  typeof value === "number" ? `${value}grad` : value;

/**
 * Formats a number as {@link SecondsString},
 * converts a {@link MillisecondsString} to a {@link SecondsString},
 * or passes {@link SecondsString} through unchanged.
 *
 * @example
 * ```ts
 * s(0.3) // "0.3s"
 * s("1000ms") // "1s"
 * s("5s") // "5s"
 * ```
 */
export const s = (value: number | DurationString): SecondsString => {
  if (typeof value === "number") {
    return `${value}s`;
  } else if (value.endsWith("ms")) {
    return s(parseFloat(value) / 1000);
  } else {
    return value as SecondsString;
  }
};

/**
 * Formats a number as a {@link MillisecondsString},
 * converts a {@link SecondsString} to a {@link MillisecondsString},
 * or passes a {@link MillisecondsString} through unchanged.
 *
 * @example
 * ```ts
 * ms(300) // "300ms"
 * ms("1s") // "1000ms"
 * ms("500ms") // "500ms"
 * ```
 */
export const ms = (value: number | DurationString): MillisecondsString => {
  if (typeof value === "number") {
    return `${value}ms`;
  } else if (!value.endsWith("ms")) {
    return ms(parseFloat(value) * 1000);
  } else {
    return value as MillisecondsString;
  }
};
