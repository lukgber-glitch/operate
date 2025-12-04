# Peppol Access Point Integration

**Task ID:** W24-T1
**Priority:** P0
**Effort:** 3d
**Markets:** EU (FR, IT, NL, BE, SE, IE)

## Overview

Secure Peppol Access Point integration for electronic document exchange across the EU. Fully compliant with CEF eDelivery AS4 Profile and EN 16931 European e-invoicing standard.

## Features

- **AS4 Messaging:** CEF eDelivery conformant AS4 profile
- **UBL Documents:** Support for UBL 2.1 Invoice and Credit Note
- **SMP Lookup:** Automatic participant and endpoint discovery via SML
- **Security:** TLS 1.3, certificate pinning, RSA-SHA256 signatures
- **Multi-Country:** Support for all Peppol-enabled countries
- **Audit Logging:** Comprehensive logging of all operations

## Architecture

```
PeppolModule
├── PeppolService (Main orchestrator)
├── PeppolController (HTTP endpoints + webhook)
├── Services
│   ├── PeppolCertificateService (TLS 1.3, cert pinning)
│   ├── PeppolParticipantService (SMP lookup)
│   └── PeppolMessageService (AS4 messaging)
├── DTOs (Validation)
└── Types (TypeScript definitions)
```

## Security Features

### TLS 1.3 Enforcement
- Minimum TLS version: TLSv1.3
- No fallback to older TLS versions
- Configured via `PeppolCertificateService`

### Certificate Pinning
```typescript
// Environment variable
PEPPOL_CERTIFICATE_PINNING=true
PEPPOL_PINNED_CERTIFICATES=ABCD1234...,EFGH5678...

// Get fingerprint
openssl x509 -noout -fingerprint -sha256 -in certificate.pem
```

### Digital Signatures
- Algorithm: RSA-SHA256
- Hash: SHA-256
- All AS4 messages are signed
- Signatures verified on incoming messages

### Audit Trail
All operations logged to `peppol_audit_logs` table:
- Message send/receive
- SMP lookups
- Certificate validation
- Document validation
- Errors

## Configuration

### Environment Variables

See `.env.peppol.example` for all configuration options.

**Required:**
```bash
PEPPOL_ACCESS_POINT_URL=https://your-ap.example/as4
PEPPOL_PARTICIPANT_ID=0192:987654321
PEPPOL_CERTIFICATE_PATH=/path/to/cert.pem
PEPPOL_PRIVATE_KEY_PATH=/path/to/key.pem
PEPPOL_CERTIFICATE_PASSWORD=your-password
```

**Optional:**
```bash
PEPPOL_SML_DOMAIN=isml.peppol.eu
PEPPOL_ENVIRONMENT=production
PEPPOL_MOCK_MODE=false
PEPPOL_CERTIFICATE_PINNING=true
PEPPOL_PINNED_CERTIFICATES=fingerprint1,fingerprint2
```

### Participant ID Schemes

ISO/IEC 6523 scheme codes:

| Scheme | Country/Type | Example |
|--------|-------------|---------|
| 0192 | Norway ORG | 0192:987654321 |
| 9925 | Italy VAT | 9925:IT12345678901 |
| 9928 | France SIRET | 9928:12345678901234 |
| 9929 | France SIREN | 9929:123456789 |
| 9930 | Belgium CBE | 9930:0123456789 |
| 9931 | Netherlands KVK | 9931:12345678 |
| 9933 | Spain VAT | 9933:ES12345678Z |

[Full list in `.env.peppol.example`]

## API Endpoints

### Send Document
```http
POST /integrations/peppol/send
Content-Type: application/json

{
  "organizationId": "uuid",
  "documentType": "Invoice",
  "invoiceNumber": "INV-2024-001",
  "issueDate": "2024-12-03",
  "currency": "EUR",
  "supplier": {
    "participantId": { "scheme": "0192", "identifier": "987654321" },
    "name": "Supplier AS",
    "address": { "cityName": "Oslo", "postalZone": "0150", "countryCode": "NO" }
  },
  "customer": {
    "participantId": { "scheme": "9925", "identifier": "IT12345678901" },
    "name": "Customer SRL",
    "address": { "cityName": "Rome", "postalZone": "00100", "countryCode": "IT" }
  },
  "lines": [...],
  "taxTotal": 250.00,
  "totalAmount": 1250.00
}
```

Response:
```json
{
  "success": true,
  "data": {
    "messageId": "uuid",
    "status": "SENT"
  },
  "message": "Document sent successfully via Peppol network"
}
```

### Webhook (Receive Document)
```http
POST /integrations/peppol/webhook?organizationId=uuid
Content-Type: application/soap+xml

[AS4 SOAP Envelope]
```

Returns AS4 receipt/MDN.

### Validate Participant
```http
POST /integrations/peppol/validate-participant
Content-Type: application/json

{
  "scheme": "0192",
  "identifier": "987654321"
}
```

### Get Transmissions
```http
GET /integrations/peppol/transmissions?organizationId=uuid&limit=50
```

### Get Transmission
```http
GET /integrations/peppol/transmissions/{messageId}
```

## Database Schema

