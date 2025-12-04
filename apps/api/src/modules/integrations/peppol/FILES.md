# Peppol Integration - File Listing

## Module Structure

```
apps/api/src/modules/integrations/peppol/
├── services/
│   ├── peppol-certificate.service.ts    (347 lines) - TLS 1.3, cert pinning, signatures
│   ├── peppol-participant.service.ts    (417 lines) - SMP lookup, participant validation
│   └── peppol-message.service.ts        (452 lines) - AS4 messaging, SOAP, receipts
├── dto/
│   ├── send-document.dto.ts             (130 lines) - Send document validation
│   ├── validate-participant.dto.ts      (11 lines)  - Participant validation
│   ├── peppol-webhook.dto.ts            (19 lines)  - Webhook event validation
│   └── index.ts                         (3 lines)   - DTO exports
├── types/
│   └── peppol.types.ts                  (474 lines) - Complete type system
├── peppol.service.ts                    (372 lines) - Main orchestrator
├── peppol.controller.ts                 (206 lines) - HTTP endpoints + webhook
├── peppol.module.ts                     (66 lines)  - NestJS module
├── peppol.config.ts                     (46 lines)  - Configuration
├── index.ts                             (5 lines)   - Module exports
├── README.md                            (454 lines) - Complete guide
└── FILES.md                             (This file)
```

## Documentation Files

```
operate/
├── .env.peppol.example                  (68 lines)  - Environment template
├── PEPPOL_QUICK_REFERENCE.md            (372 lines) - Quick reference
└── TASK_W24-T1_PEPPOL_COMPLETION_REPORT.md (500+ lines) - Completion report
```

## Database Tables Required

```sql
-- Create in your database
peppol_transmissions      - Message transmission log
peppol_audit_logs         - Audit trail
```

## Total Implementation

- **TypeScript files:** 13
- **Total code lines:** ~2,500
- **Documentation lines:** ~1,400
- **Type definitions:** 45+
- **API endpoints:** 5
- **Services:** 4
- **Security features:** 4 (TLS 1.3, pinning, signatures, audit)

## Key Files by Function

### Security
- `services/peppol-certificate.service.ts` - All security features

### Discovery
- `services/peppol-participant.service.ts` - SMP/SML integration

### Messaging
- `services/peppol-message.service.ts` - AS4 protocol

### Orchestration
- `peppol.service.ts` - Main business logic

### API
- `peppol.controller.ts` - REST endpoints

### Configuration
- `peppol.config.ts` - Environment config
- `.env.peppol.example` - Template

### Documentation
- `README.md` - Full guide
- `PEPPOL_QUICK_REFERENCE.md` - Quick start
- `TASK_W24-T1_PEPPOL_COMPLETION_REPORT.md` - Implementation report
