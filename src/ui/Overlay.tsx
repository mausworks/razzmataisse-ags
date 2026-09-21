import GObject from "ags/gobject";
import { Gtk } from "ags/gtk4";

export type OverlayProps = propsof<typeof Gtk.Overlay> & {
  above?: GObject.Object;
};

export default function Overlay({ above, $, ...props }: OverlayProps) {
  return (
    <Gtk.Overlay
      {...props}
      $={(self) => {
        if (above) self.add_overlay(above as Gtk.Widget);
        $?.(self);
      }}
    />
  );
}
