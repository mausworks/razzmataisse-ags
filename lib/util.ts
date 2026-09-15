export const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const hasKey = <T extends object>(obj: T, key: PropertyKey): key is keyof T =>
  key in obj;