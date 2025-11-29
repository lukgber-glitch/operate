import { Module } from '@nestjs/common';
import { ExpensesController } from './expenses.controller';
import { ExpensesService } from './expenses.service';
import { ExpensesRepository } from './expenses.repository';
import { RbacModule } from '../../auth/rbac/rbac.module';

/**
 * Expenses Module
 * Manages expense operations
 */
@Module({
  imports: [RbacModule],
  controllers: [ExpensesController],
  providers: [ExpensesService, ExpensesRepository],
  exports: [ExpensesService, ExpensesRepository],
})
export class ExpensesModule {}
