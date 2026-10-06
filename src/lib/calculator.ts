import { execAsync } from "ags/process";

/**
 * Evaluates `expression` via `qalc` (libqalculate) and resolves its plain
 * result, or `null` on a parse error (qalc exits non-zero, which
 * `execAsync` turns into a rejection). `-t` strips qalc's normal
 * "input = result" framing down to just the result; `-nocurrencies` skips
 * its startup attempt to fetch exchange rates over the network (otherwise
 * the first calculation of a session can stall, or fail outright offline);
 * `-time` caps how long a single calculation may run, so a pathological
 * expression can't hang the launcher waiting on it.
 */
export const evaluateMathExpression = (
  expression: string,
): Promise<string | null> =>
  execAsync(["qalc", "-t", "-nocurrencies", "-time", "3000", expression])
    .then((output) => output.trim() || null)
    .catch(() => null);
