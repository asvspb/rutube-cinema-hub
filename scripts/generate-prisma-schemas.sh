#!/usr/bin/env bash
set -euo pipefail

root_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
base_schema="$root_dir/prisma/schema.base.prisma"

sqlite_schema="$root_dir/prisma/schema.prisma"
postgres_schema="$root_dir/prisma/schema.postgres.prisma"

timestamp="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"

if [[ ! -f "$base_schema" ]]; then
  echo "Base schema not found: $base_schema" >&2
  exit 1
fi

generate_schema() {
  local provider="$1"
  local out_file="$2"

  {
    echo "// AUTO-GENERATED at $timestamp"
    echo "// Do not edit directly. Edit prisma/schema.base.prisma instead."
    echo
    echo "datasource db {"
    echo "  provider = \"$provider\""
    echo "  url      = env(\"DATABASE_URL\")"
    echo "}"
    echo
    cat "$base_schema"
  } > "$out_file"
}

generate_schema "sqlite" "$sqlite_schema"
generate_schema "postgresql" "$postgres_schema"

echo "Generated: $sqlite_schema"
echo "Generated: $postgres_schema"

