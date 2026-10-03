import app from "ags/gtk4/app";

import Pill from "./Pill";

/** Toggles the `SearchWindow` (same as the `SUPER + Space` keybind). */
export default function SearchButton() {
  return (
    <Pill variant="icon" onClicked={() => app.toggle_window("search")}>
      <image iconName="system-search-symbolic" />
    </Pill>
  );
}
