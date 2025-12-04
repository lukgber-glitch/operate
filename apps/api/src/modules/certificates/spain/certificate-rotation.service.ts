import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@modules/database/prisma.service';
import {
  CertificateRotationOptions,
  SpainCertificateError,
  SpainCertificateErrorCode,
  SpainCertificateSummary,
  SpainCertificateAuditAction,
} from './interfaces/spain-certificate.interface';
import { CertificateStorageService } from './certificate-storage.service';
import { CertificateValidatorService } from './certificate-validator.service';

/**
 * Certificate Rotation Service
 *
 * Handles zero-downtime certificate rotation for Spanish SII certificates.
 * Allows updating certificates without service interruption.
 *
 * Rotation Process:
 * 1. Validate new certificate
 * 2. Encrypt and store new certificate
 * 3. Mark new certificate as active
 * 4. Mark old certificate as inactive
 * 5. Audit log both operations
 * 6. Handle rollback on failure
 *
 * @security
 * - Atomic operations with transaction support
 * - Old certificate kept for audit trail
 * - Full audit logging
 * - Validation before rotation
 */
@Injectable()
export class CertificateRotationService {
  private readonly logger = new Logger(CertificateRotationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: CertificateStorageService,
    private readonly validatorService: CertificateValidatorService,
  ) {}

  /**
   * Rotate certificate with zero downtime
   *
   * @param options - Rotation options including old and new certificates
   * @returns New certificate summary
   * @throws SpainCertificateError if rotation fails
   */
  async rotateCertificate(
    options: CertificateRotationOptions,
  ): Promise<{
    oldCertificateId: string;
    newCertificate: SpainCertificateSummary;
  }> {
    const {
      organisationId,
      oldCertificateId,
      newCertificate,
      newPassword,
      metadata,
      context,
    } = options;

    this.logger.log(
      `Starting certificate rotation for organisation ${organisationId}: ` +
        `${oldCertificateId} -> new certificate`,
    );

    try {
      // 1. Verify old certificate exists and belongs to organisation
      const oldCert = await this.prisma.spainCertificate.findFirst({
        where: {
          id: oldCertificateId,
          organisationId,
        },
      });

      if (!oldCert) {
        throw new SpainCertificateError(
          'Old certificate not found or does not belong to this organisation',
          SpainCertificateErrorCode.NOT_FOUND,
          { certificateId: oldCertificateId },
        );
      }

      // 2. Validate new certificate
      const validation = await this.validatorService.validateCertificate(
        newCertificate,
        newPassword,
      );

      if (!validation.isValid) {
        await this.logAudit({
          certificateId: 'rotation-failed',
          organisationId,
          action: SpainCertificateAuditAction.VALIDATION_FAILED,
          performedBy: context.userId,
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
          success: false,
          errorMessage: `New certificate validation failed: ${validation.errors.join(', ')}`,
          details: {
            errors: validation.errors,
            oldCertificateId,
          },
          createdAt: new Date(),
        });

        throw new SpainCertificateError(
          `New certificate validation failed: ${validation.errors.join(', ')}`,
          SpainCertificateErrorCode.VALIDATION_FAILED,
          { errors: validation.errors },
        );
      }

      // 3. Encrypt new certificate and password
      const encryptedCert = await this.storageService.encrypt(newCertificate);
      const encryptedPass = await this.storageService.encrypt(
        Buffer.from(newPassword, 'utf-8'),
      );
      const thumbprint = this.storageService.generateThumbprint(newCertificate);

      // 4. Perform rotation in transaction (atomic operation)
      const result = await this.prisma.$transaction(async (tx) => {
        // 4a. Create new certificate (active)
        const newCert = await tx.spainCertificate.create({
          data: {
            organisationId,
            name: metadata.name,
            description: metadata.description,
            cifNif: metadata.cifNif || validation.metadata?.cifNif,
            encryptedData: encryptedCert.encrypted,
            encryptedPassword: encryptedPass.encrypted,
            iv: encryptedCert.iv,
            authTag: encryptedCert.authTag,
            thumbprint,
            serialNumber: validation.metadata?.serialNumber,
            issuer: validation.metadata?.issuer,
            subject: validation.metadata?.subject,
            validFrom: validation.metadata?.validFrom || new Date(),
            validTo: validation.metadata?.validTo || new Date(),
            environment: metadata.environment || 'production',
            isActive: true,
            createdBy: context.userId,
          },
        });

        // 4b. Deactivate old certificate (soft delete)
        await tx.spainCertificate.update({
          where: { id: oldCertificateId },
          data: {
            isActive: false,
            updatedAt: new Date(),
          },
        });

        return newCert;
      });

      // 5. Log successful rotation
      await this.logAudit({
        certificateId: result.id,
        organisationId,
        action: SpainCertificateAuditAction.ROTATED,
        performedBy: context.userId,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        success: true,
        details: {
          oldCertificateId,
          newCertificateId: result.id,
          newCertificateName: metadata.name,
          validTo: validation.metadata?.validTo,
          warnings: validation.warnings,
        },
        createdAt: new Date(),
      });

      // 6. Log old certificate deactivation
      await this.logAudit({
        certificateId: oldCertificateId,
        organisationId,
        action: SpainCertificateAuditAction.DELETED,
        performedBy: context.userId,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        success: true,
        details: {
          reason: 'rotated',
          replacedBy: result.id,
        },
        createdAt: new Date(),
      });

      this.logger.log(
        `Certificate rotation completed successfully. ` +
          `Old: ${oldCertificateId}, New: ${result.id}`,
      );

      // Convert to summary
      const summary = this.toSummary(result);

      return {
        oldCertificateId,
        newCertificate: summary,
      };
    } catch (error) {
      this.logger.error(
        `Certificate rotation failed: ${error.message}`,
        error.stack,
      );

      if (error instanceof SpainCertificateError) {
        throw error;
      }

      throw new SpainCertificateError(
        'Certificate rotation failed',
        SpainCertificateErrorCode.CERTIFICATE_ROTATION_FAILED,
        { originalError: error.message },
      );
    }
  }

