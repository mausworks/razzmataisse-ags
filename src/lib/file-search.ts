import { execAsync } from "ags/process";

export type SearchOptions = {
  ignoreGlobs?: string[];
  roots: string[];
  hidden?: boolean;
};

export type GlobSearch = SearchOptions & { glob: string };
export type ContentSearch = SearchOptions & { content: string };

export const fileSearch = async ({
  ignoreGlobs = [],
  roots,
  hidden = true,
  ...options
}: GlobSearch | ContentSearch) => {
  const globArgs = ignoreGlobs.flatMap((glob) => ["-g", glob]);
  const flags = [hidden ? "--hidden" : null].filter(Boolean) as string[];

  if ("glob" in options) {
    return execAsync([
      "rg",
      ...flags,
      "--files",
      "--iglob",
      options.glob,
      ...globArgs,
      ...roots,
    ])
      .catch(() => "")
      .then((lines) => lines.split("\n").filter(Boolean));
  } else {
    return execAsync([
      "rg",
      ...flags,
      "--files-with-matches",
      "--ignore-case",
      "--max-count=1",
      options.content,
      ...globArgs,
      ...roots,
    ])
      .catch(() => "")
      .then((lines) => lines.split("\n").filter(Boolean));
  }
};
