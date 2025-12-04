# Peppol Integration Quick Reference

**Task:** W24-T1 - Peppol Access Point Integration
**Status:** Implemented
**Security:** TLS 1.3, Certificate Pinning, RSA-SHA256 Signatures

## Quick Start

### 1. Configuration

Copy environment template:
```bash
cp .env.peppol.example .env.local
```

Required variables:
```bash
PEPPOL_ACCESS_POINT_URL=https://your-ap.example/as4
PEPPOL_PARTICIPANT_ID=0192:987654321
PEPPOL_CERTIFICATE_PATH=/path/to/cert.pem
PEPPOL_PRIVATE_KEY_PATH=/path/to/key.pem
PEPPOL_CERTIFICATE_PASSWORD=your-password
```

### 2. Database Setup

Run migrations:
```sql
-- Create transmissions table
CREATE TABLE peppol_transmissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  message_id VARCHAR(255) NOT NULL UNIQUE,
  conversation_id VARCHAR(255) NOT NULL,
  direction VARCHAR(20) NOT NULL,
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

-- Create audit logs table
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

-- Create indexes
CREATE INDEX idx_peppol_transmissions_org ON peppol_transmissions(organization_id);
CREATE INDEX idx_peppol_transmissions_message ON peppol_transmissions(message_id);
CREATE INDEX idx_peppol_audit_logs_org ON peppol_audit_logs(organization_id);
CREATE INDEX idx_peppol_audit_logs_timestamp ON peppol_audit_logs(timestamp);
```

## Common Operations

### Send Invoice

```typescript
POST /integrations/peppol/send

{
  "organizationId": "org-uuid",
  "documentType": "Invoice",
  "invoiceNumber": "INV-2024-001",
  "issueDate": "2024-12-03",
  "currency": "EUR",
  "supplier": {
    "participantId": { "scheme": "0192", "identifier": "987654321" },
    "name": "My Company AS",
    "address": {
      "streetName": "Main Street 1",
      "cityName": "Oslo",
      "postalZone": "0150",
      "countryCode": "NO"
    },
    "vatId": "NO987654321MVA"
  },
  "customer": {
    "participantId": { "scheme": "9925", "identifier": "IT12345678901" },
    "name": "Customer SRL",
    "address": {
      "cityName": "Rome",
      "postalZone": "00100",
      "countryCode": "IT"
    },
    "vatId": "IT12345678901"
  },
  "lines": [
    {
      "id": "1",
      "quantity": 10,
      "unitCode": "EA",
      "description": "Product A",
      "priceAmount": 100.00,
      "lineExtensionAmount": 1000.00,
      "taxPercent": 25,
      "taxAmount": 250.00
    }
  ],
  "taxTotal": 250.00,
  "totalAmount": 1250.00,
  "paymentMeans": {
    "paymentMeansCode": "30",
    "paymentId": "RF123456789",
    "iban": "NO9386011117947",
    "bic": "DNBANOKK"
  }
}
```

### Validate Participant

```bash
curl -X POST http://localhost:3000/integrations/peppol/validate-participant \
  -H "Content-Type: application/json" \
  -d '{
    "scheme": "0192",
    "identifier": "987654321"
  }'
```

### Get Transmission History

```bash
curl http://localhost:3000/integrations/peppol/transmissions?organizationId=org-uuid&limit=50
```

### Get Specific Transmission

```bash
curl http://localhost:3000/integrations/peppol/transmissions/{messageId}
```

## Participant ID Schemes

| Country | Scheme | Format | Example |
|---------|--------|--------|---------|
| Norway | 0192 | NO:ORGNR | 0192:987654321 |
| Italy VAT | 9925 | IT:VAT | 9925:IT12345678901 |
| France SIRET | 9928 | FR:SIRET | 9928:12345678901234 |
| France SIREN | 9929 | FR:SIREN | 9929:123456789 |
| Belgium | 9930 | BE:CBE | 9930:0123456789 |
| Netherlands | 9931 | NL:KVK | 9931:12345678 |
| Spain | 9933 | ES:VAT | 9933:ES12345678Z |
| Sweden | 0198 | SE:ORGNR | 0198:5560123456 |
| Denmark | 0184 | DK:CVR | 0184:12345678 |

## Document Types

### Invoice (380)
```
urn:oasis:names:specification:ubl:schema:xsd:Invoice-2::Invoice##urn:cen.eu:en16931:2017#compliant#urn:fdc:peppol.eu:2017:poacc:billing:3.0::2.1
```

### Credit Note (381)
```
urn:oasis:names:specification:ubl:schema:xsd:CreditNote-2::CreditNote##urn:cen.eu:en16931:2017#compliant#urn:fdc:peppol.eu:2017:poacc:billing:3.0::2.1
```

## Payment Means Codes

