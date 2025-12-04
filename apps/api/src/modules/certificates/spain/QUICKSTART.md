# Spanish SII Certificate Management - Quick Start Guide

## Setup (5 minutes)

### 1. Environment Configuration

```bash
# Generate encryption key
openssl rand -base64 32

# Add to .env or .env.local
echo "SPAIN_SII_CERT_ENCRYPTION_KEY=your-generated-key-here" >> .env
```

### 2. Database Migration

```bash
# Generate Prisma client
npm run prisma:generate

# Create and apply migration
npm run prisma:migrate:dev -- --name add-spain-certificates
```

### 3. Import Module

```typescript
// In your app.module.ts or sii.module.ts
import { SpainCertificateModule } from '@modules/certificates/spain';

@Module({
  imports: [
    SpainCertificateModule,
    // ... other modules
  ],
})
export class AppModule {}
```

## Basic Usage

### Upload Certificate

```typescript
import { SpainCertificateService } from '@modules/certificates/spain';

@Injectable()
export class YourService {
  constructor(private readonly certService: SpainCertificateService) {}

  async uploadCertificate(file: Buffer, password: string, userId: string) {
    const result = await this.certService.storeCertificate({
      organisationId: 'org-123',
      certificate: file, // PKCS#12 (.p12/.pfx) file buffer
      password: password,
      metadata: {
        name: 'Production SII Certificate 2024',
        cifNif: 'B12345678',
        environment: 'production',
      },
      context: {
        userId: userId,
      },
    });

    console.log('Certificate uploaded:', result.certificate.id);
    return result.certificate;
  }
}
```

### Retrieve Certificate for Use

```typescript
async useCertificate(organisationId: string, userId: string) {
  // Get active certificate
  const certs = await this.certService.listCertificates(
    organisationId,
    'production',
  );

  if (certs.length === 0) {
    throw new Error('No certificates found');
  }

  // Get decrypted certificate
  const cert = await this.certService.getCertificate({
    organisationId,
    certificateId: certs[0].id,
    context: { userId },
  });

  // Use for SOAP requests
  return {
    p12Buffer: cert.certificate,
    password: cert.password,
  };
}
```

### Test AEAT Connection

```typescript
async testCertificate(organisationId: string, certId: string) {
  const result = await this.certService.testAEATConnection({
    organisationId,
    certificateId: certId,
    environment: 'test', // Start with test environment
    context: { userId: 'system' },
  });

  if (result.success) {
    console.log(`✓ AEAT connection successful (${result.responseTime}ms)`);
  } else {
    console.error('✗ AEAT connection failed:', result.errors);
  }

  return result;
}
```

## Controller Example (REST API)

```typescript
import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  SpainCertificateService,
  UploadSpainCertificateDto,
  SpainCertificateSummaryDto,
} from '@modules/certificates/spain';

@Controller('spain-certificates')
@UseGuards(JwtAuthGuard)
export class SpainCertificateController {
  constructor(private readonly certService: SpainCertificateService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('certificate'))
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadSpainCertificateDto,
    @Req() req,
  ): Promise<SpainCertificateSummaryDto> {
    // Decode base64 certificate data
    const certBuffer = Buffer.from(dto.certificateData, 'base64');

    const result = await this.certService.storeCertificate({
      organisationId: req.user.organisationId,
      certificate: certBuffer,
      password: dto.password,
      metadata: {
        name: dto.name,
        description: dto.description,
        cifNif: dto.cifNif,
        environment: dto.environment,
      },
      context: {
        userId: req.user.id,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      },
    });

    return result.certificate;
  }

  @Get()
  async list(@Req() req): Promise<SpainCertificateSummaryDto[]> {
    return this.certService.listCertificates(req.user.organisationId);
  }

  @Get(':id/test')
  async testConnection(@Param('id') id: string, @Req() req) {
    return this.certService.testAEATConnection({
      organisationId: req.user.organisationId,
      certificateId: id,
      environment: 'test',
      context: {
        userId: req.user.id,
        ipAddress: req.ip,
      },
    });
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Req() req): Promise<void> {
    await this.certService.deleteCertificate({
      organisationId: req.user.organisationId,
      certificateId: id,
      context: {
        userId: req.user.id,
        ipAddress: req.ip,
      },
    });
  }
}
```

## Testing

```typescript
// Example test
import { Test } from '@nestjs/testing';
import { SpainCertificateService } from '@modules/certificates/spain';

describe('Certificate Upload', () => {
  let service: SpainCertificateService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [SpainCertificateModule],
    }).compile();

    service = module.get(SpainCertificateService);
  });

  it('should upload a valid certificate', async () => {
    const certBuffer = Buffer.from('...'); // Load test certificate
    const result = await service.storeCertificate({
      organisationId: 'test-org',
      certificate: certBuffer,
      password: 'test-password',
      metadata: {
        name: 'Test Certificate',
        environment: 'test',
      },
      context: {
        userId: 'test-user',
      },
    });

    expect(result.certificate.id).toBeDefined();
    expect(result.certificate.name).toBe('Test Certificate');
  });
});
```

## Common Patterns

### 1. Get Active Production Certificate

```typescript
async getProductionCert(organisationId: string): Promise<DecryptedSpainCertificate> {
  const certs = await this.certService.listCertificates(
    organisationId,
    'production',
  );

  const activeCert = certs.find(c => c.isActive && !c.isExpired);

  if (!activeCert) {
    throw new Error('No active production certificate found');
  }

  return this.certService.getCertificate({
    organisationId,
    certificateId: activeCert.id,
    context: { userId: 'system' },
  });
}
```

