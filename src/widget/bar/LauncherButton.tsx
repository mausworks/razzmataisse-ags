import app from "ags/gtk4/app";

import Pill from "./Pill";

/** Toggles the `LauncherWindow` (same as the `SUPER + Space` keybind). */
export default function LauncherButton() {
  return (
    <Pill variant="icon" onClicked={() => app.toggle_window("launcher")}>
      <image iconName="go-next-symbolic" />
    </Pill>
  );
}
