#!/usr/bin/env bash
set -euo pipefail

VAR_NAME="${VAR_NAME:-DOCS_PORT}"
MIN_PORT="${MIN_PORT:-20000}"
MAX_PORT="${MAX_PORT:-60999}"
COMPOSE_FILE="${COMPOSE_FILE:-_specs/docker/compose.yml}"
MAX_ATTEMPTS="${MAX_ATTEMPTS:-50}"

is_integer() {
  [[ "$1" =~ ^[0-9]+$ ]]
}

port_in_use() {
  local port="$1"

  if command -v ss >/dev/null 2>&1; then
    ss -lntH 2>/dev/null | awk '{print $4}' | grep -Eq "[:.]${port}\$"
    return $?
  fi

  if command -v lsof >/dev/null 2>&1; then
    lsof -nP -iTCP:"${port}" -sTCP:LISTEN >/dev/null 2>&1
    return $?
  fi

  return 1
}

random_port() {
  if command -v shuf >/dev/null 2>&1; then
    shuf -i "${MIN_PORT}-${MAX_PORT}" -n 1
    return
  fi

  awk -v min="${MIN_PORT}" -v max="${MAX_PORT}" 'BEGIN { srand(); print int(min + rand() * (max - min + 1)) }'
}

if ! is_integer "${MIN_PORT}" || ! is_integer "${MAX_PORT}" || ! is_integer "${MAX_ATTEMPTS}"; then
  echo "MIN_PORT, MAX_PORT, and MAX_ATTEMPTS must be integers" >&2
  exit 1
fi

if (( MIN_PORT < 1024 || MAX_PORT > 65535 || MIN_PORT > MAX_PORT )); then
  echo "Port range must satisfy: 1024 <= MIN_PORT <= MAX_PORT <= 65535" >&2
  exit 1
fi

if [[ ! -f "${COMPOSE_FILE}" ]]; then
  echo "Compose file not found: ${COMPOSE_FILE}" >&2
  exit 1
fi

selected_port=""
for (( attempt = 1; attempt <= MAX_ATTEMPTS; attempt++ )); do
  candidate="$(random_port)"
  if ! port_in_use "${candidate}"; then
    selected_port="${candidate}"
    break
  fi
done

if [[ -z "${selected_port}" ]]; then
  echo "Could not find an available port after ${MAX_ATTEMPTS} attempts" >&2
  exit 1
fi

if [[ "${BASH_SOURCE[0]}" != "${0}" ]]; then
  export "${VAR_NAME}=${selected_port}"
  echo "${VAR_NAME}=${selected_port}"
  exit 0
fi

printf 'export %s=%s\n' "${VAR_NAME}" "${selected_port}"
printf '# Compose file: %s\n' "${COMPOSE_FILE}"
printf '# Usage: eval "$(%s)" && docker compose -f %s up\n' "_specs/scripts/randomize-compose-port.sh" "${COMPOSE_FILE}"
