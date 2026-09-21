import { Gtk } from "ags/gtk4";

export type FC<P extends Record<string, unknown>> = (props: P) => Gtk.Widget;
