import Bar from "@widget/bar";
import Launcher from "@widget/launcher/Launcher";
import NotificationWindow from "@widget/notifications/NotificationWindow";
import app from "ags/gtk4/app";

app.start({
  main: () => {
    const monitors = app.get_monitors();
    monitors.map((monitor) => Bar({ monitor }));

    Launcher({ monitor: monitors[0] });
    NotificationWindow({ monitor: monitors[0] });
  },
});
