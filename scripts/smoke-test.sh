#!/usr/bin/env bash
set -euo pipefail

if ! command -v curl >/dev/null 2>&1; then
  echo "curl is required for smoke tests" >&2
  exit 1
fi

APP_URL="http://localhost:9229/"
PROXY_URL="http://localhost:9230/api/proxy?url=https://rutube.ru/channel/32869212/videos/"

echo "Checking dev server..."
APP_STATUS="$(curl -s -o /dev/null -w "%{http_code}" "$APP_URL")"
if [ "$APP_STATUS" != "200" ]; then
  echo "Dev server check failed: $APP_URL returned $APP_STATUS" >&2
  exit 1
fi

echo "Checking proxy..."
PROXY_STATUS="$(curl -s -o /dev/null -w "%{http_code}" "$PROXY_URL")"
if [ "$PROXY_STATUS" != "200" ] && [ "$PROXY_STATUS" != "403" ] && [ "$PROXY_STATUS" != "429" ]; then
  echo "Proxy check failed: $PROXY_URL returned $PROXY_STATUS" >&2
  exit 1
fi

echo "Smoke tests passed."
