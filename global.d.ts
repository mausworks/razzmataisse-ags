// bun-types/test.d.ts declares "bun:test" fully self-contained (its
// JestMock type is defined right there, not in globals.d.ts/bun.d.ts) --
// reference it directly instead of adding "bun" to tsconfig types, which
// would pull in all of @types/node's globals too. That's exactly the
// footgun that caused the `assert`-from-"assert" bug earlier: Node/Bun
// builtins type-checking fine in code that's actually bundled for GJS,
// then failing at bundle time. There's no `import`-style equivalent for
// pulling in an ambient module declaration by file path, so this is the
// correct tool here despite the lint rule's general advice.
// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="node_modules/bun-types/test.d.ts" />
