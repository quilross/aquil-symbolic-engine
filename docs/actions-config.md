# GPT Actions Configuration

## Schema URL
- https://signal-q.me/openapi.yaml

## Authentication
- Type: API Key (Bearer)
- Header: `Authorization`
- Value: `Bearer $API_TOKEN`

## Test Sequence
1. `GET /system/health`
2. `GET /actions/list`
3. `POST /actions/chat`

## Common Failures and Fixes
- **401**: token mismatch
- **403**: CORS issue
- **404**: route trimming
- **5xx**: Durable Object binding problem
