import { Module, Global } from '@nestjs/common';
import { FinancialAuditService } from './financial-audit.service';
import { SecurityAuditService } from './security-audit.service';
import { DatabaseModule } from '../database/database.module';

/**
 * Financial Audit Module
 *
 * Provides audit logging for:
 * - Financial data access and modifications (FinancialAuditService)
 * - Security events and authentication (SecurityAuditService)
 *
 * Made global so it can be used across all modules without imports
 */
@Global()
@Module({
  imports: [DatabaseModule],
  providers: [FinancialAuditService, SecurityAuditService],
  exports: [FinancialAuditService, SecurityAuditService],
})
export class FinancialAuditModule {}
