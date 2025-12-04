import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { EmployeesRepository } from './employees.repository';
import { CountryContextService } from '../../country-context/country-context.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { UpdateTaxInfoDto } from './dto/update-tax-info.dto';
import { UpdateBankingDto } from './dto/update-banking.dto';
import { EmployeeQueryDto } from './dto/employee-query.dto';
import { EmployeeResponseDto } from './dto/employee-response.dto';
import { CreateContractDto } from './dto/create-contract.dto';
import { UpdateContractDto } from './dto/update-contract.dto';
import { Prisma } from '@prisma/client';

/**
 * Employees Service
 * Business logic for employee management operations
 */
@Injectable()
export class EmployeesService {
  private readonly logger = new Logger(EmployeesService.name);

  constructor(
    private repository: EmployeesRepository,
    private countryContextService: CountryContextService,
  ) {}

  /**
   * Find all employees with pagination and filters
   */
  async findAll(
    orgId: string,
    query: EmployeeQueryDto,
  ): Promise<{
    data: EmployeeResponseDto[];
    meta: {
      total: number;
      page: number;
      pageSize: number;
      totalPages: number;
    };
  }> {
    const {
      search,
      status,
      department,
      countryCode,
      page = 1,
      pageSize = 20,
      sortBy = 'lastName',
      sortOrder = 'asc',
    } = query;

    // Build where clause
    const where: Prisma.EmployeeWhereInput = {
      orgId,
      deletedAt: null,
      ...(status && { status }),
      ...(countryCode && { countryCode }),
      ...(search && {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { employeeNumber: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    // Handle department filter (requires contract join)
    if (department) {
      where.contracts = {
        some: {
          department,
          isActive: true,
        },
      };
    }

    const skip = (page - 1) * pageSize;

    const [employees, total] = await Promise.all([
      this.repository.findAll({
        where,
        skip,
        take: pageSize,
        orderBy: { [sortBy]: sortOrder },
        include: {
          contracts: {
            where: { isActive: true },
            take: 1,
            orderBy: { startDate: 'desc' },
          },
        },
      }),
      this.repository.count(where),
    ]);

    return {
      data: employees.map((emp) => this.maskSensitiveData(emp)),
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  /**
   * Find employee by ID
   */
  async findById(id: string): Promise<EmployeeResponseDto> {
    const employee = await this.repository.findById(id, {
      contracts: {
        where: { isActive: true },
      },
    });

    if (!employee || employee.deletedAt) {
      throw new NotFoundException(`Employee with ID ${id} not found`);
    }

    return this.maskSensitiveData(employee);
  }

  /**
   * Create new employee
   */
  async create(
    orgId: string,
    dto: CreateEmployeeDto,
  ): Promise<EmployeeResponseDto> {
    // Validate country is supported
    await this.validateCountry(dto.countryCode);

    // Check employee number uniqueness
    const numberExists = await this.repository.employeeNumberExists(
      orgId,
      dto.employeeNumber,
    );
    if (numberExists) {
      throw new ConflictException(
        `Employee number ${dto.employeeNumber} already exists`,
      );
    }

    // Check email uniqueness
    const emailExists = await this.repository.emailExists(orgId, dto.email);
    if (emailExists) {
      throw new ConflictException(
        `Employee with email ${dto.email} already exists`,
      );
    }

    const employee = await this.repository.create({
      organisation: { connect: { id: orgId } },
      ...(dto.userId && { user: { connect: { id: dto.userId } } }),
      employeeNumber: dto.employeeNumber,
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email,
      phone: dto.phone,
      dateOfBirth: new Date(dto.dateOfBirth),
      gender: dto.gender,
      nationality: dto.nationality,
      street: dto.street,
      city: dto.city,
      postalCode: dto.postalCode,
      countryCode: dto.countryCode.toUpperCase(),
      taxId: dto.taxId,
      taxClass: dto.taxClass,
      churchTax: dto.churchTax ?? false,
      bankName: dto.bankName,
      iban: dto.iban,
      bic: dto.bic,
      status: dto.status,
      hireDate: new Date(dto.hireDate),
      terminationDate: dto.terminationDate
        ? new Date(dto.terminationDate)
        : null,
    });

    this.logger.log(`Created employee ${employee.id} for organisation ${orgId}`);

    return this.maskSensitiveData(employee);
  }

  /**
   * Update employee
   */
  async update(
    id: string,
    dto: UpdateEmployeeDto,
  ): Promise<EmployeeResponseDto> {
    const existing = await this.repository.findById(id);

    if (!existing || existing.deletedAt) {
      throw new NotFoundException(`Employee with ID ${id} not found`);
    }

    // Check email uniqueness if changing
    if (dto.email && dto.email !== existing.email) {
      const emailExists = await this.repository.emailExists(
        existing.orgId,
        dto.email,
        id,
      );
      if (emailExists) {
        throw new ConflictException(
          `Employee with email ${dto.email} already exists`,
        );
      }
    }

    const updateData: Prisma.EmployeeUpdateInput = {};

    if (dto.firstName) updateData.firstName = dto.firstName;
    if (dto.lastName) updateData.lastName = dto.lastName;
    if (dto.email) updateData.email = dto.email;
    if (dto.phone !== undefined) updateData.phone = dto.phone;
    if (dto.gender !== undefined) updateData.gender = dto.gender;
    if (dto.nationality !== undefined) updateData.nationality = dto.nationality;
    if (dto.street !== undefined) updateData.street = dto.street;
    if (dto.city !== undefined) updateData.city = dto.city;
    if (dto.postalCode !== undefined) updateData.postalCode = dto.postalCode;
    if (dto.status) updateData.status = dto.status;
    if (dto.terminationDate !== undefined) {
      updateData.terminationDate = dto.terminationDate
        ? new Date(dto.terminationDate)
        : null;
    }

    const employee = await this.repository.update(id, updateData);

    this.logger.log(`Updated employee ${id}`);

    return this.maskSensitiveData(employee);
  }

  /**
   * Soft delete employee
   */
  async softDelete(id: string): Promise<void> {
    const existing = await this.repository.findById(id);

    if (!existing || existing.deletedAt) {
      throw new NotFoundException(`Employee with ID ${id} not found`);
    }

    await this.repository.softDelete(id);

    this.logger.log(`Soft deleted employee ${id}`);
  }

  /**
   * Restore soft-deleted employee
   */
  async restore(id: string): Promise<EmployeeResponseDto> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundException(`Employee with ID ${id} not found`);
    }

    if (!existing.deletedAt) {
      throw new BadRequestException('Employee is not deleted');
    }

    const employee = await this.repository.restore(id);

    this.logger.log(`Restored employee ${id}`);

    return this.maskSensitiveData(employee);
  }

  /**
   * Update employee tax information
   */
  async updateTaxInfo(
    id: string,
    dto: UpdateTaxInfoDto,
  ): Promise<EmployeeResponseDto> {
    const existing = await this.repository.findById(id);

    if (!existing || existing.deletedAt) {
      throw new NotFoundException(`Employee with ID ${id} not found`);
    }

    const updateData: Prisma.EmployeeUpdateInput = {};
    if (dto.taxId !== undefined) updateData.taxId = dto.taxId;
    if (dto.taxClass !== undefined) updateData.taxClass = dto.taxClass;
    if (dto.churchTax !== undefined) updateData.churchTax = dto.churchTax;

    const employee = await this.repository.update(id, updateData);

    this.logger.log(`Updated tax info for employee ${id}`);

    return this.maskSensitiveData(employee);
  }

  /**
   * Update employee banking details
   */
  async updateBanking(
    id: string,
    dto: UpdateBankingDto,
  ): Promise<EmployeeResponseDto> {
    const existing = await this.repository.findById(id);

    if (!existing || existing.deletedAt) {
      throw new NotFoundException(`Employee with ID ${id} not found`);
    }

    const updateData: Prisma.EmployeeUpdateInput = {};
    if (dto.bankName !== undefined) updateData.bankName = dto.bankName;
    if (dto.iban !== undefined) updateData.iban = dto.iban;
    if (dto.bic !== undefined) updateData.bic = dto.bic;

    const employee = await this.repository.update(id, updateData);

    this.logger.log(`Updated banking info for employee ${id}`);

    return this.maskSensitiveData(employee);
  }

  // ============================================================================
  // CONTRACT METHODS
  // ============================================================================

  /**
   * Get employee contracts
   */
  async getContracts(employeeId: string) {
    const employee = await this.repository.findById(employeeId);

    if (!employee || employee.deletedAt) {
      throw new NotFoundException(`Employee with ID ${employeeId} not found`);
    }

    return this.repository.findContracts(employeeId);
  }

  /**
   * Get active contract for employee
   */
  async getActiveContract(employeeId: string) {
    const employee = await this.repository.findById(employeeId);

    if (!employee || employee.deletedAt) {
      throw new NotFoundException(`Employee with ID ${employeeId} not found`);
    }

    return this.repository.findActiveContract(employeeId);
  }

  /**
   * Create employment contract
   */
  async createContract(employeeId: string, dto: CreateContractDto) {
    const employee = await this.repository.findById(employeeId);

    if (!employee || employee.deletedAt) {
      throw new NotFoundException(`Employee with ID ${employeeId} not found`);
    }

    // Validate contract type is valid for country
    await this.validateContractType(employee.countryCode, dto.contractType);

    // Deactivate existing active contracts
    await this.repository.deactivateEmployeeContracts(employeeId);

    const contract = await this.repository.createContract({
      employee: { connect: { id: employeeId } },
      contractType: dto.contractType,
      title: dto.title,
      department: dto.department,
      startDate: new Date(dto.startDate),
      endDate: dto.endDate ? new Date(dto.endDate) : null,
      probationEnd: dto.probationEnd ? new Date(dto.probationEnd) : null,
      salaryAmount: dto.salaryAmount,
      salaryCurrency: dto.salaryCurrency || 'EUR',
      salaryPeriod: dto.salaryPeriod,
      weeklyHours: dto.weeklyHours,
      workingDays: dto.workingDays,
      benefits: dto.benefits || null,
      isActive: true,
    });

    this.logger.log(`Created contract ${contract.id} for employee ${employeeId}`);

    return contract;
  }

  /**
   * Update employment contract
   */
  async updateContract(contractId: string, dto: UpdateContractDto) {
    const contract = await this.repository.findContractById(contractId);

    if (!contract) {
      throw new NotFoundException(`Contract with ID ${contractId} not found`);
    }

    const updateData: Prisma.EmploymentContractUpdateInput = {};
    if (dto.title) updateData.title = dto.title;
    if (dto.department !== undefined) updateData.department = dto.department;
    if (dto.endDate !== undefined) {
      updateData.endDate = dto.endDate ? new Date(dto.endDate) : null;
    }
    if (dto.salaryAmount !== undefined) updateData.salaryAmount = dto.salaryAmount;
    if (dto.weeklyHours !== undefined) updateData.weeklyHours = dto.weeklyHours;
    if (dto.workingDays) updateData.workingDays = dto.workingDays;
    if (dto.benefits !== undefined) updateData.benefits = dto.benefits;

    const updated = await this.repository.updateContract(contractId, updateData);

    this.logger.log(`Updated contract ${contractId}`);

    return updated;
  }

  /**
   * Terminate employment contract
   */
  async terminateContract(contractId: string, endDate: Date) {
    const contract = await this.repository.findContractById(contractId);

    if (!contract) {
      throw new NotFoundException(`Contract with ID ${contractId} not found`);
    }

    const updated = await this.repository.updateContract(contractId, {
      endDate,
      isActive: false,
    });

    this.logger.log(`Terminated contract ${contractId}`);

    return updated;
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Validate country is supported
   */
  private async validateCountry(countryCode: string): Promise<void> {
    try {
      await this.countryContextService.findCountryByCode(
        countryCode.toUpperCase(),
      );
    } catch (error) {
      throw new BadRequestException(
        `Country ${countryCode} is not supported`,
      );
    }
  }

  /**
   * Validate contract type is valid for country
   */
  private async validateContractType(
    countryCode: string,
    contractType: string,
  ): Promise<void> {
    const employmentTypes =
      await this.countryContextService.getEmploymentTypes(countryCode);

    // Map contract types to employment type codes
    // This is a simplified check - in production, you'd have a more robust mapping
    const validTypes = employmentTypes.map((t) => t.code.toUpperCase());

    this.logger.debug(
      `Valid employment types for ${countryCode}: ${validTypes.join(', ')}`,
    );

    // For now, we'll just log a warning if validation would be needed
    // In production, implement proper mapping and validation
  }

  /**
   * Mask sensitive data in employee response
   */
  private maskSensitiveData(employee: any): EmployeeResponseDto {
    return {
      ...employee,
      // Mask IBAN (show first 4 and last 3 characters)
      iban: employee.iban
        ? `${employee.iban.substring(0, 4)}***************${employee.iban.slice(-3)}`
        : null,
      // Mask Tax ID (show last 3 characters)
      taxId: employee.taxId ? `***********${employee.taxId.slice(-3)}` : null,
    };
  }
}
