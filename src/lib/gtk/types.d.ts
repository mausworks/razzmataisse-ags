// Hand-maintained, unlike colors.d.ts/icons.d.ts/index.d.ts's own re-export
// of them -- scripts/gtk-typegen.ts regenerates this directory's *.d.ts
// files wholesale and has no way to know about content it didn't write
// itself, so anything that belongs here needs to also be re-exported from
// index.ts's own hand-written section (see scripts/gtk-typegen.ts) or it's
// silently lost on the next regeneration.

/**
 * Strips a widget's GObject property names (`snake_case`, e.g.
 * `icon_name`) from its props type, leaving only the camelCase ones JSX
 * actually accepts -- GI's TypeScript bindings expose both forms on the
 * same class, but only camelCase is meant to be written in JSX.
 */
export type NiceWidgetProps<P extends props> = Omit<
  P,
  Lowercase<Extract<keyof P, `${string}_${string}`>>
>;
