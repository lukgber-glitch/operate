#!/bin/bash
# TrueLayer PIS API Endpoint Tests
# Run this after starting the API server to test all PIS endpoints

API_URL="http://localhost:3001/api/v1"
JWT_TOKEN="YOUR_JWT_TOKEN_HERE"  # Replace with actual JWT token

echo "🚀 TrueLayer PIS Endpoint Tests"
echo "================================"
echo ""

# Test 1: Create Payment
echo "📝 Test 1: Create Payment"
echo "POST $API_URL/integrations/truelayer/payments"

PAYMENT_RESPONSE=$(curl -s -X POST "$API_URL/integrations/truelayer/payments" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 150.00,
    "currency": "GBP",
    "beneficiaryName": "ACME Corporation Ltd",
    "beneficiaryIban": "GB29NWBK60161331926819",
    "reference": "Invoice INV-2024-001",
    "description": "Payment for consulting services",
    "sourceType": "INVOICE"
  }')

echo "$PAYMENT_RESPONSE" | jq .
PAYMENT_ID=$(echo "$PAYMENT_RESPONSE" | jq -r '.paymentId')
echo "✅ Payment ID: $PAYMENT_ID"
echo ""

# Test 2: Get Payment Status
echo "📊 Test 2: Get Payment Status"
echo "GET $API_URL/integrations/truelayer/payments/$PAYMENT_ID"

curl -s "$API_URL/integrations/truelayer/payments/$PAYMENT_ID" \
  -H "Authorization: Bearer $JWT_TOKEN" | jq .
echo ""

# Test 3: List Payments
echo "📋 Test 3: List All Payments"
echo "GET $API_URL/integrations/truelayer/payments?limit=10"

curl -s "$API_URL/integrations/truelayer/payments?limit=10" \
  -H "Authorization: Bearer $JWT_TOKEN" | jq .
echo ""

# Test 4: List Payments with Filter
echo "🔍 Test 4: List Payments (Filtered by Status)"
echo "GET $API_URL/integrations/truelayer/payments?status=AUTHORIZATION_REQUIRED"

curl -s "$API_URL/integrations/truelayer/payments?status=AUTHORIZATION_REQUIRED" \
  -H "Authorization: Bearer $JWT_TOKEN" | jq .
echo ""

# Test 5: Cancel Payment
echo "❌ Test 5: Cancel Payment"
echo "DELETE $API_URL/integrations/truelayer/payments/$PAYMENT_ID"

curl -s -X DELETE "$API_URL/integrations/truelayer/payments/$PAYMENT_ID" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason": "Test cancellation"}' \
  -w "Status: %{http_code}\n"
echo ""

# Test 6: Create Payment with UK Account
echo "🏦 Test 6: Create Payment (UK Account Details)"
echo "POST $API_URL/integrations/truelayer/payments"

curl -s -X POST "$API_URL/integrations/truelayer/payments" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 250.00,
    "currency": "GBP",
    "beneficiaryName": "John Smith",
    "beneficiarySortCode": "12-34-56",
    "beneficiaryAccountNumber": "12345678",
    "reference": "Expense reimbursement",
    "sourceType": "EXPENSE"
  }' | jq .
echo ""

# Test 7: Validation - Amount Too Small
echo "⚠️  Test 7: Validation - Amount Too Small"
echo "POST $API_URL/integrations/truelayer/payments"

curl -s -X POST "$API_URL/integrations/truelayer/payments" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 0.001,
    "currency": "GBP",
    "beneficiaryName": "Test",
    "beneficiaryIban": "GB29NWBK60161331926819"
  }' | jq .
echo ""

# Test 8: Validation - Missing Beneficiary Details
echo "⚠️  Test 8: Validation - Missing Beneficiary Details"
echo "POST $API_URL/integrations/truelayer/payments"

curl -s -X POST "$API_URL/integrations/truelayer/payments" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 100.00,
    "currency": "GBP",
    "beneficiaryName": "Test"
  }' | jq .
echo ""

echo "✅ All tests complete!"
echo ""
echo "Note: Make sure to:"
echo "1. Replace YOUR_JWT_TOKEN_HERE with actual JWT"
echo "2. Start API server on port 3001"
echo "3. Enable sandbox mode (TRUELAYER_ENV=sandbox)"
