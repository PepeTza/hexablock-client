// @ts-check
// Import boundary of the admin panel (D-19, issues #7 and #46).
//
// The panel is an outer web app that may use the two innermost layers of the
// client — domain and application — through the `@domain` and `@application`
// aliases. It must never reach the mobile app: its adapters, its frameworks,
// its screens or its React Native packages. The rule is ESLint's built-in
// `no-restricted-imports`, so a forbidden import fails in the editor, in the
// pre-commit hook and in CI.

/** Aliases of the app's outer layers. The panel only configures `@domain` and `@application`. */
const APP_LAYER_PATTERN = {
  regex: '^@(adapters|frameworks)(/|$)',
  message:
    'The admin panel may only import the domain and application layers, through @domain and @application (D-19).',
};

/**
 * Relative paths that climb out of admin/ into the app's src/. Domain and
 * application are reached through their aliases instead, so the panel never
 * depends on folders of the mobile app.
 */
const RELATIVE_SRC_PATTERN = {
  regex: '^(\\.\\./)+src/(domain|application|adapters|frameworks)(/|$)',
  message:
    'The admin panel reaches the app only through the @domain and @application aliases, never with a relative path into src/ (D-19).',
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
