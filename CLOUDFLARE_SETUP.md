# Cloudflare Setup

This guide details how to deploy the Signal Q worker to Cloudflare Workers with a custom domain and durable object storage.

## Prerequisites
- [Node.js](https://nodejs.org/) and npm installed locally
- A Cloudflare account with Workers enabled
- The [`wrangler`](https://developers.cloudflare.com/workers/wrangler/install-and-update/) CLI (v3 or later)
- [`jq`](https://stedolan.github.io/jq/) installed for the deploy script
- A domain managed by Cloudflare (the examples use `signal-q.me`)

## 1. Install dependencies
```bash
npm install
```

## 2. Configure the worker
Review `worker/wrangler.toml` and update it for your domain and durable objects. The default file maps
the worker to `signal-q.me` and binds the `MemoryDO` class:

```toml
name = "signal_q"
main = "worker/index.js"
workers_dev = false

routes = [
  { pattern = "signal-q.me", custom_domain = true }
]

[durable_objects]
bindings = [
  { name = "MEMORY", class_name = "MemoryDO" }
]

[[migrations]]
tag = "v1-memory"
new_classes = ["MemoryDO"]
```

Update the `pattern` with your own domain and increment the migration tag when the durable object
schema changes.

## 3. Authenticate with Cloudflare
```bash
wrangler login
```
The login opens a browser window and stores your API credentials locally.

## 4. Configure secrets
Set the worker tokens and Cloudflare AI gateway credentials:
```bash
wrangler secret put SIGNALQ_API_TOKEN
wrangler secret put SIGNALQ_ADMIN_TOKEN
wrangler secret put CLOUDFLARE_API_TOKEN
```
Export the related environment variables so the deploy script and `/actions/chat` can access them:
```bash
export SIGNALQ_API_TOKEN=<your user token>
export SIGNALQ_ADMIN_TOKEN=<your admin token>
export CLOUDFLARE_ACCOUNT_ID=<your Cloudflare account ID>
export CLOUDFLARE_GATEWAY_ID=<your AI Gateway ID>
export CLOUDFLARE_MODEL_ID=@cf/meta/llama-3.1-8b-instruct
```
The worker reads the secrets at runtime; the environment variables are only used during deployment or local testing.

## 5. Deploy the worker
From the project root run the deploy script:
```bash
cd worker
./deploy.sh
```
The script calls `wrangler deploy`, provisions the durable object defined in `wrangler.toml`, and performs a quick health check against the live endpoint. It exits early if `SIGNALQ_API_TOKEN` isn't set or if `jq` is missing.

## 6. Custom domain
`worker/wrangler.toml` already maps the worker to the `signal-q.me` domain:
```toml
routes = [
  { pattern = "signal-q.me", custom_domain = true }
]
```
Update the pattern if you want to use a different domain. The domain must exist in your Cloudflare account and have a DNS record pointing at Workers.

If your project uses CI/CD you can deploy non-interactively by setting the `CLOUDFLARE_API_TOKEN` and
`CLOUDFLARE_ACCOUNT_ID` environment variables before running `wrangler deploy`.

## 7. Verify deployment
After deployment you can run the smoke tests:
```bash
npm test
```
To manually verify an endpoint:
```bash
curl -X POST -H "Authorization: Bearer $SIGNALQ_API_TOKEN" \
  https://signal-q.me/actions/system_health
```
A successful response returns JSON containing a status of `healthy`.

## 8. Troubleshooting
- Ensure you ran `wrangler login` before deploying.
- If the health check fails, run `wrangler tail` to view worker logs.
- When changing durable object classes, add a migration block to `wrangler.toml`.
- Redeploy with `wrangler deploy` after updating secrets or configuration.

With these steps the API is live and ready for OpenAI GPT Actions or other clients.
