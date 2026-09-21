import { describe, expect, it } from "bun:test";

import Lua from "./lua";

describe("Lua.stringify", () => {
  it("serializes a number property", () => {
    expect(Lua.stringify({ workspace: 3 })).toBe("{ workspace = 3 }");
  });

  it("serializes true and false directly", () => {
    expect(Lua.stringify({ a: true, b: false })).toBe(
      "{ a = true, b = false }",
    );
  });

  it("quotes and escapes string values", () => {
    expect(Lua.stringify({ msg: 'He said "hi"\n' })).toBe(
      '{ msg = "He said \\"hi\\"\\n" }',
    );
  });

  it("converts null to nil", () => {
    expect(Lua.stringify({ a: null })).toBe("{ a = nil }");
  });

  it("omits properties set to undefined", () => {
    expect(Lua.stringify({ a: 1, b: undefined })).toBe("{ a = 1 }");
  });

  it("serializes nested objects recursively", () => {
    expect(Lua.stringify({ nested: { a: 1 } })).toBe("{ nested = { a = 1 } }");
  });

  it("serializes arrays as Lua sequences", () => {
    expect(Lua.stringify({ tags: ["x", "y"] })).toBe('{ tags = { "x", "y" } }');
  });

  it("serializes an array of objects", () => {
    expect(Lua.stringify({ items: [{ a: 1 }, { a: 2 }] })).toBe(
      "{ items = { { a = 1 }, { a = 2 } } }",
    );
  });

  it("wraps a non-identifier key in brackets", () => {
    expect(Lua.stringify({ "foo bar": 1 })).toBe('{ ["foo bar"] = 1 }');
  });

  it("wraps a key starting with a digit in brackets", () => {
    expect(Lua.stringify({ "1foo": 1 })).toBe('{ ["1foo"] = 1 }');
  });

  it("wraps a reserved Lua keyword used as a key in brackets", () => {
    expect(Lua.stringify({ end: 1 })).toBe('{ ["end"] = 1 }');
  });

  it("throws for NaN", () => {
    expect(() => Lua.stringify({ a: NaN })).toThrow();
  });

  it("throws for Infinity", () => {
    expect(() => Lua.stringify({ a: Infinity })).toThrow();
  });

  it("throws for a value of an unsupported type", () => {
    const bad = (() => {}) as unknown;
    expect(() => Lua.stringify({ a: bad } as never)).toThrow();
  });
});
