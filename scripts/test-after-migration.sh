#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

print_step() {
  echo -e "\n==> $1"
}

print_step "Checking required directories and files"
required_dirs=("src" "src/components" "src/services" "server")
required_files=("src/App.tsx" "src/index.tsx" "src/types.ts" "server/index.js")

for dir in "${required_dirs[@]}"; do
  if [ -d "$ROOT_DIR/$dir" ]; then
    echo "✓ $dir"
  else
    echo "✗ Missing directory: $dir" >&2
    exit 1
  fi
done

for file in "${required_files[@]}"; do
  if [ -f "$ROOT_DIR/$file" ]; then
    echo "✓ $file"
  else
    echo "✗ Missing file: $file" >&2
    exit 1
  fi
done

print_step "Checking Node and npm versions"
node -v
npm -v

print_step "Running TypeScript typecheck"
if npm run -s build >/dev/null; then
  echo "✓ build succeeded"
else
  echo "✗ build failed" >&2
  exit 1
fi

print_step "Running existing smoke tests"
"$ROOT_DIR/scripts/smoke-test.sh"

print_step "All checks completed"
