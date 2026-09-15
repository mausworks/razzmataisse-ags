import type { Accessor, Node } from "ags";
import { defineStyle, type VariantsOf } from "../lib/css";

const cx = defineStyle({
  class: "Pill",
  style: {
    borderRadius: 8,
    margin: 2,
    minWidth: 24,
    padding: "2px 4px",
    opacity: 0.5,
    background: "transparent",
    border: "none",
    "&:hover": { background: "alpha(@theme_fg_color, 0.08)" },
    "&:active": { background: "alpha(@theme_fg_color, 0.16)" },
  },
  variants: {
    focused: { opacity: 1, background: "alpha(@theme_fg_color, 0.15)" },
  },
});

type Variant = VariantsOf<typeof cx>;

type PillProps = {
  variant?: Variant | Accessor<Variant | undefined>;
  tooltipText?: string;
  children?: Node | Node[];
  onClicked?: () => void;
};

export default function Pill({ variant, ...props }: PillProps) {
  return <button class={cx(variant)} {...props} />;
}