| Code | Description |
|------|-------------|
| 30 | Credit transfer |
| 42 | Payment to bank account |
| 48 | Bank card |
| 49 | Direct debit |
| 58 | SEPA credit transfer |
| 59 | SEPA direct debit |

## Unit Codes (UN/ECE Rec 20)

| Code | Description |
|------|-------------|
| EA | Each (piece) |
| HUR | Hour |
| DAY | Day |
| MTR | Meter |
| KGM | Kilogram |
| LTR | Liter |
| MTQ | Cubic meter |
| SET | Set |

## Security

### Certificate Pinning

Get certificate fingerprint:
```bash
openssl x509 -noout -fingerprint -sha256 -in certificate.pem
```

Set pinned certificates:
```bash
PEPPOL_PINNED_CERTIFICATES=ABCD1234...,EFGH5678...
```

### TLS Configuration

Verify TLS 1.3:
```bash
openssl s_client -connect your-ap.example:443 -tls1_3
```

## Troubleshooting

### Certificate Issues

**Problem:** Certificate validation failed
**Solution:**
1. Check certificate validity: `openssl x509 -in cert.pem -text -noout`
2. Verify expiry date
3. Ensure certificate is Peppol-compliant

### SMP Lookup Failed

**Problem:** Cannot find participant endpoint
**Solution:**
1. Verify participant ID format
2. Check SML domain configuration
3. Test SMP URL manually: `http://B-{md5hash}.{sml-domain}`

### Transmission Failed

**Problem:** Message sending failed
**Solution:**
1. Check audit logs: `SELECT * FROM peppol_audit_logs WHERE action = 'message:send'`
2. Verify endpoint URL from SMP
3. Check TLS connection
4. Review error message in transmission log

### Receipt Timeout

**Problem:** No receipt received
**Solution:**
1. Increase timeout setting
2. Check recipient's Access Point status
3. Review network connectivity
4. Check transmission status

## Testing

### Mock Mode

Enable for local development:
```bash
PEPPOL_MOCK_MODE=true
```

### Test Network

Use Peppol test infrastructure:
```bash
PEPPOL_SML_DOMAIN=isml.peppoltest.eu
PEPPOL_ENVIRONMENT=test
```

### Test Participants

Test participant IDs (OpenPeppol):
- `9915:test` - Generic test participant
- `9908:991-1234512345-06` - Test participant NO

## Monitoring

### Check Transmission Status

```sql
SELECT
  message_id,
  direction,
  from_participant,
  to_participant,
  status,
  error_message,
  created_at
FROM peppol_transmissions
WHERE organization_id = 'org-uuid'
ORDER BY created_at DESC
LIMIT 50;
```

### Audit Log Query

```sql
SELECT
  action,
  message_id,
  participant_id,
  status_code,
  duration,
  timestamp
FROM peppol_audit_logs
WHERE organization_id = 'org-uuid'
  AND timestamp > NOW() - INTERVAL '24 hours'
ORDER BY timestamp DESC;
```

### Success Rate

```sql
SELECT
  direction,
  status,
  COUNT(*) as count
FROM peppol_transmissions
WHERE organization_id = 'org-uuid'
  AND created_at > NOW() - INTERVAL '7 days'
GROUP BY direction, status;
```

## Production Checklist

- [ ] Valid Peppol certificate installed
- [ ] Private key secured (chmod 600)
- [ ] Participant ID registered with Peppol
- [ ] Access Point URL verified
- [ ] TLS 1.3 connectivity tested
- [ ] Certificate pinning configured
- [ ] Database tables created
- [ ] Webhook endpoint accessible (HTTPS required)
- [ ] Test invoice sent successfully
- [ ] Receipt received successfully
- [ ] Audit logging verified
- [ ] Monitoring alerts configured
- [ ] Certificate expiry monitoring enabled
- [ ] Backup/disaster recovery plan

## Resources

- **OpenPeppol:** https://peppol.eu
- **Documentation:** https://docs.peppol.eu
- **CEF eDelivery:** https://ec.europa.eu/cefdigital/wiki/display/CEFDIGITAL/eDelivery
- **UBL 2.1:** http://docs.oasis-open.org/ubl/os-UBL-2.1/
- **EN 16931:** https://ec.europa.eu/cefdigital/wiki/display/CEFDIGITAL/EN16931

## Module Location

```
apps/api/src/modules/integrations/peppol/
├── peppol.module.ts
├── peppol.service.ts
├── peppol.controller.ts
├── peppol.config.ts
├── services/
│   ├── peppol-certificate.service.ts
│   ├── peppol-participant.service.ts
│   └── peppol-message.service.ts
├── dto/
├── types/
└── README.md
```

## Support

For issues or questions:
1. Check audit logs for error details
2. Review transmission status in database
3. Verify configuration in `.env`
4. Consult README.md in module directory
5. Test with mock mode enabled
