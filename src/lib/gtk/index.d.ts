export type { ThemeColor } from "./colors";
export type { IconName } from "./icons";

export type NiceWidgetProps<P extends props> = Omit<
  P,
  Lowercase<Extract<keyof P, `${string}_${string}`>>
>;
