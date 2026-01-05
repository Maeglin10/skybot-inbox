#!/usr/bin/env bash
set -e

echo "Checking for forbidden direct fetch (must use /api/proxy)..."

HITS=$(grep -RIn --include='*.ts' --include='*.tsx' "fetch(" src | grep -v "/api/proxy" || true)

if [ -n "$HITS" ]; then
  echo "❌ Direct fetch detected:"
  echo "$HITS"
  exit 1
fi

echo "✅ OK: all fetch go through /api/proxy"