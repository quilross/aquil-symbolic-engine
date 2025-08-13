## ClientResponseError
- Usually missing Bearer or CORS origin mismatch.
- Fix: Provide `Authorization: Bearer <token>` from `ADMIN_TOKENS`; set `CORS_ORIGIN` in prod.

## Merge‑marker failure
- CI step `[merge-check]` lists files/lines. Resolve conflicts, re-run.

## DO not persisting
- Ensure first deploy applied migration tag `v1` (Wrangler handles automatically).
