import { Module } from '@nestjs/common';
import { InvoicesController } from './invoices.controller';
import { InvoicesService } from './invoices.service';
import { InvoicesRepository } from './invoices.repository';
import { RbacModule } from '../../auth/rbac/rbac.module';

/**
 * Invoices Module
 * Manages invoice operations
 */
@Module({
  imports: [RbacModule],
  controllers: [InvoicesController],
  providers: [InvoicesService, InvoicesRepository],
  exports: [InvoicesService, InvoicesRepository],
})
export class InvoicesModule {}
