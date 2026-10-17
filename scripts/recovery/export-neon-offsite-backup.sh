#!/usr/bin/env bash
# GameYer: create a private, complete Neon/PostgreSQL offsite backup.
# This script MUST run only on a trusted operator computer with pg_dump/pg_restore.
# It does not modify the database, deploy the site, or upload data anywhere.
# Never commit the backup or a database password into Git.
set -euo pipefail
umask 077

if [[ ${1:-} == "--help" || ${1:-} == "-h" ]]; then
  cat <<'HELP'
GameYer Neon offsite backup (read-only)
Usage: bash scripts/recovery/export-neon-offsite-backup.sh /secure/local/backup/folder

Prerequisites: PostgreSQL pg_dump and pg_restore, sha256sum.
Connection MUST be configured using libpq environment variables:
  PGHOST=<Neon endpoint hostname>
  PGPORT=5432
  PGDATABASE=gameyer
  PGUSER=<authorized backup/export role>
  PGSSLMODE=require
Credential: use a private chmod-0600 PGPASSFILE or interactive prompt;
never put connection URLs/passwords in CLI args, shell history, Git, or logs.

This is a FULL private database export: it can include contact details,
admin records, analytics IDs, and other sensitive data. Store it only in
encrypted private storage with restricted sharing. It must NEVER go into
GameYer's public repository, public assets, or browser-accessible paths.
HELP
  exit 0
fi

destination=${1:-}
if [[ -z "$destination" || ! -d "$destination" ]]; then
  echo "Pass an existing private destination directory." >&2
  exit 2
fi
for command in pg_dump pg_restore sha256sum mktemp; do
  if ! command -v "$command" >/dev/null 2>&1; then
    echo "Missing prerequisite: $command" >&2
    exit 2
  fi
done
: "${PGHOST:?Specify Neon endpoint via PGHOST.}"
: "${PGUSER:?Specify backup role via PGUSER.}"
: "${PGDATABASE:?Specify database name via PGDATABASE.}"
if [[ "$PGDATABASE" != "gameyer" ]]; then
  echo "Refusing unexpected database name." >&2
  exit 2
fi
if [[ ! "$PGHOST" =~ \.neon\.tech$ ]]; then
  echo "Refusing connection outside the configured Neon host family." >&2
  exit 2
fi
if [[ "${PGSSLMODE:-}" != "require" && "${PGSSLMODE:-}" != "verify-full" ]]; then
  echo "Set PGSSLMODE=require or verify-full." >&2
  exit 2
fi
if [[ "${GAMEYER_BACKUP_CONFIRM_PRIVATE:-}" != "yes" ]]; then
  echo "Set GAMEYER_BACKUP_CONFIRM_PRIVATE=yes only after verifying destination is private." >&2
  exit 2
fi

stamp=$(date -u +%Y%m%dT%H%M%SZ)
filename="gameyer-neon-full-${stamp}.dump"
tmp=$(mktemp "$destination/.gameyer-backup-XXXXXXXX.tmp")
cleanup() { [[ -f "$tmp" ]] && rm -f -- "$tmp"; }
trap cleanup EXIT
chmod 600 "$tmp"
# pg_dump reads credentials from libpq; never pass a URL with password as argv.
pg_dump --format=custom --compress=6 --no-owner --no-acl --file="$tmp" --dbname="$PGDATABASE"
# Verify the archive's full SQL/data stream can be decoded (not merely TOC).
pg_restore --file=/dev/null "$tmp"
mv -- "$tmp" "$destination/$filename"
trap - EXIT
(
  cd -- "$destination"
  sha256sum "$filename" > "$filename.sha256"
)
chmod 600 "$destination/$filename" "$destination/$filename.sha256"
echo "Private backup created and verified: $destination/$filename"
echo "Now copy the .dump and .sha256 into the owner's PRIVATE offsite storage."
echo "A full restore rehearsal must be performed on a separate disposable database."
