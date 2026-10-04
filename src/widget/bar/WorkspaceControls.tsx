import { alpha, defineStyle, transitions } from "@lib/css";
import {
  createWorkspacesActions,
  createWorkspacesModel,
  WORKSPACE_FLAGS,
  WorkspaceId,
  WorkspaceModel,
} from "@state/workspaces";
import theme from "@theme";
import Overlay from "@ui/Overlay";
import defineProgressMeter from "@ui/ProgressMeter";
import Square from "@ui/Square";
import { For } from "ags";
import { Gtk } from "ags/gtk4";

const MAX_WORKSPACES = 10;
const ORB_SIZE = theme.bar.workspaceIndicator.size;
const ORB_SPACING = theme.bar.workspaceIndicator.spacing;
const CONTAINER_WIDTH = ORB_SPACING + (ORB_SIZE + ORB_SPACING) * MAX_WORKSPACES;

export default function Workspaces() {
  const { workspaces, maxId } = createWorkspacesModel();
  const { focus } = createWorkspacesActions();

  return (
    <Overlay
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
          <For each={workspaces} id={(ws) => ws.id}>
            {(ws) => <WorkspaceButton {...ws} onClicked={focus} />}
          </For>
        </box>
      }
    >
      <Track progress={maxId.as((max) => max - 1)} />
    </Overlay>
  );
}

type WorkspaceButtonProps = WorkspaceModel & {
  onClicked?: (id: WorkspaceId) => void;
};

const WorkspaceButton: FC<WorkspaceButtonProps> = ({
  id,
  onClicked,
  flags,
}) => {
  const open = flags.has(WORKSPACE_FLAGS.OPEN).as((on) => on && "open");
  const filler = flags.has(WORKSPACE_FLAGS.FILLER).as((on) => on && "filler");
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
    open: { opacity: 0 },
    filler: { opacity: 0 },
    focused: {
      opacity: 1,
      transition: transitions({
        opacity: "300ms 250ms ease-out",
      }),
    },
  },
});