  /**
   * Log audit entry
   */
  private async logAudit(entry: {
    certificateId: string;
    organisationId: string;
    action: SpainCertificateAuditAction;
    performedBy: string;
    ipAddress?: string;
    userAgent?: string;
    success: boolean;
    errorMessage?: string;
    details?: Record<string, any>;
    createdAt: Date;
  }): Promise<void> {
    try {
      await this.prisma.spainCertificateAuditLog.create({
        data: {
          certificateId: entry.certificateId,
          organisationId: entry.organisationId,
          action: entry.action,
          performedBy: entry.performedBy,
          ipAddress: entry.ipAddress,
          userAgent: entry.userAgent,
          success: entry.success,
          errorMessage: entry.errorMessage,
          details: entry.details as any,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to log audit entry: ${error.message}`);
      // Don't throw - audit logging failure shouldn't break operations
    }
  }

  /**
   * Convert stored certificate to summary
   */
  private toSummary(cert: any): SpainCertificateSummary {
    const now = new Date();
    const daysUntilExpiry = Math.floor(
      (cert.validTo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );

    return {
      id: cert.id,
      organisationId: cert.organisationId,
      name: cert.name,
      cifNif: cert.cifNif,
      serialNumber: cert.serialNumber,
      issuer: cert.issuer,
      subject: cert.subject,
      thumbprint: cert.thumbprint,
      validFrom: cert.validFrom,
      validTo: cert.validTo,
      environment: cert.environment,
      isActive: cert.isActive,
      lastUsedAt: cert.lastUsedAt,
      createdAt: cert.createdAt,
      updatedAt: cert.updatedAt,
      createdBy: cert.createdBy,
      daysUntilExpiry,
      isExpired: now > cert.validTo,
      isExpiringSoon: daysUntilExpiry <= 30 && daysUntilExpiry > 0,
    };
  }
}
