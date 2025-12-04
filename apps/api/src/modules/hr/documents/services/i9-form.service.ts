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
  CreateI9Section1Dto,
  CreateI9Section2Dto,
  CreateI9Section3Dto,
  I9FormResponseDto,
} from '../dto/i9-form.dto';
import { EVerifyStatus } from '../types/employee-document.types';

/**
 * I-9 Form Service
 * Handles I-9 form submission, verification, and compliance monitoring
 */
@Injectable()
export class I9FormService {
  private readonly logger = new Logger(I9FormService.name);

  constructor(
    private prisma: PrismaService,
    private storageService: DocumentStorageService,
  ) {}

  /**
   * Create I-9 form with Section 1 (Employee section)
   */
  async createSection1(
    employeeId: string,
    orgId: string,
    dto: CreateI9Section1Dto,
  ): Promise<I9FormResponseDto> {
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

    // Check if active I-9 exists
    const existingActive = await this.prisma.i9Form.findFirst({
      where: {
        employeeId,
        isActive: true,
        deletedAt: null,
      },
    });

    if (existingActive) {
      throw new ConflictException('Active I-9 form already exists for this employee');
    }

    // Validate citizenship status (exactly one must be true)
    const citizenshipChecks = [
      dto.citizenOfUS,
      dto.nonCitizenNational,
      dto.lawfulPermanentResident,
      dto.alienAuthorizedToWork,
    ];
    const selectedCount = citizenshipChecks.filter((v) => v === true).length;

    if (selectedCount !== 1) {
      throw new BadRequestException(
        'Exactly one citizenship status must be selected',
      );
    }

    // Encrypt SSN if provided
    const encryptedSSN = dto.ssn
      ? await this.storageService.encryptText(dto.ssn)
      : null;

    // Create I-9 form with Section 1 completed
    const i9Form = await this.prisma.i9Form.create({
      data: {
        employeeId,
        orgId,
        section1CompletedAt: new Date(),
        lastName: dto.lastName,
        firstName: dto.firstName,
        middleInitial: dto.middleInitial,
        otherLastNames: dto.otherLastNames,
        address: dto.address,
        city: dto.city,
        state: dto.state,
        zipCode: dto.zipCode,
        dateOfBirth: new Date(dto.dateOfBirth),
        ssn: encryptedSSN,
        email: dto.email,
        phone: dto.phone,
        citizenOfUS: dto.citizenOfUS,
        nonCitizenNational: dto.nonCitizenNational,
        lawfulPermanentResident: dto.lawfulPermanentResident,
        alienAuthorizedToWork: dto.alienAuthorizedToWork,
        uscisNumber: dto.uscisNumber,
        i94AdmissionNumber: dto.i94AdmissionNumber,
        foreignPassportNumber: dto.foreignPassportNumber,
        countryOfIssuance: dto.countryOfIssuance,
        workAuthorizationExpiry: dto.workAuthorizationExpiry
          ? new Date(dto.workAuthorizationExpiry)
          : null,
        employeeSignature: 'ELECTRONIC_SIGNATURE',
        employeeSignedAt: new Date(),
        eVerifyStatus: EVerifyStatus.NOT_SUBMITTED,
        isActive: true,
      },
    });

    this.logger.log(
      `Created I-9 Section 1 for employee ${employeeId}, form ID: ${i9Form.id}`,
    );

    return this.mapToResponseDto(i9Form);
  }

