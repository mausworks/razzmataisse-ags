import { Accessor, createEffect, createState } from "gnim";

import { excludeFlags, hasFlags, includeFlags } from "./flags";

export type Mutable<T> = ReturnType<typeof createMutable<T>>;
export type MutableFlags<T extends number> = ReturnType<
  typeof createMutableFlags<T>
>;

export const createMutable = <T>(initial: T) => {
  const [get, set] = createState(initial);

  return Object.assign(get, { set });
};

export const createMutableFlags = <T extends number>(initial: T) => {
  const [get, set] = createState(initial);

  return Object.assign(get, {
    set,
    has: (flags: T) => get.as((value) => hasFlags(value, flags)),
    include: (flags: T) => set((current) => includeFlags(current, flags)),
    exclude: (flags: T) => set((current) => excludeFlags(current, flags)),
    toggle: (flags: T, on: boolean) =>
      set((current) =>
        on ? includeFlags(current, flags) : excludeFlags(current, flags),
      ),
  });
};

export const createPrevious = <T>(get: Accessor<T>, initial: T) => {
  const previous = createMutable<T>(initial);

  createEffect(() => previous.set(get()));

  return previous;
};
