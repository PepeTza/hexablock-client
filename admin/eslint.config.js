// ESLint flat config of the admin panel: the same TypeScript rules as the
// app, plus the panel's import boundary (eslint-boundaries.js).
import prettier from 'eslint-config-prettier';
import tseslint from 'typescript-eslint';

import { adminBoundaries } from './eslint-boundaries.js';

export default tseslint.config(
  {
    ignores: ['node_modules/', 'dist/', 'coverage/', '**/*.js'],
  },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [...tseslint.configs.recommendedTypeChecked],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // CONTRIBUTING §4: no `any`; use `unknown` and narrow.
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },
  adminBoundaries,
  // Must stay last: turns off rules that conflict with Prettier.
  prettier,
);
