const fs = require('node:fs');
const path = require('node:path');

// Layers that must keep at least 80 % coverage (CONTRIBUTING §5, D-05).
const COVERED_LAYERS = ['src/domain', 'src/application'];
const MINIMUM = { statements: 80, branches: 80, functions: 80, lines: 80 };

// Jest fails when a threshold path has no coverage data, so a layer is only
// enforced once its folder exists. No change is needed here when it appears.
const coverageThreshold = Object.fromEntries(
  COVERED_LAYERS.filter((layer) =>
    fs.existsSync(path.join(__dirname, layer)),
  ).map((layer) => [`./${layer}/`, MINIMUM]),
);

// Same path aliases as tsconfig.json (`@domain/*`, `@application/*`..., `@test/*`).
const LAYERS = ['domain', 'application', 'adapters', 'frameworks'];
const moduleNameMapper = {
  ...Object.fromEntries(
    LAYERS.map((layer) => [`^@${layer}/(.*)$`, `<rootDir>/src/${layer}/$1`]),
  ),
  '^@test/(.*)$': '<rootDir>/test/$1',
};

/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  testEnvironment: 'node',
  // Skip React Native runtime mocks: tests target pure domain, application and
  // presentation logic (no UI component tests), keeping feedback fast.
  setupFiles: [],
  roots: ['<rootDir>/test'],
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.test.{ts,tsx}'],
  coverageThreshold,
  moduleNameMapper,
  // `admin/` is a separate web app tested with Vitest (D-18).
  testMatch: ['<rootDir>/test/**/*.test.ts'],
  modulePathIgnorePatterns: ['<rootDir>/admin/'],
};
