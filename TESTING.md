# Testing and Validation Setup

This document describes the comprehensive testing infrastructure set up for the Aquil Symbolic Engine, including Vitest, Miniflare, and OpenTelemetry integration.

## Overview

The testing setup includes:
- **Vitest** for unit and integration testing
- **Miniflare** for local Cloudflare Workers testing
- **OpenTelemetry** for observability and monitoring
- **Coverage reporting** with V8 provider

## Testing Commands

### Primary Test Commands

```bash
# Run all tests with Vitest
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run integration tests specifically
npm run test:integration

# Run Miniflare integration tests
npm run test:miniflare

# Run legacy Node.js tests
npm run test:legacy
```

### Test File Structure

```
test/
├── setup.js                 # OpenTelemetry setup and mocks
├── idempotency.test.js      # Idempotency tests
├── endpoints.test.js        # API endpoint tests
├── integration.test.js      # Integration tests (mocked)
└── monitoring.test.js       # Observability tests

scripts/
└── test-miniflare.mjs       # Miniflare integration tests
```

## Vitest Configuration

The Vitest configuration (`vitest.config.js`) includes:

- **Environment**: Node.js environment with mocked Cloudflare bindings
- **Setup Files**: OpenTelemetry instrumentation and global mocks
- **Coverage**: V8 coverage provider with HTML/JSON reports
- **Timeouts**: 30-second test timeout for async operations

### Key Features

- Global test environment variables
- OpenTelemetry tracing for test observability
- Mocked Cloudflare Worker bindings (KV, D1, R2, Vectorize, AI)
- Single-threaded execution for consistency

## Miniflare Integration

Miniflare provides realistic local testing of Cloudflare Workers:

```bash
# Run Miniflare tests
npm run test:miniflare
```

### Miniflare Test Coverage

- Health check endpoints
- CORS configuration
- Log creation and storage
- Error handling (404s)
- Worker environment validation

## OpenTelemetry Integration

OpenTelemetry is integrated for observability and monitoring:

### Features

- **Tracing**: Request/operation tracing with spans
- **Metrics**: Counters and histograms for performance monitoring
- **Instrumentation**: Automatic HTTP and fetch instrumentation
- **Custom Metrics**: Application-specific metrics

### Usage in Tests

```javascript
import { trace } from '@opentelemetry/api';

const tracer = trace.getTracer('test-name');
const span = tracer.startSpan('operation-name');

try {
  // Test logic
  span.setStatus({ code: 1 }); // SUCCESS
} catch (error) {
  span.recordException(error);
  span.setStatus({ code: 2, message: error.message });
  throw error;
} finally {
  span.end();
}
```

### Observability Module

The `src/utils/observability.js` module provides:

- `initializeObservability()` - Setup for production
- `traceOperation()` - Wrapper for traced operations
- `createTracingMiddleware()` - HTTP request tracing
- `createCustomMetrics()` - Application-specific metrics

## Test Categories

### 1. Unit Tests

- **Idempotency Tests**: Ensure operations are idempotent
- **Endpoint Logic Tests**: Validate API endpoint behavior
- **Utility Function Tests**: Test helper functions

### 2. Integration Tests

- **Storage Operations**: KV, D1, R2, Vector operations
- **API Flow Tests**: Complete request/response cycles
- **Error Handling**: Validation and error responses

### 3. Monitoring Tests

- **OpenTelemetry Integration**: Span and metric creation
- **Performance Monitoring**: Threshold detection
- **Resource Health**: Binding health checks

### 4. Miniflare Tests

- **Real Worker Environment**: Actual Cloudflare Worker execution
- **Binding Integration**: Real KV, D1, etc. operations
- **Production Parity**: Environment matching production

## Mock Environment

The test setup includes comprehensive mocks for Cloudflare bindings:

```javascript
globalThis.TEST_ENV = {
  AQUIL_MEMORIES: { /* KV operations */ },
  AQUIL_DB: { /* D1 operations */ },
  AQUIL_STORAGE: { /* R2 operations */ },
  AQUIL_CONTEXT: { /* Vectorize operations */ },
  AQUIL_AI: { /* AI operations */ }
};
```

## Coverage Reporting

Coverage reports are generated using V8 and include:

- **Text output**: Console summary
- **JSON report**: Machine-readable coverage data
- **HTML report**: Interactive coverage browser

```bash
# Generate coverage report
npm run test:coverage

# Coverage files generated:
# - coverage/index.html (interactive report)
# - coverage/coverage-final.json (JSON data)
```

## Continuous Integration

The testing setup is designed for CI/CD pipelines:

- Fast execution with parallel testing
- Clear exit codes for success/failure
- Detailed error reporting
- Coverage threshold enforcement

## Best Practices

### Writing Tests

1. **Use OpenTelemetry spans** for observability
2. **Test both success and error paths**
3. **Mock external dependencies appropriately**
4. **Use descriptive test names and structure**
5. **Include performance and monitoring tests**

### Running Tests

1. **Run tests before commits**
2. **Check coverage regularly**
3. **Use Miniflare for integration validation**
4. **Monitor test performance and reliability**

## Dependencies

### Testing Dependencies

- `vitest` - Test framework
- `@vitest/coverage-v8` - Coverage provider
- `miniflare` - Cloudflare Workers local testing
- `@cloudflare/vitest-pool-workers` - Vitest Cloudflare integration

### OpenTelemetry Dependencies

- `@opentelemetry/api` - Core OpenTelemetry API
- `@opentelemetry/sdk-node` - Node.js SDK
- `@opentelemetry/auto-instrumentations-node` - Auto-instrumentation

## Troubleshooting

### Common Issues

1. **OpenTelemetry Import Errors**: Ensure correct import syntax
2. **Mock Binding Issues**: Check setup.js for proper mocking
3. **Miniflare Failures**: Verify worker script syntax
4. **Coverage Missing**: Install @vitest/coverage-v8

### Debug Commands

```bash
# Run tests with verbose output
npm run test -- --reporter=verbose

# Run specific test file
npm run test test/endpoints.test.js

# Run tests in watch mode for development
npm run test:watch
```

## Future Enhancements

Potential improvements to the testing setup:

1. **E2E Testing**: Add Playwright for end-to-end tests
2. **Performance Testing**: Load testing with k6
3. **Visual Testing**: Screenshot comparison tests
4. **API Testing**: OpenAPI specification validation
5. **Security Testing**: Vulnerability scanning integration