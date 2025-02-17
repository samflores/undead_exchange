import { coverageConfigDefaults, defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      exclude: [
        'src/index.ts',
        'knexfile.ts',
        'db/seeds/*.ts',
        ...coverageConfigDefaults.exclude
      ],
      thresholds: {
        functions: 90,
        branches: 90,
        statements: 90,
        lines: 90,
      }
    },
    testTimeout: 20000,
  },
  resolve: {
    alias: {
      src: resolve(__dirname, 'src'),
      tests: resolve(__dirname, 'tests'),
    },
  },
});
