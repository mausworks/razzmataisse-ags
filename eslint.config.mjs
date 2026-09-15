import js from "@eslint/js";
import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";

export default defineConfig(
  { ignores: ["node_modules/", "@girs/"] },
  js.configs.recommended,
  tseslint.configs.recommended,
  eslintPluginPrettierRecommended,
);