### 2. Check Certificate Expiry

```typescript
async checkExpiryStatus(organisationId: string): Promise<{
  expiringSoon: number;
  expired: number;
}> {
  const certs = await this.certService.listCertificates(organisationId);

  return {
    expiringSoon: certs.filter(c => c.isExpiringSoon).length,
    expired: certs.filter(c => c.isExpired).length,
  };
}
```

### 3. Rotate Certificate

```typescript
import { CertificateRotationService } from '@modules/certificates/spain';

async renewCertificate(
  organisationId: string,
  oldCertId: string,
  newCertFile: Buffer,
  newPassword: string,
) {
  const result = await this.rotationService.rotateCertificate({
    organisationId,
    oldCertificateId: oldCertId,
    newCertificate: newCertFile,
    newPassword,
    metadata: {
      name: `Production SII Certificate ${new Date().getFullYear()}`,
      environment: 'production',
    },
    context: { userId: 'admin' },
  });

  console.log(`Rotated certificate from ${result.oldCertificateId} to ${result.newCertificate.id}`);
  return result.newCertificate;
}
```

## Error Handling

```typescript
import {
  SpainCertificateError,
  SpainCertificateErrorCode,
} from '@modules/certificates/spain';

try {
  await certService.storeCertificate(...);
} catch (error) {
  if (error instanceof SpainCertificateError) {
    switch (error.code) {
      case SpainCertificateErrorCode.INVALID_PASSWORD:
        return { error: 'Incorrect certificate password' };

      case SpainCertificateErrorCode.CERTIFICATE_EXPIRED:
        return { error: 'Certificate has expired' };

      case SpainCertificateErrorCode.NOT_FNMT_CERTIFICATE:
        return { error: 'Certificate must be issued by FNMT' };

      case SpainCertificateErrorCode.VALIDATION_FAILED:
        return { error: 'Certificate validation failed', details: error.details };

      default:
        return { error: 'Certificate operation failed' };
    }
  }
  throw error;
}
```

## Monitoring

### Expiry Alerts (Cron Job)

The service automatically checks for expiring certificates daily at 9 AM:

```typescript
// Runs automatically via @Cron decorator
// To manually trigger:
await certService.checkExpiringCertificates();
```

### Manual Monitoring

```typescript
// Get certificates expiring in next 30 days
const expiring = await certService.getExpiringCertificates(30);

for (const cert of expiring) {
  console.warn(
    `Certificate "${cert.name}" expires in ${cert.daysUntilExpiry} days`
  );

  // Send notification
  await notificationService.sendExpiryWarning({
    organisationId: cert.organisationId,
    certificateName: cert.name,
    daysRemaining: cert.daysUntilExpiry,
  });
}
```

## Security Checklist

- [ ] `SPAIN_SII_CERT_ENCRYPTION_KEY` set in environment (min 32 chars)
- [ ] Encryption key stored securely (not in code/git)
- [ ] Database backups enabled
- [ ] HTTPS enforced for certificate uploads
- [ ] Rate limiting on upload endpoints
- [ ] File size limits on uploads (max 10MB for certificates)
- [ ] Audit logs monitored regularly
- [ ] Certificate expiry alerts configured

## Troubleshooting

### Issue: "SPAIN_SII_CERT_ENCRYPTION_KEY environment variable is not set"
**Solution**: Add the encryption key to your .env file

### Issue: "Invalid certificate password"
**Solution**: Verify the password used when generating the PKCS#12 file

### Issue: "Certificate validation failed: No certificate found in PKCS#12 file"
**Solution**: Ensure the file is a valid PKCS#12 (.p12 or .pfx) certificate

### Issue: "Certificate does not appear to be issued by FNMT"
**Solution**: This is a warning, not an error. For production, use FNMT certificates from https://www.cert.fnmt.es/

### Issue: "Decryption failed"
**Solution**:
- Check the encryption key hasn't changed
- Verify database contains valid encrypted data
- Check for data corruption

## Next Steps

1. **Implement SOAP Client**: Add actual AEAT SOAP connectivity testing
2. **Add Notifications**: Integrate with notification service for expiry alerts
3. **HSM Integration**: Move private keys to hardware security module
4. **Certificate Auto-Renewal**: Implement FNMT API integration

## Support

- **Documentation**: See README.md for detailed information
- **Implementation**: See IMPLEMENTATION_SUMMARY.md for technical details
- **FNMT Support**: https://www.cert.fnmt.es/atencion-al-ciudadano
- **AEAT SII**: https://www.agenciatributaria.es/AEAT.internet/SII.shtml

## Example FNMT Certificate

For testing, you can generate a self-signed PKCS#12 certificate:

```bash
# Generate private key
openssl genrsa -out private.key 2048

# Generate certificate request
openssl req -new -key private.key -out cert.csr \
  -subj "/C=ES/O=Test Company/CN=Test/serialNumber=B12345678"

# Generate self-signed certificate
openssl x509 -req -days 365 -in cert.csr -signkey private.key -out cert.crt

# Create PKCS#12 bundle
openssl pkcs12 -export -out certificate.p12 \
  -inkey private.key -in cert.crt -password pass:testpassword

# Test upload
base64 certificate.p12 > certificate.b64
```

Note: For production, always use official FNMT certificates!
