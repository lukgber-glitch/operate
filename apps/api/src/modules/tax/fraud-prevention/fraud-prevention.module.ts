/**
 * Fraud Prevention Module
 *
 * Provides fraud detection and prevention for tax deductions
 */

import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { RbacModule } from '../../auth/rbac/rbac.module';
import { FraudPreventionController } from './fraud-prevention.controller';
import { FraudPreventionService } from './fraud-prevention.service';

@Module({
  imports: [DatabaseModule, RbacModule],
  controllers: [FraudPreventionController],
  providers: [FraudPreventionService],
  exports: [FraudPreventionService],
})
export class FraudPreventionModule {}
