import { Module } from '@nestjs/common';
import { ScheduledPaymentsController } from './scheduled-payments.controller';
import { ScheduledPaymentsService } from './scheduled-payments.service';
import { RbacModule } from '../../auth/rbac/rbac.module';
import { DatabaseModule } from '../../database/database.module';

/**
 * Scheduled Payments Module
 * Manages scheduled payments for bills and invoices
 *
 * Features:
 * - Schedule payments for future dates
 * - Manage payment methods and bank accounts
 * - Execute payments immediately or on schedule
 * - Track payment status (pending, processing, completed, failed)
 * - View upcoming and due-today payments
 */
@Module({
  imports: [RbacModule, DatabaseModule],
  controllers: [ScheduledPaymentsController],
  providers: [ScheduledPaymentsService],
  exports: [ScheduledPaymentsService],
})
export class ScheduledPaymentsModule {}
