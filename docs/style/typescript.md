# TypeScript / JavaScript style guide

## Functions

Prefer arrow functions over `function` declarations/expressions, except for
`export default function` or when function syntax is otherwise required
(generators, hoisting, dynamic `this`).

```ts
const add = (a: number, b: number) => a + b

export default function Bar() {
  /* ... */
}
```

Prefer type inference over explicit return type annotations.

```ts
// Prefer
const add = (a: number, b: number) => a + b

// Not
const add = (a: number, b: number): number => a + b
```

When a value's inferred type needs to be pinned down, prefer a type
assertion (`as Foo`) on the value over annotating the function's return type.

```ts
// Prefer
const makeUser = (name: string) => ({ name, id: crypto.randomUUID() }) as User

// Not
const makeUser = (name: string): User => ({ name, id: crypto.randomUUID() })
```

## Control flow

Prefer a `const` record (lookup object) over `switch` or long
`if`/`else if`/`else` chains for mapping one value to another. Declare the
record once, ahead of use.

```ts
const ICONS = {
  wifi: "network-wireless-symbolic",
  wired: "network-wired-symbolic",
  offline: "network-offline-symbolic",
} as const

const icon = ICONS[state]
```

Prefer a ternary over a full function body for simple two-branch cases.

```ts
const label = isConnected ? "Connected" : "Disconnected"
```

Prefer `if`/`else if`/`else` once a function has three or more distinct
return cases — nested ternaries and oversized records get hard to read past
two branches. Use braces for `if`/`else if`/`else` blocks.

```ts
function classify(n: number) {
  if (n < 0) {
    return "negative"
  } else if (n === 0) {
    return "zero"
  } else if (n < 10) {
    return "small"
  } else {
    return "large"
  }
}
```

A brace-less, one-line `if` is only allowed for early returns (guard
clauses, null checks, etc.).

```ts
if (!user) return null
```

## Naming

Standard JS casing (camelCase for variables/functions, PascalCase for
types/classes). Initialisms are upper-cased -- each letter stands for a
separate word (`URL`, `HTTP`, `API`).

```ts
function parseURL(url: string) {
  /* ... */
}

const res = await httpGET(url)
```

Clippings (a single word truncated, not multiple words compressed) are not
initialisms and stay lower-case, e.g. `id` (short for "identifier").

```ts
const userId = getUserId()
const { id } = user
```

Avoid one-character variable names, including short-lived callback/closure
parameters. Prefer a short but descriptive name instead.

```ts
// Prefer
const sorted = items.sort((left, right) => left.id - right.id)

// Not
const sorted = items.sort((a, b) => a.id - b.id)
```

## JSDoc

Multi-line JSDoc starts with `/**` on its own line, followed by a line break
before the description. A single-line JSDoc stays on one line.

```ts
/**
 * Formats a duration in milliseconds as `mm:ss`.
 */

/** Short one-liner. */
```

Examples go in an `@example` tag, followed by a fenced code block.

```ts
/**
 * Formats a duration in milliseconds as `mm:ss`.
 *
 * @example
 * ```ts
 * formatDuration(65_000) // "01:05"
 * ```
 */
```
