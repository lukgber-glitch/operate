# SDI Integration Module

Sistema di Interscambio (SDI) - Italian Electronic Invoicing System Integration

## Overview

This module provides complete integration with Italy's mandatory electronic invoicing system (SDI - Sistema di Interscambio), managed by the Agenzia delle Entrate (Italian Revenue Agency).

## Features

### Core Functionality
- ✅ **FatturaPA XML Generation** (v1.2.2)
- ✅ **Digital Signatures** (CAdES-BES, XAdES-BES)
- ✅ **Italian Fiscal Code Validation** (Codice Fiscale)
- ✅ **VAT Number Validation** (Partita IVA)
- ✅ **SDI Submission** (Direct HTTPS & Peppol)
- ✅ **SDI Notification Handling** (RC, NS, MC, NE, EC, DT)
- ✅ **Comprehensive Audit Logging**
- ✅ **TLS 1.2+ Security**

### Supported Document Types
- **FPA12**: Public Administration invoices (B2G)
- **FPR12**: Private sector invoices (B2B, B2C)
- All 27 invoice types (TD01-TD27)

### Notification Types
- **RC** (Ricevuta di consegna): Delivery receipt
- **NS** (Notifica di scarto): Rejection notice
- **MC** (Mancata consegna): Failed delivery
- **NE** (Notifica esito): Outcome notification
- **EC** (Esito committente): Buyer response (accepted/refused)
- **DT** (Decorrenza termini): Deadline expiry (deemed accepted)

## Architecture

```
sdi/
├── services/
│   ├── sdi-codice-fiscale.service.ts  # Fiscal code validation
│   ├── sdi-invoice.service.ts         # FatturaPA XML generation
│   ├── sdi-signature.service.ts       # Digital signatures
│   ├── sdi-submission.service.ts      # SDI submission
│   └── sdi-notification.service.ts    # Notification handling
├── dto/                                # Data Transfer Objects
├── types/                              # TypeScript types
├── schemas/                            # FatturaPA XSD schemas
├── sdi.module.ts                       # NestJS module
├── sdi.service.ts                      # Main orchestrator
├── sdi.controller.ts                   # HTTP endpoints
└── sdi.config.ts                       # Configuration
```

## Installation

### Dependencies

```json
{
  "@nestjs/common": "^10.0.0",
  "@nestjs/config": "^3.0.0",
  "@nestjs/axios": "^3.0.0",
  "xml2js": "^0.6.0",
  "class-validator": "^0.14.0",
  "class-transformer": "^0.5.0"
}
```

### Environment Variables

```env
# SDI Configuration
SDI_ENDPOINT=https://sdi.fatturapa.gov.it/SdI
SDI_TRANSMITTER_CODE=YOUR_7CHAR_CODE
SDI_ENVIRONMENT=test  # or 'production'
SDI_MOCK_MODE=true    # For testing

# Digital Signature
SDI_CERTIFICATE_PATH=/path/to/certificate.pem
SDI_PRIVATE_KEY_PATH=/path/to/private-key.pem
SDI_CERTIFICATE_PASSWORD=your_password
SDI_SIGNATURE_TYPE=CAdES-BES  # or 'XAdES-BES'

# Client Certificate (for TLS)
SDI_CLIENT_CERTIFICATE=/path/to/client-cert.pem
SDI_CLIENT_PRIVATE_KEY=/path/to/client-key.pem

# Peppol Integration (optional)
SDI_USE_PEPPOL=false

# Webhook
SDI_WEBHOOK_SECRET=your_webhook_secret

# Retry Policy
SDI_RETRY_MAX_ATTEMPTS=3
SDI_RETRY_INITIAL_DELAY=5000
SDI_RETRY_MAX_DELAY=60000
SDI_RETRY_BACKOFF=2

# Timeouts
SDI_SUBMISSION_TIMEOUT=30000
SDI_NOTIFICATION_TIMEOUT=10000
```

## Usage

### 1. Import Module

