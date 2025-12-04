# ZATCA Certificate Database Migration

This document describes the database changes for ZATCA certificate management.

## Migration Steps

### 1. Update Prisma Schema

The following models have been added to `schema.prisma`:

- `ZatcaCertificate` - Main certificate storage
- `ZatcaCertificateAuditLog` - Audit trail
- `ZatcaCertificateRotation` - Rotation history
- `ZatcaSigningOperation` - Signing operations
- `ZatcaKeyManagementAudit` - Key management audit

### 2. Run Migration

```bash
# Generate Prisma client
npm run prisma:generate

# Create migration
npm run prisma:migrate dev --name add_zatca_certificates

# Apply migration to production
npm run prisma:migrate deploy
```

### 3. Verify Migration

```sql
-- Check tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name LIKE 'zatca_%';

-- Should return:
-- zatca_certificates
-- zatca_certificate_audit_logs
-- zatca_certificate_rotations
-- zatca_signing_operations
-- zatca_key_management_audit
```

### 4. Create Indexes

The following indexes are automatically created:

```sql
-- zatca_certificates
CREATE INDEX idx_zatca_cert_org ON zatca_certificates(organisation_id);
CREATE INDEX idx_zatca_cert_active ON zatca_certificates(is_active);
CREATE INDEX idx_zatca_cert_status ON zatca_certificates(csid_status);
CREATE INDEX idx_zatca_cert_valid_to ON zatca_certificates(valid_to);
CREATE INDEX idx_zatca_cert_env ON zatca_certificates(environment);
CREATE INDEX idx_zatca_cert_type ON zatca_certificates(certificate_type);

-- zatca_certificate_audit_logs
CREATE INDEX idx_zatca_audit_cert ON zatca_certificate_audit_logs(certificate_id);
CREATE INDEX idx_zatca_audit_org ON zatca_certificate_audit_logs(organisation_id);
CREATE INDEX idx_zatca_audit_action ON zatca_certificate_audit_logs(action);
CREATE INDEX idx_zatca_audit_created ON zatca_certificate_audit_logs(created_at);

-- zatca_certificate_rotations
CREATE INDEX idx_zatca_rotation_cert ON zatca_certificate_rotations(certificate_id);
CREATE INDEX idx_zatca_rotation_status ON zatca_certificate_rotations(rotation_status);

-- zatca_signing_operations
CREATE INDEX idx_zatca_signing_cert ON zatca_signing_operations(certificate_id);
CREATE INDEX idx_zatca_signing_invoice ON zatca_signing_operations(invoice_id);
CREATE INDEX idx_zatca_signing_created ON zatca_signing_operations(created_at);
```

## Data Types

### Binary Data Storage

Private keys and certificates are stored as `Bytes` (PostgreSQL `BYTEA`):

```sql
encrypted_private_key BYTEA NOT NULL,
encrypted_certificate BYTEA,
iv BYTEA NOT NULL,
auth_tag BYTEA NOT NULL
```

### JSON Fields

Audit details are stored as JSON:

```sql
details JSONB
```

## Security Considerations

1. **Encryption at Rest**
   - Enable PostgreSQL encryption for sensitive columns
   - Use database-level encryption for entire tablespace

2. **Access Control**
   - Restrict direct database access
   - Use application-level access control
   - Audit all direct database queries

3. **Backup Strategy**
   - Encrypt backups containing certificate data
   - Test restore procedures regularly
   - Maintain separate encryption keys for backups

4. **Compliance**
   - Retain audit logs for required period (recommend 7 years)
   - Implement data retention policies
   - Document access procedures

## Rollback Procedure

If migration needs to be rolled back:

```bash
# Rollback last migration
npm run prisma:migrate resolve --rolled-back MIGRATION_NAME

# Or manually drop tables
DROP TABLE IF EXISTS zatca_signing_operations;
DROP TABLE IF EXISTS zatca_certificate_rotations;
DROP TABLE IF EXISTS zatca_certificate_audit_logs;
DROP TABLE IF EXISTS zatca_key_management_audit;
DROP TABLE IF EXISTS zatca_certificates;

# Drop enums
DROP TYPE IF EXISTS "ZatcaCertificateType";
DROP TYPE IF EXISTS "ZatcaCsidStatus";
DROP TYPE IF EXISTS "ZatcaInvoiceType";
```

## Performance Tuning

### Recommended Settings

```sql
-- For large audit log tables
ALTER TABLE zatca_certificate_audit_logs SET (autovacuum_vacuum_scale_factor = 0.05);
ALTER TABLE zatca_signing_operations SET (autovacuum_vacuum_scale_factor = 0.05);

-- Partition audit logs by month (if volume is high)
CREATE TABLE zatca_certificate_audit_logs_2024_01
PARTITION OF zatca_certificate_audit_logs
FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
```

## Monitoring

### Key Metrics

Monitor these metrics:

1. **Certificate Count**
   ```sql
   SELECT certificate_type, csid_status, COUNT(*)
   FROM zatca_certificates
   GROUP BY certificate_type, csid_status;
   ```

2. **Expiring Certificates**
   ```sql
   SELECT COUNT(*)
   FROM zatca_certificates
   WHERE valid_to < NOW() + INTERVAL '30 days'
   AND is_active = true;
   ```

3. **Signing Operations Volume**
   ```sql
   SELECT DATE(created_at), COUNT(*)
   FROM zatca_signing_operations
   WHERE created_at > NOW() - INTERVAL '7 days'
   GROUP BY DATE(created_at);
   ```

4. **Audit Log Growth**
   ```sql
   SELECT pg_size_pretty(pg_total_relation_size('zatca_certificate_audit_logs'));
   ```