  /**
   * Complete I-9 Section 2 (Employer verification)
   * Must be completed within 3 business days of employee's first day
   */
  async completeSection2(
    i9FormId: string,
    userId: string,
    dto: CreateI9Section2Dto,
  ): Promise<I9FormResponseDto> {
    const i9Form = await this.prisma.i9Form.findUnique({
      where: { id: i9FormId },
    });

    if (!i9Form || i9Form.deletedAt) {
      throw new NotFoundException(`I-9 form ${i9FormId} not found`);
    }

    if (!i9Form.section1CompletedAt) {
      throw new BadRequestException('Section 1 must be completed first');
    }

    if (i9Form.section2CompletedAt) {
      throw new BadRequestException('Section 2 is already completed');
    }

    // Validate document requirements
    this.validateI9Documents(dto);

    // Update I-9 form with Section 2
    const updated = await this.prisma.i9Form.update({
      where: { id: i9FormId },
      data: {
        section2CompletedAt: new Date(),
        firstDayOfEmployment: new Date(dto.firstDayOfEmployment),
        documentListA: dto.documentListA as any,
        documentListATitle: dto.documentListATitle,
        documentListAIssuer: dto.documentListAIssuer,
        documentListANumber: dto.documentListANumber,
        documentListAExpiry: dto.documentListAExpiry
          ? new Date(dto.documentListAExpiry)
          : null,
        documentListB: dto.documentListB as any,
        documentListBTitle: dto.documentListBTitle,
        documentListBIssuer: dto.documentListBIssuer,
        documentListBNumber: dto.documentListBNumber,
        documentListBExpiry: dto.documentListBExpiry
          ? new Date(dto.documentListBExpiry)
          : null,
        documentListC: dto.documentListC as any,
        documentListCTitle: dto.documentListCTitle,
        documentListCIssuer: dto.documentListCIssuer,
        documentListCNumber: dto.documentListCNumber,
        documentListCExpiry: dto.documentListCExpiry
          ? new Date(dto.documentListCExpiry)
          : null,
        employerName: dto.employerName,
        employerAddress: dto.employerAddress,
        employerCity: dto.employerCity,
        employerState: dto.employerState,
        employerZipCode: dto.employerZipCode,
        employerRepName: dto.employerRepName,
        employerRepTitle: dto.employerRepTitle,
        employerRepSignature: 'ELECTRONIC_SIGNATURE',
        employerSignedAt: new Date(),
      },
    });

    this.logger.log(`Completed I-9 Section 2 for form ${i9FormId}`);

    // Check if reverification will be needed
    await this.checkReverificationNeeds(i9FormId);

    return this.mapToResponseDto(updated);
  }

  /**
   * Complete I-9 Section 3 (Reverification and Rehires)
   */
  async completeSection3(
    i9FormId: string,
    userId: string,
    dto: CreateI9Section3Dto,
  ): Promise<I9FormResponseDto> {
    const i9Form = await this.prisma.i9Form.findUnique({
      where: { id: i9FormId },
    });

    if (!i9Form || i9Form.deletedAt) {
      throw new NotFoundException(`I-9 form ${i9FormId} not found`);
    }

    if (!i9Form.section2CompletedAt) {
      throw new BadRequestException('Section 2 must be completed first');
    }

    // Update I-9 form with Section 3
    const updated = await this.prisma.i9Form.update({
      where: { id: i9FormId },
      data: {
        section3CompletedAt: new Date(),
        reverificationReason: dto.reverificationReason,
        reverificationDate: new Date(dto.reverificationDate),
        reverificationDocument: dto.reverificationDocument,
        reverificationDocumentNumber: dto.reverificationDocumentNumber,
        reverificationDocumentExpiry: dto.reverificationDocumentExpiry
          ? new Date(dto.reverificationDocumentExpiry)
          : null,
        requiresReverification: false, // Reset flag after reverification
      },
    });

    this.logger.log(`Completed I-9 Section 3 for form ${i9FormId}`);

    // Check if future reverification will be needed
    await this.checkReverificationNeeds(i9FormId);

    return this.mapToResponseDto(updated);
  }

  /**
   * Get I-9 form by ID
   */
  async findById(i9FormId: string): Promise<I9FormResponseDto> {
    const i9Form = await this.prisma.i9Form.findUnique({
      where: { id: i9FormId },
    });

    if (!i9Form || i9Form.deletedAt) {
      throw new NotFoundException(`I-9 form ${i9FormId} not found`);
    }

    return this.mapToResponseDto(i9Form);
  }

