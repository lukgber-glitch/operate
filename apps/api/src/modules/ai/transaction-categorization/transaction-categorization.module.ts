/**
 * Transaction Categorization Module
 * Provides AI-powered categorization for bank transactions
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TransactionCategorizationService } from './transaction-categorization.service';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [ConfigModule, DatabaseModule],
  providers: [TransactionCategorizationService],
  exports: [TransactionCategorizationService],
})
export class TransactionCategorizationModule {}
