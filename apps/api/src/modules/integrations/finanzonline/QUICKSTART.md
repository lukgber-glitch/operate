# FinanzOnline Integration - Quick Start Guide

## 5-Minute Setup

### 1. Environment Configuration

Create or update `.env` file:

```bash
# FinanzOnline Settings
FON_ENVIRONMENT=sandbox
FON_ENCRYPTION_KEY=your-random-32-char-encryption-key-here
FON_TIMEOUT=30000
FON_DEBUG=true
FON_SESSION_TIMEOUT=120
```

**⚠️ IMPORTANT**: Generate a secure encryption key:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2. Import Module

In your `app.module.ts` or relevant module:

```typescript
import { FinanzOnlineModule } from './modules/integrations/finanzonline';

@Module({
  imports: [
    // ... other modules
    FinanzOnlineModule,
  ],
})
export class AppModule {}
```

### 3. Basic Usage Example

```typescript
import { FinanzOnlineService } from '@modules/integrations/finanzonline';

// Inject service
constructor(private readonly fonService: FinanzOnlineService) {}

// 1. Authenticate
async authenticateUser() {
  const session = await this.fonService.authenticate({
    taxId: '12-345/6789',
    certificate: yourPemCertificate,
    certificateType: 'PEM',
    environment: 'sandbox',
  });

  return session.sessionId; // Store this for future requests
}

// 2. Submit VAT Return
async submitVAT(sessionId: string) {
  const result = await this.fonService.submitVATReturn({
    taxId: '12-345/6789',
    sessionId,
    period: {
      year: 2025,
      type: 'MONTHLY',
      period: 11,
      startDate: new Date('2025-11-01'),
      endDate: new Date('2025-11-30'),
    },
    lines: [
      { code: '000', amount: 50000 }, // 500 EUR turnover
      { code: '056', amount: 10000 }, // 100 EUR VAT
    ],
    totalOutputVat: 10000,
    totalInputVat: 5000,
    netVat: 5000,
    declarationDate: new Date(),
  });

  console.log('Reference ID:', result.referenceId);
}
```

### 4. API Endpoints

Test via REST API:

**Login**:
```bash
POST http://localhost:3000/integrations/finanzonline/auth/login
Content-Type: application/json

{
  "taxId": "12-345/6789",
  "certificate": "-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----",
  "certificateType": "PEM"
}
```

**Submit VAT**:
```bash
POST http://localhost:3000/integrations/finanzonline/vat-return
Content-Type: application/json

{
  "sessionId": "sess_...",
  "taxId": "12-345/6789",
  "period": { ... },
  "lines": [ ... ],
  ...
}
```

### 5. Testing

```bash
# Run unit tests
npm test finanzonline.service.spec.ts

# Check health
curl http://localhost:3000/integrations/finanzonline/health
```

## Common Issues

### Issue: Authentication Failed
**Solution**: Check certificate format (must be valid PEM with headers)

### Issue: Invalid Tax ID
**Solution**: Format must be `XX-YYY/ZZZZ` (e.g., `12-345/6789`)

### Issue: Session Expired
**Solution**: Re-authenticate to get a new session

## Next Steps

1. Read the full [README.md](./README.md) for detailed documentation
2. Review [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) for technical details
3. Check Swagger docs at `/api/docs#/FinanzOnline`
4. Contact Austrian FinanzOnline for sandbox credentials

## Support

- Module Documentation: `README.md`
- API Docs: `http://localhost:3000/api/docs`
- Tests: `__tests__/finanzonline.service.spec.ts`
