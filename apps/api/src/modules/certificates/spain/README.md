# Spanish SII Certificate Management

Secure management of FNMT digital certificates for Spanish Tax Agency (AEAT) SII integration.

## Overview

This module provides comprehensive certificate management for Spanish SII (Suministro Inmediato de Información) compliance. It handles PKCS#12 certificates issued by FNMT (Fábrica Nacional de Moneda y Timbre) with enterprise-grade security.

## Features

- **Secure Storage**: AES-256-GCM encryption with scrypt key derivation
- **FNMT Validation**: Validates certificates issued by Spanish Certificate Authority
- **Expiry Monitoring**: Automated tracking with 30-day advance warnings
- **Zero-Downtime Rotation**: Replace certificates without service interruption
- **AEAT Testing**: Verify certificate connectivity to Spanish Tax Agency endpoints
- **Audit Logging**: Complete audit trail for compliance and security
- **Multi-Environment**: Support for production and test AEAT environments

## Architecture

```
spain-certificate.module.ts          - NestJS module configuration
spain-certificate.service.ts         - Main orchestration service
certificate-storage.service.ts       - AES-256-GCM encryption/decryption
certificate-validator.service.ts     - FNMT certificate validation
certificate-rotation.service.ts      - Zero-downtime certificate rotation
dto/                                 - DTOs for API requests/responses
interfaces/                          - TypeScript interfaces and types
tests/                               - Unit tests
```

## Security

### Encryption

- **Algorithm**: AES-256-GCM (authenticated encryption)
- **Key Derivation**: Scrypt (CPU and memory hard)
- **Key Storage**: Environment variable `SPAIN_SII_CERT_ENCRYPTION_KEY`
- **Salt**: Random 256-bit salt per encryption
- **IV**: Random 128-bit IV per encryption
- **Auth Tag**: 128-bit authentication tag for integrity

### Certificate Storage

```typescript
{
  encryptedData: Buffer,      // Encrypted PKCS#12 certificate
  encryptedPassword: Buffer,  // Encrypted certificate password
  iv: Buffer,                 // Initialization vector
  authTag: Buffer,            // Authentication tag
  thumbprint: string          // SHA-256 thumbprint for identification
}
```

### Private Key Protection

- Private keys never stored in plain text
- Passwords encrypted separately from certificates
- Master key never logged or exposed
- Constant-time comparison for authentication tags

## Usage

### Environment Setup

```bash
# Generate a secure encryption key (required)
openssl rand -base64 32

# Add to .env
SPAIN_SII_CERT_ENCRYPTION_KEY=your-generated-key-here
```

### Import Module

```typescript
import { SpainCertificateModule } from '@modules/certificates/spain/spain-certificate.module';

@Module({
  imports: [SpainCertificateModule],
})
export class SiiModule {}
```

### Store Certificate

```typescript
import { SpainCertificateService } from '@modules/certificates/spain/spain-certificate.service';

@Injectable()
export class SiiService {
  constructor(
    private readonly certService: SpainCertificateService,
  ) {}

  async uploadCertificate(
    organisationId: string,
    certificateFile: Buffer,
    password: string,
  ) {
    const result = await this.certService.storeCertificate({
      organisationId,
      certificate: certificateFile, // PKCS#12 (.p12/.pfx)
      password,
      metadata: {
        name: 'Production SII Certificate 2024',
        description: 'Main certificate for SII submissions',
        cifNif: 'B12345678',
        environment: 'production',
      },
      context: {
        userId: 'user-123',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      },
    });

    // Check for warnings (e.g., expiring soon)
    if (result.warnings.length > 0) {
      console.warn('Certificate warnings:', result.warnings);
    }

    return result.certificate;
  }
}
```

### Retrieve Certificate

```typescript
async getSiiCertificate(organisationId: string, certificateId: string) {
  const cert = await this.certService.getCertificate({
    organisationId,
    certificateId,
    context: { userId: 'user-123' },
  });

  // Use decrypted certificate for SOAP requests
  const p12Buffer = cert.certificate;
  const password = cert.password;

  // Configure SOAP client with mutual TLS
  // ... (implementation specific to SOAP library)
}
```

### Test AEAT Connection

```typescript
async testCertificate(organisationId: string, certificateId: string) {
  const result = await this.certService.testAEATConnection({
    organisationId,
    certificateId,
    environment: 'test', // Use test environment first
    context: { userId: 'user-123' },
  });

  if (result.success) {
    console.log(`Connection successful in ${result.responseTime}ms`);
  } else {
    console.error('Connection failed:', result.errors);
  }

  return result;
}
```

### Rotate Certificate

```typescript
async rotateCertificate(
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
      name: 'Production SII Certificate 2025',
      environment: 'production',
    },
    context: { userId: 'user-123' },
  });

  console.log(`Rotated from ${result.oldCertificateId} to ${result.newCertificate.id}`);
  return result;
}
```

