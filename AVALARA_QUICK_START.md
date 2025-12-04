# Avalara AvaTax - Quick Start Guide

## Overview

The Avalara integration provides US sales tax calculation for Operate/CoachOS. It handles multi-jurisdictional taxes (state + county + city + special districts), product taxability, exemptions, and nexus tracking.

## Setup

### 1. Get Sandbox Credentials

1. Visit https://developer.avalara.com/
2. Create a free sandbox account
3. Navigate to Settings > License and API Keys
4. Copy your Account ID and License Key

### 2. Configure Environment

Add to your `.env` file:

```env
AVALARA_ACCOUNT_ID=your_account_id_here
AVALARA_LICENSE_KEY=your_license_key_here
AVALARA_ENVIRONMENT=sandbox
AVALARA_COMPANY_CODE=DEFAULT
```

### 3. Test Connection

```bash
# Start the API
pnpm dev

# Test health endpoint
curl -X GET http://localhost:3001/api/v1/avalara/health \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Expected response:
{
  "status": "ok",
  "environment": "sandbox"
}
```

## Basic Usage

### Calculate Sales Tax

```typescript
POST /api/v1/avalara/calculate-tax
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN

{
  "customerCode": "CUST-001",
  "destinationAddress": {
    "line1": "410 Terry Ave N",
    "city": "Seattle",
    "state": "WA",
    "postalCode": "98109",
    "country": "US"
  },
  "lines": [
    {
      "itemCode": "PRODUCT-001",
      "description": "Software License",
      "quantity": 1,
      "amount": 100.00,
      "taxCode": "D0301000"
    }
  ]
}
```

Response:
```json
{
  "totalTax": 10.40,
  "rate": 0.104,
  "totalAmount": 110.40,
  "taxableAmount": 100.00,
  "exemptAmount": 0.00,
  "lines": [...],
  "summary": [
    {
      "region": "WA",
      "jurisType": "State",
      "jurisName": "WASHINGTON",
      "rate": 0.065,
      "tax": 6.50
    },
    {
      "region": "WA",
      "jurisType": "City",
      "jurisName": "SEATTLE",
      "rate": 0.039,
      "tax": 3.90
    }
  ]
}
```

### Product Tax Codes

Common tax codes for different product types:

- `P0000000` - Physical goods (tangible property)
- `D0101000` - Digital products (downloads, ebooks)
- `D0301000` - SaaS (Software as a Service)
- `S0101000` - Professional services
- `P0201000` - Groceries (often exempt)
- `P0101000` - Clothing (exempt in some states)

### Validate Address

```typescript
POST /api/v1/avalara/validate-address
{
  "line1": "410 Terry Ave N",
  "city": "Seattle",
  "region": "WA",
  "country": "US",
  "postalCode": "98109"
}
```

### Commit Transaction

After calculating tax, commit it for filing:

```typescript
POST /api/v1/avalara/commit-transaction
{
  "transactionCode": "INV-12345",
  "documentType": "SalesInvoice"
}
```

### Void Transaction

Cancel a committed transaction:

```typescript
POST /api/v1/avalara/void-transaction
{
  "transactionCode": "INV-12345",
  "code": "DocVoided",
  "documentType": "SalesInvoice"
}
```

## Common Scenarios

### Scenario 1: SaaS Subscription

```typescript
{
  "customerCode": "CUST-001",
  "destinationAddress": {
    "line1": "123 Main St",
    "city": "Austin",
    "state": "TX",
    "postalCode": "78701",
    "country": "US"
  },
  "lines": [
    {
      "itemCode": "SAAS-MONTHLY",
      "description": "Monthly Subscription",
      "quantity": 1,
      "amount": 99.00,
      "taxCode": "D0301000"  // SaaS tax code
    }
  ]
}
```

### Scenario 2: Multi-State Sale with Origin Address

```typescript
{
  "customerCode": "CUST-002",
  "originAddress": {
    "line1": "1 Apple Park Way",
    "city": "Cupertino",
    "state": "CA",
    "postalCode": "95014",
    "country": "US"
  },
  "destinationAddress": {
    "line1": "350 5th Ave",
    "city": "New York",
    "state": "NY",
    "postalCode": "10118",
    "country": "US"
  },
  "lines": [
    {
      "itemCode": "PRODUCT-001",
      "quantity": 1,
      "amount": 500.00
    }
  ]
}
```

