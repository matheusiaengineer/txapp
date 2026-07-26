#!/bin/bash
set -e

BASE_URL="${1:-http://localhost:3099}"
PASS=0
FAIL=0

check() {
  local route="$1"
  local expected="${2:-200}"
  local status
  status=$(curl -s -o /dev/null -w '%{http_code}' "${BASE_URL}${route}")
  if [ "$status" = "$expected" ]; then
    echo "  ✓ ${route} -> ${status}"
    PASS=$((PASS + 1))
  else
    echo "  ✗ ${route} -> ${status} (expected ${expected})"
    FAIL=$((FAIL + 1))
  fi
}

echo "=== TXAP Smoke Test ==="
echo "Base URL: ${BASE_URL}"
echo ""

echo "--- Pages ---"
check "/"
check "/auth/login"
check "/auth/register"
check "/ride"
check "/home"
check "/dashboard/passenger"
check "/dashboard/driver"
check "/dashboard/driver/map"
check "/dashboard/driver/earnings"
check "/dashboard/driver/wallet"
check "/dashboard/driver/trips"
check "/dashboard/driver/kyc"
check "/dashboard/driver/pricing"
check "/verification"

echo ""
echo "--- APIs (unauthenticated) ---"
check "/api/drivers/nearby?lat=-23.56&lng=-46.65" 200
check "/api/geocoding?q=Paulista&limit=3" 200
check "/api/routing?origin=-23.56,-46.65&destination=-23.55,-46.64" 200
check "/api/location/coverage" 200

echo ""
echo "--- Auth-protected APIs (expect 401) ---"
check "/api/payments" 401
check "/api/wallet/balance" 401

echo ""
echo "=== Results: ${PASS} passed, ${FAIL} failed ==="
[ "$FAIL" -eq 0 ] && exit 0 || exit 1
