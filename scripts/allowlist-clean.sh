#!/usr/bin/env bash
set -euo pipefail
# Non-destructive cleanup: move anything not in allowlist to legacy/<path>
ALLOWLIST=(
  ".github/workflows/deploy-and-smoke.yml"
  "scripts/smoke.sh"
  "scripts/precommit-secret-scan.sh"
  "scripts/check-merge-markers.sh"
  "scripts/allowlist-clean.sh"
  "worker/index.ts"
  "worker/wrangler.toml"
  "worker/package.json"
  "worker/tsconfig.json"
  "worker/openapi-core.yaml"
  "README.md"
  "QUICKSTART.md"
  "TROUBLESHOOTING.md"
  "REPORT_DRIFT.md"
)

is_allowed() {
  local p="$1"
  for a in "${ALLOWLIST[@]}"; do [[ "$p" == "$a" ]] && return 0; done
  return 1
}

mapfile -t TRACKED < <(git ls-files)
for f in "${TRACKED[@]}"; do
  [[ "$f" == .gitignore || "$f" == .gitattributes ]] && continue
  if ! is_allowed "$f"; then
    mkdir -p "legacy/$(dirname "$f")"
    git mv -f "$f" "legacy/$f"
  fi
done

echo "[allowlist-clean] Moved non-canonical files to legacy/. Review in PR."
