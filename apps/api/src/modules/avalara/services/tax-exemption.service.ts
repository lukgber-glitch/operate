import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ExemptionType, ExemptionStatus } from '@prisma/client';
import { createHash } from 'crypto';

/**
 * DTO for creating an exemption certificate
 */
export interface CreateExemptionCertificateDto {
  orgId: string;
  customerId?: string;
  certificateNumber: string;
  exemptionType: ExemptionType;
  exemptionReason?: string;
  effectiveDate: Date;
  expirationDate?: Date;
  states: string[];
  documentUrl?: string;
  issuingAuthority?: string;
  issuingState?: string;
  verifiedBy?: string;
}

/**
 * DTO for updating an exemption certificate
 */
export interface UpdateExemptionCertificateDto {
  status?: ExemptionStatus;
  expirationDate?: Date;
  states?: string[];
  documentUrl?: string;
  verifiedBy?: string;
}

/**
 * Tax Exemption Service
 * Manages tax exemption certificates for customers
 * Handles resale certificates, nonprofit exemptions, and government entity exemptions
 */
@Injectable()
export class TaxExemptionService {
  private readonly logger = new Logger(TaxExemptionService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new exemption certificate
   */
  async createExemptionCertificate(dto: CreateExemptionCertificateDto) {
    try {
      this.logger.debug(
        `Creating exemption certificate ${dto.certificateNumber} for customer ${dto.customerId}`,
      );

      // Generate document hash if URL provided
      let documentHash: string | undefined;
      if (dto.documentUrl) {
        documentHash = this.generateDocumentHash(dto.documentUrl);
      }

      const certificate = await this.prisma.taxExemptionCertificate.create({
        data: {
          orgId: dto.orgId,
          customerId: dto.customerId,
          certificateNumber: dto.certificateNumber,
          exemptionType: dto.exemptionType,
          exemptionReason: dto.exemptionReason,
          status: ExemptionStatus.ACTIVE,
          effectiveDate: dto.effectiveDate,
          expirationDate: dto.expirationDate,
          states: dto.states,
          documentUrl: dto.documentUrl,
          documentHash,
          issuingAuthority: dto.issuingAuthority,
          issuingState: dto.issuingState,
          verifiedBy: dto.verifiedBy,
          verifiedAt: dto.verifiedBy ? new Date() : undefined,
        },
      });

      this.logger.log(`Exemption certificate ${certificate.certificateNumber} created`);

      return certificate;
    } catch (error) {
      this.logger.error(`Failed to create exemption certificate: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to create exemption certificate: ${error.message}`);
    }
  }

  /**
   * Update an exemption certificate
   */
  async updateExemptionCertificate(
    certificateId: string,
    dto: UpdateExemptionCertificateDto,
  ) {
    try {
      const certificate = await this.prisma.taxExemptionCertificate.update({
        where: { id: certificateId },
        data: {
          ...dto,
          verifiedAt: dto.verifiedBy ? new Date() : undefined,
        },
      });

      this.logger.log(`Exemption certificate ${certificate.certificateNumber} updated`);

      return certificate;
    } catch (error) {
      this.logger.error(`Failed to update exemption certificate: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to update exemption certificate: ${error.message}`);
    }
  }

  /**
   * Get active exemption for a customer in a specific state
   */
  async getActiveExemption(orgId: string, customerId: string, state?: string) {
    const whereClause: any = {
      orgId,
      customerId,
      status: ExemptionStatus.ACTIVE,
      OR: [
        { expirationDate: null },
        { expirationDate: { gte: new Date() } },
      ],
    };

    if (state) {
      whereClause.states = { has: state };
    }

    return await this.prisma.taxExemptionCertificate.findFirst({
      where: whereClause,
      orderBy: { effectiveDate: 'desc' },
    });
  }

  /**
   * Validate an exemption certificate
   */
  async validateExemptionCertificate(
    certificateId: string,
    verifiedBy: string,
  ) {
    const certificate = await this.prisma.taxExemptionCertificate.findUnique({
      where: { id: certificateId },
    });

    if (!certificate) {
      throw new NotFoundException('Exemption certificate not found');
    }

    // Check if expired
    if (certificate.expirationDate && certificate.expirationDate < new Date()) {
      await this.prisma.taxExemptionCertificate.update({
        where: { id: certificateId },
        data: { status: ExemptionStatus.EXPIRED },
      });
      throw new BadRequestException('Exemption certificate has expired');
    }

    // Verify document integrity if hash exists
    if (certificate.documentHash && certificate.documentUrl) {
      const currentHash = this.generateDocumentHash(certificate.documentUrl);
      if (currentHash !== certificate.documentHash) {
        this.logger.warn(
          `Document integrity check failed for certificate ${certificate.certificateNumber}`,
        );
        throw new BadRequestException('Document integrity verification failed');
      }
    }

    // Update verification
    await this.prisma.taxExemptionCertificate.update({
      where: { id: certificateId },
      data: {
        verifiedBy,
        lastVerifiedAt: new Date(),
      },
    });

    this.logger.log(`Exemption certificate ${certificate.certificateNumber} validated`);

    return {
      valid: true,
      certificateNumber: certificate.certificateNumber,
      exemptionType: certificate.exemptionType,
      states: certificate.states,
      expirationDate: certificate.expirationDate,
    };
  }

  /**
   * Check for expiring certificates
   */
  async checkExpiringCertificates(orgId: string, daysBeforeExpiration: number = 30) {
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + daysBeforeExpiration);

    const expiringCertificates = await this.prisma.taxExemptionCertificate.findMany({
      where: {
        orgId,
        status: ExemptionStatus.ACTIVE,
        expirationDate: {
          gte: new Date(),
          lte: expirationDate,
        },
      },
      include: {
        // Include customer info if needed
      },
    });

    this.logger.debug(
      `Found ${expiringCertificates.length} certificates expiring in the next ${daysBeforeExpiration} days`,
    );

    return expiringCertificates;
  }

