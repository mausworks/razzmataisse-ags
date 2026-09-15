import { assert } from "./util";

/** Values that can be serialized into Lua. */
export type LuaValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | LuaValue[]
  | { [key: string]: LuaValue };

const LUA_KEYWORDS = new Set([
  "and",
  "break",
  "do",
  "else",
  "elseif",
  "end",
  "false",
  "for",
  "function",
  "goto",
  "if",
  "in",
  "local",
  "nil",
  "not",
  "or",
  "repeat",
  "return",
  "then",
  "true",
  "until",
  "while",
]);

const isBareKey = (key: string) =>
  /^[A-Za-z_][A-Za-z0-9_]*$/.test(key) && !LUA_KEYWORDS.has(key);

const quoteString = (value: string) =>
  `"${value
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    .replace(/\t/g, "\\t")}"`;

const stringifyKey = (key: string) =>
  isBareKey(key) ? key : `[${quoteString(key)}]`;

/**
 * Stringifies a value to a Lua serializable string
 * Similar to how `JSON.stringify` serializes to JSON.
 *
 * @throws If a value the type system let through still can't be
 * represented in Lua (a non-finite number, reached via `any`/`as`).
 *
 * @example
 * ```ts
 * Lua.stringify({ workspace: 3 }) // '{ workspace = 3 }'
 * Lua.stringify({ name: "a b", tags: ["x", "y"] })
 * // '{ name = "a b", tags = { "x", "y" } }'
 * ```
 */
const stringify = (value: LuaValue): string => {
  if (value === null || value === undefined) {
    return "nil";
  } else if (typeof value === "string") {
    return quoteString(value);
  } else if (typeof value === "boolean") {
    return String(value);
  } else if (typeof value === "number") {
    assert(
      Number.isFinite(value),
      `Lua: cannot stringify non-finite value '${value}'.`,
    );

    return String(value);
  } else if (Array.isArray(value)) {
    return `{ ${value.map(stringify).join(", ")} }`;
  } else if (typeof value === "object") {
    const entries = Object.entries(value)
      .filter(([, child]) => child !== undefined)
      .map(([key, child]) => `${stringifyKey(key)} = ${stringify(child)}`);

    return `{ ${entries.join(", ")} }`;
  } else {
    throw new TypeError(
      `Lua: cannot stringify value of type '${typeof value}'.`,
    );
  }
};

const Lua = { stringify };

export default Lua;
