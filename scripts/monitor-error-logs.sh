#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG_FILE="$ROOT_DIR/server/logs/error_logs.json"
INTERVAL_SEC="${INTERVAL_SEC:-5}"
EXIT_ON_ERROR="${EXIT_ON_ERROR:-false}"
LAST_TIMESTAMP=""

print_status() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

if [ ! -f "$LOG_FILE" ]; then
  print_status "Log file not found: $LOG_FILE (waiting for logs)"
  while [ ! -f "$LOG_FILE" ]; do
    sleep "$INTERVAL_SEC"
  done
fi

print_status "Monitoring $LOG_FILE every ${INTERVAL_SEC}s"

while true; do
  if [ -f "$LOG_FILE" ]; then
    NEW_ENTRIES=$(node -e "
const fs = require('fs');
const file = process.argv[1];
const last = process.argv[2];
let data = [];
try {
  data = JSON.parse(fs.readFileSync(file, 'utf8') || '[]');
} catch (e) {
  console.error('Failed to parse log file:', e.message);
  process.exit(2);
}
const entries = Array.isArray(data) ? data : [];
const fresh = last ? entries.filter(e => e.timestamp && e.timestamp > last) : entries;
const errors = fresh.filter(e => String(e.level || '').toLowerCase() === 'error');
if (errors.length === 0) {
  process.exit(0);
}
console.log(JSON.stringify({ latest: errors[errors.length - 1]?.timestamp || '', errors }, null, 2));
" "$LOG_FILE" "$LAST_TIMESTAMP" || true)

    if [ -n "$NEW_ENTRIES" ]; then
      print_status "Detected new error log entries"
      echo "$NEW_ENTRIES"
      if [ "$EXIT_ON_ERROR" = "true" ]; then
        exit 2
      fi
      LAST_TIMESTAMP=$(node -e "
const payload = JSON.parse(process.argv[1]);
console.log(payload.latest || '');
" "$NEW_ENTRIES")
    fi
  fi
  sleep "$INTERVAL_SEC"
done