  /**
   * Revoke an exemption certificate
   */
  async revokeExemptionCertificate(certificateId: string, reason?: string) {
    const certificate = await this.prisma.taxExemptionCertificate.update({
      where: { id: certificateId },
      data: {
        status: ExemptionStatus.REVOKED,
        metadata: {
          revokedAt: new Date().toISOString(),
          revokeReason: reason,
        },
      },
    });

    this.logger.log(`Exemption certificate ${certificate.certificateNumber} revoked`);

    return certificate;
  }

  /**
   * Get all exemption certificates for a customer
   */
  async getCustomerExemptions(orgId: string, customerId: string) {
    return await this.prisma.taxExemptionCertificate.findMany({
      where: {
        orgId,
        customerId,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get exemption certificates by type
   */
  async getExemptionsByType(orgId: string, exemptionType: ExemptionType) {
    return await this.prisma.taxExemptionCertificate.findMany({
      where: {
        orgId,
        exemptionType,
        status: ExemptionStatus.ACTIVE,
      },
      orderBy: { effectiveDate: 'desc' },
    });
  }

  /**
   * Verify resale certificate for drop shipping
   */
  async verifyResaleCertificate(
    orgId: string,
    certificateNumber: string,
    state: string,
  ): Promise<boolean> {
    const certificate = await this.prisma.taxExemptionCertificate.findFirst({
      where: {
        orgId,
        certificateNumber,
        exemptionType: ExemptionType.RESALE,
        status: ExemptionStatus.ACTIVE,
        states: { has: state },
        OR: [
          { expirationDate: null },
          { expirationDate: { gte: new Date() } },
        ],
      },
    });

    return !!certificate;
  }

  /**
   * Bulk import exemption certificates
   */
  async bulkImportCertificates(
    orgId: string,
    certificates: CreateExemptionCertificateDto[],
  ) {
    const results = {
      success: 0,
      failed: 0,
      errors: [] as Array<{ certificateNumber: string; error: string }>,
    };

    for (const cert of certificates) {
      try {
        await this.createExemptionCertificate({ ...cert, orgId });
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          certificateNumber: cert.certificateNumber,
          error: error.message,
        });
      }
    }

    this.logger.log(
      `Bulk import completed: ${results.success} succeeded, ${results.failed} failed`,
    );

    return results;
  }

  /**
   * Private helper methods
   */

  private generateDocumentHash(documentUrl: string): string {
    // In production, fetch and hash the actual document content
    // For now, hash the URL as a placeholder
    return createHash('sha256').update(documentUrl).digest('hex');
  }

  /**
   * Auto-expire certificates
   * This should be run as a scheduled job
   */
  async autoExpireCertificates() {
    const expiredCount = await this.prisma.taxExemptionCertificate.updateMany({
      where: {
        status: ExemptionStatus.ACTIVE,
        expirationDate: {
          lt: new Date(),
        },
      },
      data: {
        status: ExemptionStatus.EXPIRED,
      },
    });

    this.logger.log(`Auto-expired ${expiredCount.count} certificates`);

    return expiredCount;
  }
}
