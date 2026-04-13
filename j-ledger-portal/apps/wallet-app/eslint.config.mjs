import { defineConfig } from 'eslint/config';
import expoConfig from 'eslint-config-expo/flat.js';
import { config as baseConfig } from '@repo/eslint-config/base';

export default defineConfig([
  ...baseConfig,
  expoConfig,
  {
    ignores: ['dist/*', '.expo/*'],
  },
]);
