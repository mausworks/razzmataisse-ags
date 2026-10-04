import {
  BackgroundProperties,
  defineStyle,
  StyleBlock,
  transitions,
  TransitionTiming,
  translateX,
  VariantDefinition,
} from "@lib/css";
import { createPrevious } from "@lib/state";
import { Gtk } from "ags/gtk4";
import { Accessor, createComputed } from "gnim";

interface ProgressMeterProps {
  progress: Accessor<number>;
  opacity?: Accessor<number> | number;
}

interface SegmentDefinition {
  count: number;
  width: number;
  height: number;
}

export type ProgressMeterDefinition = BackgroundProperties & {
  class?: string;
  radius?: number;
  paddingX?: number;
  paddingY?: number;
  transition?: { grow: TransitionTiming; shrink: TransitionTiming };
  segment: SegmentDefinition;
};

export default function defineProgressMeter({
  class: className,
  segment,
  radius = 0,
  transition = { grow: "100ms", shrink: "100ms" },
  paddingX = 0,
  paddingY = 0,
  ...barStyle
}: ProgressMeterDefinition) {
  const maxWidth = segment.count * segment.width + paddingX;
  const capSize = segment.height + paddingY * 2;
  const shrinkTransition = transitions({ transform: transition.shrink });
  const growTransition = transitions({ transform: transition.grow });

  const containerClass = defineStyle({
    class: className,
    style: {
      borderRadius: radius,
    },
  });
  const barClass = defineStyle({
    class: className + "_bar",
    style: {
      ...barStyle,
      borderRadius: radius,
      "&.grow": { transition: growTransition },
      "&.shrink": { transition: shrinkTransition },
    },
    variants: progressVariants(segment, (progress) => {
      const progressWidth = (progress + 1) * segment.width;
      const offset = paddingX + progressWidth - maxWidth;

      return translateX(offset);
    }),
  });

  return function ProgressMeter({ progress, opacity }: ProgressMeterProps) {
    const previous = createPrevious(progress, -1);
    const at = progress.as((at) => `at${at}`);
    const dir = createComputed<"shrink" | "grow" | null>(() => {
      const next = progress();
      const prev = previous.peek();

      return next > prev ? "grow" : next < prev ? "shrink" : null;
    });

    return (
      <Gtk.Fixed
        opacity={opacity}
        widthRequest={maxWidth}
        heightRequest={capSize}
        halign={Gtk.Align.START}
        valign={Gtk.Align.START}
        hexpand={false}
        vexpand={false}
        class={containerClass()}
      >
        <box
          widthRequest={maxWidth}
          heightRequest={capSize}
          class={barClass(dir, at)}
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
