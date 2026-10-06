import GLib from "gi://GLib";

export const IS_DEV = GLib.getenv("AGS_DEV") === "1";

export const debugLog = IS_DEV ? console.log : () => {};