```typescript
import { Module } from '@nestjs/common';
import { SDIModule } from './modules/integrations/sdi';

@Module({
  imports: [SDIModule],
})
export class AppModule {}
```

### 2. Send Invoice

```typescript
import { Injectable } from '@nestjs/common';
import { SDIService } from './modules/integrations/sdi';

@Injectable()
export class InvoiceService {
  constructor(private readonly sdiService: SDIService) {}

  async sendInvoice() {
    const result = await this.sdiService.sendInvoice({
      organizationId: 'org_123',
      formatoTrasmissione: 'FPR12',
      tipoDocumento: 'TD01',
      numero: 'INV-2024-001',
      data: '2024-12-03',

      cedentePrestatore: {
        datiAnagrafici: {
          partitaIVA: '12345678901',
          denominazione: 'My Company SRL',
          regimeFiscale: 'RF01',
        },
        sede: {
          indirizzo: 'Via Roma 1',
          cap: '00100',
          comune: 'Roma',
          provincia: 'RM',
          nazione: 'IT',
        },
      },

      cessionarioCommittente: {
        datiAnagrafici: {
          codiceFiscale: 'RSSMRA80A01H501U',
          denominazione: 'Customer Company SPA',
        },
        sede: {
          indirizzo: 'Via Milano 10',
          cap: '20100',
          comune: 'Milano',
          provincia: 'MI',
          nazione: 'IT',
        },
      },

      dettaglioLinee: [
        {
          numeroLinea: 1,
          descrizione: 'Consulting services',
          quantita: 10,
          unitaMisura: 'ore',
          prezzoUnitario: 100.00,
          prezzoTotale: 1000.00,
          aliquotaIVA: 22.00,
        },
      ],

      datiRiepilogo: [
        {
          aliquotaIVA: 22.00,
          imponibile: 1000.00,
          imposta: 220.00,
        },
      ],

      codiceDestinatario: '0000000',
      pecDestinatario: 'customer@pec.it',
    });

    console.log('Invoice sent:', result);
  }
}
```

### 3. Handle Notifications (Webhook)

```typescript
@Controller('webhooks/sdi')
export class SDIWebhookController {
  constructor(private readonly sdiService: SDIService) {}

  @Post('notification')
  async handleNotification(
    @Body() xmlPayload: string,
    @Query('organizationId') organizationId: string,
  ) {
    const notification = await this.sdiService.receiveNotification(
      organizationId,
      'identificativoSdI',
      'notification_file.xml',
      xmlPayload,
    );

    // Process based on notification type
    switch (notification.notificationType) {
      case 'RC':
        // Invoice delivered successfully
        break;
      case 'NS':
        // Invoice rejected - check errors
        console.error('Errors:', notification.listaErrori);
        break;
      case 'EC':
        if (notification.esito === 'EC01') {
          // Invoice accepted by buyer
        } else {
          // Invoice refused by buyer
        }
        break;
    }

    return { success: true };
  }
}
```

### 4. Validate Fiscal Codes

```typescript
// Validate Codice Fiscale
const cfResult = await sdiService.validateCodiceFiscale('RSSMRA80A01H501U');
console.log('Valid:', cfResult.valid);
console.log('Type:', cfResult.type); // 'INDIVIDUAL' or 'COMPANY'
console.log('Data:', cfResult.extractedData);

// Validate Partita IVA
const pivaResult = await sdiService.validatePartitaIVA('12345678901');
console.log('Valid:', pivaResult.valid);
console.log('Formatted:', pivaResult.formatted); // IT12345678901
```

### 5. Query Invoice Status

```typescript
const status = await sdiService.queryInvoiceStatus({
  organizationId: 'org_123',
  identificativoSdI: '12345678901',
});

console.log('Status:', status.status);
console.log('Notifications:', status.notifications);
```

## API Endpoints

### Invoice Submission
- `POST /integrations/sdi/send` - Send invoice to SDI

### Notifications
- `POST /integrations/sdi/webhook` - Receive SDI notifications

### Validation
- `POST /integrations/sdi/validate/codice-fiscale` - Validate fiscal code
- `POST /integrations/sdi/validate/partita-iva` - Validate VAT number