  /**
   * Get active I-9 for employee
   */
  async getActiveForEmployee(employeeId: string) {
    const i9Form = await this.prisma.i9Form.findFirst({
      where: {
        employeeId,
        isActive: true,
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!i9Form) {
      throw new NotFoundException(
        `No active I-9 form found for employee ${employeeId}`,
      );
    }

    return this.mapToResponseDto(i9Form);
  }

  /**
   * Get all I-9 forms for employee
   */
  async findAllForEmployee(employeeId: string) {
    const i9Forms = await this.prisma.i9Form.findMany({
      where: {
        employeeId,
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    return i9Forms.map((form) => this.mapToResponseDto(form));
  }

  /**
   * Get I-9 forms requiring reverification
   */
  async findRequiringReverification(orgId: string) {
    const i9Forms = await this.prisma.i9Form.findMany({
      where: {
        orgId,
        requiresReverification: true,
        isActive: true,
        deletedAt: null,
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { workAuthorizationExpiry: 'asc' },
    });

    return i9Forms.map((form) => this.mapToResponseDto(form));
  }

  /**
   * Submit to E-Verify (placeholder for integration)
   */
  async submitToEVerify(i9FormId: string): Promise<void> {
    const i9Form = await this.prisma.i9Form.findUnique({
      where: { id: i9FormId },
    });

    if (!i9Form || i9Form.deletedAt) {
      throw new NotFoundException(`I-9 form ${i9FormId} not found`);
    }

    if (!i9Form.section2CompletedAt) {
      throw new BadRequestException(
        'Section 2 must be completed before E-Verify submission',
      );
    }

    // TODO: Implement E-Verify API integration
    // For now, just update status

    await this.prisma.i9Form.update({
      where: { id: i9FormId },
      data: {
        eVerifyStatus: EVerifyStatus.SUBMITTED,
        eVerifySubmittedAt: new Date(),
        eVerifyCaseNumber: `CASE-${Date.now()}`, // Placeholder
      },
    });

    this.logger.log(`Submitted I-9 form ${i9FormId} to E-Verify (placeholder)`);
  }

  /**
   * Validate I-9 document requirements
   * Must provide either List A, OR both List B and List C
   */
  private validateI9Documents(dto: CreateI9Section2Dto): void {
    const hasListA = !!dto.documentListA;
    const hasListB = !!dto.documentListB;
    const hasListC = !!dto.documentListC;

    const validCombinations = [
      hasListA && !hasListB && !hasListC, // List A only
      !hasListA && hasListB && hasListC, // List B + List C
    ];

    if (!validCombinations.some((v) => v)) {
      throw new BadRequestException(
        'Must provide either List A document, OR both List B and List C documents',
      );
    }
  }

  /**
   * Check if reverification is needed
   */
  private async checkReverificationNeeds(i9FormId: string): Promise<void> {
    const i9Form = await this.prisma.i9Form.findUnique({
      where: { id: i9FormId },
    });

    if (!i9Form) return;

    // Check if work authorization has expiry date
    if (i9Form.workAuthorizationExpiry) {
      const now = new Date();
      const expiryDate = new Date(i9Form.workAuthorizationExpiry);
      const daysUntilExpiry = Math.floor(
        (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );

      // Flag for reverification if expiring within 90 days
      if (daysUntilExpiry <= 90 && daysUntilExpiry >= 0) {
        await this.prisma.i9Form.update({
          where: { id: i9FormId },
          data: { requiresReverification: true },
        });

        this.logger.warn(
          `I-9 form ${i9FormId} requires reverification (expires in ${daysUntilExpiry} days)`,
        );
      }
    }
  }

  /**
   * Map to response DTO
   */
  private mapToResponseDto(i9Form: any): I9FormResponseDto {
    let citizenshipStatus = 'UNKNOWN';
    if (i9Form.citizenOfUS) citizenshipStatus = 'US_CITIZEN';
    else if (i9Form.nonCitizenNational) citizenshipStatus = 'NON_CITIZEN_NATIONAL';
    else if (i9Form.lawfulPermanentResident) citizenshipStatus = 'PERMANENT_RESIDENT';
    else if (i9Form.alienAuthorizedToWork) citizenshipStatus = 'AUTHORIZED_ALIEN';

    return {
      id: i9Form.id,
      employeeId: i9Form.employeeId,
      section1CompletedAt: i9Form.section1CompletedAt,
      section2CompletedAt: i9Form.section2CompletedAt,
      section3CompletedAt: i9Form.section3CompletedAt,
      citizenshipStatus,
      workAuthorizationExpiry: i9Form.workAuthorizationExpiry,
      requiresReverification: i9Form.requiresReverification,
      eVerifyStatus: i9Form.eVerifyStatus,
      isActive: i9Form.isActive,
      createdAt: i9Form.createdAt,
      updatedAt: i9Form.updatedAt,
    };
  }

  /**
   * Soft delete I-9 form
   */
  async softDelete(i9FormId: string): Promise<void> {
    const i9Form = await this.prisma.i9Form.findUnique({
      where: { id: i9FormId },
    });

    if (!i9Form || i9Form.deletedAt) {
      throw new NotFoundException(`I-9 form ${i9FormId} not found`);
    }

    await this.prisma.i9Form.update({
      where: { id: i9FormId },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    });

    this.logger.log(`Soft deleted I-9 form ${i9FormId}`);
  }
}
