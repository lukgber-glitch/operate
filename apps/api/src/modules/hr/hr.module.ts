import { Module } from '@nestjs/common';
import { EmployeesModule } from './employees/employees.module';
import { LeaveModule } from './leave/leave.module';

/**
 * HR Module
 * Parent module for all HR-related functionality
 */
@Module({
  imports: [EmployeesModule, LeaveModule],
  exports: [EmployeesModule, LeaveModule],
})
export class HrModule {}
