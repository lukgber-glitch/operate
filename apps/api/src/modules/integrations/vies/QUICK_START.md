# VIES Integration - Quick Start Guide

## Prerequisites

1. Redis running (Docker recommended):
   ```bash
   docker run -d -p 6379:6379 redis:7-alpine
   ```

2. Environment variables in `.env`:
   ```env
   REDIS_HOST=localhost
   REDIS_PORT=6379
   REDIS_DB=0
   ```

## Installation

Dependencies are already added to `package.json`. Run:

```bash
npm install
# or
pnpm install
```

## Usage

### 1. Import the Service

```typescript
import { ViesService } from '@/modules/integrations/vies';

@Injectable()
export class YourService {
  constructor(private readonly viesService: ViesService) {}
}
```

### 2. Validate VAT Number

```typescript
// Simple validation
const result = await this.viesService.validateVat('DE123456789');

if (result.valid) {
  console.log(`Valid VAT for: ${result.name}`);
  console.log(`Address: ${result.address}`);
}
```

### 3. Bulk Validation

```typescript
const results = await this.viesService.validateBulk([
  'DE123456789',
  'FR12345678901',
  'NL123456789B01',
]);

console.log(`Valid: ${results.valid}/${results.total}`);
```

### 4. Cross-border VAT Rules

```typescript
const rules = this.viesService.getCrossBorderRules(
  'DE',  // supplier country
  'FR',  // customer country
  true   // customer VAT valid
);

if (rules.reverseChargeApplicable) {
  console.log('Apply reverse charge mechanism');
  console.log(rules.notes);
}
```

## API Endpoints

### cURL Examples

```bash
# Get JWT token first (from auth endpoint)
TOKEN="your_jwt_token_here"

# Validate single VAT
curl -X POST http://localhost:3000/api/v1/vat/validate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"vatNumber": "DE123456789"}'

# Quick GET lookup
curl http://localhost:3000/api/v1/vat/validate/DE123456789 \
  -H "Authorization: Bearer $TOKEN"

# Skip cache
curl "http://localhost:3000/api/v1/vat/validate/DE123456789?skipCache=true" \
  -H "Authorization: Bearer $TOKEN"

# Bulk validation
curl -X POST http://localhost:3000/api/v1/vat/validate/bulk \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"vatNumbers": ["DE123456789", "FR12345678901"]}'

# Cross-border rules
curl -X POST http://localhost:3000/api/v1/vat/cross-border-rules \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "supplierCountry": "DE",
    "customerCountry": "FR",
    "customerVatNumber": "FR12345678901"
  }'
```

### JavaScript/Fetch

```javascript
const response = await fetch('http://localhost:3000/api/v1/vat/validate', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    vatNumber: 'DE123456789'
  })
});

const result = await response.json();
console.log(result);
```

## Response Examples

### Successful Validation

```json
{
  "valid": true,
  "countryCode": "DE",
  "vatNumber": "123456789",
  "requestDate": "2025-11-29T12:00:00Z",
  "name": "Example GmbH",
  "address": "Hauptstraße 1, 10115 Berlin, Germany",
  "cached": false
}
```

### Cached Result

```json
{
  "valid": true,
  "countryCode": "FR",
  "vatNumber": "12345678901",
  "requestDate": "2025-11-29T10:00:00Z",
  "name": "Example SARL",
  "address": "Paris, France",
  "cached": true,
  "cacheExpiry": "2025-11-30T10:00:00Z"
}
```

### Invalid VAT

```json
{
  "valid": false,
  "countryCode": "DE",
  "vatNumber": "999999999",
  "requestDate": "2025-11-29T12:00:00Z",
  "cached": false
}
```

### Error Response

```json
{
  "valid": false,
  "countryCode": "",
  "vatNumber": "US123456789",
  "requestDate": "2025-11-29T12:00:00Z",
  "cached": false,
  "errorCode": "NON_EU_COUNTRY",
  "errorMessage": "US is not an EU member state"
}
```

## Common Use Cases

### E-commerce Checkout

