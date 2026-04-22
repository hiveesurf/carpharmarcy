#!/usr/bin/env bash
# Same /api/v1 routes as the React app (Spring on :8080 = Vite dev proxy target).
set -u
BASE="${API_BASE:-http://127.0.0.1:8080/api/v1}"
USER_JAR=$(mktemp)
ADMIN_JAR=$(mktemp)
trap 'rm -f "$USER_JAR" "$ADMIN_JAR"' EXIT

ok_json() { [[ "$(echo "$1" | jq -r '.success // false')" == "true" ]]; }

pass=0
fail=0
skip=0
declare -a ROWS

record() {
  local st="$1" name="$2" detail="${3:-}"
  ROWS+=("$st|$name|$detail")
  case "$st" in
    OK) ((pass++)) || true ;;
    FAIL) ((fail++)) || true ;;
    SKIP) ((skip++)) || true ;;
  esac
}

# run NAME curl-args...
run() {
  local name="$1"
  shift
  local body
  body=$("$@" 2>/dev/null) || true
  if ok_json "$body"; then
    record OK "$name" ""
  else
    local d
    d=$(echo "$body" | jq -c 'if .error then .error else {raw: .} end' 2>/dev/null | head -c 160)
    record FAIL "$name" "${d:-error}"
  fi
  printf '%s\n' "$body"
}

echo "Base: $BASE (same paths frontend uses via /api/v1 proxy)"
echo ""

run "GET /health" curl -sS "$BASE/health"

run "POST /auth/send-otp" curl -sS -c "$USER_JAR" -b "$USER_JAR" -H "Content-Type: application/json" \
  -d '{"phone":"9876543210"}' "$BASE/auth/send-otp"

VERIFY=$(curl -sS -c "$USER_JAR" -b "$USER_JAR" -H "Content-Type: application/json" \
  -d '{"phone":"9876543210","otp":"123456"}' "$BASE/auth/verify-otp")
if ok_json "$VERIFY"; then record OK "POST /auth/verify-otp" ""; else record FAIL "POST /auth/verify-otp" "$(echo "$VERIFY" | jq -c .error 2>/dev/null | head -c 120)"; fi

TOKEN=$(echo "$VERIFY" | jq -r '.data.accessToken // empty')

REFRESH=$(curl -sS -c "$USER_JAR" -b "$USER_JAR" -H "Content-Type: application/json" -d "{}" "$BASE/auth/refresh-token")
if ok_json "$REFRESH"; then
  record OK "POST /auth/refresh-token" ""
  RT=$(echo "$REFRESH" | jq -r '.data.accessToken // empty')
  [[ -n "$RT" ]] && TOKEN="$RT"
else
  record FAIL "POST /auth/refresh-token" "$(echo "$REFRESH" | jq -c .error 2>/dev/null | head -c 120)"
fi

GUEST="aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"
usercurl() { curl -sS -c "$USER_JAR" -b "$USER_JAR" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -H "X-Guest-Session: $GUEST" "$@"; }

PARTS=$(usercurl "$BASE/products?type=part")
if ok_json "$PARTS"; then record OK "GET /products?type=part" ""; else record FAIL "GET /products?type=part" ""; fi
PID=$(echo "$PARTS" | jq -r '.data.items[0].id // empty')

VEH=$(usercurl "$BASE/products?type=vehicle")
if ok_json "$VEH"; then record OK "GET /products?type=vehicle" ""; else record FAIL "GET /products?type=vehicle" ""; fi
VID=$(echo "$VEH" | jq -r '.data.items[0].id // empty')

run "GET /categories" usercurl "$BASE/categories"

if [[ -n "$PID" ]]; then
  run "GET /products/{id}" usercurl "$BASE/products/$PID"
else
  record SKIP "GET /products/{id}" "no part in catalog"
fi

run "GET /cart (initial)" usercurl "$BASE/cart"

