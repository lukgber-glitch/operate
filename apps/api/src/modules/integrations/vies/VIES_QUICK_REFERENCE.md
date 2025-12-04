# VIES Integration - Quick Reference Guide

## 1. Overview

The VIES (VAT Information Exchange System) integration provides EU VAT number validation via the official EU Commission service.

**Purpose**: Validate EU business VAT numbers for cross-border transactions and compliance.

## 2. Quick Start

### Basic Validation

```typescript
import { ViesService } from './modules/integrations/vies';

// Inject the service
constructor(private readonly viesService: ViesService) {}

// Validate a VAT number
const result = await this.viesService.validateVat('DE123456789');

if (result.valid) {
  console.log('✓ Valid VAT:', result.name, result.address);
} else {
  console.log('✗ Invalid VAT:', result.errorMessage);
}
```

### Bulk Validation

```typescript
const results = await this.viesService.validateBulk([
  'DE123456789',
  'FR12345678901',
  'NL123456789B01'
]);

console.log(`Valid: ${results.valid}, Invalid: ${results.invalid}`);
```

### Cross-Border Rules

```typescript
const rules = this.viesService.getCrossBorderRules(
  'DE', // Supplier country
  'FR', // Customer country
  true  // Customer VAT is valid
);

if (rules.reverseChargeApplicable) {
  console.log('Apply reverse charge mechanism');
}
```

## 3. API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/v1/vat/validate` | Validate single VAT |
| GET | `/api/v1/vat/validate/:vatNumber` | Quick validation |
| POST | `/api/v1/vat/validate/bulk` | Bulk validation (max 10) |
| POST | `/api/v1/vat/cross-border-rules` | Get VAT rules |
| GET | `/api/v1/vat/health` | Health check |

## 4. Common Use Cases

### Use Case 1: Invoice Creation for EU Customer

```typescript
async createInvoice(customerId: string, items: InvoiceItem[]) {
  const customer = await this.getCustomer(customerId);

  // Validate customer VAT number
  const vatValidation = await this.viesService.validateVat(
    customer.vatNumber,
    customer.country
  );

  if (!vatValidation.valid) {
    throw new Error('Invalid customer VAT number');
  }

  // Get applicable VAT rules
  const rules = this.viesService.getCrossBorderRules(
    'DE', // Your country
    customer.country,
    vatValidation.valid
  );

  // Apply VAT treatment
  const invoice = {
    ...items,
    vatRate: rules.reverseChargeApplicable ? 0 : 19,
    reverseCharge: rules.reverseChargeApplicable,
    notes: rules.notes
  };

  return invoice;
}
```

### Use Case 2: Onboarding New Business Customer

```typescript
async onboardBusiness(businessData: OnboardingData) {
  // Validate VAT number during onboarding
  const vatValidation = await this.viesService.validateVat(
    businessData.vatNumber
  );

  if (!vatValidation.valid) {
    return {
      success: false,
      error: 'Please provide a valid EU VAT number'
    };
  }

  // Store company details from VIES
  const customer = {
    ...businessData,
    companyName: vatValidation.name,
    address: vatValidation.address,
    vatNumberVerified: true,
    vatVerificationDate: new Date()
  };

  await this.saveCustomer(customer);

  return { success: true, customer };
}
```

### Use Case 3: Batch VAT Verification

```typescript
async verifyCustomerVatNumbers() {
  const customers = await this.getAllEuCustomers();

  // Get all VAT numbers
  const vatNumbers = customers.map(c => c.vatNumber);

  // Validate in batches of 10
  const batches = chunk(vatNumbers, 10);

  for (const batch of batches) {
    const results = await this.viesService.validateBulk(batch);

    // Update customer records
    for (const result of results.results) {
      await this.updateCustomerVatStatus(
        result.vatNumber,
        result.valid
      );
    }
  }
}
```

## 5. Utility Functions

### VAT Number Parser

