/**
 * Transaction Categorization Module
 * Provides AI-powered categorization for bank transactions
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TransactionCategorizationService } from './transaction-categorization.service';
import { PrismaModule } from '../../database/prisma.module';

@Module({
  imports: [ConfigModule, PrismaModule],
  providers: [TransactionCategorizationService],
  exports: [TransactionCategorizationService],
})
export class TransactionCategorizationModule {}
