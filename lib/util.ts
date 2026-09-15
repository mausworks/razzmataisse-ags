export const isPlainObject = (
  value: unknown,
): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

// TS2775: an arrow-const assertion signature needs an explicit type
// annotation on the binding; a function declaration doesn't.
export function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}
