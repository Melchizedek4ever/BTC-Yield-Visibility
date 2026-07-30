import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// Mirrors the `@/*` path alias from tsconfig.json so tests import modules
// exactly the way application code does.
const root = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  resolve: { alias: { '@': root } },
  test: {
    include: ['**/*.test.ts'],
    exclude: ['node_modules/**', '.next/**'],
    coverage: {
      provider: 'v8',
      // Coverage tracks the intelligence pipeline only — UI is excluded by design.
      include: ['lib/**', 'services/**', 'adapters/**', 'domain/**'],
    },
  },
});
