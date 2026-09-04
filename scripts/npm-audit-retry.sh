#!/usr/bin/env bash
set -euo pipefail

max_attempts="${NPM_AUDIT_MAX_ATTEMPTS:-3}"
base_delay_seconds="${NPM_AUDIT_RETRY_DELAY_SECONDS:-5}"

# Keep each registry attempt bounded so an upstream outage cannot consume the
# entire workflow timeout. npm still fails normally for real high/critical
# advisories; only clearly transient registry/network failures are retried.
export npm_config_fetch_retries="${npm_config_fetch_retries:-1}"
export npm_config_fetch_retry_factor="${npm_config_fetch_retry_factor:-2}"
export npm_config_fetch_retry_mintimeout="${npm_config_fetch_retry_mintimeout:-5000}"
export npm_config_fetch_retry_maxtimeout="${npm_config_fetch_retry_maxtimeout:-15000}"
export npm_config_fetch_timeout="${npm_config_fetch_timeout:-60000}"

for ((attempt = 1; attempt <= max_attempts; attempt += 1)); do
  echo "npm audit attempt ${attempt}/${max_attempts}"

  set +e
  output="$(timeout 90s npm audit --omit=dev --audit-level=high 2>&1)"
  status=$?
  set -e

  printf '%s\n' "$output"

  if [ "$status" -eq 0 ]; then
    exit 0
  fi

  transient=0
  if [ "$status" -eq 124 ]; then
    transient=1
  elif printf '%s\n' "$output" | grep -Eiq \
    '503 Service Unavailable|502 Bad Gateway|504 Gateway Timeout|network timeout|audit endpoint returned an error|ECONNRESET|ETIMEDOUT|EAI_AGAIN|ENETUNREACH|socket hang up|fetch failed'; then
    transient=1
  fi

  if [ "$transient" -eq 0 ]; then
    echo 'npm audit reported a non-transient failure; failing closed.' >&2
    exit "$status"
  fi

  if [ "$attempt" -eq "$max_attempts" ]; then
    echo 'npm audit service remained unavailable after bounded retries; failing closed.' >&2
    exit 1
  fi

  delay=$((base_delay_seconds * attempt))
  echo "Transient npm audit service failure detected; retrying in ${delay}s." >&2
  sleep "$delay"
done

exit 1
