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
  {
    files: ['src/**/*.ts', 'src/**/*.tsx'],
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
      // AGENTS.md §4, RF-05, RN-05: randomness goes through an injected,
      // seedable source (IRandomSource, ISeedGenerator), so games replay from
      // their seed. Also catches `const { random } = Math`.
      'no-restricted-properties': [
        'error',
        {
          object: 'Math',
          property: 'random',
          message:
            'Do not call Math.random in production code; inject IRandomSource or ISeedGenerator (AGENTS.md §4). The adapter that implements ISeedGenerator gets a named exception.',
        },
      ],
    },
  },
  ...layerBoundaries(discoverVariants(VARIANTS_DIR)),
  // Must stay last: turns off rules that conflict with Prettier.
  prettier,
);
