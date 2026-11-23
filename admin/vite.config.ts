import { fileURLToPath } from 'node:url';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// The game's domain and application layers, shared with the app without a
// package (D-16, D-19).
const DOMAIN_DIR = fileURLToPath(new URL('../src/domain', import.meta.url));
const APPLICATION_DIR = fileURLToPath(
  new URL('../src/application', import.meta.url),
);

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@domain': DOMAIN_DIR,
      '@application': APPLICATION_DIR,
    },
  },
  server: {
    // The dev server only serves files inside the panel by default.
    fs: { allow: ['.', DOMAIN_DIR, APPLICATION_DIR] },
  },
  test: {
    environment: 'jsdom',
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['**/*.test.{ts,tsx}'],
    },
  },
});
