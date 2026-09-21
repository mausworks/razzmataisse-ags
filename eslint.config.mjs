import js from "@eslint/js";
import { defineConfig } from "eslint/config";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import tseslint from "typescript-eslint";

import localRules from "./eslint-local-rules.mjs";

export default defineConfig(
  { ignores: ["node_modules/", "@girs/"] },
  {
    // An `eslint-disable-next-line` that doesn't actually suppress a
    // reported problem becomes an error itself -- used deliberately in
    // eslint-local-rules.examples.tsx as a lightweight "expect an error
    // here" marker for the local rules (a regression that stops a rule
    // from firing turns into a lint failure instead of silently rotting).
    linterOptions: { reportUnusedDisableDirectives: "error" },
  },
  js.configs.recommended,
  tseslint.configs.recommended,
  eslintPluginPrettierRecommended,
  {
    plugins: { local: localRules, "simple-import-sort": simpleImportSort },
    rules: {
      "local/require-for-id": "error",
      "local/require-definestyle-scope": "error",
      "local/require-transform-space-separator": "error",
      "local/require-valid-transform-units": "error",
      "local/prefer-transition-helper": "warn",
      "simple-import-sort/imports": "error",
      "simple-import-sort/exports": "error",
    },
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["../*"],
              message:
                "Use a path alias (@lib/*, @widget/*, @state/*, @ui/*, @theme) instead of relative parent traversal.",
            },
          ],
        },
      ],
    },
  },
  {
    // The one legitimate exception: this file exists specifically to
    // bridge into src/ from the project-root theme.json, which no alias
    // reaches (aliases only cover paths under src/, per its baseUrl).
    files: ["src/theme.ts"],
    rules: { "no-restricted-imports": "off" },
  },
);