### peppol_transmissions
```sql
CREATE TABLE peppol_transmissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  message_id VARCHAR(255) NOT NULL UNIQUE,
  conversation_id VARCHAR(255) NOT NULL,
  direction VARCHAR(20) NOT NULL, -- OUTBOUND, INBOUND
  from_participant VARCHAR(255) NOT NULL,
  to_participant VARCHAR(255) NOT NULL,
  document_type VARCHAR(50) NOT NULL,
  document_id TEXT NOT NULL,
  process_id TEXT NOT NULL,
  status VARCHAR(50) NOT NULL,
  payload TEXT,
  receipt TEXT,
  error_code VARCHAR(50),
  error_message TEXT,
  sent_at TIMESTAMP,
  received_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### peppol_audit_logs
```sql
CREATE TABLE peppol_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  user_id UUID,
  action VARCHAR(50) NOT NULL,
  message_id VARCHAR(255),
  participant_id VARCHAR(255),
  endpoint TEXT,
  method VARCHAR(10),
  status_code INTEGER,
  duration INTEGER,
  timestamp TIMESTAMP DEFAULT NOW(),
  metadata JSONB
);
```

## Standards Compliance

### AS4 Profile
- **Standard:** OASIS AS4 Profile
- **Version:** CEF eDelivery AS4 Profile v2.0
- **Transport:** SOAP 1.2 over HTTPS
- **Security:** WS-Security with digital signatures

### UBL 2.1
- **Invoice:** `urn:oasis:names:specification:ubl:schema:xsd:Invoice-2`
- **Credit Note:** `urn:oasis:names:specification:ubl:schema:xsd:CreditNote-2`
- **Profile:** EN 16931 compliant
- **BIS:** Peppol BIS Billing 3.0

### ISO Standards
- **ISO/IEC 6523:** Participant ID schemes
- **ISO 3166-1 alpha-2:** Country codes
- **ISO 4217:** Currency codes
- **UN/ECE Rec 20:** Unit codes

## Message Flow

### Sending a Document

1. **Validate Input:** Validate invoice data via DTOs
2. **Generate UBL:** Convert invoice to UBL 2.1 XML
3. **Validate UBL:** Check against EN 16931 rules
4. **SMP Lookup:** Find recipient's Access Point endpoint
5. **Create AS4 Message:** Build SOAP envelope with UBL payload
6. **Sign Message:** Apply RSA-SHA256 signature
7. **Send via TLS 1.3:** POST to recipient's Access Point
8. **Process Receipt:** Handle AS4 MDN/receipt
9. **Update Status:** Log transmission result

### Receiving a Document

1. **Receive Webhook:** AS4 message arrives at webhook endpoint
2. **Parse SOAP:** Extract AS4 message from envelope
3. **Verify Signature:** Validate sender's digital signature
4. **Validate Message:** Check participant IDs, document format
5. **Extract UBL:** Parse UBL document from payload
6. **Store Transmission:** Save to database
7. **Return Receipt:** Send AS4 MDN back to sender

## Error Handling

### Error Codes
- `PEPPOL_001`: Invalid participant ID
- `PEPPOL_002`: Invalid document
- `PEPPOL_003`: SMP lookup failed
- `PEPPOL_004`: Endpoint not found
- `PEPPOL_005`: Certificate invalid
- `PEPPOL_006`: Certificate expired
- `PEPPOL_007`: Signature invalid
- `PEPPOL_008`: Transmission failed
- `PEPPOL_009`: Receipt timeout
- `PEPPOL_010`: Unsupported document type

### Retry Logic
- Max attempts: 3
- Initial delay: 5 seconds
- Backoff multiplier: 2x
- Max delay: 60 seconds

## Testing

### Mock Mode
For local development without real certificates:

```bash
PEPPOL_MOCK_MODE=true
```

Mock mode provides:
- Fake SMP responses
- Simulated endpoints
- Mock certificates
- No actual network calls

### Test Environment
Use Peppol test network:

```bash
PEPPOL_SML_DOMAIN=isml.peppoltest.eu
PEPPOL_ENVIRONMENT=test
```

## Production Checklist

- [ ] Valid Peppol Access Point certificate
- [ ] Certificate installed and accessible
- [ ] Private key secured
- [ ] Participant ID registered
- [ ] Access Point URL configured
- [ ] TLS 1.3 verified
- [ ] Certificate pinning enabled
- [ ] Pinned certificates configured
- [ ] Database tables created
- [ ] Webhook endpoint accessible
- [ ] Audit logging verified
- [ ] Test transmission successful

## Monitoring

### Key Metrics
- Transmission success rate
- Average send time
- Receipt acknowledgment rate
- SMP lookup failures
- Certificate expiry alerts

### Logs
All operations logged with:
- Timestamp
- Organization ID
- Message ID
- Action
- Duration
- Status code
- Error details (if any)

## Support

### Peppol Resources
- [Peppol Homepage](https://peppol.eu)
- [OpenPeppol](https://docs.peppol.eu)
- [CEF eDelivery](https://ec.europa.eu/cefdigital/wiki/display/CEFDIGITAL/eDelivery)
- [UBL 2.1 Specification](http://docs.oasis-open.org/ubl/os-UBL-2.1/)
- [EN 16931](https://ec.europa.eu/cefdigital/wiki/display/CEFDIGITAL/EN16931)

### Technical Contact
- See `PEPPOL_QUICK_REFERENCE.md` for common operations
- Check audit logs for troubleshooting
- Review transmission status via API

## License

Copyright (c) 2024 Operate/CoachOS. All rights reserved.
