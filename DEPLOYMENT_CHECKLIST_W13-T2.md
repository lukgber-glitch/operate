# Deployment Checklist: W13-T2 - ELSTER Certificate Management

## Pre-Deployment

### 1. Dependencies
- [ ] Install `node-forge`: `npm install node-forge`
- [ ] Install types: `npm install -D @types/node-forge`
- [ ] Verify installation: `npm list node-forge`

### 2. Environment Configuration
- [ ] Generate encryption key: `openssl rand -base64 32`
- [ ] Add to `.env`: `ELSTER_CERT_ENCRYPTION_KEY=<generated-key>`
- [ ] Verify key length (minimum 32 characters)
- [ ] Add to production secrets manager (AWS Secrets Manager, HashiCorp Vault, etc.)
- [ ] Add to staging environment
- [ ] Add to development environment (different key)

### 3. Database Migration
- [ ] Review migration file: `packages/database/prisma/migrations/add_elster_certificates/migration.sql`
- [ ] Generate Prisma client: `npx prisma generate`
- [ ] Run migration in development: `npx prisma migrate dev --name add_elster_certificates`
- [ ] Verify tables created: `ElsterCertificate`, `ElsterCertificateAuditLog`
- [ ] Check indexes are created
- [ ] Verify foreign key constraints

### 4. Code Review
- [ ] Review service implementation: `elster-certificate.service.ts`
- [ ] Review type definitions: `elster-certificate.types.ts`
- [ ] Review module configuration: `elster.module.ts`
- [ ] Verify error handling
- [ ] Check audit logging implementation

### 5. Testing
- [ ] Run unit tests: `npm test elster-certificate.service.spec.ts`
- [ ] Verify test coverage (should be >80%)
- [ ] Run integration tests (if available)
- [ ] Test in development environment with real certificate

### 6. Security Review
- [ ] Verify AES-256-GCM encryption is used
- [ ] Check IV is unique per operation
- [ ] Verify auth tags are stored and validated
- [ ] Review key derivation (SCRYPT)
- [ ] Audit logging is comprehensive
- [ ] No sensitive data in logs
- [ ] Soft deletes preserve audit trail

## Deployment Steps

### Development Environment
1. [ ] Install dependencies
2. [ ] Set environment variable
3. [ ] Run database migration
4. [ ] Run tests
5. [ ] Test with sample certificate
6. [ ] Verify audit logs are created

### Staging Environment
1. [ ] Deploy code
2. [ ] Set environment variable (different key than dev)
3. [ ] Run database migration: `npx prisma migrate deploy`
4. [ ] Smoke test certificate operations
5. [ ] Verify audit logging
6. [ ] Check database indexes

### Production Environment
1. [ ] Deploy code (after staging validation)
2. [ ] Set environment variable via secrets manager
3. [ ] Run database migration: `npx prisma migrate deploy`
4. [ ] Verify migration success
5. [ ] Monitor logs for errors
6. [ ] Set up monitoring alerts

## Post-Deployment

### 1. Monitoring Setup
- [ ] Set up certificate expiry alerts
  ```typescript
  // Cron job to check daily
  const expiring = await certificateService.getExpiringCertificates(30);
  if (expiring.length > 0) {
    // Send alert to admins
  }
  ```
- [ ] Monitor audit log volume
- [ ] Set up alerts for failed decryption attempts
- [ ] Track certificate usage patterns

### 2. Documentation
- [ ] Update team documentation
- [ ] Add runbook for certificate management
- [ ] Document renewal process
- [ ] Create admin guide for certificate upload

### 3. Integration
- [ ] Import module in tax module
  ```typescript
  import { ElsterModule } from './elster/elster.module';

  @Module({
    imports: [ElsterModule],
  })
  export class TaxModule {}
  ```
- [ ] Update tax filing service to use certificate service
- [ ] Test end-to-end ELSTER submission

### 4. Admin Setup
- [ ] Upload initial certificates (if applicable)
- [ ] Verify certificates are encrypted in database
- [ ] Test certificate retrieval
- [ ] Review audit logs

### 5. Backup & Recovery
- [ ] Document encryption key backup procedure
- [ ] Test key rotation procedure
- [ ] Verify certificate export (if needed)
- [ ] Document disaster recovery steps

## Verification Tests

### Functional Tests
```bash
# Test certificate storage
curl -X POST /api/elster/certificates \
  -H "Content-Type: application/json" \
  -d '{
    "organisationId": "org-123",
    "certificate": "<base64-encoded-cert>",
    "password": "<password>",
    "metadata": { "name": "Test Certificate" }
  }'

# Test certificate retrieval
curl -X GET /api/elster/certificates/org-123

# Test expiring certificates
curl -X GET /api/elster/certificates/expiring?days=30
```

### Database Verification
```sql
-- Check certificates are encrypted
SELECT id, name,
       length(encryptedData) as cert_size,
       length(encryptedPassword) as pass_size,
       isActive, validTo
FROM "ElsterCertificate"
WHERE organisationId = 'org-123';

-- Check audit logs
SELECT action, performedBy, success, createdAt
FROM "ElsterCertificateAuditLog"
WHERE organisationId = 'org-123'
ORDER BY createdAt DESC
LIMIT 10;

-- Check indexes
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename IN ('ElsterCertificate', 'ElsterCertificateAuditLog');
```

### Security Verification
- [ ] Verify certificates are not readable in raw form
- [ ] Check encryption key is not in code
- [ ] Audit logs contain no sensitive data
- [ ] Test unauthorized access fails
- [ ] Verify expired certificates are rejected

## Rollback Plan

If issues are encountered:

1. **Code Rollback**
   ```bash
   # Revert to previous version
   git revert <commit-hash>
   git push
   ```

2. **Database Rollback** (if necessary)
   ```bash
   # Create down migration
   npx prisma migrate dev --create-only
   # Edit migration to drop tables
   DROP TABLE "ElsterCertificateAuditLog";
   DROP TABLE "ElsterCertificate";
   # Apply rollback
   npx prisma migrate deploy
   ```

3. **Environment Variables**
   - Remove `ELSTER_CERT_ENCRYPTION_KEY` if no longer needed
   - Document original state

## Known Issues & Mitigations

### Issue 1: Performance with Large Certificates
**Mitigation**: Implement caching for frequently accessed certificates

### Issue 2: Key Rotation Downtime
**Mitigation**: Schedule during maintenance window, use `rotateEncryptionKey()` method

### Issue 3: Certificate Format Compatibility
**Mitigation**: Validate certificates before deployment, document supported formats

## Support Contacts

- **Developer**: SENTINEL (Security Engineer)
- **DBA**: Database team
- **Security**: Security team
- **On-call**: DevOps team

## Documentation Links

- Implementation: `/apps/api/src/modules/tax/elster/README.md`
- Types: `/apps/api/src/modules/tax/elster/types/elster-certificate.types.ts`
- Tests: `/apps/api/src/modules/tax/elster/services/__tests__/`
- Summary: `/IMPLEMENTATION_SUMMARY_W13-T2.md`

## Compliance

- [ ] GDPR compliance verified
- [ ] GoBD compliance verified
- [ ] Security audit completed
- [ ] Data retention policy documented

## Sign-off

- [ ] Code review approved
- [ ] Security review approved
- [ ] QA testing completed
- [ ] Documentation updated
- [ ] Deployment approved

**Deployed by**: _______________
**Date**: _______________
**Version**: _______________
