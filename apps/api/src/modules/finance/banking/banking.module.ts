import { Module } from '@nestjs/common';
import { BankingController } from './banking.controller';
import { BankingService } from './banking.service';
import { BankingRepository } from './banking.repository';
import { TransactionPipelineService } from './transaction-pipeline.service';
import { RbacModule } from '../../auth/rbac/rbac.module';
import { TransactionCategorizationModule } from '../../ai/transaction-categorization/transaction-categorization.module';
import { ClassificationModule } from '../../ai/classification/classification.module';

/**
 * Banking Module
 * Manages bank account and transaction operations
 * Includes automatic transaction classification pipeline
 */
@Module({
  imports: [
    RbacModule,
    TransactionCategorizationModule,
    ClassificationModule,
  ],
  controllers: [BankingController],
  providers: [BankingService, BankingRepository, TransactionPipelineService],
  exports: [BankingService, BankingRepository, TransactionPipelineService],
})
export class BankingModule {}
