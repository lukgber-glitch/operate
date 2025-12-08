import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { DocumentStorageService } from './document-storage.service';
import {
  CreateW4FormDto,
  UpdateW4FormDto,
  SignW4FormDto,
  W4FormResponseDto,
} from '../dto/w4-form.dto';
import {
  W4_DEPENDENT_AMOUNTS,
  W4_TAX_BRACKETS_2024,
  W4_STANDARD_DEDUCTIONS,
  FilingStatus,
} from '../types/employee-document.types';
import { Prisma } from '@prisma/client';

/**
 * W-4 Form Service
 * Handles W-4 form submission, validation, and withholding calculations
 */
@Injectable()
export class W4FormService {
  private readonly logger = new Logger(W4FormService.name);

  constructor(
    private prisma: PrismaService,
    private storageService: DocumentStorageService,
  ) {}

  /**
   * Create new W-4 form
   */
  async create(
    employeeId: string,
    orgId: string,
    dto: CreateW4FormDto,
  ): Promise<W4FormResponseDto> {
    // Validate employee exists
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
    });

    if (!employee || employee.deletedAt) {
      throw new NotFoundException(`Employee ${employeeId} not found`);
    }

    if (employee.orgId !== orgId) {
      throw new BadRequestException('Employee does not belong to this organization');
    }

    // Check if active W-4 exists for this tax year
    const existingActive = await this.prisma.w4Form.findFirst({
      where: {
        employeeId,
        taxYear: dto.taxYear,
        isActive: true,
        deletedAt: null,
      },
    });

    if (existingActive) {
      throw new ConflictException(
        `Active W-4 form already exists for tax year ${dto.taxYear}`,
      );
    }

    // Encrypt SSN
    const encryptedSSN = await this.storageService.encryptText(dto.ssn);

    // Calculate dependent amounts
    const dependentsUnder17Amount =
      dto.numberOfDependentsUnder17 * W4_DEPENDENT_AMOUNTS.CHILD_UNDER_17;
    const otherDependentsAmount =
      dto.numberOfOtherDependents * W4_DEPENDENT_AMOUNTS.OTHER_DEPENDENT;
    const totalClaimDependentsAmount =
      dependentsUnder17Amount + otherDependentsAmount;

    // Create W-4 form
    const w4Form = await this.prisma.w4Form.create({
      data: {
        employeeId,
        orgId,
        taxYear: dto.taxYear,
        firstName: dto.firstName,
        middleInitial: dto.middleInitial,
        lastName: dto.lastName,
        ssn: encryptedSSN,
        address: dto.address,
        city: dto.city,
        state: dto.state,
        zipCode: dto.zipCode,
        filingStatus: dto.filingStatus as Prisma.InputJsonValue,
        multipleJobsOrSpouseWorks: dto.multipleJobsOrSpouseWorks,
        numberOfDependentsUnder17: dto.numberOfDependentsUnder17,
        dependentsUnder17Amount,
        numberOfOtherDependents: dto.numberOfOtherDependents,
        otherDependentsAmount,
        totalClaimDependentsAmount,
        otherIncome: dto.otherIncome || 0,
        deductions: dto.deductions || 0,
        extraWithholding: dto.extraWithholding || 0,
        effectiveDate: dto.effectiveDate ? new Date(dto.effectiveDate) : new Date(),
        isActive: false, // Not active until signed
      },
    });

    this.logger.log(`Created W-4 form ${w4Form.id} for employee ${employeeId}`);

    return this.mapToResponseDto(w4Form);
  }

  /**
   * Update W-4 form (before signing)
   */
  async update(
    w4FormId: string,
    userId: string,
    dto: UpdateW4FormDto,
  ): Promise<W4FormResponseDto> {
    const w4Form = await this.prisma.w4Form.findUnique({
      where: { id: w4FormId },
    });

    if (!w4Form || w4Form.deletedAt) {
      throw new NotFoundException(`W-4 form ${w4FormId} not found`);
    }

    if (w4Form.signedAt) {
      throw new BadRequestException('Cannot update a signed W-4 form');
    }

    // Calculate dependent amounts if changed
    const updateData: Prisma.W4FormUpdateInput = {};

    if (dto.filingStatus !== undefined) {
      updateData.filingStatus = dto.filingStatus as Prisma.InputJsonValue;
    }

    if (dto.multipleJobsOrSpouseWorks !== undefined) {
      updateData.multipleJobsOrSpouseWorks = dto.multipleJobsOrSpouseWorks;
    }

    if (dto.numberOfDependentsUnder17 !== undefined) {
      updateData.numberOfDependentsUnder17 = dto.numberOfDependentsUnder17;
      updateData.dependentsUnder17Amount =
        dto.numberOfDependentsUnder17 * W4_DEPENDENT_AMOUNTS.CHILD_UNDER_17;
    }

    if (dto.numberOfOtherDependents !== undefined) {
      updateData.numberOfOtherDependents = dto.numberOfOtherDependents;
      updateData.otherDependentsAmount =
        dto.numberOfOtherDependents * W4_DEPENDENT_AMOUNTS.OTHER_DEPENDENT;
    }

    // Recalculate total if any dependent counts changed
    if (
      dto.numberOfDependentsUnder17 !== undefined ||
      dto.numberOfOtherDependents !== undefined
    ) {
      const under17 =
        dto.numberOfDependentsUnder17 ?? w4Form.numberOfDependentsUnder17;
      const other = dto.numberOfOtherDependents ?? w4Form.numberOfOtherDependents;
      updateData.totalClaimDependentsAmount =
        under17 * W4_DEPENDENT_AMOUNTS.CHILD_UNDER_17 +
        other * W4_DEPENDENT_AMOUNTS.OTHER_DEPENDENT;
    }

    if (dto.otherIncome !== undefined) {
      updateData.otherIncome = dto.otherIncome;
    }

    if (dto.deductions !== undefined) {
      updateData.deductions = dto.deductions;
    }

    if (dto.extraWithholding !== undefined) {
      updateData.extraWithholding = dto.extraWithholding;
    }

    const updated = await this.prisma.w4Form.update({
      where: { id: w4FormId },
      data: updateData,
    });

    this.logger.log(`Updated W-4 form ${w4FormId}`);

    return this.mapToResponseDto(updated);
  }

  /**
   * Sign W-4 form (makes it active)
   */
  async sign(
    w4FormId: string,
    userId: string,
    dto: SignW4FormDto,
  ): Promise<W4FormResponseDto> {
    const w4Form = await this.prisma.w4Form.findUnique({
      where: { id: w4FormId },
    });

    if (!w4Form || w4Form.deletedAt) {
      throw new NotFoundException(`W-4 form ${w4FormId} not found`);
    }

    if (w4Form.signedAt) {
      throw new BadRequestException('W-4 form is already signed');
    }

    if (!dto.confirmAccuracy) {
      throw new BadRequestException('Must confirm accuracy to sign W-4');
    }

    // Deactivate previous active W-4 forms for this employee and tax year
    await this.prisma.w4Form.updateMany({
      where: {
        employeeId: w4Form.employeeId,
        taxYear: w4Form.taxYear,
        isActive: true,
        id: { not: w4FormId },
      },
      data: {
        isActive: false,
        endDate: new Date(),
      },
    });

    // Calculate withholding
    const calculatedWithholding = this.calculateWithholding(w4Form);

    // Sign and activate the form
    const signed = await this.prisma.w4Form.update({
      where: { id: w4FormId },
      data: {
        signedAt: new Date(),
        signedBy: userId,
        isActive: true,
        calculatedWithholding,
      },
    });

    this.logger.log(
      `Signed W-4 form ${w4FormId} for employee ${w4Form.employeeId}`,
    );

    return this.mapToResponseDto(signed);
  }

  /**
   * Get W-4 form by ID
   */
  async findById(w4FormId: string): Promise<W4FormResponseDto> {
    const w4Form = await this.prisma.w4Form.findUnique({
      where: { id: w4FormId },
    });

    if (!w4Form || w4Form.deletedAt) {
      throw new NotFoundException(`W-4 form ${w4FormId} not found`);
    }

    return this.mapToResponseDto(w4Form);
  }

  /**
   * Get active W-4 for employee
   */
  async getActiveForEmployee(employeeId: string, taxYear?: number) {
    const year = taxYear || new Date().getFullYear();

    const w4Form = await this.prisma.w4Form.findFirst({
      where: {
        employeeId,
        taxYear: year,
        isActive: true,
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!w4Form) {
      throw new NotFoundException(
        `No active W-4 form found for employee ${employeeId} for tax year ${year}`,
      );
    }

    return this.mapToResponseDto(w4Form);
  }

  /**
   * Get all W-4 forms for employee
   */
  async findAllForEmployee(employeeId: string) {
    const w4Forms = await this.prisma.w4Form.findMany({
      where: {
        employeeId,
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    return w4Forms.map((form) => this.mapToResponseDto(form));
  }

  /**
   * Calculate withholding based on W-4 information
   * This is a simplified calculation - in production, use IRS Publication 15-T
   */
  private calculateWithholding(w4Form: any): number {
    const annualSalary = 50000; // TODO: Get from employee's contract
    const payPeriods = 26; // Bi-weekly

    // Get tax brackets for filing status
    const brackets =
      W4_TAX_BRACKETS_2024[w4Form.filingStatus as keyof typeof W4_TAX_BRACKETS_2024];
    const standardDeduction =
      W4_STANDARD_DEDUCTIONS[w4Form.filingStatus as keyof typeof W4_STANDARD_DEDUCTIONS];

    // Calculate taxable income
    let taxableIncome =
      annualSalary -
      standardDeduction -
      Number(w4Form.totalClaimDependentsAmount) +
      Number(w4Form.otherIncome) -
      Number(w4Form.deductions);

    // Calculate tax using brackets
    let annualTax = 0;
    let remainingIncome = taxableIncome;

    for (const bracket of brackets) {
      if (remainingIncome <= 0) break;

      const bracketIncome = Math.min(
        remainingIncome,
        bracket.max - bracket.min + 1,
      );
      annualTax += bracketIncome * bracket.rate;
      remainingIncome -= bracketIncome;
    }

    // Calculate per-paycheck withholding
    let perPaycheckWithholding = annualTax / payPeriods;

    // Add extra withholding
    perPaycheckWithholding += Number(w4Form.extraWithholding);

    // Adjust for multiple jobs if needed
    if (w4Form.multipleJobsOrSpouseWorks) {
      // Simplified adjustment - in production, use IRS worksheet
      perPaycheckWithholding *= 1.1;
    }

    return Math.round(perPaycheckWithholding * 100) / 100; // Round to 2 decimals
  }

  /**
   * Map to response DTO (without exposing SSN)
   */
  private mapToResponseDto(w4Form: any): W4FormResponseDto {
    return {
      id: w4Form.id,
      employeeId: w4Form.employeeId,
      taxYear: w4Form.taxYear,
      filingStatus: w4Form.filingStatus,
      numberOfDependentsUnder17: w4Form.numberOfDependentsUnder17,
      numberOfOtherDependents: w4Form.numberOfOtherDependents,
      dependentsUnder17Amount: Number(w4Form.dependentsUnder17Amount),
      otherDependentsAmount: Number(w4Form.otherDependentsAmount),
      totalClaimDependentsAmount: Number(w4Form.totalClaimDependentsAmount),
      otherIncome: Number(w4Form.otherIncome),
      deductions: Number(w4Form.deductions),
      extraWithholding: Number(w4Form.extraWithholding),
      calculatedWithholding: w4Form.calculatedWithholding
        ? Number(w4Form.calculatedWithholding)
        : undefined,
      isActive: w4Form.isActive,
      effectiveDate: w4Form.effectiveDate,
      signedAt: w4Form.signedAt,
      createdAt: w4Form.createdAt,
      updatedAt: w4Form.updatedAt,
    };
  }

  /**
   * Soft delete W-4 form
   */
  async softDelete(w4FormId: string): Promise<void> {
    const w4Form = await this.prisma.w4Form.findUnique({
      where: { id: w4FormId },
    });

    if (!w4Form || w4Form.deletedAt) {
      throw new NotFoundException(`W-4 form ${w4FormId} not found`);
    }

    await this.prisma.w4Form.update({
      where: { id: w4FormId },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    });

    this.logger.log(`Soft deleted W-4 form ${w4FormId}`);
  }
}
