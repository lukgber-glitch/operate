# Chorus Pro Integration Module

French government e-invoicing portal for Business-to-Government (B2G) transactions.

## Overview

Chorus Pro is the mandatory platform for all suppliers invoicing French public entities since January 2020. This module provides complete integration with the Chorus Pro API using OAuth2 authentication via PISTE and Factur-X invoice format.

## Features

- **OAuth2 Authentication**: Secure authentication via PISTE (French government SSO)
- **Invoice Submission**: Submit Factur-X invoices to public entities
- **Status Tracking**: Real-time invoice status monitoring
- **Entity Lookup**: Find public entities and their service codes by SIRET
- **Payment Tracking**: Monitor payment status and history
- **Rejection Handling**: Automatic rejection detection and notification
- **Statistics**: Comprehensive reporting and analytics

## Legal Framework

- **Ordonnance n° 2014-697** (26 juin 2014)
- **Decree 2016-1478** - Progressive rollout 2017-2020
- **EN 16931** - European e-invoicing standard
- **Mandatory since**: January 2020 for all public entities

## Configuration

### Environment Variables

```bash
# PISTE OAuth2 Configuration
CHORUS_PRO_PISTE_URL=https://piste.gouv.fr/api/oauth/token
CHORUS_PRO_CLIENT_ID=your_client_id
CHORUS_PRO_CLIENT_SECRET=your_client_secret
CHORUS_PRO_SCOPE=chorus-pro:invoice:submit chorus-pro:invoice:consult

# Chorus Pro API Configuration
CHORUS_PRO_API_URL=https://chorus-pro.gouv.fr/cpro/transverses
CHORUS_PRO_API_VERSION=v1
CHORUS_PRO_API_TIMEOUT=60000

# Optional: Client Certificate
CHORUS_PRO_CERTIFICATE_PATH=/path/to/certificate.pem

# Retry Configuration
CHORUS_PRO_RETRY_ATTEMPTS=3
CHORUS_PRO_RETRY_DELAY=1000
```

## API Endpoints

### Invoice Operations

#### Submit Invoice
```http
POST /integrations/chorus-pro/invoices/submit
Content-Type: multipart/form-data

{
  "invoiceData": {
    "invoiceNumber": "FAC2024-001",
    "invoiceDate": "2024-03-15",
    "supplierSiret": "12345678901234",
    "recipientSiret": "98765432109876",
    "serviceReference": {
      "serviceCode": "SERVICE001"
    },
    "amountExcludingTax": 1000.00,
    "vatAmount": 200.00,
    "amountIncludingTax": 1200.00
  },
  "document": <Factur-X PDF file>
}
```

#### Get Invoice Status
```http
GET /integrations/chorus-pro/invoices/{chorusInvoiceId}/status
```

#### Query Invoices
```http
POST /integrations/chorus-pro/invoices/query
Content-Type: application/json

{
  "supplierSiret": "12345678901234",
  "dateFrom": "2024-01-01",
  "dateTo": "2024-12-31"
}
```

#### Get Invoices by Supplier
```http
GET /integrations/chorus-pro/invoices/supplier/{siret}
GET /integrations/chorus-pro/invoices/supplier/{siret}/rejected
GET /integrations/chorus-pro/invoices/supplier/{siret}/paid
GET /integrations/chorus-pro/invoices/supplier/{siret}/pending
```

### Entity Operations

#### Lookup Public Entity
```http
POST /integrations/chorus-pro/entities/lookup
Content-Type: application/json

{
  "siret": "98765432109876",
  "name": "Ministère de l'Économie"
}
```

#### Check E-Invoice Acceptance
```http
GET /integrations/chorus-pro/entities/{siret}/accepts-einvoices
```

#### Get Service Codes
```http
GET /integrations/chorus-pro/entities/{siret}/services
```

### Statistics & Health

#### Get Supplier Statistics
```http
GET /integrations/chorus-pro/statistics/supplier/{siret}?dateFrom=2024-01-01&dateTo=2024-12-31
```

#### Test Connection
```http
GET /integrations/chorus-pro/health/test-connection
```

## Usage Examples

### TypeScript Service Usage