```typescript
import { parseVatNumber, normalizeVatNumber, formatVatNumber } from './utils/vat-parser.util';

// Parse VAT number
const parsed = parseVatNumber('DE 123-456-789');
// Result: { countryCode: 'DE', vatNumber: '123456789', normalized: 'DE123456789' }

// Normalize (remove spaces, dashes)
const normalized = normalizeVatNumber('DE 123-456-789');
// Result: 'DE123456789'

// Format for display
const formatted = formatVatNumber('DE', '123456789');
// Result: 'DE 123456789'
```

### VAT Format Validation

```typescript
import { validateVatFormat, isValidVatFormat, getVatFormatInfo } from './utils/vat-validator.util';

// Validate format (doesn't call VIES)
const formatCheck = validateVatFormat('DE', '123456789');
if (formatCheck.valid) {
  console.log('Format is correct');
} else {
  console.log('Format error:', formatCheck.error);
}

// Quick format check
const isValid = isValidVatFormat('DE', '123456789');

// Get format info for a country
const info = getVatFormatInfo('DE');
// Result: { pattern: /^\d{9}$/, description: 'Germany: 9 digits', example: 'DE123456789' }
```

## 6. VAT Number Formats by Country

| Country | Format | Example |
|---------|--------|---------|
| Austria (AT) | U + 8 digits | ATU12345678 |
| Belgium (BE) | 0/1 + 9 digits | BE0123456789 |
| Germany (DE) | 9 digits | DE123456789 |
| France (FR) | 2 chars + 9 digits | FRXX123456789 |
| Italy (IT) | 11 digits | IT12345678901 |
| Netherlands (NL) | 9 digits + B + 2 digits | NL123456789B01 |
| Spain (ES) | 1 char + 7 digits + 1 char | ESX12345678 |
| Sweden (SE) | 12 digits | SE123456789012 |
| Ireland (IE) | 7 digits + 1-2 letters | IE1234567X |

See `utils/vat-validator.util.ts` for all country patterns.

## 7. Error Handling

### Error Codes

```typescript
enum ViesErrorCode {
  INVALID_INPUT = 'INVALID_INPUT',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  MS_UNAVAILABLE = 'MS_UNAVAILABLE',
  TIMEOUT = 'TIMEOUT',
  SERVER_BUSY = 'SERVER_BUSY',
  NON_EU_COUNTRY = 'NON_EU_COUNTRY',
  GLOBAL_MAX_CONCURRENT_REQ = 'GLOBAL_MAX_CONCURRENT_REQ'
}
```

### Graceful Error Handling

```typescript
try {
  const result = await this.viesService.validateVat(vatNumber);

  if (result.errorCode === 'SERVICE_UNAVAILABLE') {
    // VIES is down, use fallback
    return this.useCachedValidation(vatNumber);
  }

  return result;
} catch (error) {
  // Log error and continue with business logic
  this.logger.error('VIES validation failed', error);

  // Allow transaction to proceed with manual review flag
  return { valid: null, requiresManualReview: true };
}
```

## 8. Caching Strategy

### Cache Behavior

- **Cache Key**: `vies:{COUNTRY}:{VAT_NUMBER}`
- **Success TTL**: 24 hours
- **Failure TTL**: 1 hour
- **Skip Cache**: Set `skipCache: true` in request

### Cache Management

```typescript
// Clear specific VAT cache
await this.viesService.clearCache('DE', '123456789');

// Clear all cache for a country
await this.viesService.clearCache('DE');

// Clear all VIES cache
await this.viesService.clearCache();
```

## 9. Cross-Border VAT Rules

### Reverse Charge Mechanism

**Scenario**: German company sells to French company with valid VAT.

```typescript
const rules = this.viesService.getCrossBorderRules('DE', 'FR', true);

// Result:
{
  isCrossBorder: true,
  reverseChargeApplicable: true,
  vatTreatment: 'B2B intra-community supply - reverse charge applies',
  notes: 'Supplier: 0% VAT, include "Reverse charge - Article 196..."'
}
```

