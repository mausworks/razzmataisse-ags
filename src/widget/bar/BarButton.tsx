import { alpha, type CXProp, defineStyle } from "@lib/css";
import theme from "@theme";
import type { Accessor, Node } from "ags";
import { Gtk } from "ags/gtk4";

const { palette } = theme.bar;

type PillStyleProps = {
  variant?: CXProp<typeof cx>;
  tooltipText?: string;
  visible?: boolean | Accessor<boolean>;
  children?: Node | Node[];
};

export type BarButtonProps = propsof<typeof Gtk.Button> &
  PillStyleProps & {
    onClicked?: () => void;
  };

export default function BarButton({ variant, ...props }: BarButtonProps) {
  return (
    <button overflow={Gtk.Overflow.HIDDEN} class={cx(variant)} {...props} />
  );
}

type BarMenuButtonProps = propsof<typeof Gtk.MenuButton> & PillStyleProps;

/** Same class and props as `BarButton`, but renders a `menubutton`. */
export function BarMenuButton({ variant, ...props }: BarMenuButtonProps) {
  return (
    <menubutton overflow={Gtk.Overflow.HIDDEN} class={cx(variant)} {...props} />
  );
}

const cx = defineStyle({
  style: {
    "&:not(menubutton), & > button": {
      fontWeight: 500,
      borderRadius: 9999,
      margin: "0 4px",
      minWidth: 24,
      padding: "2px 4px",
      background: "transparent",
      border: "none",
      color: alpha(palette.text, 0.8),
      boxShadow: "0 0 0 0 transparent",
    },
    "&:not(menubutton):hover, & > button:hover": {
      background: alpha(palette.accent, 0.08),
    },
    "&:not(menubutton):active, & > button:active": {
      background: alpha(palette.accent, 0.11),
      color: alpha(palette.text, 0.8),
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
        color: palette.accent,
      },
      "&:not(menubutton):active, &:active": {
        color: palette.accent,
        background: alpha(palette.accent, 0.16),
      },
    },
    active: {
      "&:not(menubutton), & > button": {
        opacity: 1,
        background: alpha(palette.accent, 0.1),
        color: palette.accent,
      },
    },
  },
});
