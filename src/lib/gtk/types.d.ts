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
