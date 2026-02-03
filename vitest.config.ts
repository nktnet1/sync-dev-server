import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    isolate: false,
    maxWorkers: 1,
    coverage: {
      include: ['src/**/*.ts'],
      exclude: ['src/types.ts'],
    },
  },
});
