import { Module, Global } from '@nestjs/common';
import { FinancialAuditService } from './financial-audit.service';
import { DatabaseModule } from '../database/database.module';

/**
 * Financial Audit Module
 *
 * Provides audit logging for financial data access and modifications
 * Made global so it can be used across all financial modules without imports
 */
@Global()
@Module({
  imports: [DatabaseModule],
  providers: [FinancialAuditService],
  exports: [FinancialAuditService],
})
export class FinancialAuditModule {}
