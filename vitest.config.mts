import { resolve } from 'path';
import { coverageConfigDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      exclude: [
        'src/server.ts',
        'src/index.ts',
        'knexfile.ts',
        'src/db.ts',
        ...coverageConfigDefaults.exclude
      ],
      thresholds: {
        functions: 90,
        branches: 90,
        statements: 90,
        lines: 90,
      }
    }
  },
  resolve: {
    alias: {
      src: resolve(__dirname, 'src'),
      tests: resolve(__dirname, 'tests'),
    },
  },
});
