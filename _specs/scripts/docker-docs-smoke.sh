#!/usr/bin/env bash
set -euo pipefail

npm run docs:generate
mkdocs build --strict -f _specs/mkdocs.yml