### Scenario 3: Tax-Exempt Customer

```typescript
{
  "customerCode": "NONPROFIT-001",
  "destinationAddress": {...},
  "lines": [
    {
      "itemCode": "PRODUCT-001",
      "quantity": 1,
      "amount": 100.00,
      "exemptionCode": "EXEMPT-123"  // Exemption certificate
    }
  ],
  "exemptionNo": "CERT-NONPROFIT-001"
}
```

## State-Specific Rules

### Origin-Based States
California - Tax calculated from seller location

### Destination-Based States
Most states - Tax calculated from buyer location:
- New York
- Texas
- Florida
- Washington
- etc.

### Economic Nexus Thresholds

| State | Sales Threshold | Transaction Threshold | Effective Date |
|-------|----------------|---------------------|----------------|
| CA | $500,000 | - | 2019-04-01 |
| NY | $500,000 | 100 | 2019-06-21 |
| TX | $500,000 | - | 2019-10-01 |
| FL | $100,000 | - | 2021-07-01 |
| WA | $100,000 | - | 2018-10-01 |

## Troubleshooting

### Error: "Invalid credentials"
- Check `AVALARA_ACCOUNT_ID` and `AVALARA_LICENSE_KEY`
- Verify you're using sandbox credentials with `AVALARA_ENVIRONMENT=sandbox`
- Ensure no extra spaces in environment variables

### Error: "Company not found"
- Verify `AVALARA_COMPANY_CODE` matches your Avalara account
- Default is "DEFAULT" for sandbox accounts

### Error: "Address not found"
- Use the address validation endpoint first
- Ensure ZIP code is valid
- Include city and state

### Unexpected Tax Rates
- Verify address is accurate (use validation endpoint)
- Check product tax code matches your product type
- Some localities have special tax rates

## Production Deployment

### 1. Get Production Credentials
- Contact Avalara sales for production account
- Complete tax compliance requirements
- Obtain production API credentials

### 2. Update Environment
```env
AVALARA_ENVIRONMENT=production
AVALARA_ACCOUNT_ID=prod_account_id
AVALARA_LICENSE_KEY=prod_license_key
AVALARA_COMPANY_CODE=YOUR_COMPANY
```

### 3. Configure Nexus
In Avalara portal:
- Set up nexus in states where you have tax obligations
- Configure company locations
- Upload exemption certificates

### 4. Test Production
- Run test transactions
- Verify tax calculations
- Check transaction history in Avalara portal

## Best Practices

1. **Cache Results:** For repeated calculations, consider caching for 24 hours
2. **Validate Addresses:** Always validate addresses before tax calculation
3. **Commit Only Final Transactions:** Don't commit estimates or quotes
4. **Handle Errors Gracefully:** Implement fallback tax rates for service outages
5. **Monitor Usage:** Track API usage to avoid rate limits
6. **Log Transactions:** Keep audit trail of all tax calculations
7. **Test Thoroughly:** Test with various addresses and product types

## API Reference

All endpoints require JWT authentication:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

### Calculate Tax
`POST /api/v1/avalara/calculate-tax`

### Commit Transaction
`POST /api/v1/avalara/commit-transaction`

### Void Transaction
`POST /api/v1/avalara/void-transaction`

### Validate Address
`POST /api/v1/avalara/validate-address`

### Health Check
`GET /api/v1/avalara/health`

## Resources

- [Avalara Developer Portal](https://developer.avalara.com/)
- [AvaTax API Reference](https://developer.avalara.com/api-reference/avatax/rest/v2/)
- [Tax Codes Reference](https://taxcode.avatax.avalara.com/)
- [Nexus Guide](https://www.avalara.com/us/en/learn/whitepapers/economic-nexus.html)

## Support

- **Sandbox Issues:** Check Avalara developer forum
- **Production Issues:** Contact Avalara support
- **Integration Issues:** Open ticket in Operate/CoachOS repository
