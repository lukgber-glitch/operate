import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { DocumentStorageService } from './services/document-storage.service';
import { W4FormService } from './services/w4-form.service';
import { I9FormService } from './services/i9-form.service';
import {
  DocumentUploadDto,
  VerifyDocumentDto,
  RejectDocumentDto,
  DocumentQueryDto,
} from './dto/document-upload.dto';
import { EmployeeDocumentType, DOCUMENT_RETENTION_PERIODS } from './types/employee-document.types';

/**
 * Employee Documents Service
 * Orchestration layer for employee document management
 */
@Injectable()
export class EmployeeDocumentsService {
  private readonly logger = new Logger(EmployeeDocumentsService.name);

  constructor(
    private prisma: PrismaService,
    private storageService: DocumentStorageService,
    private w4FormService: W4FormService,
    private i9FormService: I9FormService,
  ) {}

  /**
   * Upload employee document
   */
  async uploadDocument(
    file: Express.Multer.File,
    employeeId: string,
    orgId: string,
    userId: string,
    dto: DocumentUploadDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    // Validate employee exists and belongs to org
    const employee = await this.validateEmployeeAccess(employeeId, orgId);

    // Store document securely
    const storageResult = await this.storageService.storeDocument(file, {
      employeeId,
      documentType: dto.documentType,
      orgId,
    });

    // Create document record
    const document = await this.prisma.employeeDocument.create({
      data: {
        employeeId,
        orgId,
        documentType: dto.documentType as Prisma.InputJsonValue,
        fileName: file.originalname,
        fileSize: storageResult.fileSize,
        mimeType: storageResult.mimeType,
        storageKey: storageResult.storageKey,
        encryptionKeyId: storageResult.encryptionKeyId,
        issueDate: dto.issueDate ? new Date(dto.issueDate) : null,
        expirationDate: dto.expirationDate ? new Date(dto.expirationDate) : null,
        documentNumber: dto.documentNumber,
        issuingAuthority: dto.issuingAuthority,
        countryCode: dto.countryCode,
        uploadedBy: userId,
        ipAddress,
        userAgent,
      },
    });

    this.logger.log(
      `Uploaded document ${document.id} for employee ${employeeId}`,
    );

    // Log audit event
    await this.logAuditEvent({
      action: 'UPLOAD',
      userId,
      employeeId,
      orgId,
      documentId: document.id,
      ipAddress,
      userAgent,
    });

    return document;
  }

  /**
   * Get document by ID
   */
  async getDocument(documentId: string, orgId: string, userId: string) {
    const document = await this.prisma.employeeDocument.findUnique({
      where: { id: documentId },
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
    });

    if (!document || document.deletedAt) {
      throw new NotFoundException(`Document ${documentId} not found`);
    }

    if (document.orgId !== orgId) {
      throw new ForbiddenException('Access denied to this document');
    }

    // Log access
    await this.logAuditEvent({
      action: 'VIEW',
      userId,
      employeeId: document.employeeId,
      orgId,
      documentId,
    });

    return document;
  }

  /**
   * Download document file
   */
  async downloadDocument(
    documentId: string,
    orgId: string,
    userId: string,
  ): Promise<{ buffer: Buffer; fileName: string; mimeType: string }> {
    const document = await this.getDocument(documentId, orgId, userId);

    // Retrieve and decrypt file
    const buffer = await this.storageService.retrieveDocument(document.storageKey);

    // Log download
    await this.logAuditEvent({
      action: 'DOWNLOAD',
      userId,
      employeeId: document.employeeId,
      orgId,
      documentId,
    });

    return {
      buffer,
      fileName: document.fileName,
      mimeType: document.mimeType,
    };
  }

