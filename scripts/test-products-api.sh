#!/usr/bin/env bash
PK="pk_4f2a7194ea759c0f8e4ac2eb8f9acc575acf9195e46d349f2a3f564eb6a59469"
URL="https://legion.sentinelprime.org"
REG="reg_01KTQ208VKWWYN60NXZ6EAX0M8"

curl -s "$URL/store/products?limit=2&region_id=$REG&fields=*variants.calculated_price,+variants.prices" \
  -H "x-publishable-api-key: $PK" | python3 -m json.tool | head -100
