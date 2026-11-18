// @ts-check
// Import boundary of the admin panel (D-19, issue #7).
//
// The panel is an outer app that may use the innermost layer of the client,
// the domain, through the `@domain` alias. It must never reach the mobile
// app: its other layers, its screens or its React Native packages. The rule
// is ESLint's built-in `no-restricted-imports`, so a forbidden import fails
// in the editor, in the pre-commit hook and in CI.
//
// If decision 19 allows the application layer too, remove `application`
// from APP_LAYER_PATTERN and from RELATIVE_SRC_PATTERN.

/** Aliases of the app's other layers. The panel only configures `@domain`. */
const APP_LAYER_PATTERN = {
  regex: '^@(application|adapters|frameworks)(/|$)',
  message:
    'The admin panel may only import the domain, through @domain (D-19).',
};

/**
 * Relative paths that climb out of admin/ into the app's src/. The domain is
 * reached through the alias instead, so the panel never depends on folders
 * of the mobile app.
 */
const RELATIVE_SRC_PATTERN = {
  regex: '^(\\.\\./)+src/(domain|application|adapters|frameworks)(/|$)',
  message:
    'The admin panel reaches the app only through the @domain alias, never with a relative path into src/ (D-19).',
};

/** Packages of the mobile UI, which do not run in a browser. */
const MOBILE_UI_PATTERN = {
  regex: '^(react-native|expo)(-|/|$)|^@(expo|shopify|react-navigation)/',
  message:
    'The admin panel is a web app: it cannot import the mobile UI packages.',
};

/** @type {import('eslint').Linter.Config} */
export const adminBoundaries = {
  files: ['src/**/*.{ts,tsx}'],
  rules: {
    'no-restricted-imports': [
      'error',
      {
        patterns: [APP_LAYER_PATTERN, RELATIVE_SRC_PATTERN, MOBILE_UI_PATTERN],
      },
    ],
  },
};
