import { Gdk, Gtk } from "ags/gtk4";

const iconTheme = Gtk.IconTheme.get_for_display(Gdk.Display.get_default()!);

export const isIconSupported = (name: string | nullish) =>
  Boolean(name && iconTheme.has_icon(name));

export const supportedIcon = (...names: (string | nullish)[]): string | null =>
  names.find(isIconSupported) ?? null;
