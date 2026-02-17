#!/usr/bin/env bash
set -euo pipefail

cd /workspace

cmd="${1:-build}"

case "$cmd" in
  extract)
    exec npm run docs:extract
    ;;
  render)
    exec npm run docs:render
    ;;
  generate)
    exec npm run docs:generate
    ;;
  build)
    exec npm run docs:build
    ;;
  serve)
    exec npm run docs:serve
    ;;
  smoke)
    exec bash docs/_specs/scripts/docker-docs-smoke.sh
    ;;
  *)
    exec "$@"
    ;;
esac
