import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    coverage: {
      include: ['src/**/*.ts'],
      exclude: ['src/types/ts'],
    },
  },
});
