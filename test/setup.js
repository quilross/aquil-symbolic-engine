// Test setup file for Vitest with OpenTelemetry instrumentation
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';

// Initialize OpenTelemetry for testing
const sdk = new NodeSDK({
  instrumentations: [
    getNodeAutoInstrumentations({
      // Configure auto-instrumentations for testing
      '@opentelemetry/instrumentation-http': {
        enabled: true,
      },
      '@opentelemetry/instrumentation-fetch': {
        enabled: true,
      },
    }),
  ],
  // Use a no-op exporter for testing to avoid external dependencies
  traceExporter: {
    export: () => Promise.resolve({ code: 0 }),
    shutdown: () => Promise.resolve(),
  },
  metricExporter: {
    export: () => Promise.resolve({ code: 0 }),
    shutdown: () => Promise.resolve(),
  },
});

// Start the SDK for testing
sdk.start();

// Global test setup
globalThis.TEST_ENV = {
  // Mock Cloudflare Worker environment
  AQUIL_MEMORIES: {
    get: async (key) => null,
    put: async (key, value) => true,
    delete: async (key) => true,
    list: async () => ({ keys: [] }),
  },
  AQUIL_DB: {
    prepare: (sql) => ({
      bind: (...params) => ({
        run: async () => ({ success: true, meta: { changes: 1 } }),
        all: async () => ({ results: [], success: true }),
        first: async () => null,
      }),
      // Add all method directly to the prepared statement
      all: async () => ({ results: [], success: true }),
      first: async () => null,
    }),
    exec: async (sql) => ({ results: [], success: true }),
  },
  AQUIL_STORAGE: {
    get: async (key) => null,
    put: async (key, value) => true,
    delete: async (key) => true,
    list: async () => ({ objects: [] }),
  },
  AQUIL_CONTEXT: {
    query: async (vector, options) => ({ matches: [] }),
    upsert: async (vectors) => ({ mutationId: 'test-id' }),
  },
  AQUIL_AI: {
    run: async (model, input) => ({ response: 'test-response' }),
  },
};

// Cleanup after tests
globalThis.afterAll = () => {
  sdk.shutdown();
};