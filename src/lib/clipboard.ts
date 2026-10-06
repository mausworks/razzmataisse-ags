import { execAsync } from "ags/process";

export const copyToClipboard = (text: string) => execAsync(["wl-copy", text]);

export const pasteFromClipboard = () => execAsync(["wl-paste"]);