```typescript
import { ChorusProService } from './chorus-pro.service';
import { FacturXService } from '../factur-x/factur-x.service';

// 1. Generate Factur-X invoice
const facturXPdf = await facturXService.generateFacturXInvoice(invoiceData, {
  profile: 'EN16931',
  validateSIRET: true,
  validateTVA: true,
});

// 2. Lookup public entity to get service code
const entity = await chorusProService.lookupEntity({
  siret: '98765432109876',
});

// 3. Submit invoice to Chorus Pro
const result = await chorusProService.submitInvoice({
  invoiceNumber: 'FAC2024-001',
  invoiceDate: new Date('2024-03-15'),
  invoiceType: 'FACTURE',
  supplierSiret: '12345678901234',
  supplierName: 'ACME Corporation',
  recipientSiret: '98765432109876',
  recipientName: "Ministère de l'Économie",
  serviceReference: {
    serviceCode: entity.entity.services[0].serviceCode,
  },
  engagement: {
    engagementNumber: 'ENG2024001234', // If required
  },
  amountExcludingTax: 1000.00,
  vatAmount: 200.00,
  amountIncludingTax: 1200.00,
  documentFormat: 'FACTURX',
  documentData: facturXPdf,
});

console.log('Chorus Invoice ID:', result.chorusInvoiceId);
console.log('Status:', result.status);

// 4. Track status
const status = await chorusProService.getInvoiceStatus(result.chorusInvoiceId);
console.log('Current status:', status.status);
console.log('Status history:', status.statusHistory);

// 5. Check if paid
const isPaid = status.status === 'SOLDEE';
```

## Invoice Status Flow

```
DEPOSEE (Submitted)
  ↓
EN_COURS_DE_TRAITEMENT (Processing)
  ↓
MISE_A_DISPOSITION (Available to entity)
  ↓
MANDATEE (Payment ordered)
  ↓
MISE_EN_PAIEMENT (In payment)
  ↓
SOLDEE (Paid)
```

Alternative flow:
```
DEPOSEE → EN_COURS_DE_TRAITEMENT → REJETEE (Rejected)
                                      ↓
                                  RECYCLEE (Resubmitted)
```

## French Public Sector Requirements

### Mandatory Fields

1. **SIRET**: 14-digit identifier for both supplier and recipient
2. **Invoice Number**: Unique invoice reference
3. **Amounts**: HT (excl. tax), TVA, TTC (incl. tax)
4. **Factur-X Format**: EN 16931 compliant PDF/A-3 with embedded XML

### Optional but Often Required

1. **Service Code** (`code service destinataire`): Department within entity
2. **Engagement Number** (`numéro d'engagement`): Financial commitment reference
3. **Purchase Order**: Reference to bon de commande
4. **Contract Reference**: For ongoing contracts

### Public Entity Types

- **Ministries**: National government departments
- **Local Authorities**: Communes, départements, régions
- **Public Hospitals**: AP-HP, CHU, etc.
- **Public Establishments**: EPA, EPIC
- **Social Security**: URSSAF, CPAM, etc.

## Error Handling

### Common Errors

```typescript
// SIRET validation error
{
  code: 'SIRET_INVALIDE',
  message: 'Invalid SIRET number'
}

// Service code not found
{
  code: 'SERVICE_INTROUVABLE',
  message: 'Service code not found for this entity'
}

// Missing engagement
{
  code: 'ENGAGEMENT_ABSENT',
  message: 'Engagement number required for this entity'
}

// Duplicate invoice
{
  code: 'FACTURE_DOUBLON',
  message: 'Invoice already submitted'
}
```

## Best Practices

1. **Always validate SIRET** before submission
2. **Lookup service codes** for each entity
3. **Check engagement requirements** per service
4. **Use Factur-X EN16931 profile** for best compatibility
5. **Implement status polling** for payment tracking
6. **Handle rejections** with automatic retry logic
7. **Cache entity information** to reduce API calls
8. **Log all submissions** for audit trail

## Testing

### Test Public Entity

For testing, you can use the Chorus Pro sandbox environment:

```bash
CHORUS_PRO_API_URL=https://sandbox.chorus-pro.gouv.fr/cpro/transverses
CHORUS_PRO_PISTE_URL=https://sandbox.piste.gouv.fr/api/oauth/token
```

Test SIRET for public entities are available in the Chorus Pro documentation.

## Security

- **OAuth2 tokens** are cached and auto-refreshed
- **TLS 1.2+** required for all API calls
- **Optional client certificates** for enhanced security
- **Audit logging** of all submissions
- **Token secure storage** in memory (not persisted)

## Performance

- **Token caching**: Reduces authentication overhead
- **Entity caching**: 24-hour TTL for entity lookups
- **Retry logic**: Automatic retry on transient failures
- **Async operations**: Non-blocking invoice submission

## Support & Documentation

- **Chorus Pro Portal**: https://chorus-pro.gouv.fr
- **PISTE Documentation**: https://piste.gouv.fr/documentation
- **Support Email**: support.chorus-pro@finances.gouv.fr
- **Helpdesk**: 0 809 540 591 (France only)

## License

Internal use only - Operate/CoachOS platform.
