import type { Accessor, Node } from "ags";
import { defineStyle, type VariantsOf } from "../lib/css";

const cx = defineStyle({
  class: "Pill",
  style: {
    borderRadius: 9999,
    margin: 2,
    minWidth: 24,
    padding: "2px 4px",
    opacity: 0.5,
    background: "transparent",
    border: "none",
    "&:hover": { background: "alpha(@theme_fg_color, 0.08)" },
    "&:active": { background: "alpha(@theme_fg_color, 0.16)" },
    // A `menubutton`'s actual clickable surface is an internal `button`
    // node (GTK's node tree is `menubutton > button.toggle`), which paints
    // its own theme chrome independently of this class -- mirror the same
    // look there so `MenuPill` matches `Pill`.
    "& button": {
      margin: 0,
      padding: 0,
      minWidth: 0,
      borderRadius: 9999,
      background: "transparent",
      border: "none",
      "&:hover": { background: "alpha(@theme_fg_color, 0.08)" },
      "&:active": { background: "alpha(@theme_fg_color, 0.16)" },
    },
  },
  variants: {
    focused: { opacity: 1, background: "alpha(@theme_fg_color, 0.15)" },
    // For persistent status readouts (clock, network/bluetooth/volume)
    // rather than discrete actions -- always fully legible, with a
    // text-shaped hover/active affordance (a color shift, no filled
    // circle) instead of the background pill used for icon/action pills.
    text: {
      opacity: 1,
      borderRadius: 6,
      background: "transparent",
      "&:hover": { color: "@accent_color" },
      "&:active": {
        color: "@accent_color",
        background: "alpha(@accent_color, 0.12)",
      },
      "& button": {
        margin: 0,
        padding: 0,
        minWidth: 0,
        borderRadius: 6,
        background: "transparent",
        "&:hover": { color: "@accent_color", background: "transparent" },
        "&:active": {
          color: "@accent_color",
          background: "alpha(@accent_color, 0.12)",
        },
      },
    },
  },
});

type Variant = VariantsOf<typeof cx>;

type PillStyleProps = {
  variant?: Variant | Accessor<Variant | undefined>;
  tooltipText?: string;
  children?: Node | Node[];
};

type PillProps = PillStyleProps & {
  onClicked?: () => void;
};

export default function Pill({ variant, ...props }: PillProps) {
  return <button class={cx(variant)} {...props} />;
}

/**
 * Same class and props as `Pill`, but renders a `menubutton`. Defaults to
 * the `text` variant, since menu buttons in this bar are persistent status
 * readouts rather than discrete actions.
 */
export function MenuPill({ variant = "text", ...props }: PillStyleProps) {
  return <menubutton class={cx(variant)} {...props} />;
}
