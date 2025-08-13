# GPT Actions Configuration

## Schema URL
- https://signal-q.me/openapi.yaml

## Authentication
- Type: API Key (Bearer)
- Header: `Authorization`
- Value: `Bearer sq_live_7k9m2n8p4x6w1z5q3r7t9v2b4c6d8f0h`

## Test Sequence
1. `GET /system/health`
2. `GET /actions/list`
3. `POST /actions/chat`

## Common Failures and Fixes
- **401**: token mismatch
- **403**: CORS issue
- **404**: route trimming
- **5xx**: Durable Object binding problem
