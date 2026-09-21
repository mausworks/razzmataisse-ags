import { defineStyle } from "@lib/css";
import {
  createWorkspacesActions,
  createWorkspacesModel,
  WorkspaceId,
  WorkspaceModel,
} from "@state/workspaces";
import theme from "@theme";
import defineBarMeter from "@ui/BarMeter";
import Overlay from "@ui/Overlay";
import Square from "@ui/Square";
import { For } from "ags";
import { Gtk } from "ags/gtk4";

const BarTheme = theme.bar;

const MAX_WORKSPACES = 10;
const ORB_SIZE = BarTheme.workspaceIndicator.orbSize;
const ORB_SPACING = BarTheme.workspaceIndicator.orbSpacing;
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
      <Track opacity={0.1} progress={maxId.as((max) => max - 1)} />
    </Overlay>
  );
}

const Track = defineBarMeter({
  class: "ws-track",
  radius: 9999,
  transition: "100ms linear",
  paddingX: ORB_SPACING,
  background: theme.bar.palette.text,
  segment: {
    count: MAX_WORKSPACES,
    width: ORB_SIZE + ORB_SPACING,
    height: ORB_SIZE + ORB_SPACING,
  },
});

type WorkspaceButtonProps = Partial<WorkspaceModel> & {
  onClicked?: (id: WorkspaceId) => void;
};

const WorkspaceButton: FC<WorkspaceButtonProps> = ({
  id,
  onClicked,
  isFocused,
  isEmpty,
  isFiller,
}) => {
  const variant = [
    isEmpty && "empty",
    isFiller && "filler",
    isFocused && "focused",
  ] as const;

  return (
    <Square
      widthRequest={ORB_SIZE}
      heightRequest={ORB_SIZE}
      halign={Gtk.Align.START}
      valign={Gtk.Align.START}
    >
      <button onClicked={() => id && onClicked?.(id)} class={buttonCX(variant)}>
        <label class={buttonLabelCX(variant)} label={String(id ?? "")} />
      </button>
    </Square>
  );
};

const buttonCX = defineStyle({
  class: "ws-button",
  style: {
    background: "none",
    border: "none",
    padding: 0,
    minWidth: 0,
    minHeight: 0,
    borderRadius: 9999,
  },
  variants: {
    empty: {},
    filler: {},
    focused: {},
  },
});

const buttonLabelCX = defineStyle({
  class: "ws-button-label",
  style: {
    background: "none",
    color: theme.bar.palette.text,
    border: "none",
    fontFeatureSettings: '"tnum"',
    fontSize: "small",
    opacity: 1,
    padding: 0,
    minWidth: 0,
    minHeight: 0,
    transform: "scale(1)",
    transition: "transform 1s linear",
  },
  variants: {
    empty: {
      transform: "scale(0)",
    },
    filler: {
      transform: "scale(0)",
    },
    focused: {
      transform: "scale(1)",
    },
  },
});
