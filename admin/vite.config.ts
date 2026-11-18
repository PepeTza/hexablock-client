import { fileURLToPath } from 'node:url';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// The game's domain, shared with the app without a package (D-16, D-19).
const DOMAIN_DIR = fileURLToPath(new URL('../src/domain', import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@domain': DOMAIN_DIR },
  },
  server: {
    // The dev server only serves files inside the panel by default.
    fs: { allow: ['.', DOMAIN_DIR] },
  },
  test: {
    environment: 'jsdom',
  },
});
