/**
 * Converts a simple glob pattern (with `*` as a wildcard)
 * into a regular expression with optional flags.
 */
export const globToRegExp = (glob: string, flags?: string): RegExp =>
  new RegExp(
    `^${glob.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*")}$`,
    flags,
  );