### Status & History
- `GET /integrations/sdi/status` - Query invoice status
- `GET /integrations/sdi/transmissions` - Get transmission history
- `GET /integrations/sdi/transmissions/:id` - Get specific transmission
- `POST /integrations/sdi/retry/:id` - Retry failed transmission

### Monitoring
- `GET /integrations/sdi/health` - Health check
- `GET /integrations/sdi/statistics` - Get statistics
- `GET /integrations/sdi/certificate/validate` - Validate certificate

## Security

### Digital Signatures
All invoices must be digitally signed before submission:
- **Format**: CAdES-BES (PKCS#7) or XAdES-BES (XML)
- **Algorithm**: RSA-SHA256 or stronger
- **Certificate**: Qualified certificate from accredited CA

### TLS Requirements
- **Minimum Version**: TLS 1.2
- **Client Certificate**: Required for production
- **Certificate Pinning**: Recommended

### Fiscal Code Validation
Implements complete Codice Fiscale validation:
- Format validation (16 chars for individuals, 11 for companies)
- Checksum verification
- Data extraction (birthdate, gender, birthplace)

### Partita IVA Validation
Validates Italian VAT numbers:
- Format validation (11 digits)
- Luhn algorithm checksum
- Automatic IT prefix handling

## Testing

### Mock Mode
Enable mock mode for testing without actual SDI submission:

```env
SDI_MOCK_MODE=true
```

### Test Environment
Use SDI test endpoint:

```env
SDI_ENDPOINT=https://testservizi.fatturapa.it/sdi
SDI_ENVIRONMENT=test
```

### Test Recipient Codes
- `0000000` - Use with PEC email
- `XXXXXXX` - Test codes from SDI documentation

## Error Handling

### Common SDI Errors

| Code | Description | Solution |
|------|-------------|----------|
| 00001 | File format error | Check XML structure |
| 00002 | File name error | Verify filename format |
| 00003 | Transmitter not found | Register transmitter code |
| 00004 | Recipient not found | Verify Codice Destinatario |
| 00100-00199 | Header errors | Check supplier/customer data |
| 00200-00299 | Body errors | Validate invoice lines |
| 00400-00499 | Tax errors | Check VAT calculations |

### Retry Policy
Failed submissions are automatically retried:
- **Max Attempts**: 3
- **Initial Delay**: 5 seconds
- **Backoff**: Exponential (2x)
- **Max Delay**: 60 seconds

## Compliance

### Italian Regulations
- ✅ Decreto Ministeriale 55/2013
- ✅ Circolare 18/E/2014
- ✅ FatturaPA v1.2.2 specifications
- ✅ Digital signature regulations

### Data Protection
- ✅ GDPR compliant
- ✅ Data encryption at rest
- ✅ TLS encryption in transit
- ✅ Audit logging

## Integration with Peppol

The SDI module can integrate with the existing Peppol module for cross-border invoicing:

```env
SDI_USE_PEPPOL=true
```

When enabled, invoices are submitted to SDI via the Peppol network, providing:
- European-wide invoice distribution
- Standardized message format
- Automated routing
- Receipt acknowledgments

## Monitoring & Logging

### Audit Logs
All operations are logged:
- Invoice submissions
- Notification receipts
- Validation requests
- Status queries
- Errors and failures

### Health Checks
Monitor system health:
- Certificate validity
- SDI endpoint availability
- Database connectivity

### Statistics
Track performance metrics:
- Total invoices sent
- Delivery rate
- Rejection rate
- Average delivery time
- Status distribution

## Support

### Resources
- [FatturaPA Official Site](https://www.fatturapa.gov.it/)
- [Agenzia delle Entrate](https://www.agenziaentrate.gov.it/)
- [SDI Technical Specs](https://www.fatturapa.gov.it/export/documenti/fatturapa/v1.2.2/)

### Common Issues
See `/docs/sdi-troubleshooting.md` for troubleshooting guide

## License

Copyright © 2024 Operate/CoachOS. All rights reserved.