```typescript
async validateCustomerVat(vatNumber: string, country: string) {
  const validation = await this.viesService.validateVat(
    vatNumber,
    country
  );

  if (!validation.valid) {
    throw new BadRequestException('Invalid VAT number');
  }

  return {
    vatValid: true,
    companyName: validation.name,
    companyAddress: validation.address
  };
}
```

### Invoice Generation

```typescript
async getVatTreatment(
  supplierCountry: string,
  customerCountry: string,
  customerVatNumber?: string
) {
  let customerVatValid = false;

  if (customerVatNumber) {
    const validation = await this.viesService.validateVat(
      customerVatNumber,
      customerCountry
    );
    customerVatValid = validation.valid;
  }

  const rules = this.viesService.getCrossBorderRules(
    supplierCountry,
    customerCountry,
    customerVatValid
  );

  return {
    applyVat: !rules.reverseChargeApplicable,
    vatRate: rules.reverseChargeApplicable ? 0 : this.getStandardRate(supplierCountry),
    invoiceNote: rules.notes
  };
}
```

### Customer Onboarding

```typescript
async onboardBusiness(dto: OnboardBusinessDto) {
  // Validate VAT number
  const vatValidation = await this.viesService.validateVat(
    dto.vatNumber,
    dto.country
  );

  if (!vatValidation.valid) {
    throw new BadRequestException(
      'Please provide a valid VAT number'
    );
  }

  // Use validated company data
  return this.businessRepository.create({
    ...dto,
    companyName: vatValidation.name || dto.companyName,
    address: vatValidation.address || dto.address,
    vatVerifiedAt: new Date(),
  });
}
```

## Testing

### Run Unit Tests

```bash
npm run test -- vies.service.spec
```

### Manual Testing via Swagger

1. Start the API: `npm run dev`
2. Open: http://localhost:3000/api/docs
3. Authenticate with JWT
4. Navigate to "VAT Validation" section
5. Try the endpoints

## Troubleshooting

### Redis Connection Error

```
Error: Redis connection failed
```

**Solution**: Ensure Redis is running:
```bash
docker ps | grep redis
# If not running:
docker run -d -p 6379:6379 redis:7-alpine
```

### VIES Service Unavailable

```json
{
  "errorCode": "SERVICE_UNAVAILABLE",
  "errorMessage": "VIES service is temporarily unavailable"
}
```

**Solutions**:
1. Check VIES status: https://ec.europa.eu/taxation_customs/vies/
2. Retry with `skipCache: false` to use cached result if available
3. VIES often has downtime on weekends

### Invalid Country Code

```json
{
  "errorCode": "NON_EU_COUNTRY",
  "errorMessage": "US is not an EU member state"
}
```

**Solution**: Only EU countries are supported. Use UK for Northern Ireland (XI).

## Performance Tips

1. **Don't skip cache**: Let the 24-hour cache work for you
2. **Bulk operations**: Use `/validate/bulk` for multiple VATs
3. **Error handling**: Implement fallbacks for VIES downtime
4. **Rate limiting**: Don't validate same VAT repeatedly

## Advanced Features

### Clear Cache (Admin)

```typescript
// Clear specific VAT
await this.viesService.clearCache('DE', '123456789');

// Clear all for a country
await this.viesService.clearCache('DE');

// Clear all VIES cache
await this.viesService.clearCache();
```

### Custom Retry Logic

The service automatically retries 3 times with exponential backoff. If you need different behavior, you can catch the error and implement custom logic:

```typescript
try {
  const result = await this.viesService.validateVat(vatNumber);
} catch (error) {
  // Custom fallback logic
  if (error.message.includes('SERVICE_UNAVAILABLE')) {
    // Use cached data or queue for later
  }
}
```

## Need Help?

- **Documentation**: See `README.md` in this directory
- **Implementation Report**: See `OP-024_VIES_INTEGRATION_REPORT.md` in project root
- **API Docs**: http://localhost:3000/api/docs (when running)
- **VIES Official**: https://ec.europa.eu/taxation_customs/vies/
