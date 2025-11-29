import { Module } from '@nestjs/common';
import { EmployeesController } from './employees.controller';
import { EmployeesService } from './employees.service';
import { EmployeesRepository } from './employees.repository';
import { CountryContextModule } from '../../country-context/country-context.module';
import { RbacModule } from '../../auth/rbac/rbac.module';

/**
 * Employees Module
 * Manages employee records and employment contracts
 */
@Module({
  imports: [CountryContextModule, RbacModule],
  controllers: [EmployeesController],
  providers: [EmployeesService, EmployeesRepository],
  exports: [EmployeesService, EmployeesRepository],
})
export class EmployeesModule {}
