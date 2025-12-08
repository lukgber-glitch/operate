import { Module } from '@nestjs/common';
import { SecurityAuditService } from './security-audit.service';
import { DatabaseModule } from '../database/database.module';

/**
 * Security Audit Module
 *
 * Provides comprehensive security event logging:
 * - Login attempts (success/failure)
 * - Password changes
 * - Permission changes
 * - MFA events
 * - API key usage
 * - Sensitive data access
 *
 * Integrates with AuditLog table for immutable audit trail
 */
@Module({
  imports: [DatabaseModule],
  providers: [SecurityAuditService],
  exports: [SecurityAuditService],
})
export class SecurityAuditModule {}
