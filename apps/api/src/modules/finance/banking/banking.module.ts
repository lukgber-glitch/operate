import { Module } from '@nestjs/common';
import { BankingController } from './banking.controller';
import { BankingService } from './banking.service';
import { BankingRepository } from './banking.repository';
import { RbacModule } from '../../auth/rbac/rbac.module';

/**
 * Banking Module
 * Manages bank account and transaction operations
 */
@Module({
  imports: [RbacModule],
  controllers: [BankingController],
  providers: [BankingService, BankingRepository],
  exports: [BankingService, BankingRepository],
})
export class BankingModule {}
