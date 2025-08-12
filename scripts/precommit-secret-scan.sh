#!/usr/bin/env bash
set -euo pipefail
echo "Scanning for accidental secrets…"
PATTERNS=(
  'sq_(live|admin)_[0-9A-Za-z_-]{8,}'   # project tokens
  'sk-[A-Za-z0-9]{20,}'                 # OpenAI-like keys
  '-----BEGIN (RSA|EC) PRIVATE KEY-----'
)
IFS='|'; PATTERN="${PATTERNS[*]}"; unset IFS
if git diff --cached -U0 -- . ':!scripts/precommit-secret-scan.sh' | grep -E "$PATTERN"; then
  echo "❌ Potential secret found in staged changes"
  exit 1
else
  echo "✅ Clean"
fi
