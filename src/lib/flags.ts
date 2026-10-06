/** Combines `flags` into `value` via bitwise OR. */
export const includeFlags = <F extends number>(value: F, flags: F) =>
  (value | flags) as F;

/** Removes every flag in `flags` from `value`. */
export const excludeFlags = <F extends number>(value: F, flags: F) =>
  (value & ~flags) as F;

/** Whether `value` has every flag set in `flags`. */
export const hasFlags = <F extends number>(value: F, flags: F) =>
  (value & flags) === flags;

export const flagNames = <F extends number>(
  value: F,
  flags: Record<string, F>,
) =>
  Object.entries(flags)
    .filter(([, flag]) => flag !== 0 && hasFlags(value, flag))
    .map(([name]) => name);
