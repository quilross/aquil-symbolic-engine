# Signal Q Operations Guide

Signal Q is a Cloudflare Worker that exposes a minimal API for version info, health checks, actions, and per-user memory storage. This repository holds all code and specs needed to develop, deploy, and operate the service.

## Quickstart
1. `npm i`
2. `npx wrangler dev`
3. `npx wrangler deploy`

## Secrets
- `wrangler secret put API_TOKEN`
- `wrangler secret put API_TOKEN_ADMIN`

## Workers AI Gateway
Set these to enable `/actions/chat` to call Cloudflare Workers AI via the Gateway:

- `CLOUDFLARE_ACCOUNT_ID` (e.g. `b07412f2f2389e8b537051bc092f3376`)
- `CLOUDFLARE_GATEWAY_ID` (e.g. `ark-ai`)
- `CLOUDFLARE_MODEL_ID` (e.g. `@cf/meta/llama-3.1-8b-instruct`)
- `wrangler secret put CLOUDFLARE_API_TOKEN`

The worker posts prompts to:

```
https://gateway.ai.cloudflare.com/v1/${CLOUDFLARE_ACCOUNT_ID}/${CLOUDFLARE_GATEWAY_ID}/workers-ai/${CLOUDFLARE_MODEL_ID}
```

Example curl request:

```
curl https://gateway.ai.cloudflare.com/v1/b07412f2f2389e8b537051bc092f3376/ark-ai/workers-ai/@cf/meta/llama-3.1-8b-instruct \
  --header "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  --header 'Content-Type: application/json' \
  --data '{"prompt": "What is Cloudflare?"}'
```

The worker falls back to an echo reply if the request fails.

If any are missing the chat action falls back to echo responses.

## Durable Objects
- Binding name: `MEMORY`
- Migration tag: `v1-memory`

## Endpoints
| Method | Path | Access |
|--------|------|--------|
| GET | `/version` | Public |
| GET | `/system/health` | Public |
| GET | `/memory/:user` | Public |
| POST | `/actions/list` | Protected |
| POST | `/actions/chat` | Protected |
| POST | `/actions/probe_identity` | Protected |
| POST | `/actions/recalibrate_state` | Protected |
| POST | `/actions/trigger_deploy` | Protected |

## OpenAPI
- Source: `worker/src/openapi-core.json`
- Served at runtime: `/openapi.yaml`

## Troubleshooting
- Stream logs: `npx wrangler tail`
- 401 errors: missing or wrong Bearer token
- Durable Object migration errors: check binding `MEMORY` and migration tag `v1-memory`
- CORS: verify OPTIONS preflight allows origin, headers, and methods
- Replicate GPT Actions ingestion: `API_TOKEN=... node scripts/forensics.mjs`

