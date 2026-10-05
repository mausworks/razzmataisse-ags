import config from "@config";
import { alpha, defineStyle, transitions } from "@lib/css";
import {
  createWorkspacesModel,
  WORKSPACE_FLAGS,
  WorkspaceId,
  WorkspaceModel,
} from "@state/workspaces";
import theme from "@theme";
import Overlay from "@ui/Overlay";
import defineProgressMeter from "@ui/ProgressMeter";
import Square from "@ui/Square";
import { createComputed, For } from "ags";
import { Gtk } from "ags/gtk4";

const ORB_SIZE = theme.bar.workspaceIndicator.size;
const ORB_SPACING = theme.bar.workspaceIndicator.spacing;

// `Track`'s segment count bakes into a generated CSS class at module-eval
// time (see `defineProgressMeter`/`defineStyle` -- "exactly once, at
// module scope"), so it can't be sized from a prop the way the rest of
// this component's config-driven defaults are. Read directly from config
// here instead, same as `theme.bar.workspaceIndicator` above -- it's the
// same value `max` below defaults to, just needed earlier than render.
const MAX_WORKSPACES = config.bar.workspaces.max;
const CONTAINER_WIDTH = ORB_SPACING + (ORB_SIZE + ORB_SPACING) * MAX_WORKSPACES;

export type WorkspaceControlsProps = {
  visible?: boolean;
  max?: number;
  backfill?: boolean;
};

export default function Workspaces({
  visible = true,
  max = MAX_WORKSPACES,
  backfill = true,
}: WorkspaceControlsProps) {
  const { workspaces, maxId, openIds, focus } = createWorkspacesModel();

  // The model always tracks the full 1-10 range -- `max` only limits how
  // many of those slots this component actually renders.
  const visibleWorkspaces = workspaces.as((list) => list.slice(0, max));
  const progress = createComputed(() =>
    !backfill ? openIds().length - 1 : Math.min(maxId(), max) - 1,
  );

  return (
    <Overlay
      visible={visible}
      widthRequest={CONTAINER_WIDTH}
      valign={Gtk.Align.CENTER}
      halign={Gtk.Align.START}
      above={
        <box
          spacing={ORB_SPACING}
          marginStart={ORB_SPACING}
          marginEnd={ORB_SPACING}
          widthRequest={CONTAINER_WIDTH}
          valign={Gtk.Align.CENTER}
          halign={Gtk.Align.START}
        >
          <For each={visibleWorkspaces} id={(ws) => ws.id}>
            {(ws) => (
              <WorkspaceButton {...ws} backfill={backfill} onClicked={focus} />
            )}
          </For>
        </box>
      }
    >
      <Track progress={progress} />
    </Overlay>
  );
}

type WorkspaceButtonProps = WorkspaceModel & {
  backfill: boolean;
  onClicked?: (id: WorkspaceId) => void;
};

const WorkspaceButton: FC<WorkspaceButtonProps> = ({
  id,
  onClicked,
  flags,
  backfill,
}) => {
  const open = flags.has(WORKSPACE_FLAGS.OPEN).as((on) => on && "open");
  const filler = flags
    .has(WORKSPACE_FLAGS.FILLER)
    .as((on) => backfill && on && "filler");
  const focused = flags
    .has(WORKSPACE_FLAGS.FOCUSED)
    .as((on) => on && "focused");

  return (
    <Square
      widthRequest={ORB_SIZE}
      heightRequest={ORB_SIZE}
      halign={Gtk.Align.START}
      valign={Gtk.Align.START}
    >
      <button
        widthRequest={ORB_SIZE}
        heightRequest={ORB_SIZE}
        class={buttonClass(open, filler, focused)}
        onClicked={() => onClicked?.(id)}
      >
        <label
          yalign={0.5}
          xalign={0.5}
          class={buttonLabelClass(open, filler, focused)}
          label={String(id)}
        />
      </button>
    </Square>
  );
};

const Track = defineProgressMeter({
  radius: 9999,
  transition: {
    grow: "300ms ease",
    shrink: "300ms 100ms ease",
  },
  paddingX: ORB_SPACING,
  background: alpha(theme.bar.palette.text, 0.08),
  segment: {
    count: MAX_WORKSPACES,
    width: ORB_SIZE + ORB_SPACING,
    height: ORB_SIZE + ORB_SPACING,
  },
});

const buttonClass = defineStyle({
  style: {
    background: "none",
    border: "none",
    padding: 0,
    minWidth: ORB_SIZE,
    minHeight: ORB_SIZE,
    borderRadius: 9999,
    boxShadow: "none",
  },
  variants: {
    open: {},
    filler: {},
    focused: {},
  },
});

const buttonLabelClass = defineStyle({
  style: {
    background: "none",
    color: alpha(theme.bar.palette.text, 0.5),
    border: "none",
    fontFeatureSettings: '"tnum"',
    fontSize: 12,
    fontWeight: "bold",
    fontFamily: "monospace",
    padding: 0,
    opacity: 0,
    transformOrigin: "center center",
    transition: transitions({
      opacity: "300ms ease-out",
    }),
  },
  variants: {
    open: { opacity: 1, color: alpha(theme.bar.palette.text, 0.1) },
    filler: { opacity: 1, color: alpha(theme.bar.palette.text, 0.1) },
    focused: {
      opacity: 1,
      color: alpha(theme.bar.palette.text, 0.5),
      transition: transitions({
        opacity: "300ms 250ms ease-out",
      }),
    },
  },
});
