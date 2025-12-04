import { Module } from '@nestjs/common';
import { EmployeesModule } from './employees/employees.module';
import { LeaveModule } from './leave/leave.module';
import { EmployeeDocumentsModule } from './documents/employee-documents.module';

/**
 * HR Module
 * Parent module for all HR-related functionality
 */
@Module({
  imports: [
    EmployeesModule,
    LeaveModule,
    EmployeeDocumentsModule,
  ],
  exports: [
    EmployeesModule,
    LeaveModule,
    EmployeeDocumentsModule,
  ],
})
export class HrModule {}
