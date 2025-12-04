import { Module } from '@nestjs/common';
import { CostsController } from './costs.controller';
import { CostsService } from './costs.service';
import { CostsRepository } from './costs.repository';
import { RbacModule } from '../auth/rbac/rbac.module';
import { BudgetsModule } from './budgets/budgets.module';

/**
 * Costs Module
 * Manages cost tracking for automations and AI operations
 * Includes budget management system with threshold alerts and auto-pause
 */
@Module({
  imports: [RbacModule, BudgetsModule],
  controllers: [CostsController],
  providers: [CostsService, CostsRepository],
  exports: [CostsService, CostsRepository, BudgetsModule],
})
export class CostsModule {}
