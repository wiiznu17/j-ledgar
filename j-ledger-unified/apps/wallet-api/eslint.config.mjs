import { defineConfig } from "eslint/config";
import { config as baseConfig } from "@repo/eslint-config/base";

export default defineConfig([
  ...baseConfig,
]);
