
# Aquil Symbolic Engine - AI Agent Instructions

**This document is the canonical source of guidance for AI coding agents working in this codebase. Follow these instructions for architecture, workflows, conventions, and integration points.**

This document provides essential guidance for AI agents working on the Aquil Symbolic Engine codebase.

## Architecture Overview

The Aquil Symbolic Engine is a Cloudflare Worker that acts as a personal wisdom and trust-building system. It's designed to be a modular, data-driven, and extensible platform for personal development.

- **Entry Point**: `src/index.js` is the main entry point for the Cloudflare Worker. It initializes the router and wires up all the different modules.
- **Routing**: We use `itty-router`. Routes are organized into modules within the `src/routes/` directory (e.g., `logging.js`, `system.js`). This keeps the main `index.js` clean and focused on orchestration.
- **Core Logic**: The core business logic is split across several directories:
    - `src/actions/`: Contains low-level functions for interacting with Cloudflare services (D1, R2, KV, Vectorize). For example, `src/actions/d1.js` handles all direct D1 database queries.
    - `src/ark/`: Implements the "ARK" (Aquil Record Keeping) specification. `ark-endpoints.js` defines higher-level operations that compose functions from `src/actions/`.
    - `src/agent/`: Contains the logic for the autonomous agent, including its decision-making engine (`engine.js`).
    - `src-core-*`: These files (`src-core-somatic-healer.js`, `src-core-values-clarifier.js`, etc.) represent specialized modules for different aspects of personal development. They are orchestrated by the main worker.
- **Configuration**:
    - `wrangler.toml`: The primary configuration file for the Cloudflare Worker. It defines bindings to D1, R2, KV, Vectorize, and other services.
    - `config/*.json`: These files, especially `ark.actions.logging.json`, define schemas, validation rules, and metadata for API actions. The worker loads these at startup to configure its behavior, ensuring that the configuration is the single source of truth for validation logic.

## Data Flow

1.  A request hits the worker.
2.  `itty-router` in `src/index.js` matches the route.
3.  The request is passed to a route handler in `src/routes/*.js`.
4.  The route handler calls higher-level functions in `src/ark/endpoints.js` or other service modules.
5.  These functions use low-level actions in `src/actions/*.js` to interact with Cloudflare's infrastructure (D1, R2, KV).
6.  Data is returned up the chain and formatted into a JSON response.

## Developer Workflows

### Running Locally

To run the worker locally for development:

```bash
npm run dev
```

This will start a local server that simulates the Cloudflare environment.

### Testing

The project uses `vitest` for testing.

-   **Run all tests**:
    ```bash
    npm run test
    ```
-   **Run tests in watch mode**:
    ```bash
    npm run test:watch
    ```
-   **Run integration tests**:
    ```bash
    npm run test:integration
    ```
    Integration tests are located in `test/integration.test.js` and often interact with a local Miniflare instance.

### Deployment

Deployment to Cloudflare is handled by Wrangler:

```bash
npm run deploy
```

### Database Migrations

The D1 database schema is managed with migrations.

-   **Apply migrations**:
    ```bash
    npm run db:migrate
    ```
-   The base schema is defined in `schema.sql`.

## Project Conventions

-   **Modularity**: Functionality is broken down into small, single-responsibility modules. The `src/routes/`, `src/actions/`, and `src-core-*` directories are prime examples.
-   **Configuration as Code**: API behavior, validation rules, and enums are defined in JSON files (`config/*.json`) and loaded by the application at runtime. This makes the system highly configurable without requiring code changes. See how `LOG_TYPES` and `UUID_V4` are created in `src/index.js` from `config/ark.actions.logging.json`.
-   **Error Handling**: A centralized error handler is used to ensure consistent error responses. See `src/utils/error-handler.js`.
-   **GPT Compatibility**: The system has a compatibility layer (`src/utils/gpt-compat.js`) to adjust its behavior when interacting with ChatGPT, which has specific constraints.
-   **Scripts**: The `scripts/` directory contains numerous helper scripts for tasks like database migration, schema validation, and testing.

## Integration Points

-   **Cloudflare Services**: The application is deeply integrated with Cloudflare's ecosystem:
    -   **D1 (`AQUIL_DB`)**: For structured SQL data.
    -   **R2 (`AQUIL_STORAGE`)**: For large object storage.
    -   **KV (`AQUIL_MEMORIES`)**: For key-value storage.
    -   **Vectorize (`AQUIL_CONTEXT`)**: For vector embeddings and similarity search.
    -   **AI Gateway (`AI_GATEWAY_PROD`)**: For routing requests to AI models.
-   **External APIs**: The worker may call external APIs via the AI Gateway or directly.

## Vectorize Testing

Cloudflare Vectorize does not have a local emulator. For tests, use the mocks provided in `TEST_ENV.AQUIL_CONTEXT` or run the script `scripts/test-vector-retrieval.mjs`. This allows you to simulate vector operations and validate integration without needing the real service.

## Local Development Secrets

Only the following secrets are required for local development:
- `CLOUDFLARE_API_TOKEN`
- `OPENAI_API_KEY`
- Optionally: `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_GATEWAY_ID` (if using AI Gateway)
Set these in your `.dev.vars` file or via Wrangler/Miniflare CLI as needed.

## src-core-* Modules


Each `src-core-*` module is tied to a specific endpoint and implements a personal-growth engine. The modules `SomaticHealer` and `ValuesClarifier` are canonical examples of the implementation pattern: they expose a class or function, are imported in `src/index.js`, and are invoked by the agent engine or ARK endpoints. Use these as references when adding new modules.

---
**Feedback requested:** If any section is unclear or missing, or if you need more examples, please comment so this guide can be improved for future AI agents.
