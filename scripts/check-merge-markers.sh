#!/usr/bin/env bash
set -euo pipefail
# Fail if any merge-conflict markers exist in tracked files
if git grep -n -E '^(<<<<<<<|=======|>>>>>>>)' -- . >/dev/null; then
  echo "[merge-check] Merge-conflict markers found. Resolve before proceeding." >&2
  git grep -n -E '^(<<<<<<<|=======|>>>>>>>)' -- . | sed 's/^/[merge-check] /'
  exit 1
fi
echo "[merge-check] OK — no conflict markers found."
