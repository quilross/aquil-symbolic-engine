import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    // Test file patterns
    include: [
      'test/**/*.{test,spec}.{js,mjs,ts}',
      'src/**/*.{test,spec}.{js,mjs,ts}'
    ],
    // Test timeout
    testTimeout: 30000,
    // Setup files
    setupFiles: ['./test/setup.js'],
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'test/',
        'scripts/',
        '*.config.*'
      ]
    },
    // Global test environment variables
    globals: true,
    // Pool settings for stability
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: true
      }
    }
  }
});