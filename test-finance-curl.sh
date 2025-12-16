#!/bin/bash

# Finance Pages Browser Test using curl
# Tests all finance-related pages on https://operate.guru

BASE_URL="https://operate.guru"

# Array of pages to test
declare -a PAGES=(
    "/finance:Finance Dashboard"
    "/finance/invoices:Invoice List"
    "/finance/invoices/new:Create Invoice"
    "/finance/invoices/recurring:Recurring Invoices"
    "/finance/expenses:Expense List"
    "/finance/expenses/new:Create Expense"
    "/finance/expenses/scan:Receipt Scanning"
    "/finance/transactions:Transaction List"
    "/finance/bank-accounts:Bank Connections"
    "/finance/banking:Banking Dashboard"
    "/finance/accounts:Chart of Accounts"
    "/finance/payments:Payments List"
    "/finance/reconciliation:Bank Reconciliation"
)

TOTAL=0
PASSED=0
FAILED=0

echo "=========================================="
echo "Finance Pages Test Report"
echo "=========================================="
echo "Base URL: $BASE_URL"
echo "Total Pages: ${#PAGES[@]}"
echo ""

ISSUES_JSON="["

for PAGE_INFO in "${PAGES[@]}"; do
    IFS=':' read -r PATH NAME <<< "$PAGE_INFO"
    URL="${BASE_URL}${PATH}"

    echo "Testing: $NAME ($PATH)"
    ((TOTAL++))

    # Get HTTP status code
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -L "$URL" 2>&1)

    # Get redirect location if any
    REDIRECT=$(curl -s -I "$URL" 2>&1 | grep -i "location:" | head -1 | cut -d' ' -f2 | tr -d '\r\n')

    if [ "$HTTP_CODE" = "200" ]; then
        echo "  ✓ Status: $HTTP_CODE OK"
        ((PASSED++))
    elif [ "$HTTP_CODE" = "307" ] || [ "$HTTP_CODE" = "302" ] || [ "$HTTP_CODE" = "301" ]; then
        if [[ "$REDIRECT" == *"/login"* ]]; then
            echo "  ✗ Status: $HTTP_CODE - Redirects to login (auth required)"
            ((FAILED++))
            ISSUES_JSON="${ISSUES_JSON}{\"page\":\"$PATH\",\"type\":\"backend\",\"severity\":\"critical\",\"description\":\"Page redirects to login\",\"expected\":\"Page loads or shows auth message\",\"actual\":\"Redirects to $REDIRECT\"},"
        else
            echo "  → Status: $HTTP_CODE - Redirects to: $REDIRECT"
            ((PASSED++))
        fi
    elif [ "$HTTP_CODE" = "404" ]; then
        echo "  ✗ Status: $HTTP_CODE - Not Found"
        ((FAILED++))
        ISSUES_JSON="${ISSUES_JSON}{\"page\":\"$PATH\",\"type\":\"backend\",\"severity\":\"critical\",\"description\":\"Page not found (404)\",\"expected\":\"200 OK\",\"actual\":\"404 Not Found\"},"
    elif [ "$HTTP_CODE" -ge 500 ]; then
        echo "  ✗ Status: $HTTP_CODE - Server Error"
        ((FAILED++))
        ISSUES_JSON="${ISSUES_JSON}{\"page\":\"$PATH\",\"type\":\"backend\",\"severity\":\"critical\",\"description\":\"Server error ($HTTP_CODE)\",\"expected\":\"200 OK\",\"actual\":\"$HTTP_CODE Server Error\"},"
    else
        echo "  ⚠ Status: $HTTP_CODE - Unexpected"
        ((FAILED++))
        ISSUES_JSON="${ISSUES_JSON}{\"page\":\"$PATH\",\"type\":\"backend\",\"severity\":\"medium\",\"description\":\"Unexpected status code\",\"expected\":\"200 OK\",\"actual\":\"$HTTP_CODE\"},"
    fi

    echo ""
done

# Remove trailing comma and close JSON array
ISSUES_JSON="${ISSUES_JSON%,}]"

echo "=========================================="
echo "Summary"
echo "=========================================="
echo "Total Pages: $TOTAL"
echo "Passed: $PASSED ✓"
echo "Failed: $FAILED ✗"
echo "=========================================="

# Create JSON report
cat > C:/Users/grube/op/operate-fresh/finance-curl-test-report.json << EOF
{
  "summary": {
    "total": $TOTAL,
    "passed": $PASSED,
    "failed": $FAILED
  },
  "issues": $ISSUES_JSON
}
EOF

echo ""
echo "Report saved to: finance-curl-test-report.json"
echo ""
echo "Note: This is a basic HTTP test without authentication."
echo "For authenticated testing, use the Puppeteer-based test."
