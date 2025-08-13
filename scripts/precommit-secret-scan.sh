#!/usr/bin/env bash
set -euo pipefail
PATTERN='(sk-[A-Za-z0-9]{20,}|sq_(live|admin)_[A-Za-z0-9_\-]{16,}|OPENAI_(KEY|API_KEY)|CF_API_TOKEN)'
FILES=$(git diff --cached --name-only)
[[ -z "$FILES" ]] && exit 0
if grep -E -n "$PATTERN" $FILES; then
  echo "[secret-scan] Potential secret detected in staged files. Commit aborted." >&2
  exit 1
fi
