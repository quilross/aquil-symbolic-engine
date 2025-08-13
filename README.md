# Signalhaven Actions API (Conflict‑Free Cloud Deploy)
Cloudflare Worker backend for Custom GPT actions with Durable Object memory. CI smoke‑tests locally and deploys when Cloudflare secrets exist. CI **fails** if any merge‑conflict markers remain.

## Cloud‑Only Flow
- Push to `main` → CI checks for merge markers, typechecks, spins up a local Worker, runs smoke tests.
- If `CF_API_TOKEN` + `CF_ACCOUNT_ID` secrets exist, CI deploys to Cloudflare.
- Add a Worker Route `signal-q.me/*` to bind the custom domain (optional first; workers.dev works).
- Use `/openapi.yaml` in your GPT Actions; set one token from `ADMIN_TOKENS` as the Action Bearer token.
