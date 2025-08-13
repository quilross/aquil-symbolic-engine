# Quickstart
1) (Optional) Run cleanup guard locally in Codespaces/Copilot: `scripts/check-merge-markers.sh`.
2) Commit/push; view **Actions** → **Deploy and Smoke**. Expect `[merge-check] OK` and `[smoke] OK`.
3) Add repo secrets to enable deploy: `CF_API_TOKEN`, `CF_ACCOUNT_ID`, `ADMIN_TOKENS`.
4) Add Worker Route in Cloudflare: `signal-q.me/*` → this Worker.
