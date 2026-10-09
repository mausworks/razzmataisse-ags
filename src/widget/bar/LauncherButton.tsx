import app from "ags/gtk4/app";

import BarButton from "./BarButton";

export type LauncherButtonProps = {
  visible?: boolean;
};

/** Toggles the `LauncherWindow` (same as the `SUPER + Space` keybind). */
export default function LauncherButton({
  visible = true,
}: LauncherButtonProps) {
  return (
    <BarButton
      variant="icon"
      visible={visible}
      onClicked={() => app.toggle_window("launcher")}
    >
      <image iconName="search-symbolic" />
    </BarButton>
  );
}
