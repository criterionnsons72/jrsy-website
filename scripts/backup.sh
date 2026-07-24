#!/usr/bin/env bash
# Tailor Master — database backup helper.
# Creates a timestamped, compressed pg_dump. For production, run on a schedule
# and ship the artifact to object storage with a retention policy (PITR is also
# enabled on the managed database — see docs/stage-5).
#
# Usage: DATABASE_URL=postgres://... ./scripts/backup.sh [output_dir]
set -euo pipefail

OUT_DIR="${1:-./backups}"
mkdir -p "$OUT_DIR"

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is required" >&2
  exit 1
fi

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
FILE="$OUT_DIR/tailor-master-$STAMP.sql.gz"

echo "Backing up to $FILE ..."
pg_dump "$DATABASE_URL" --no-owner --no-privileges | gzip > "$FILE"
echo "Done: $FILE ($(du -h "$FILE" | cut -f1))"

# Restore (verify periodically):
#   gunzip -c "$FILE" | psql "$RESTORE_DATABASE_URL"
