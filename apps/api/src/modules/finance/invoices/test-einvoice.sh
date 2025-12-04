#!/bin/bash

# Test script for E-Invoice generation endpoints
# Usage: ./test-einvoice.sh <JWT_TOKEN> <ORG_ID> <INVOICE_ID>

TOKEN=${1:-"your-jwt-token"}
ORG_ID=${2:-"test-org-id"}
INVOICE_ID=${3:-"test-invoice-id"}
BASE_URL="http://localhost:3000/api"

echo "=== E-Invoice Generation Tests ==="
echo "Token: ${TOKEN:0:20}..."
echo "Org ID: $ORG_ID"
echo "Invoice ID: $INVOICE_ID"
echo ""

# Test 1: Standard PDF
echo "Test 1: Standard PDF Generation"
curl -s -X GET "$BASE_URL/organisations/$ORG_ID/invoices/$INVOICE_ID/generate?format=standard" \
  -H "Authorization: Bearer $TOKEN" \
  | jq -r '.contentType, .filename' 2>/dev/null || echo "FAILED"
echo ""

# Test 2: ZUGFeRD EN16931
echo "Test 2: ZUGFeRD PDF (EN16931 profile)"
curl -s -X GET "$BASE_URL/organisations/$ORG_ID/invoices/$INVOICE_ID/generate?format=zugferd&zugferdProfile=EN16931" \
  -H "Authorization: Bearer $TOKEN" \
  | jq -r '.contentType, .filename' 2>/dev/null || echo "FAILED"
echo ""

# Test 3: ZUGFeRD BASIC
echo "Test 3: ZUGFeRD PDF (BASIC profile)"
curl -s -X GET "$BASE_URL/organisations/$ORG_ID/invoices/$INVOICE_ID/generate?format=zugferd&zugferdProfile=BASIC" \
  -H "Authorization: Bearer $TOKEN" \
  | jq -r '.contentType, .filename' 2>/dev/null || echo "FAILED"
echo ""

# Test 4: Factur-X (alias for ZUGFeRD)
echo "Test 4: Factur-X PDF"
curl -s -X GET "$BASE_URL/organisations/$ORG_ID/invoices/$INVOICE_ID/generate?format=facturx&zugferdProfile=EN16931" \
  -H "Authorization: Bearer $TOKEN" \
  | jq -r '.contentType, .filename' 2>/dev/null || echo "FAILED"
echo ""

# Test 5: XRechnung UBL
echo "Test 5: XRechnung XML (UBL syntax)"
curl -s -X GET "$BASE_URL/organisations/$ORG_ID/invoices/$INVOICE_ID/generate?format=xrechnung&xrechnungSyntax=UBL" \
  -H "Authorization: Bearer $TOKEN" \
  | jq -r '.contentType, .filename' 2>/dev/null || echo "FAILED"
echo ""

# Test 6: XRechnung CII
echo "Test 6: XRechnung XML (CII syntax)"
curl -s -X GET "$BASE_URL/organisations/$ORG_ID/invoices/$INVOICE_ID/generate?format=xrechnung&xrechnungSyntax=CII" \
  -H "Authorization: Bearer $TOKEN" \
  | jq -r '.contentType, .filename' 2>/dev/null || echo "FAILED"
echo ""

# Test 7: Invalid format (should fail)
echo "Test 7: Invalid format (expected to fail)"
curl -s -X GET "$BASE_URL/organisations/$ORG_ID/invoices/$INVOICE_ID/generate?format=invalid" \
  -H "Authorization: Bearer $TOKEN" \
  | jq -r '.statusCode, .message' 2>/dev/null || echo "FAILED AS EXPECTED"
echo ""

echo "=== Tests Complete ==="