ADD=$(usercurl -X POST -d "{\"productId\":\"$PID\",\"quantity\":1}" "$BASE/cart")
if ok_json "$ADD"; then record OK "POST /cart (add line)" ""; else record FAIL "POST /cart (add line)" "$(echo "$ADD" | jq -c .error 2>/dev/null | head -c 120)"; fi
ITEM=$(echo "$ADD" | jq -r '.data.itemId // empty')
[[ -z "$ITEM" ]] && ITEM=$(usercurl "$BASE/cart" | jq -r '.data.items[0].id // empty')

CART2=$(usercurl "$BASE/cart")
if ok_json "$CART2"; then record OK "GET /cart (with lines)" ""; else record FAIL "GET /cart (with lines)" ""; fi

if [[ -n "$ITEM" ]]; then
  run "PUT /cart/{itemId}" usercurl -X PUT -d '{"quantity":1}' "$BASE/cart/$ITEM"
  run "DELETE /cart/{itemId}" usercurl -X DELETE "$BASE/cart/$ITEM"
else
  record SKIP "PUT /cart/{itemId}" "no line id"
  record SKIP "DELETE /cart/{itemId}" "no line id"
fi

ADDU=$(usercurl -X POST -d "{\"productId\":\"$PID\",\"quantity\":1}" "$BASE/cart")
if ok_json "$ADDU"; then record OK "POST /cart (for checkout)" ""; else record FAIL "POST /cart (for checkout)" ""; fi

run "GET /wishlist" usercurl "$BASE/wishlist"

if [[ -n "$PID" ]]; then
  run "POST /wishlist/toggle" usercurl -X POST -d "{\"productId\":\"$PID\"}" "$BASE/wishlist/toggle"
else
  record SKIP "POST /wishlist/toggle" "no product id"
fi

run "GET /user/profile" usercurl "$BASE/user/profile"
run "PUT /user/profile" usercurl -X PUT -d '{"fullName":"API Smoke User"}' "$BASE/user/profile"

run "GET /addresses" usercurl "$BASE/addresses"

ADDR=$(usercurl -X POST -d '{"line1":"1 Test St","city":"Mumbai","pincode":"400001","country":"IN","label":"Home"}' "$BASE/addresses")
if ok_json "$ADDR"; then record OK "POST /addresses" ""; else record FAIL "POST /addresses" ""; fi
AID=$(echo "$ADDR" | jq -r '.data.address.id // empty')

if [[ -n "$AID" ]]; then
  run "PUT /addresses/{id}" usercurl -X PUT -d '{"line1":"2 Test St","city":"Mumbai","pincode":"400002","country":"IN"}' "$BASE/addresses/$AID"
else
  record SKIP "PUT /addresses/{id}" "no address id"
fi

ORD=$(usercurl -X POST -d "{\"addressId\":\"$AID\"}" "$BASE/orders")
if ok_json "$ORD"; then record OK "POST /orders" ""; else record FAIL "POST /orders" "$(echo "$ORD" | jq -c .error 2>/dev/null | head -c 120)"; fi

run "GET /orders" usercurl "$BASE/orders"
OID=$(usercurl "$BASE/orders" | jq -r '.data.items[0].id // empty')
if [[ -n "$OID" ]]; then
  run "GET /orders/{id}" usercurl "$BASE/orders/$OID"
else
  record SKIP "GET /orders/{id}" "no order id"
fi

if [[ -n "$AID" ]]; then
  run "DELETE /addresses/{id}" usercurl -X DELETE "$BASE/addresses/$AID"
else
  record SKIP "DELETE /addresses/{id}" "no address id"
fi

run "DELETE /cart (clear)" usercurl -X DELETE "$BASE/cart"

run "POST /auth/logout" curl -sS -c "$USER_JAR" -b "$USER_JAR" -H "Content-Type: application/json" -d "{}" "$BASE/auth/logout"

run "GET /vehicle/brands" curl -sS "$BASE/vehicle/brands"
BID=$(curl -sS "$BASE/vehicle/brands" | jq -r '.data.items[0].id // .data.items[0].brandId // empty')
if [[ -n "$BID" ]]; then
  run "GET /vehicle/models" curl -sS "$BASE/vehicle/models?brandId=$BID"
