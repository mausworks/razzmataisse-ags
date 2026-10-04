import app from "ags/gtk4/app";

import Pill from "./Pill";

export type LauncherButtonProps = {
  visible?: boolean;
};

/** Toggles the `LauncherWindow` (same as the `SUPER + Space` keybind). */
export default function LauncherButton({
  visible = true,
}: LauncherButtonProps) {
  return (
    <Pill
      variant="icon"
      visible={visible}
      onClicked={() => app.toggle_window("launcher")}
    >
      <image iconName="go-next-symbolic" />
    </Pill>
  );
}
