import { alpha, type CXProp, defineStyle } from "@lib/css";
import type { Node } from "ags";
import { Gtk } from "ags/gtk4";

type PillStyleProps = {
  variant?: CXProp<typeof cx>;
  tooltipText?: string;
  children?: Node | Node[];
};

type PillProps = PillStyleProps & {
  onClicked?: () => void;
};

export default function Pill({ variant, ...props }: PillProps) {
  return (
    <button overflow={Gtk.Overflow.HIDDEN} class={cx(variant)} {...props} />
  );
}

/** Same class and props as `Pill`, but renders a `menubutton`. */
export function MenuPill({ variant, ...props }: PillStyleProps) {
  return (
    <menubutton overflow={Gtk.Overflow.HIDDEN} class={cx(variant)} {...props} />
  );
}

const cx = defineStyle({
  style: {
    "&:not(menubutton), & > button": {
      fontWeight: "bold",
      borderRadius: 9999,
      margin: "0 4px",
      minWidth: 24,
      padding: "2px 4px",
      background: "transparent",
      border: "none",
      color: alpha("@theme_fg_color", 0.8),
      boxShadow: "0 0 0 0 transparent",
    },
    "&:not(menubutton):hover, & > button:hover": {
      background: alpha("@accent_color", 0.08),
    },
    "&:not(menubutton):active, & > button:active": {
      background: alpha("@accent_color", 0.16),
    },
  },
  variants: {
    text: {
      "&:not(menubutton), & > button": {
        fontWeight: "normal",
      },
    },
    icon: {
      "&:not(menubutton), & > button": {
        background: "transparent",
        fontWeight: "normal",
        padding: 4,
      },
      "&:not(menubutton):hover, &:hover": {
        color: "@accent_color",
      },
      "&:not(menubutton):active, &:active": {
        color: "@accent_color",
        background: "alpha(@accent_color, 0.5)",
      },
    },
    active: {
      "&:not(menubutton), & > button": {
        opacity: 1,
        background: alpha("@theme_fg_color", 0.1),
      },
    },
  },
});
