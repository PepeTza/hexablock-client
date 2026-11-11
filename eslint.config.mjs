// ESLint flat config: the TypeScript baseline plus the layer and variant
// boundaries of Clean Architecture (eslint-boundaries.config.js, issue #8).
import prettier from 'eslint-config-prettier';
import tseslint from 'typescript-eslint';

import boundaries from './eslint-boundaries.config.js';

const { layerBoundaries, discoverVariants, VARIANTS_DIR } = boundaries;

export default tseslint.config(
  {
    ignores: [
      'node_modules/',
      '.expo/',
      'dist/',
      'coverage/',
      'android/',
      'ios/',
      'admin/',
      '**/*.config.js',
      '**/*.config.mjs',
    ],
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
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
  ...layerBoundaries(discoverVariants(VARIANTS_DIR)),
  // Must stay last: turns off rules that conflict with Prettier.
  prettier,
);
