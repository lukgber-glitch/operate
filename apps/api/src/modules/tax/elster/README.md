# ELSTER Certificate Management

Secure management of digital certificates for German tax authority (ELSTER) integration.

## Overview

The ELSTER Certificate Management system provides secure storage, retrieval, and lifecycle management of PKCS#12 (.pfx/.p12) certificates required for automated tax filing with the German ELSTER system.

## Features

- **AES-256-GCM Encryption**: Military-grade encryption for certificate and password storage
- **Certificate Validation**: Automatic validation of certificate format, expiry, and validity
- **Expiry Monitoring**: Track certificates approaching expiration (30-day warning)
- **Comprehensive Audit Logging**: Complete audit trail of all certificate operations
- **Access Control**: Organisation-level isolation and user-based access control
- **Key Rotation**: Support for encryption key rotation without data loss

## Security Architecture

### Encryption

- **Algorithm**: AES-256-GCM (Galois/Counter Mode)
- **Key Derivation**: SCRYPT with random salt
- **IV**: Random 16-byte initialization vector per operation
- **Authentication**: 16-byte authentication tag for integrity verification

### Storage

Certificates are stored in encrypted form with the following components:
- Encrypted certificate data
- Encrypted password
- Initialization vector (IV)
- Authentication tag
- Certificate metadata (serial number, issuer, subject, validity dates)

### Audit Trail

All operations are logged with:
- Action type (CREATED, ACCESSED, DELETED, etc.)
- User ID and IP address
- Success/failure status
- Error messages (if applicable)
- Timestamps

## Environment Variables

### Required

```bash
# Master encryption key for certificate storage
# MUST be at least 32 characters long
# Generate with: openssl rand -base64 32
ELSTER_CERT_ENCRYPTION_KEY=your-secure-32-character-minimum-key-here
```

### Recommended

```bash
# Database connection (if not already configured)
DATABASE_URL=postgresql://user:password@localhost:5432/operate

# Node environment
NODE_ENV=production
```

## Usage

### Import Module

```typescript
import { ElsterModule } from '@/modules/tax/elster/elster.module';

@Module({
  imports: [ElsterModule],
})
export class TaxModule {}
```

### Store a Certificate

```typescript
import { ElsterCertificateService } from '@/modules/tax/elster/services';

@Injectable()
export class MyService {
  constructor(private certificateService: ElsterCertificateService) {}

  async storeCertificate(certFile: Buffer, password: string, userId: string) {
    const summary = await this.certificateService.storeCertificate({
      organisationId: 'org-123',
      certificate: certFile,
      password: password,
      metadata: {
        name: 'Production ELSTER Certificate',
        description: 'Main certificate for tax filing',
      },
      context: {
        userId: userId,
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0...',
      },
    });

    console.log(`Certificate stored: ${summary.id}`);
    console.log(`Valid until: ${summary.validTo}`);
    console.log(`Days until expiry: ${summary.daysUntilExpiry}`);
  }
}
```

### Retrieve a Certificate

```typescript
async useCertificate(certId: string, userId: string) {
  const cert = await this.certificateService.getCertificate({
    organisationId: 'org-123',
    certificateId: certId,
    context: {
      userId: userId,
      ipAddress: '192.168.1.1',
    },
    updateLastUsed: true, // Track usage
  });

  // Use the certificate
  const certBuffer = cert.certificate;
  const password = cert.password;

  // ... perform ELSTER submission ...
}
```

### List Certificates

```typescript
async listCertificates() {
  const certificates = await this.certificateService.listCertificates('org-123');

  certificates.forEach((cert) => {
    console.log(`${cert.name}:`);
    console.log(`  - Valid: ${cert.validFrom} to ${cert.validTo}`);
    console.log(`  - Status: ${cert.isActive ? 'Active' : 'Inactive'}`);
    console.log(`  - Expiring soon: ${cert.isExpiringSoon ? 'Yes' : 'No'}`);
    console.log(`  - Expired: ${cert.isExpired ? 'Yes' : 'No'}`);
  });
}
```

### Monitor Expiring Certificates

```typescript
async checkExpiringCertificates() {
  // Get certificates expiring in next 60 days
  const expiring = await this.certificateService.getExpiringCertificates(60);

  expiring.forEach((cert) => {
    console.warn(
      `Certificate "${cert.name}" expires in ${cert.daysUntilExpiry} days!`
    );
    // Send notification to admin...
  });
}
```

### Delete a Certificate

```typescript
async deleteCertificate(certId: string, userId: string) {
  await this.certificateService.deleteCertificate({
    organisationId: 'org-123',
    certificateId: certId,
    context: {
      userId: userId,
      ipAddress: '192.168.1.1',
    },
  });

  console.log('Certificate deleted (soft delete - marked inactive)');
}
```

### Validate Before Storing

```typescript
async validateCertificate(certFile: Buffer, password: string) {
  const validation = await this.certificateService.validateCertificate(
    certFile,
    password
  );

  if (!validation.isValid) {
    console.error('Certificate validation failed:');
    validation.errors.forEach((error) => console.error(`  - ${error}`));
    return;
  }

  if (validation.warnings.length > 0) {
    console.warn('Certificate warnings:');
    validation.warnings.forEach((warning) => console.warn(`  - ${warning}`));
  }

  console.log('Certificate is valid:');
  console.log(`  Serial: ${validation.metadata.serialNumber}`);
  console.log(`  Issuer: ${validation.metadata.issuer}`);
  console.log(`  Subject: ${validation.metadata.subject}`);
  console.log(`  Valid: ${validation.metadata.validFrom} to ${validation.metadata.validTo}`);
}
```

