# Signal Q Operations Guide

Signal Q is a Cloudflare Worker that exposes a minimal API for version info, health checks, actions, and per-user memory storage. This repository holds all code and specs needed to develop, deploy, and operate the service.

## Quickstart
1. `npm i`
2. `npx wrangler dev`
3. `npx wrangler deploy`

## Secrets
- `wrangler secret put SIGNALQ_API_TOKEN`
- `wrangler secret put SIGNALQ_ADMIN_TOKEN`

## Workers AI Gateway
Set these to enable `/actions/chat` to call Cloudflare Workers AI through your Gateway:

- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_GATEWAY_ID`
- `CLOUDFLARE_MODEL_ID`
- `wrangler secret put CLOUDFLARE_API_TOKEN`

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
- Replicate GPT Actions ingestion: `SIGNALQ_API_TOKEN=... node scripts/forensics.mjs`

