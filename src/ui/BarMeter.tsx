import {
  CSSBackgroundProperties,
  defineStyle,
  StyleBlock,
  subselector,
  VariantDefinition,
} from "@lib/css";
import { translateX } from "@lib/css/transform";
import { Gtk } from "ags/gtk4";
import { Accessor } from "gnim";

import Square from "./Square";

interface BarMeterProps {
  progress: Accessor<number>;
  opacity?: Accessor<number> | number;
}

interface SegmentDefinition {
  count: number;
  width: number;
  height: number;
}

export type BarMeterDefinition = CSSBackgroundProperties & {
  class: string;
  radius?: number;
  paddingX?: number;
  paddingY?: number;
  transition?: string;
  segment: SegmentDefinition;
};

export default function defineBarMeter({
  class: className,
  segment,
  radius = 0,
  transition,
  paddingX = 0,
  paddingY = 0,
  ...barStyle
}: BarMeterDefinition) {
  const maxBarWidth = segment.count * segment.width + paddingX;
  const capSize = segment.height + paddingY * 2;

  const barCX = defineStyle({
    class: className + "_bar",
    style: {
      borderRadius: 0,
      transition: `transform ${transition}`,
    },
    variants: progressVariants(segment, (progress) => {
      const progressWidth = progress * segment.width;
      const offset = paddingX + capSize / 2 + progressWidth - maxBarWidth;

      return translateX(offset);
    }),
  });
  const capCX = defineStyle({
    class: className + "_cap",
    style: {
      borderRadius: radius,
      transition: `transform ${transition}`,
    },
    variants: progressVariants(segment, (progress) => {
      const progressWidth = progress * segment.width;
      const offset = paddingX + progressWidth;

      return translateX(offset);
    }),
  });

  const containerClass = defineStyle({
    class: className,
    style: {
      borderRadius: radius,
      ...subselector(barCX.selector(), barStyle),
      ...subselector(capCX.selector(), barStyle),
    },
  })();

  return function BarMeter({ progress, opacity }: BarMeterProps) {
    const variant = progress.as((at) => `at${at}`);

    return (
      <Gtk.Fixed
        opacity={opacity}
        widthRequest={maxBarWidth}
        heightRequest={capSize}
        halign={Gtk.Align.START}
        valign={Gtk.Align.START}
        hexpand={false}
        vexpand={false}
        class={containerClass}
      >
        <box
          widthRequest={maxBarWidth}
          heightRequest={capSize}
          class={barCX(variant)}
        />
        <Square
          halign={Gtk.Align.START}
          valign={Gtk.Align.START}
          widthRequest={capSize}
          heightRequest={capSize}
          class={capCX(variant)}
        />
      </Gtk.Fixed>
    );
  };
}

/** One `"atN"` variant per workspace slot, each running `transform` through
 * `toTransform` for that slot's pixel offset -- shared by the indicator's
 * cap (plain `translateX`) and middle (`translateX` plus a collapsed
 * `scaleX(0)`), so both pieces move in lockstep. */
const progressVariants = (
  segment: SegmentDefinition,
  transform: (progress: number) => string,
) =>
  Object.fromEntries(
    Array.from({ length: segment.count }, (_, i) => [
      `at${i}`,
      { transform: transform(i) } as StyleBlock,
    ]),
  ) as VariantDefinition;