### Monitor Expiring Certificates

```typescript
// Automated cron job runs daily at 9 AM
// Manual check:
async checkExpiring() {
  const expiring = await this.certService.getExpiringCertificates(30);

  for (const cert of expiring) {
    console.warn(
      `Certificate "${cert.name}" expires in ${cert.daysUntilExpiry} days`,
    );
    // Send notification to organisation admins
  }
}
```

## FNMT Certificates

### Certificate Format

- **Format**: PKCS#12 (.p12 or .pfx)
- **Issuer**: FNMT (Fábrica Nacional de Moneda y Timbre)
- **Contains**: X.509 certificate + private key
- **Password Protected**: Yes (required during upload)
- **Validity**: Typically 2-4 years

### Obtaining Certificates

1. Register at FNMT: https://www.cert.fnmt.es/
2. Generate certificate request
3. Verify identity at registration office
4. Download PKCS#12 certificate
5. Upload to Operate platform

### Certificate Structure

```
Subject: CN=Company Name, serialNumber=B12345678, ...
Issuer: CN=FNMT Clase 2 CA, O=FNMT-RCM, C=ES
Serial Number: 1234567890ABCDEF
Valid From: 2024-01-01
Valid To: 2026-01-01
Key Usage: digitalSignature, nonRepudiation
```

## AEAT Endpoints

### Production

```
https://www1.agenciatributaria.gob.es/wlpl/SSII-FACT/ws/fe/SiiFactFEV1SOAP
```

### Test (Pre-production)

```
https://prewww1.aeat.es/wlpl/SSII-FACT/ws/fe/SiiFactFEV1SOAP
```

## Audit Logging

All certificate operations are logged:

- `CREATED` - Certificate uploaded
- `ACCESSED` - Certificate retrieved
- `DELETED` - Certificate deactivated
- `ROTATED` - Certificate replaced
- `VALIDATION_FAILED` - Upload rejected
- `AEAT_TEST_SUCCESS` - Connectivity test passed
- `AEAT_TEST_FAILED` - Connectivity test failed
- `ENCRYPTION_KEY_ROTATED` - Master key rotated

Each log entry includes:
- Timestamp
- User ID
- IP address
- User agent
- Success/failure
- Error details (if applicable)

## Database Schema

```prisma
model SpainCertificate {
  id                 String   @id @default(cuid())
  organisationId     String
  name               String
  description        String?
  cifNif             String?  // Spanish tax ID
  encryptedData      Bytes    // AES-256-GCM encrypted
  encryptedPassword  Bytes
  iv                 Bytes
  authTag            Bytes
  thumbprint         String?  // SHA-256
  serialNumber       String?
  issuer             String?
  subject            String?
  validFrom          DateTime
  validTo            DateTime
  environment        String   // production | test
  isActive           Boolean
  lastUsedAt         DateTime?
  createdAt          DateTime
  updatedAt          DateTime
  createdBy          String
}
```

## Error Handling

```typescript
try {
  await certService.storeCertificate(...);
} catch (error) {
  if (error instanceof SpainCertificateError) {
    switch (error.code) {
      case SpainCertificateErrorCode.INVALID_PASSWORD:
        // Handle incorrect password
        break;
      case SpainCertificateErrorCode.CERTIFICATE_EXPIRED:
        // Handle expired certificate
        break;
      case SpainCertificateErrorCode.NOT_FNMT_CERTIFICATE:
        // Handle non-FNMT certificate
        break;
      // ... other error codes
    }
  }
}
```

## Testing

```bash
# Run unit tests
npm test spain-certificate.service.spec.ts

# Run with coverage
npm test -- --coverage spain-certificate.service.spec.ts
```

## Future Enhancements

- [ ] HSM integration for private key storage
- [ ] Automatic certificate renewal via FNMT API
- [ ] Certificate usage analytics
- [ ] Multi-certificate load balancing
- [ ] Certificate chain validation
- [ ] CRL/OCSP revocation checking
- [ ] Notification service integration

## References

- [AEAT SII Documentation](https://www.agenciatributaria.es/AEAT.internet/SII.shtml)
- [FNMT Certificate Authority](https://www.cert.fnmt.es/)
- [Spanish Tax Law (BOE)](https://www.boe.es/)
- [PKCS#12 Specification](https://tools.ietf.org/html/rfc7292)

## Support

For issues or questions:
- Internal: Contact security team
- FNMT: https://www.cert.fnmt.es/atencion-al-ciudadano
- AEAT: https://www.agenciatributaria.es/

## Security Considerations

1. **Never commit** certificates or passwords to version control
2. **Rotate** encryption keys annually or when compromised
3. **Monitor** certificate expiry dates proactively
4. **Test** new certificates in test environment first
5. **Backup** certificates securely offline
6. **Restrict** access to certificate management endpoints
7. **Audit** all certificate operations regularly
8. **Validate** certificate thumbprints after rotation