**Action**: Invoice at 0% VAT with reverse charge note.

### Distance Selling (B2C)

**Scenario**: German company sells to French consumer.

```typescript
const rules = this.viesService.getCrossBorderRules('DE', 'FR', false);

// Result:
{
  isCrossBorder: true,
  reverseChargeApplicable: false,
  vatTreatment: 'Cross-border B2C - supplier country VAT applies',
  notes: 'Distance selling thresholds may apply'
}
```

**Action**: Apply supplier country VAT (German VAT).

### Domestic Transaction

**Scenario**: German company sells to another German company.

```typescript
const rules = this.viesService.getCrossBorderRules('DE', 'DE', true);

// Result:
{
  isCrossBorder: false,
  reverseChargeApplicable: false,
  vatTreatment: 'Domestic transaction - standard VAT applies'
}
```

**Action**: Apply standard domestic VAT (19% in Germany).

## 10. Testing

### Manual Testing with cURL

```bash
# Validate VAT
curl -X POST http://localhost:3000/api/v1/vat/validate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"vatNumber": "DE123456789"}'

# Bulk validation
curl -X POST http://localhost:3000/api/v1/vat/validate/bulk \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"vatNumbers": ["DE123456789", "FR12345678901"]}'

# Cross-border rules
curl -X POST http://localhost:3000/api/v1/vat/cross-border-rules \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"supplierCountry": "DE", "customerCountry": "FR", "customerVatNumber": "FR12345678901"}'

# Health check
curl http://localhost:3000/api/v1/vat/health \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Unit Testing

```typescript
describe('ViesService', () => {
  it('should validate a valid VAT number', async () => {
    const result = await viesService.validateVat('DE123456789');
    expect(result.valid).toBe(true);
    expect(result.countryCode).toBe('DE');
  });

  it('should use cache on second call', async () => {
    await viesService.validateVat('DE123456789');
    const result = await viesService.validateVat('DE123456789');
    expect(result.cached).toBe(true);
  });
});
```

## 11. Performance Tips

1. **Use Bulk Validation**: Validate multiple VAT numbers in one request
2. **Leverage Cache**: Cache hit rate is typically 80%+
3. **Background Validation**: Validate VAT numbers asynchronously for better UX
4. **Format Check First**: Use `validateVatFormat()` before calling VIES
5. **Handle Failures Gracefully**: VIES has downtime; implement fallbacks

## 12. Security Considerations

1. **Rate Limiting**: VIES may throttle excessive requests
2. **Authentication Required**: All endpoints require JWT token
3. **Data Privacy**: Cache VAT validation results securely
4. **Audit Logging**: Log all VAT validations for compliance
5. **HTTPS Only**: VIES SOAP calls use TLS

## 13. Monitoring

### Key Metrics

- Total validations per hour
- Cache hit rate
- VIES response time
- Error rate by error code
- Most validated countries

### Health Check

```typescript
GET /api/v1/vat/health

Response:
{
  "status": "ok",
  "timestamp": "2025-11-29T12:00:00Z"
}
```

## 14. Troubleshooting

| Issue | Possible Cause | Solution |
|-------|---------------|----------|
| 503 Service Unavailable | VIES is down | Check https://ec.europa.eu/taxation_customs/vies/ |
| Timeout | Slow VIES response | Retry with exponential backoff (automatic) |
| Invalid format | Wrong VAT format | Use `validateVatFormat()` first |
| Cache not working | Redis connection | Check Redis connection |
| Rate limit | Too many requests | Implement request queuing |

## 15. Additional Resources

- **VIES Service**: https://ec.europa.eu/taxation_customs/vies/
- **WSDL**: https://ec.europa.eu/taxation_customs/vies/checkVatService.wsdl
- **EU VAT Directive**: https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:02006L0112-20200101
- **Full README**: `./README.md`
- **Source Code**: `./vies.service.ts`

---

**Last Updated**: December 2025
**Version**: 1.0.0
**Maintainer**: BRIDGE Agent
