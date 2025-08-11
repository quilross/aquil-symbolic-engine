#!/usr/bin/env bash
set -euo pipefail
ORIGIN=$(git remote get-url origin)
# handles https or ssh; convert to https raw
REPO=${ORIGIN#*github.com[:/]}
REPO=${REPO%.git}
echo "https://raw.githubusercontent.com/$REPO/main/worker/src/openapi-core.json"