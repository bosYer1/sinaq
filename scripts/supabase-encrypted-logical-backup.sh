#!/usr/bin/env bash
set -euo pipefail

# GameYer Supabase logical backup utility.
# Required:
#   DATABASE_URL          Postgres connection string with read access to the full database.
#   BACKUP_PASSPHRASE     Strong secret used only through stdin by GPG.
# Optional:
#   BACKUP_DIR            Destination directory. Defaults to ./backups (gitignored by policy).
#
# The script never uploads or commits the dump. Store the resulting .gpg file off-site
# (private Drive/B2/private backup storage). Never place it in the public repository.

: "${DATABASE_URL:?DATABASE_URL is required}"
: "${BACKUP_PASSPHRASE:?BACKUP_PASSPHRASE is required}"

for command in pg_dump pg_restore gpg sha256sum; do
  if ! command -v "$command" >/dev/null 2>&1; then
    echo "Missing required command: $command" >&2
    exit 1
  fi
done

backup_dir="${BACKUP_DIR:-./backups}"
mkdir -p "$backup_dir"
chmod 700 "$backup_dir"

stamp="$(date -u +'%Y%m%dT%H%M%SZ')"
archive="$backup_dir/gameyer-supabase-$stamp.dump"
encrypted="$archive.gpg"
checksum="$encrypted.sha256"
verify_tmp="$backup_dir/.verify-$stamp.dump"

cleanup() {
  rm -f "$archive" "$verify_tmp"
}
trap cleanup EXIT INT TERM

umask 077

echo "Creating logical database dump..."
pg_dump   --dbname="$DATABASE_URL"   --format=custom   --no-owner   --no-privileges   --file="$archive"

echo "Validating PostgreSQL archive..."
pg_restore --list "$archive" >/dev/null

echo "Encrypting backup..."
gpg   --batch   --yes   --pinentry-mode loopback   --cipher-algo AES256   --symmetric   --passphrase-fd 3   --output "$encrypted"   "$archive"   3<<<"$BACKUP_PASSPHRASE"

chmod 600 "$encrypted"

echo "Verifying encrypted round trip..."
gpg   --batch   --yes   --pinentry-mode loopback   --passphrase-fd 3   --decrypt "$encrypted"   > "$verify_tmp"   3<<<"$BACKUP_PASSPHRASE"

pg_restore --list "$verify_tmp" >/dev/null

sha256sum "$encrypted" > "$checksum"
chmod 600 "$checksum"

echo "Backup verified:"
printf '  %s\n' "$encrypted"
printf '  %s\n' "$checksum"
echo "Move both files to private off-site storage. Do not commit them."
