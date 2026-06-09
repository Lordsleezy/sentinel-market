#!/usr/bin/env bash
set -euo pipefail
MEDUSA_URL="https://legion.sentinelprime.org"
PK="pk_4f2a7194ea759c0f8e4ac2eb8f9acc575acf9195e46d349f2a3f564eb6a59469"

echo "=== Regions ==="
curl -s "$MEDUSA_URL/store/regions" -H "x-publishable-api-key: $PK" | python3 -m json.tool | head -40

echo ""
echo "=== Payment providers (all) ==="
curl -s "$MEDUSA_URL/store/payment-providers" -H "x-publishable-api-key: $PK" | python3 -m json.tool

CART_ID="cart_01KTQB1MJTWHFEK1CCW0Q34XVN"
echo ""
echo "=== Payment collection for cart ==="
PC=$(curl -s -X POST "$MEDUSA_URL/store/payment-collections" \
  -H "Content-Type: application/json" \
  -H "x-publishable-api-key: $PK" \
  -d "{\"cart_id\":\"$CART_ID\"}")
echo "$PC" | python3 -m json.tool | head -30
