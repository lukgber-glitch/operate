# VIES VAT Validation Integration

## Overview

This module provides integration with the EU VIES (VAT Information Exchange System) service for validating EU VAT numbers. It's essential for B2B transactions across EU borders to verify business partners' VAT registration status.

## Features

- **VAT Number Validation**: Real-time validation against the official VIES database
- **Smart Caching**: 24-hour Redis caching to reduce API calls and improve performance
- **Retry Logic**: Exponential backoff retry mechanism (3 attempts) for transient failures
- **Bulk Validation**: Validate up to 10 VAT numbers in a single request
- **Cross-border Rules**: Automatic determination of VAT treatment for EU transactions
- **Error Handling**: Comprehensive error codes and fallback mechanisms

## API Endpoints

### POST `/api/v1/vat/validate`

Validate a single VAT number.

**Request Body:**
```json
{
  "vatNumber": "DE123456789",
  "countryCode": "DE"  // optional if included in vatNumber
}
```

**Response:**
```json
{
  "valid": true,
  "countryCode": "DE",
  "vatNumber": "123456789",
  "requestDate": "2025-11-29T12:00:00Z",
  "name": "Example GmbH",
  "address": "Hauptstraße 1, 10115 Berlin, Germany",
  "cached": false,
  "cacheExpiry": null
}
```

### GET `/api/v1/vat/validate/:vatNumber`

Simple GET endpoint for quick lookups.

**Query Parameters:**
- `skipCache` (optional): Set to `true` to force fresh validation

**Example:**
```
GET /api/v1/vat/validate/DE123456789?skipCache=false
```

### POST `/api/v1/vat/validate/bulk`

Validate multiple VAT numbers (max 10).

**Request Body:**
```json
{
  "vatNumbers": [
    "DE123456789",
    "FR12345678901",
    "NL123456789B01"
  ]
}
```

**Response:**
```json
{
  "results": [
    {
      "valid": true,
      "countryCode": "DE",
      "vatNumber": "123456789",
      // ... additional fields
    },
    // ... more results
  ],
  "total": 3,
  "valid": 2,
  "invalid": 1,
  "errors": 0
}
```

### POST `/api/v1/vat/cross-border-rules`

Get applicable VAT rules for cross-border transactions.

**Request Body:**
```json
{
  "supplierCountry": "DE",
  "customerCountry": "FR",
  "customerVatNumber": "FR12345678901"  // optional
}
```

**Response:**
```json
{
  "isCrossBorder": true,
  "supplierCountry": "DE",
  "customerCountry": "FR",
  "reverseChargeApplicable": true,
  "vatTreatment": "B2B intra-community supply - reverse charge applies",
  "notes": "Supplier: 0% VAT, include \"Reverse charge - Article 196 of Directive 2006/112/EC\" on invoice. Customer: Self-assess VAT in their country."
}
```

## Architecture

### Components

1. **ViesClient**: SOAP client wrapper for communicating with VIES service
2. **ViesService**: Business logic with caching and retry mechanisms
3. **ViesController**: REST API endpoints
4. **RedisService**: Caching layer for validation results

### Caching Strategy

- **Cache Key Format**: `vies:{COUNTRY_CODE}:{VAT_NUMBER}`
- **TTL**: 24 hours
- **Cache Hit**: Returns immediately with `cached: true` flag
- **Cache Miss**: Validates via VIES, then caches successful results

### Retry Logic

- **Max Retries**: 3 attempts
- **Backoff**: Exponential (1s, 2s, 4s)
- **Retryable Errors**:
  - SERVICE_UNAVAILABLE
  - MS_UNAVAILABLE
  - TIMEOUT
  - SERVER_BUSY
  - GLOBAL_MAX_CONCURRENT_REQ

### Error Codes

| Code | Description |
|------|-------------|
| `INVALID_INPUT` | Invalid VAT number format |
| `SERVICE_UNAVAILABLE` | VIES service is down |
| `MS_UNAVAILABLE` | Member state service unavailable |
| `TIMEOUT` | Request timeout |
| `SERVER_BUSY` | Server is overloaded |
| `NON_EU_COUNTRY` | Country is not in EU |
| `GLOBAL_MAX_CONCURRENT_REQ` | Rate limit exceeded |

## Supported Countries

All EU member states with VAT:

AT (Austria), BE (Belgium), BG (Bulgaria), CY (Cyprus), CZ (Czech Republic), DE (Germany), DK (Denmark), EE (Estonia), EL (Greece), ES (Spain), FI (Finland), FR (France), HR (Croatia), HU (Hungary), IE (Ireland), IT (Italy), LT (Lithuania), LU (Luxembourg), LV (Latvia), MT (Malta), NL (Netherlands), PL (Poland), PT (Portugal), RO (Romania), SE (Sweden), SI (Slovenia), SK (Slovakia), XI (Northern Ireland)

## VAT Number Formats

The service accepts various formats:
- With country code: `DE123456789`
- Without country code: `123456789` (requires `countryCode` parameter)
- With spaces/dashes: `DE 123-456-789` (automatically cleaned)

## Usage Examples

### TypeScript/JavaScript

```typescript
import { ViesService } from './modules/integrations/vies';

// Inject service
constructor(private readonly viesService: ViesService) {}

// Validate VAT
const result = await this.viesService.validateVat('DE123456789');

if (result.valid) {
  console.log(`Valid VAT for: ${result.name}`);
}

// Get cross-border rules
const rules = this.viesService.getCrossBorderRules('DE', 'FR', true);
console.log(`Reverse charge: ${rules.reverseChargeApplicable}`);
```

### cURL

```bash
# Validate VAT number
curl -X POST http://localhost:3000/api/v1/vat/validate \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"vatNumber": "DE123456789"}'

# Bulk validation
curl -X POST http://localhost:3000/api/v1/vat/validate/bulk \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"vatNumbers": ["DE123456789", "FR12345678901"]}'
```

## Configuration

Required environment variables:

```env
# Redis (for caching)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=optional
REDIS_DB=0
```

## Testing

Run unit tests:

```bash
npm run test -- vies.service.spec
```

The test suite covers:
- Valid/invalid VAT number validation
- Caching behavior
- Retry logic
- Bulk validation
- Cross-border rules
- Error handling

## Performance

- **Average Response Time** (cached): ~5ms
- **Average Response Time** (uncached): ~500-2000ms (depends on VIES)
- **Cache Hit Rate**: Typically 80%+ in production
- **Throughput**: Limited by VIES service rate limits

## Limitations

1. **VIES Availability**: The EU VIES service has occasional downtime
2. **Rate Limiting**: VIES may throttle excessive requests
3. **Company Data**: Name and address are not always available
4. **Real-time Status**: VAT status can change; cache may be slightly outdated

## Future Enhancements

- [ ] Webhook notifications for VAT status changes
- [ ] Historical validation tracking
- [ ] Company profile enrichment
- [ ] Analytics dashboard for validation patterns
- [ ] Support for UK VAT post-Brexit

## References

- [VIES Official Documentation](https://ec.europa.eu/taxation_customs/vies/)
- [EU VAT Directive 2006/112/EC](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:02006L0112-20200101)
- [SOAP WSDL](http://ec.europa.eu/taxation_customs/vies/checkVatService.wsdl)

## Support

For issues or questions:
1. Check the logs for detailed error messages
2. Verify VIES service status at https://ec.europa.eu/taxation_customs/vies/
3. Review the error code in the response
4. Contact the development team