else
  record SKIP "GET /vehicle/models" "no brand id"
fi

run "GET /vehicle/years" curl -sS "$BASE/vehicle/years"
run "GET /vehicle/variants" curl -sS "$BASE/vehicle/variants"
run "POST /search/vehicle" curl -sS -H "Content-Type: application/json" -d '{"brand":"x"}' "$BASE/search/vehicle"
run "POST /search/plate" curl -sS -H "Content-Type: application/json" -d '{"plate":"KA01AB1234"}' "$BASE/search/plate"
run "POST /leads/seller" curl -sS -H "Content-Type: application/json" -d '{"name":"Test","phone":"9876543210"}' "$BASE/leads/seller"

if [[ -n "$VID" ]]; then
  run "POST /compat/vehicle-enquiry/{id}" curl -sS -H "Content-Type: application/json" -d '{"message":"smoke"}' "$BASE/compat/vehicle-enquiry/$VID"
else
  record SKIP "POST /compat/vehicle-enquiry" "no vehicle id"
fi

run "POST /admin/auth/login" curl -sS -c "$ADMIN_JAR" -b "$ADMIN_JAR" -H "Content-Type: application/json" \
  -d '{"email":"admin@carnalysys.com","password":"admin123"}' "$BASE/admin/auth/login"

admincurl() { curl -sS -b "$ADMIN_JAR" -c "$ADMIN_JAR" -H "Content-Type: application/json" "$@"; }

run "GET /admin/dashboard" admincurl "$BASE/admin/dashboard"
run "GET /admin/products" admincurl "$BASE/admin/products"
run "GET /admin/categories" admincurl "$BASE/admin/categories"
run "GET /admin/orders" admincurl "$BASE/admin/orders"
run "GET /admin/users" admincurl "$BASE/admin/users"

ADMIN_UID=$(admincurl "$BASE/admin/users" | jq -r '.data.items[0].id // empty')
if [[ -n "$ADMIN_UID" ]]; then
  run "GET /admin/users/{id}" admincurl "$BASE/admin/users/$ADMIN_UID"
else
  record SKIP "GET /admin/users/{id}" "no users"
fi

APID=$(admincurl "$BASE/admin/products" | jq -r '.data.items[0].id // empty')
if [[ -n "$APID" ]]; then
  PLINE=$(admincurl "$BASE/admin/products/$APID")
  PUB=$(echo "$PLINE" | jq -r '.data.product.published // true')
  NEWPUB="false"; [[ "$PUB" == "false" ]] && NEWPUB="true"
  run "PATCH /admin/products/{id}/publish" admincurl -X PATCH -d "{\"published\":$NEWPUB}" "$BASE/admin/products/$APID/publish"
  run "PATCH /admin/products/{id}/publish (restore)" admincurl -X PATCH -d "{\"published\":$PUB}" "$BASE/admin/products/$APID/publish"
else
  record SKIP "PATCH /admin/products/{id}/publish" "no product"
fi

A_OID=$(admincurl "$BASE/admin/orders" | jq -r '.data.items[0].id // empty')
if [[ -n "$A_OID" ]]; then
  run "PATCH /admin/orders/{id}/status" admincurl -X PATCH -d '{"status":"processing"}' "$BASE/admin/orders/$A_OID/status"
else
  record SKIP "PATCH /admin/orders/{id}/status" "no orders"
fi

echo ""
echo "========== Results (mirror frontend API module) =========="
for r in "${ROWS[@]}"; do
  IFS='|' read -r st n d <<< "$r"
  printf "%-6s %s %s\n" "$st" "$n" "${d:+($d)}"
done

total=$((pass + fail))
echo ""
echo "Succeeded (OK): $pass"
echo "Failed (FAIL):  $fail"
echo "Skipped:        $skip"
echo "Total checks:   $((pass + fail + skip))"
if [[ "$total" -gt 0 ]]; then
  echo "Success rate:   $((100 * pass / total))% (OK of OK+FAIL, skips excluded)"
fi
