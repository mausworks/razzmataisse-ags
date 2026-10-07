export type StringCandidate = string | null | undefined;

export const shortest = (
  ...candidates: [StringCandidate, ...StringCandidate[]]
) =>
  candidates.reduce((a, b) =>
    a && a.length !== 0 && a.length <= (b?.length ?? Infinity) ? a : b,
  );
