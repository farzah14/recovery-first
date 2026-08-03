import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-support/setup.ts'],
    include: [
      'tests/unit/**/*.test.ts',
      'tests/unit/**/*.test.tsx',
      'tests/component/**/*.test.ts',
      'tests/component/**/*.test.tsx',
      'tests/integration/**/*.test.ts',
      'tests/integration/**/*.test.tsx',
      'tests/accessibility/**/*.test.ts',
      'tests/accessibility/**/*.test.tsx',
      'tests/features/**/*.test.ts',
      'tests/features/**/*.test.tsx',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'html'],
      reportsDirectory: './coverage',
    },
  },
});
