# Signal Q Cloudflare Worker

A JavaScript/TypeScript Cloudflare Worker backend for the Signal Q API. The worker is fully runnable inside GitHub Codespaces with no local dependencies.

## Development in Codespaces
1. Open this repository in GitHub Codespaces. The provided dev container installs Node.js 18 and dependencies.
2. Edit worker code in `worker/src` as needed.

## Run the Worker Locally
Use Wrangler's dev server inside Codespaces:

```bash
npm run dev
```

## Testing
`npm test` runs the health test suite. Set the following environment variables to exercise the live API; if they are not provided the tests are skipped.

- `API_BASE_URL`
- `USER_TOKEN`
- `ADMIN_TOKEN`

Example:
```bash
API_BASE_URL=https://your-worker.example.workers.dev \
USER_TOKEN=ct_user_token \
ADMIN_TOKEN=ct_admin_token \
npm test
```

## Deployment
Deploy the worker with Wrangler:

```bash
npm run deploy
```

The deploy script requires a `CLOUDFLARE_API_TOKEN` and any runtime secrets (such as `API_TOKEN` and `API_TOKEN_ADMIN`) supplied via environment variables or GitHub Actions secrets. Pushes to `main` trigger the CI workflow in `.github/workflows/ci.yml`.

## Extending the Agent
- Add new endpoints or logic in `worker/src/index.js`.
- Update `worker/src/openapi-core.json` when APIs change.
- Use modular functions and avoid Node.js-only APIs (e.g., `fs`, `net`).

## Repository Structure
```
/worker/
  ├── src/
  │   ├── index.js           # Worker implementation
  │   └── openapi-core.json  # OpenAPI schema
  ├── health-test.js         # Optional health check script
  ├── test-api.js            # Basic API invocation helper
  └── wrangler.toml          # Cloudflare configuration
```

## Security
No credentials or secrets are stored in the repository. Provide tokens through environment variables or GitHub Actions secrets when deploying or running tests.
