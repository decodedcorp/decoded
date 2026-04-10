#!/usr/bin/env bash
# E2E 코드 커버리지 임계값 체크
# Usage: bash scripts/check-coverage.sh [threshold]
set -euo pipefail

THRESHOLD="${1:-30}"
LCOV_FILE="coverage/lcov.info"

if [ ! -f "$LCOV_FILE" ]; then
  echo "ERROR: $LCOV_FILE not found. Run E2E tests with E2E_COVERAGE=1 first."
  exit 1
fi

# Parse lcov.info for line coverage
LINES_FOUND=$(grep -c "^DA:" "$LCOV_FILE" || echo "0")
LINES_HIT=$(grep "^DA:" "$LCOV_FILE" | awk -F, '$2 > 0' | wc -l | tr -d ' ')

if [ "$LINES_FOUND" -eq 0 ]; then
  echo "ERROR: No coverage data found in $LCOV_FILE"
  exit 1
fi

COVERAGE=$(( LINES_HIT * 100 / LINES_FOUND ))

echo "=== E2E Code Coverage ==="
echo "  Lines found: $LINES_FOUND"
echo "  Lines hit:   $LINES_HIT"
echo "  Coverage:    ${COVERAGE}%"
echo "  Threshold:   ${THRESHOLD}%"

if [ "$COVERAGE" -lt "$THRESHOLD" ]; then
  echo "FAIL: Coverage ${COVERAGE}% is below threshold ${THRESHOLD}%"
  exit 1
fi

echo "PASS: Coverage ${COVERAGE}% meets threshold ${THRESHOLD}%"
