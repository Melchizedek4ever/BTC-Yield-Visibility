import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const root = fileURLToPath(new URL('.', import.meta.url));

/**
 * The source monitor runs against REAL upstreams, so it lives behind its own
 * config and is never part of `npm test`. A failure here means the world
 * changed — a pool retired, an endpoint reshaped, a baseline gone stale — not
 * that someone broke the code, and it must never block a commit on that basis.
 *
 * Single-threaded and unretried on purpose: a flaky network result should be
 * visible as a failure worth a human glance, not smoothed away by retries
 * until a real outage looks the same as a blip.
 */
export default defineConfig({
  resolve: { alias: { '@': root } },
  test: {
    include: ['monitor/**/*.live.test.ts'],
    testTimeout: 120_000,
    hookTimeout: 120_000,
    fileParallelism: false,
    retry: 0,
  },
});
