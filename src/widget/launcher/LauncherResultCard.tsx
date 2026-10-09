import { alpha, backdropBlur, defineStyle } from "@lib/css";
import { ellipsizePath } from "@lib/path";
import { type LauncherResult } from "@state/launcher";
import theme from "@theme";
import { Accessor, Fragment } from "ags";
import { Gdk, Gtk } from "ags/gtk4";
import Gio from "gi://Gio?version=2.0";

const { palette } = theme.bar;

const POINTER_CURSOR = Gdk.Cursor.new_from_name("pointer", null);
const RESULT_ICON_SIZE = 32;

export interface ResultCardProps {
  result: LauncherResult;
  selected: Accessor<boolean>;
  onClick?: (result: LauncherResult) => void;
}

export default function LauncherResultCard({
  result,
  selected,
  onClick,
}: ResultCardProps) {
  return (
    <button
      cursor={POINTER_CURSOR}
      focusable={false}
      class={resultClass(selected.as((isSelected) => isSelected && "selected"))}
      onClicked={() => onClick?.(result)}
      hexpand
      halign={Gtk.Align.FILL}
    >
      <box spacing={12} hexpand>
        <ResultIcon result={result} />

        <box orientation={Gtk.Orientation.VERTICAL} hexpand>
          <ResultTitle result={result} />
          <ResultSubtitle result={result} />
        </box>
      </box>
    </button>
  );
}

const EXTENSION_ICON_OVERRIDES: Record<string, string[]> = {
  ts: ["text-x-javascript", "text-x-generic"],
  tsx: ["text-x-javascript", "text-x-generic"],
  jsx: ["text-x-javascript", "text-x-generic"],
};

interface FileIconProps {
  path: string;
  size?: number;
}

function FileIcon({ path, size }: FileIconProps) {
  const ext = path.split(".").pop()?.toLowerCase();
  const override = ext && EXTENSION_ICON_OVERRIDES[ext];
  const [contentType] = Gio.content_type_guess(path, null);
  const gicon = override
    ? Gio.ThemedIcon.new_from_names(override)
    : Gio.content_type_get_icon(contentType);

  return <image gicon={gicon} pixelSize={size} />;
}

interface ResultIconProps {
  result: LauncherResult;
}

function ResultIcon({ result }: ResultIconProps) {
  if (result.type === "file") {
    return <FileIcon path={result.path} size={RESULT_ICON_SIZE} />;
  } else if (result.type === "app") {
    return (
      <image
        iconName={result.app.iconName || "application-x-executable-symbolic"}
        pixelSize={RESULT_ICON_SIZE}
      />
    );
  } else {
    return <Fragment />;
  }
}

type ResultTextProps = {
  result: LauncherResult;
};

const titleText = (result: LauncherResult): string => {
  switch (result.type) {
    case "app":
      return result.app.name;
    case "file":
      return result.path.split("/").pop() ?? result.path;
    case "exec":
      return result.command;
    case "calc":
      return result.value;
  }
};

const subtitleText = (result: LauncherResult): string | false => {
  switch (result.type) {
    case "app":
      return result.app.description || false;
    case "file":
      return ellipsizePath(result.path);
    case "exec":
      return "Run in a terminal";
    case "calc":
      return "Press enter to copy";
  }
};

function ResultTitle({ result }: ResultTextProps) {
  const isMonospace = result.type === "calc" || result.type === "exec";

  return (
    <label
      label={titleText(result)}
      halign={Gtk.Align.START}
      ellipsize={3}
      hexpand
      class={isMonospace ? monospaceClass : ""}
    />
  );
}

function ResultSubtitle({ result }: ResultTextProps) {
  const subtitle = subtitleText(result);

  if (!subtitle) return <Fragment />;

  return (
    <label
      label={subtitle}
      halign={Gtk.Align.START}
      ellipsize={3}
      hexpand
      class={subtitleClass}
    />
  );
}

const monospaceClass = defineStyle({
  style: {
    fontFamily: "monospace",
  },
})();

const tint = (color: string) => `linear-gradient(${color}, ${color})`;

const resultClass = defineStyle({
  style: {
    backgroundColor: palette.activeBackground,
    backgroundImage: "none",
    backdropFilter: backdropBlur(),
    fontWeight: 500,
    color: palette.text,
    border: `1px solid ${alpha(palette.text, 0.1)}`,
    boxShadow: [
      `0 8px 16px -4px ${alpha("#000", 0.35)}`,
      `0 1px 3px ${alpha("#000", 0.3)}`,
    ].join(", "),
    borderRadius: 12,
    padding: "8px 12px",
    "&:hover": {
      backgroundImage: tint(alpha(palette.text, 0.08)),
    },
    "&:active": {
      backgroundImage: tint(alpha(palette.accent, 0.16)),
    },
  },
  variants: {
    selected: {
      backgroundImage: tint(alpha(palette.accent, 0.16)),
    },
  },
});

const subtitleClass = defineStyle({
  style: {
    color: "#8E8E93",
    fontSize: 11,
  },
})();
