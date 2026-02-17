#!/usr/bin/env bash
set -euo pipefail

if [[ "${1:-}" != "--skip-generate" ]]; then
  npm run docs:generate
fi

if ! git diff --exit-code -- generated/; then
  echo "[ERROR] Generated docs are stale. Run npm run docs:generate and commit generated changes."
  exit 1
fi

printf '%s\n' "Generated docs are fresh."
