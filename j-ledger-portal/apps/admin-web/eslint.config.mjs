import { defineConfig, globalIgnores } from "eslint/config";
import { nextJsConfig } from "@repo/eslint-config/next-js";

const eslintConfig = defineConfig([
  ...nextJsConfig,
  // Override default ignores of eslint-config-next if needed, though shared config already has them.
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
