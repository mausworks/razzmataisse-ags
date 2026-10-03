import Bar from "@widget/bar";
import SearchWindow from "@widget/search/SearchWindow";
import app from "ags/gtk4/app";

app.start({
  main: () => {
    const monitors = app.get_monitors();
    monitors.map((monitor) => Bar({ monitor }));

    // A single window, not one per monitor -- `app.toggle_window("search")`
    // (and the SUPER + Space keybind) only makes sense for one uniquely
    // named window.
    SearchWindow({ monitor: monitors[0] });
  },
});
