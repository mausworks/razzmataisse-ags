import { subprocess } from "ags/process";

/**
 * Pipes `expression` through `bc -l` and resolves its output, or `null` if
 * `bc` produced nothing usable (a parse error, divide-by-zero, etc. go to
 * stderr, not stdout). `bc` is interactive -- it keeps reading from stdin
 * until told to stop -- so the expression is followed by `quit` rather
 * than closing stdin, which `Process` has no way to do from here anyway.
 *
 * The two `write()` calls must be chained, not fired together: `bc`'s
 * stdin is a single `GDataOutputStream`, and a second `write_bytes_async`
 * issued before the first's callback has fired rejects outright instead
 * of queuing.
 */
export const evaluateMathExpression = (
  expression: string,
): Promise<string | null> =>
  new Promise((resolve) => {
    let output = "";
    let failed = false;

    const proc = subprocess(
      ["bc", "-l", "-q"],
      (stdout) => {
        output += (output ? "\n" : "") + stdout;
      },
      () => {
        failed = true;
      },
    );

    proc.connect("exit", () => {
      resolve(!failed && output.trim() ? output.trim() : null);
    });

    proc
      .write(`${expression}\n`)
      .then(() => proc.write("quit\n"))
      .catch(() => resolve(null));
  });
