import { alpha, defineStyle } from "@lib/css";
import theme from "@theme";
import { Gtk } from "ags/gtk4";

import type { BarButtonProps } from "./BarButton";
import BarButton from "./BarButton";

const { palette } = theme.bar;

export type BarPopoverProps = Omit<propsof<typeof Gtk.Popover>, "class">;

/**
 * A `popover`, styled as a solid-black panel matching the bar itself,
 * instead of the system theme's default light popover chrome. Drawn with no
 * arrow -- `hasArrow={false}` just removes the `arrow` CSS node outright,
 * rather than trying to hide it with CSS. `set_offset` isn't a settable
 * property (no CSS equivalent either), so the gap from the bar has to be
 * applied imperatively via `$`.
 */
export default function BarPopover({ $, children, ...props }: BarPopoverProps) {
  return (
    <popover
      hasArrow={false}
      widthRequest={240}
      {...props}
      class={popoverClass}
      $={(self) => {
        self.set_offset(0, 8);
        $?.(self);
      }}
    >
      <box orientation={Gtk.Orientation.VERTICAL}>{children}</box>
    </popover>
  );
}

const popoverClass = defineStyle({
  class: "BarPopover",
  style: {
    background: "transparent",
    boxShadow: "none",
    "& > contents": {
      background: palette.activeBackground,
      color: palette.text,
      padding: 0,
      margin: 0,
      borderRadius: 12,
      border: `1px solid ${alpha(palette.text, 0.1)}`,
    },
  },
})();

export type BarPopoverHeaderProps = Omit<propsof<typeof Gtk.Box>, "class">;

export function BarPopoverHeader({ ...props }: BarPopoverHeaderProps) {
  return (
    <box
      orientation={Gtk.Orientation.HORIZONTAL}
      spacing={8}
      {...props}
      class={popoverHeaderClass}
    />
  );
}

const popoverHeaderClass = defineStyle({
  class: "BarPopoverHeader",
  style: {
    color: alpha(palette.text, 0.6),
    fontWeight: 500,
    padding: "8px 8px 8px 12px",
    marginBottom: 8,
    borderBottom: `1px solid ${alpha(palette.text, 0.1)}`,
  },
})();

export type BarPopoverListProps = Omit<propsof<typeof Gtk.Box>, "class">;

export function BarPopoverList(props: BarPopoverListProps) {
  return (
    <box
      class={popoverListClass}
      orientation={Gtk.Orientation.VERTICAL}
      spacing={4}
      {...props}
    />
  );
}

const popoverListClass = defineStyle({
  class: "BarPopoverList",
  style: {
    padding: "0px 2px 4px 2px",
  },
})();

export function BarPopoverListItem({ children, ...props }: BarButtonProps) {
  return (
    <BarButton {...props}>
      <box
        spacing={8}
        class={popoverListItemClass}
        orientation={Gtk.Orientation.HORIZONTAL}
      >
        {children}
      </box>
    </BarButton>
  );
}

const popoverListItemClass = defineStyle({
  class: "BarPopoverListItem",
  style: {
    padding: "6px 8px",
  },
})();
