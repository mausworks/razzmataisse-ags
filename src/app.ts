import Bar from "@widget/bar";
import app from "ags/gtk4/app";

app.start({
  main: () => {
    app.get_monitors().map((monitor) => Bar({ monitor }));
  },
});
