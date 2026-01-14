#!/usr/bin/env bash
set -euo pipefail

tmp=$(mktemp)
npx ts-node scripts/sign-whatsapp.ts > "$tmp"

SIG="$(jq -r '.signature' "$tmp")"
PAYLOAD="$(jq -r '.payload' "$tmp")"

curl -i -X POST http://127.0.0.1:3001/webhooks/whatsapp \
  -H "Content-Type: application/json" \
  -H "x-hub-signature-256: $SIG" \
  --data "$PAYLOAD"