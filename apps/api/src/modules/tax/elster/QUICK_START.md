# ELSTER Certificate Management - Quick Start Guide

## 5-Minute Setup

### 1. Install Dependencies (30 seconds)
```bash
npm install node-forge
npm install -D @types/node-forge
```

### 2. Set Environment Variable (1 minute)
```bash
# Generate a secure key
openssl rand -base64 32

# Add to .env file
echo "ELSTER_CERT_ENCRYPTION_KEY=<paste-generated-key-here>" >> .env
```

### 3. Run Database Migration (1 minute)
```bash
npx prisma generate
npx prisma migrate dev --name add_elster_certificates
```

### 4. Import Module (30 seconds)
```typescript
// In your tax.module.ts
import { ElsterModule } from './elster/elster.module';

@Module({
  imports: [
    ElsterModule,  // Add this
    // ... other imports
  ],
})
export class TaxModule {}
```

### 5. Use the Service (2 minutes)
```typescript
import { ElsterCertificateService } from '@/modules/tax/elster';

@Injectable()
export class MyService {
  constructor(
    private certificateService: ElsterCertificateService
  ) {}

  async uploadCertificate(
    orgId: string,
    certFile: Buffer,
    password: string,
    userId: string
  ) {
    // Store the certificate
    const cert = await this.certificateService.storeCertificate({
      organisationId: orgId,
      certificate: certFile,
      password: password,
      metadata: { name: 'ELSTER Certificate' },
      context: {
        userId: userId,
        ipAddress: '192.168.1.1',
        userAgent: 'MyApp/1.0',
      },
    });

    console.log(`Certificate stored: ${cert.id}`);
    console.log(`Valid until: ${cert.validTo}`);
  }

  async useCertificate(orgId: string, certId: string, userId: string) {
    // Retrieve the certificate
    const cert = await this.certificateService.getCertificate({
      organisationId: orgId,
      certificateId: certId,
      context: { userId: userId },
    });

    // Use it for ELSTER submission
    return {
      certificate: cert.certificate,
      password: cert.password,
    };
  }
}
```

## That's It!

You now have a secure, production-ready certificate management system.

## Next Steps

1. **Read the full documentation**: `README.md`
2. **Run the tests**: `npm test elster-certificate.service.spec.ts`
3. **Review security**: Check `IMPLEMENTATION_SUMMARY_W13-T2.md`
4. **Set up monitoring**: See deployment checklist

## Common Operations

### Upload Certificate
```typescript
const summary = await certificateService.storeCertificate({
  organisationId: 'org-123',
  certificate: certBuffer,
  password: 'cert-password',
  metadata: { name: 'Production Cert' },
  context: { userId: 'user-456' },
});
```

### List Certificates
```typescript
const certs = await certificateService.listCertificates('org-123');
certs.forEach(cert => {
  console.log(`${cert.name}: ${cert.isExpiringSoon ? 'EXPIRING SOON!' : 'OK'}`);
});
```

### Get Expiring Certificates
```typescript
const expiring = await certificateService.getExpiringCertificates(30);
if (expiring.length > 0) {
  console.warn(`${expiring.length} certificates expiring in 30 days!`);
}
```

## Troubleshooting

### Error: "ELSTER_CERT_ENCRYPTION_KEY not set"
**Solution**: Add the environment variable to your `.env` file

### Error: "Certificate validation failed"
**Solution**: Ensure the certificate is in PKCS#12 format (.pfx or .p12) and the password is correct

### Error: "Certificate has expired"
**Solution**: Use a valid certificate or renew the existing one

## Need Help?

- Full documentation: `README.md`
- Implementation details: `/IMPLEMENTATION_SUMMARY_W13-T2.md`
- Deployment guide: `/DEPLOYMENT_CHECKLIST_W13-T2.md`
- Test examples: `services/__tests__/elster-certificate.service.spec.ts`
