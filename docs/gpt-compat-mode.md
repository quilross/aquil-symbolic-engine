# GPT_COMPAT_MODE Documentation

## Overview

GPT_COMPAT_MODE is a fail-open compatibility mode designed to ensure the Aquil Symbolic Engine continues to function when used as a ChatGPT action, even if some Cloudflare bindings (D1, KV, R2, Vectorize) are unavailable or misconfigured.

## Usage

Set the `GPT_COMPAT_MODE` environment variable to enable fail-open behavior:

```bash
# Enable GPT compatibility mode
export GPT_COMPAT_MODE=true

# Or in wrangler.toml
[env.production.vars]
GPT_COMPAT_MODE = "true"
```

## Behavior

When `GPT_COMPAT_MODE` is enabled:

### 1. Missing Bindings
- **Normal mode**: Throws errors when bindings are missing
- **Compat mode**: Returns `null` and logs a warning, allowing execution to continue

### 2. Failed Operations
- **Normal mode**: Throws exceptions that halt execution
- **Compat mode**: Returns fallback values and logs warnings

### 3. Logging Failures
- **Normal mode**: Logging exceptions can halt the entire request
- **Compat mode**: Logging failures are caught and suppressed, returning `false`

## Implementation

The GPT_COMPAT_MODE system provides three main utilities:

### `safeBinding(env, bindingName)`
Safely access Cloudflare bindings with fallback behavior.

```javascript
const db = safeBinding(env, 'AQUIL_DB');
if (db) {
  // Use database normally
  await db.prepare(query).run();
} else {
  // In compat mode, binding is null - continue with degraded functionality
  console.log('Database unavailable, using fallback behavior');
}
```

### `safeOperation(env, operation, fallbackValue)`
Execute operations with automatic fallback in compat mode.

```javascript
const logs = await safeOperation(env, 
  () => readLogsFromDatabase(env),
  [] // Return empty array if database fails in compat mode
);
```

### `safeLog(env, logOperation)`
Perform logging operations without halting execution.

```javascript
await safeLog(env, async () => {
  await logMetamorphicEvent(env, eventData);
});
// Returns true if successful, false if failed (in compat mode)
```

## Use Cases

1. **ChatGPT Actions**: When some bindings may not be available in the ChatGPT environment
2. **Development**: When testing without full Cloudflare setup
3. **Graceful Degradation**: When you want the system to continue functioning even if storage layers fail

## Testing

Run the demonstration script to see GPT_COMPAT_MODE in action:

```bash
node demo/gpt-compat-demo.mjs
```

Or run the test suite:

```bash
node --test test/gptCompat.test.js
```

## Modified Components

The following components have been updated to support GPT_COMPAT_MODE:

- `src/utils/error-handler.js` - Error logging uses `safeLog`
- `src/actions/logging.js` - All binding access uses `safeBinding` and `safeOperation`
- All endpoint error handlers - Proper error processing prevents status code range errors

## Observability

When GPT_COMPAT_MODE is active, you'll see console logs like:

```
[GPT_COMPAT_MODE] Missing binding AQUIL_DB, continuing in fail-open mode
[GPT_COMPAT_MODE] Operation failed, returning fallback: Database connection failed
[GPT_COMPAT_MODE] Logging failed, suppressing exception: Logging service unavailable
```

This provides visibility into which operations are falling back while maintaining system functionality.