## Database Schema

### ElsterCertificate

| Column | Type | Description |
|--------|------|-------------|
| id | String | Unique identifier (CUID) |
| organisationId | String | Organisation owner |
| name | String | User-friendly name |
| encryptedData | Bytes | Encrypted certificate |
| encryptedPassword | Bytes | Encrypted password |
| iv | Bytes | Initialization vector |
| authTag | Bytes | Authentication tag |
| serialNumber | String? | Certificate serial number |
| issuer | String? | Certificate issuer |
| subject | String? | Certificate subject |
| validFrom | DateTime | Validity start date |
| validTo | DateTime | Validity end date |
| isActive | Boolean | Active status |
| lastUsedAt | DateTime? | Last usage timestamp |
| createdAt | DateTime | Creation timestamp |
| updatedAt | DateTime | Last update timestamp |
| createdBy | String | Creator user ID |

### ElsterCertificateAuditLog

| Column | Type | Description |
|--------|------|-------------|
| id | String | Unique identifier (CUID) |
| certificateId | String | Related certificate |
| organisationId | String | Organisation |
| action | String | Action type |
| performedBy | String | User who performed action |
| ipAddress | String? | Request IP address |
| userAgent | String? | Request user agent |
| success | Boolean | Success status |
| errorMessage | String? | Error message if failed |
| details | JSON? | Additional details |
| createdAt | DateTime | Log timestamp |

## Migration

To apply the database schema:

```bash
# Generate Prisma client
npx prisma generate

# Run migration
npx prisma migrate dev --name add_elster_certificates

# Or in production
npx prisma migrate deploy
```

## Error Handling

The service throws `CertificateError` with specific error codes:

- `INVALID_CERTIFICATE`: Certificate format is invalid
- `INVALID_PASSWORD`: Password is incorrect
- `CERTIFICATE_EXPIRED`: Certificate has expired
- `DECRYPTION_FAILED`: Failed to decrypt certificate
- `ENCRYPTION_FAILED`: Failed to encrypt certificate
- `NOT_FOUND`: Certificate not found
- `UNAUTHORIZED`: Access denied
- `VALIDATION_FAILED`: Certificate validation failed
- `STORAGE_FAILED`: Database storage failed
- `KEY_ROTATION_FAILED`: Key rotation failed

Example error handling:

```typescript
try {
  const cert = await certificateService.getCertificate({...});
} catch (error) {
  if (error instanceof CertificateError) {
    switch (error.code) {
      case CertificateErrorCode.CERTIFICATE_EXPIRED:
        console.error('Certificate expired on:', error.details.validTo);
        break;
      case CertificateErrorCode.NOT_FOUND:
        console.error('Certificate not found');
        break;
      default:
        console.error('Certificate error:', error.message);
    }
  } else {
    throw error; // Unexpected error
  }
}
```

## Security Best Practices

1. **Encryption Key Management**
   - Store `ELSTER_CERT_ENCRYPTION_KEY` in secure secret management (AWS Secrets Manager, HashiCorp Vault, etc.)
   - Never commit the key to version control
   - Rotate the key periodically using `rotateEncryptionKey()`
   - Use different keys for different environments

2. **Access Control**
   - Always validate `organisationId` matches the authenticated user's organisation
   - Implement role-based access control (RBAC) for certificate management
   - Log all certificate access for compliance

3. **Certificate Lifecycle**
   - Monitor expiring certificates with `getExpiringCertificates()`
   - Set up automated alerts for certificates expiring within 30 days
   - Maintain a backup of certificates in secure offline storage
   - Document certificate renewal procedures

4. **Audit Compliance**
   - Regularly review audit logs for suspicious activity
   - Retain audit logs according to regulatory requirements (typically 10+ years for tax data)
   - Export audit logs to external SIEM systems

## Testing

Run the test suite:

```bash
# Unit tests
npm test elster-certificate.service.spec.ts

# With coverage
npm test -- --coverage elster-certificate.service.spec.ts

# Watch mode
npm test -- --watch elster-certificate.service.spec.ts
```

## Dependencies

- `@nestjs/common`: NestJS framework
- `@nestjs/config`: Configuration management
- `@prisma/client`: Database ORM
- `node-forge`: Certificate parsing and validation
- `crypto`: Node.js built-in cryptography

Install additional dependency:

```bash
npm install node-forge
npm install -D @types/node-forge
```

## Troubleshooting

### Certificate Upload Fails

1. Check certificate format (must be PKCS#12 .pfx or .p12)
2. Verify password is correct
3. Ensure certificate is not expired
4. Check certificate contains both certificate and private key

### Decryption Fails

1. Verify `ELSTER_CERT_ENCRYPTION_KEY` is set correctly
2. Check if encryption key was rotated
3. Ensure database has not been corrupted
4. Review audit logs for clues

### Performance Issues

1. Add database indexes (already included in migration)
2. Implement certificate caching for frequently accessed certificates
3. Use `updateLastUsed: false` when not needed
4. Archive old/inactive certificates

## License

Proprietary - Operate/CoachOS
