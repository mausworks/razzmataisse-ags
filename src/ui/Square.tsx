import { NiceWidgetProps } from "@lib/gtk";
import { Gtk } from "ags/gtk4";

export type SquareProps = Omit<
  NiceWidgetProps<propsof<typeof Gtk.AspectFrame>>,
  "ratio" | "obeyChild"
>;

export default function Square({ ...props }: SquareProps) {
  return <Gtk.AspectFrame {...props} ratio={1} obeyChild={false} />;
}
