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

import type GObject from "gi://GObject";

declare global {
  type falsy = false | 0 | "" | null | undefined;

  type props = { [name: string]: unknown };

  type nullish = null | undefined;

  type FC<P extends props> = (props: P) => GObject.Object;

  /**
   * The full JSX props type accepted by a component -- either a GTK widget
   * class or a regular function component. Pass the component itself via
   * `typeof`, not an instance type (mirrors React's `ComponentProps`):
   *
   * ```ts
   * type ButtonProps = propsof<typeof Gtk.Button>;
   * type PillProps = propsof<typeof Pill>;
   * ```
   *
   * Resolves through `JSX.LibraryManagedAttributes`, the same type gnim's
   * JSX factory itself uses to type-check `<Tag ...>` -- so this always
   * matches what a real JSX usage would accept: `CCProps`'s added
   * `class`/`css`/`on<Signal>` handlers for a widget class, or `FCProps`'s
   * `children`/`$` for a function component.
   */
  type propsof<T> = T extends new (props: props) => GObject.Object
    ? JSX.LibraryManagedAttributes<T, ConstructorParameters<T>[0]>
    : T extends (props: props) => GObject.Object
      ? JSX.LibraryManagedAttributes<T, Parameters<T>[0]>
      : never;
}