  /**
   * List documents for employee
   */
  async listEmployeeDocuments(
    employeeId: string,
    orgId: string,
    query: DocumentQueryDto,
  ) {
    await this.validateEmployeeAccess(employeeId, orgId);

    const where: any = {
      employeeId,
      orgId,
      deletedAt: null,
    };

    if (query.documentType) {
      where.documentType = query.documentType;
    }

    const page = query.page || 1;
    const pageSize = query.pageSize || 20;
    const skip = (page - 1) * pageSize;

    const [documents, total] = await Promise.all([
      this.prisma.employeeDocument.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.employeeDocument.count({ where }),
    ]);

    return {
      data: documents,
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  /**
   * Verify document
   */
  async verifyDocument(
    documentId: string,
    orgId: string,
    userId: string,
    dto: VerifyDocumentDto,
  ) {
    const document = await this.getDocument(documentId, orgId, userId);

    const updated = await this.prisma.employeeDocument.update({
      where: { id: documentId },
      data: {
        status: 'VERIFIED' as Prisma.InputJsonValue,
        verifiedAt: new Date(),
        verifiedBy: userId,
      },
    });

    this.logger.log(`Verified document ${documentId}`);

    await this.logAuditEvent({
      action: 'VERIFY',
      userId,
      employeeId: document.employeeId,
      orgId,
      documentId,
      details: { notes: dto.notes },
    });

    return updated;
  }

  /**
   * Reject document
   */
  async rejectDocument(
    documentId: string,
    orgId: string,
    userId: string,
    dto: RejectDocumentDto,
  ) {
    const document = await this.getDocument(documentId, orgId, userId);

    const updated = await this.prisma.employeeDocument.update({
      where: { id: documentId },
      data: {
        status: 'REJECTED' as Prisma.InputJsonValue,
        rejectedAt: new Date(),
        rejectedBy: userId,
        rejectionReason: dto.reason,
      },
    });

    this.logger.log(`Rejected document ${documentId}: ${dto.reason}`);

    await this.logAuditEvent({
      action: 'REJECT',
      userId,
      employeeId: document.employeeId,
      orgId,
      documentId,
      details: { reason: dto.reason },
    });

    return updated;
  }

  /**
   * Delete document (soft delete)
   */
  async deleteDocument(documentId: string, orgId: string, userId: string) {
    const document = await this.getDocument(documentId, orgId, userId);

    await this.prisma.employeeDocument.update({
      where: { id: documentId },
      data: {
        deletedAt: new Date(),
      },
    });

    this.logger.log(`Deleted document ${documentId}`);

    await this.logAuditEvent({
      action: 'DELETE',
      userId,
      employeeId: document.employeeId,
      orgId,
      documentId,
    });
  }

  /**
   * Get documents requiring attention (expiring, pending verification, etc.)
   */
  async getDocumentsRequiringAttention(orgId: string) {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Documents expiring soon
    const expiring = await this.prisma.employeeDocument.findMany({
      where: {
        orgId,
        deletedAt: null,
        expirationDate: {
          gte: now,
          lte: thirtyDaysFromNow,
        },
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
      orderBy: { expirationDate: 'asc' },
    });

    // Pending verification
    const pendingVerification = await this.prisma.employeeDocument.findMany({
      where: {
        orgId,
        deletedAt: null,
        status: 'PENDING' as Prisma.InputJsonValue,
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
      orderBy: { createdAt: 'asc' },
      take: 50,
    });

    // I-9 forms requiring reverification
    const i9Reverification = await this.i9FormService.findRequiringReverification(orgId);

    return {
      expiring,
      pendingVerification,
      i9Reverification,
    };
  }

  /**
   * Check document retention compliance
   */
  async checkRetentionCompliance(orgId: string) {
    const now = new Date();
    const documentsToArchive: any[] = [];

    // Get all terminated employees
    const terminatedEmployees = await this.prisma.employee.findMany({
      where: {
        orgId,
        status: 'TERMINATED' as Prisma.InputJsonValue,
        terminationDate: { not: null },
      },
      select: {
        id: true,
        terminationDate: true,
        documents: {
          where: {
            deletedAt: null,
          },
        },
      },
    });

    for (const employee of terminatedEmployees) {
      if (!employee.terminationDate) continue;

      const terminationDate = new Date(employee.terminationDate);
      const yearsAfterTermination =
        (now.getTime() - terminationDate.getTime()) / (1000 * 60 * 60 * 24 * 365);

      for (const document of employee.documents) {
        let retentionYears = DOCUMENT_RETENTION_PERIODS.GENERAL_DOCUMENT;

        if (document.documentType === 'W4_FORM') {
          retentionYears = DOCUMENT_RETENTION_PERIODS.W4_FORM;
        } else if (document.documentType === 'I9_FORM') {
          retentionYears = DOCUMENT_RETENTION_PERIODS.I9_FORM;
        }

        if (yearsAfterTermination >= retentionYears) {
          documentsToArchive.push({
            documentId: document.id,
            employeeId: employee.id,
            documentType: document.documentType,
            retentionYears,
            yearsAfterTermination,
          });
        }
      }
    }

    return documentsToArchive;
  }

  /**
   * Validate employee access
   */
  private async validateEmployeeAccess(employeeId: string, orgId: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
    });

    if (!employee || employee.deletedAt) {
      throw new NotFoundException(`Employee ${employeeId} not found`);
    }

    if (employee.orgId !== orgId) {
      throw new ForbiddenException('Employee does not belong to this organization');
    }

    return employee;
  }

  /**
   * Log audit event
   */
  private async logAuditEvent(params: {
    action: string;
    userId: string;
    employeeId: string;
    orgId: string;
    documentId?: string;
    ipAddress?: string;
    userAgent?: string;
    details?: any;
  }) {
    await this.prisma.hrAuditLog.create({
      data: {
        orgId: params.orgId,
        employeeId: params.employeeId,
        userId: params.userId,
        action: `DOCUMENT_${params.action}`,
        entityType: 'EmployeeDocument',
        entityId: params.documentId || params.employeeId,
        oldValues: null,
        newValues: params.details || null,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      },
    });
  }
}
