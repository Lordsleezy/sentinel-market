#!/usr/bin/env bash
set -euo pipefail
MEDUSA_URL="https://legion.sentinelprime.org"
SK="sk_8d723f88ac7046dd80d7c46d5c59820a8dc0bb5a72597472d944b1fd5404b3fa"
PK="pk_4f2a7194ea759c0f8e4ac2eb8f9acc575acf9195e46d349f2a3f564eb6a59469"
BASIC=$(echo -n "${SK}:" | base64 -w0)

echo "=== API Keys ==="
curl -s "$MEDUSA_URL/admin/api-keys" -H "Authorization: Basic $BASIC" | python3 -m json.tool | head -50

echo ""
echo "=== Create cart ==="
CART=$(curl -s -X POST "$MEDUSA_URL/store/carts" \
  -H "Content-Type: application/json" \
  -H "x-publishable-api-key: $PK" \
  -d '{}')
echo "$CART" | python3 -m json.tool | head -20
CART_ID=$(echo "$CART" | python3 -c "import sys,json; print(json.load(sys.stdin)['cart']['id'])")

echo ""
echo "=== Product variants ==="
PROD=$(curl -s "$MEDUSA_URL/store/products?limit=1" -H "x-publishable-api-key: $PK")
VARIANT_ID=$(echo "$PROD" | python3 -c "import sys,json; p=json.load(sys.stdin)['products'][0]; print(p['variants'][0]['id'])")
echo "variant: $VARIANT_ID"

echo ""
echo "=== Add line item ==="
curl -s -X POST "$MEDUSA_URL/store/carts/$CART_ID/line-items" \
  -H "Content-Type: application/json" \
  -H "x-publishable-api-key: $PK" \
  -d "{\"variant_id\":\"$VARIANT_ID\",\"quantity\":1}" | python3 -m json.tool | head -30

echo ""
echo "=== Payment providers ==="
curl -s "$MEDUSA_URL/store/payment-providers?region_id=reg_01KTQ208T8Y0Y0Y0Y0Y0Y0Y0" -H "x-publishable-api-key: $PK" 2>/dev/null || \
curl -s "$MEDUSA_URL/store/payment-providers" -H "x-publishable-api-key: $PK" | python3 -m json.tool
