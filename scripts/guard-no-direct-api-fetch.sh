#!/usr/bin/env bash
set -euo pipefail

ROOT="${1:-src}"
BAD=$(grep -RIn --include='*.ts' --include='*.tsx' 'fetch(["`]/api/' "$ROOT" \
  | grep -v '/api/proxy' || true)

if [[ -n "$BAD" ]]; then
  echo "❌ Direct fetch('/api/*') found (must use /api/proxy via api.client/api.server):"
  echo "$BAD"
  exit 1
fi

echo "✅ No direct fetch('/api/*') outside /api/proxy"
