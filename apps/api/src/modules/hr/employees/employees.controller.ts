import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { EmployeesService } from './employees.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { UpdateTaxInfoDto } from './dto/update-tax-info.dto';
import { UpdateBankingDto } from './dto/update-banking.dto';
import { EmployeeQueryDto } from './dto/employee-query.dto';
import { EmployeeResponseDto } from './dto/employee-response.dto';
import { CreateContractDto } from './dto/create-contract.dto';
import { UpdateContractDto } from './dto/update-contract.dto';
import { TerminateContractDto } from './dto/terminate-contract.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RbacGuard } from '../../auth/rbac/rbac.guard';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { Permission } from '../../auth/rbac/permissions';

/**
 * Employees Controller
 * Handles employee and contract management operations
 */
@ApiTags('HR - Employees')
@Controller('organisations/:orgId/employees')
@UseGuards(JwtAuthGuard, RbacGuard)
@ApiBearerAuth()
export class EmployeesController {
  constructor(private employeesService: EmployeesService) {}

  // ============================================================================
  // EMPLOYEE ENDPOINTS
  // ============================================================================

  /**
   * List all employees in organisation
   */
  @Get()
  @RequirePermissions(Permission.EMPLOYEES_READ)
  @ApiOperation({
    summary: 'List employees',
    description: 'Get paginated list of employees with filters',
  })
  @ApiParam({
    name: 'orgId',
    description: 'Organisation ID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Employees retrieved successfully',
    type: [EmployeeResponseDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  async findAll(
    @Param('orgId') orgId: string,
    @Query() query: EmployeeQueryDto,
  ) {
    return this.employeesService.findAll(orgId, query);
  }

  /**
   * Get single employee by ID
   */
  @Get(':id')
  @RequirePermissions(Permission.EMPLOYEES_READ)
  @ApiOperation({
    summary: 'Get employee',
    description: 'Retrieve single employee by ID',
  })
  @ApiParam({
    name: 'orgId',
    description: 'Organisation ID',
    type: 'string',
  })
  @ApiParam({
    name: 'id',
    description: 'Employee ID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Employee retrieved successfully',
    type: EmployeeResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Employee not found',
  })
  async findOne(@Param('id') id: string): Promise<EmployeeResponseDto> {
    return this.employeesService.findById(id);
  }

  /**
   * Create new employee
   */
  @Post()
  @RequirePermissions(Permission.EMPLOYEES_CREATE)
  @ApiOperation({
    summary: 'Create employee',
    description: 'Create a new employee record',
  })
  @ApiParam({
    name: 'orgId',
    description: 'Organisation ID',
    type: 'string',
  })
  @ApiResponse({
    status: 201,
    description: 'Employee created successfully',
    type: EmployeeResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: 409,
    description: 'Employee number or email already exists',
  })
  async create(
    @Param('orgId') orgId: string,
    @Body() createEmployeeDto: CreateEmployeeDto,
  ): Promise<EmployeeResponseDto> {
    return this.employeesService.create(orgId, createEmployeeDto);
  }

  /**
   * Update employee
   */
  @Patch(':id')
  @RequirePermissions(Permission.EMPLOYEES_UPDATE)
  @ApiOperation({
    summary: 'Update employee',
    description: 'Update employee details',
  })
  @ApiParam({
    name: 'orgId',
    description: 'Organisation ID',
    type: 'string',
  })
  @ApiParam({
    name: 'id',
    description: 'Employee ID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Employee updated successfully',
    type: EmployeeResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Employee not found',
  })
  async update(
    @Param('id') id: string,
    @Body() updateEmployeeDto: UpdateEmployeeDto,
  ): Promise<EmployeeResponseDto> {
    return this.employeesService.update(id, updateEmployeeDto);
  }

  /**
   * Soft delete employee
   */
  @Delete(':id')
  @RequirePermissions(Permission.EMPLOYEES_DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete employee',
    description: 'Soft delete an employee record',
  })
  @ApiParam({
    name: 'orgId',
    description: 'Organisation ID',
    type: 'string',
  })
  @ApiParam({
    name: 'id',
    description: 'Employee ID',
    type: 'string',
  })
  @ApiResponse({
    status: 204,
    description: 'Employee deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Employee not found',
  })
  async delete(@Param('id') id: string): Promise<void> {
    return this.employeesService.softDelete(id);
  }

  /**
   * Restore soft-deleted employee
   */
  @Post(':id/restore')
  @RequirePermissions(Permission.EMPLOYEES_CREATE)
  @ApiOperation({
    summary: 'Restore employee',
    description: 'Restore a soft-deleted employee',
  })
  @ApiParam({
    name: 'orgId',
    description: 'Organisation ID',
    type: 'string',
  })
  @ApiParam({
    name: 'id',
    description: 'Employee ID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Employee restored successfully',
    type: EmployeeResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Employee not found',
  })
  async restore(@Param('id') id: string): Promise<EmployeeResponseDto> {
    return this.employeesService.restore(id);
  }

  // ============================================================================
  // TAX & BANKING ENDPOINTS
  // ============================================================================

  /**
   * Update employee tax information
   */
  @Patch(':id/tax-info')
  @RequirePermissions(Permission.EMPLOYEES_UPDATE)
  @ApiOperation({
    summary: 'Update tax info',
    description: 'Update employee tax information',
  })
  @ApiParam({
    name: 'orgId',
    description: 'Organisation ID',
    type: 'string',
  })
  @ApiParam({
    name: 'id',
    description: 'Employee ID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Tax info updated successfully',
    type: EmployeeResponseDto,
  })
  async updateTaxInfo(
    @Param('id') id: string,
    @Body() dto: UpdateTaxInfoDto,
  ): Promise<EmployeeResponseDto> {
    return this.employeesService.updateTaxInfo(id, dto);
  }

  /**
   * Update employee banking details
   */
  @Patch(':id/banking')
  @RequirePermissions(Permission.EMPLOYEES_UPDATE)
  @ApiOperation({
    summary: 'Update banking',
    description: 'Update employee banking details',
  })
  @ApiParam({
    name: 'orgId',
    description: 'Organisation ID',
    type: 'string',
  })
  @ApiParam({
    name: 'id',
    description: 'Employee ID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Banking info updated successfully',
    type: EmployeeResponseDto,
  })
  async updateBanking(
    @Param('id') id: string,
    @Body() dto: UpdateBankingDto,
  ): Promise<EmployeeResponseDto> {
    return this.employeesService.updateBanking(id, dto);
  }

  // ============================================================================
  // CONTRACT ENDPOINTS
  // ============================================================================

  /**
   * List employee contracts
   */
  @Get(':id/contracts')
  @RequirePermissions(Permission.EMPLOYEES_READ)
  @ApiOperation({
    summary: 'List contracts',
    description: 'Get all contracts for an employee',
  })
  @ApiParam({
    name: 'orgId',
    description: 'Organisation ID',
    type: 'string',
  })
  @ApiParam({
    name: 'id',
    description: 'Employee ID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Contracts retrieved successfully',
  })
  async getContracts(@Param('id') employeeId: string) {
    return this.employeesService.getContracts(employeeId);
  }

  /**
   * Create employment contract
   */
  @Post(':id/contracts')
  @RequirePermissions(Permission.EMPLOYEES_UPDATE)
  @ApiOperation({
    summary: 'Create contract',
    description: 'Create a new employment contract',
  })
  @ApiParam({
    name: 'orgId',
    description: 'Organisation ID',
    type: 'string',
  })
  @ApiParam({
    name: 'id',
    description: 'Employee ID',
    type: 'string',
  })
  @ApiResponse({
    status: 201,
    description: 'Contract created successfully',
  })
  async createContract(
    @Param('id') employeeId: string,
    @Body() dto: CreateContractDto,
  ) {
    return this.employeesService.createContract(employeeId, dto);
  }

  /**
   * Update employment contract
   */
  @Patch(':employeeId/contracts/:contractId')
  @RequirePermissions(Permission.EMPLOYEES_UPDATE)
  @ApiOperation({
    summary: 'Update contract',
    description: 'Update an employment contract',
  })
  @ApiParam({
    name: 'orgId',
    description: 'Organisation ID',
    type: 'string',
  })
  @ApiParam({
    name: 'employeeId',
    description: 'Employee ID',
    type: 'string',
  })
  @ApiParam({
    name: 'contractId',
    description: 'Contract ID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Contract updated successfully',
  })
  async updateContract(
    @Param('contractId') contractId: string,
    @Body() dto: UpdateContractDto,
  ) {
    return this.employeesService.updateContract(contractId, dto);
  }

  /**
   * Terminate employment contract
   */
  @Post(':employeeId/contracts/:contractId/terminate')
  @RequirePermissions(Permission.EMPLOYEES_UPDATE)
  @ApiOperation({
    summary: 'Terminate contract',
    description: 'Terminate an employment contract',
  })
  @ApiParam({
    name: 'orgId',
    description: 'Organisation ID',
    type: 'string',
  })
  @ApiParam({
    name: 'employeeId',
    description: 'Employee ID',
    type: 'string',
  })
  @ApiParam({
    name: 'contractId',
    description: 'Contract ID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Contract terminated successfully',
  })
  async terminateContract(
    @Param('contractId') contractId: string,
    @Body() dto: TerminateContractDto,
  ) {
    return this.employeesService.terminateContract(
      contractId,
      new Date(dto.endDate),
    );
  }
}
