import { type CXProp, defineStyle } from "@lib/css";
import { alpha } from "@lib/css/color";
import type { Node } from "ags";

const cx = defineStyle({
  class: "Pill",
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

type PillStyleProps = {
  variant?: CXProp<typeof cx>;
  tooltipText?: string;
  children?: Node | Node[];
};

type PillProps = PillStyleProps & {
  onClicked?: () => void;
};

export default function Pill({ variant, ...props }: PillProps) {
  return <button class={cx(variant)} {...props} />;
}

/** Same class and props as `Pill`, but renders a `menubutton`. */
export function MenuPill({ variant, ...props }: PillStyleProps) {
  return <menubutton class={cx(variant)} {...props} />;
}
