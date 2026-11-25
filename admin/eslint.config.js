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
  {
    files: ['src/**/*.ts', 'src/**/*.tsx'],
    ignores: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx'],
    rules: {
      // AGENTS.md §3: no type assertions (`as`, `<T>value`, except `as const`),
      // non-null assertions (`!`), or `instanceof` in production code.
      '@typescript-eslint/consistent-type-assertions': [
        'error',
        { assertionStyle: 'never' },
      ],
      '@typescript-eslint/no-non-null-assertion': 'error',
      'no-restricted-syntax': [
        'error',
        {
          selector: "BinaryExpression[operator='instanceof']",
          message:
            'Do not use instanceof in production code; use polymorphism, generics, or discriminated unions (AGENTS.md §3).',
        },
      ],
    },
  },
  adminBoundaries,
  // Must stay last: turns off rules that conflict with Prettier.
  prettier,
);
