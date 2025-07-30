# Signalhaven Transcendence Agent Worker

This Cloudflare Worker implements the Signalhaven Transcendence Agent described in the repository specs. It stores user state in KV and Durable Objects and exposes a REST API.

## Features

- Bearer token authentication (`API_TOKEN` env variable)
- Daily free-tier usage counters with graceful degradation
- KV storage of memories and protocol logs with timestamps and versioning
- Admin reset endpoint (`/reset`) protected by `API_TOKEN_ADMIN`
- Friction rating capture and leadership rotation
- Play protocol creation and listing
- Media engagement and feedback logging
- Admin log export with simple encryption
- Minimal OpenAPI 3.1 document at `src/openapi.json`

