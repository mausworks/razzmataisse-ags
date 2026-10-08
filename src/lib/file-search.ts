import { execAsync } from "ags/process";

export type SearchOptions = {
  ignoreGlobs?: string[];
  roots: string[];
  hidden?: boolean;
};

export type GlobSearch = SearchOptions & { glob: string };
export type ContentSearch = SearchOptions & { content: string };

/**
 * Runs `rg` once per root, from inside that root: rg anchors `-g` globs
 * containing a `/` (e.g. `!.config/foo/**`) to its working directory.
 */
const searchRoots = (roots: string[], args: string[]) =>
  Promise.all(
    roots.map((root) =>
      execAsync(["env", "-C", root, "rg", ...args, root]).catch(() => ""),
    ),
  ).then((outputs) =>
    outputs.flatMap((lines) => lines.split("\n")).filter(Boolean),
  );

export const fileSearch = ({
  ignoreGlobs = [],
  roots,
  hidden = true,
  ...options
}: GlobSearch | ContentSearch) => {
  const globArgs = ignoreGlobs.flatMap((glob) => ["-g", glob]);
  const flags = [hidden ? "--hidden" : null].filter(Boolean) as string[];

  if ("glob" in options) {
    return searchRoots(roots, [
      ...flags,
      "--files",
      "--iglob",
      options.glob,
      ...globArgs,
    ]);
  } else {
    return searchRoots(roots, [
      ...flags,
      "--files-with-matches",
      "--ignore-case",
      "--max-count=1",
      options.content,
      ...globArgs,
    ]);
  }
};
