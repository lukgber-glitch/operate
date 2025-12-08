import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../../database/prisma.service';
import { ZatcaCertificateService } from './zatca-certificate.service';
import { ZatcaAuditService } from './zatca-audit.service';
import { ZatcaCertificateValidator } from './zatca-certificate-validator';
import { ZATCA_CONSTANTS } from './zatca-certificate.constants';
import { RenewZatcaCertificateDto } from './dto/renew-zatca-certificate.dto';

/**
 * ZATCA Certificate Rotation Service
 *
 * Handles certificate lifecycle management:
 * - Monitor certificate expiry
 * - Automated renewal workflow
 * - Certificate rotation
 * - Graceful transition between certificates
 */
@Injectable()
export class ZatcaCertificateRotationService {
  private readonly logger = new Logger(ZatcaCertificateRotationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly certificateService: ZatcaCertificateService,
    private readonly auditService: ZatcaAuditService,
    private readonly validator: ZatcaCertificateValidator,
  ) {}

  /**
   * Monitor certificate expiry (runs daily at 00:00)
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async monitorCertificateExpiry() {
    this.logger.log('Running certificate expiry check');

    try {
      const certificates = await this.prisma.zatcaCertificate.findMany({
        where: {
          isActive: true,
          csidStatus: 'ACTIVE',
        },
      });

      for (const certificate of certificates) {
        const daysUntilExpiry = this.validator.daysUntilExpiry(certificate.validTo);

        // Check if renewal is needed
        if (daysUntilExpiry <= ZATCA_CONSTANTS.RENEWAL.WARNING_DAYS) {
          if (!certificate.renewalNotificationSent) {
            await this.sendRenewalNotification(certificate.id);
          }

          // Auto-renew if 7 days or less
          if (daysUntilExpiry <= 7 && !certificate.renewalStartDate) {
            this.logger.warn(
              `Certificate ${certificate.id} expires in ${daysUntilExpiry} days. Initiating auto-renewal.`,
            );
            // Auto-renewal would be triggered here
            // await this.renewCertificate(certificate.id, 'system', { reason: 'auto-renewal' });
          }
        }

        // Mark as expired
        if (this.validator.isExpired(certificate.validTo)) {
          await this.markAsExpired(certificate.id);
        }
      }

      this.logger.log('Certificate expiry check completed');
    } catch (error) {
      this.logger.error(`Certificate expiry check failed: ${error.message}`, error.stack);
    }
  }

  /**
   * Send renewal notification
   */
  private async sendRenewalNotification(certificateId: string) {
    const certificate = await this.prisma.zatcaCertificate.findUnique({
      where: { id: certificateId },
      include: { organisation: true },
    });

    if (!certificate) {
      return;
    }

    const daysUntilExpiry = this.validator.daysUntilExpiry(certificate.validTo);

    this.logger.warn(
      `Certificate renewal notification: ${certificate.name} expires in ${daysUntilExpiry} days`,
    );

    // Update flag
    await this.prisma.zatcaCertificate.update({
      where: { id: certificateId },
      data: { renewalNotificationSent: true },
    });

    // In production, send email/notification to admin
    // await this.notificationService.sendCertificateRenewalAlert(...)
  }

  /**
   * Mark certificate as expired
   */
  private async markAsExpired(certificateId: string) {
    await this.prisma.zatcaCertificate.update({
      where: { id: certificateId },
      data: {
        csidStatus: 'EXPIRED',
        isActive: false,
      },
    });

    this.logger.warn(`Certificate ${certificateId} marked as expired`);
  }

  /**
   * Renew certificate
   */
  async renewCertificate(
    certificateId: string,
    userId: string,
    dto: RenewZatcaCertificateDto,
  ) {
    this.logger.log(`Starting certificate renewal for: ${certificateId}`);

    const oldCertificate = await this.prisma.zatcaCertificate.findUnique({
      where: { id: certificateId },
    });

    if (!oldCertificate) {
      throw new NotFoundException('Certificate not found');
    }

    // Create rotation record
    const rotation = await this.prisma.zatcaCertificateRotation.create({
      data: {
        certificateId,
        organisationId: oldCertificate.organisationId,
        oldCertificateId: certificateId,
        rotationType: 'renewal',
        rotationReason: dto.reason || 'expiry',
        rotationStatus: 'initiated',
        performedBy: userId,
        invoicesSignedOld: oldCertificate.invoicesSigned,
      },
    });

    await this.auditService.logAction({
      organisationId: oldCertificate.organisationId,
      certificateId,
      action: ZATCA_CONSTANTS.AUDIT_ACTIONS.ROTATION_STARTED,
      performedBy: userId,
      success: true,
      details: {
        rotationId: rotation.id,
        reason: dto.reason,
      },
    });

    try {
      // Update rotation status
      await this.prisma.zatcaCertificateRotation.update({
        where: { id: rotation.id },
        data: { rotationStatus: 'in_progress' },
      });

      // Create new certificate with same details
      const newCertificate = await this.certificateService.createCertificate(
        oldCertificate.organisationId,
        userId,
        {
          name: `${oldCertificate.name} (Renewed)`,
          description: `Renewal of ${oldCertificate.name}`,
          certificateType: oldCertificate.certificateType as Prisma.InputJsonValue,
          invoiceType: oldCertificate.invoiceType as Prisma.InputJsonValue,
          commonName: oldCertificate.commonName,
          organizationName: oldCertificate.organizationName,
          organizationUnit: oldCertificate.organizationUnit,
          environment: oldCertificate.environment as Prisma.InputJsonValue,
          otp: dto.otp,
          autoActivate: dto.autoActivate,
        },
      );

      // Update old certificate
      await this.prisma.zatcaCertificate.update({
        where: { id: certificateId },
        data: {
          isActive: false,
          csidStatus: 'EXPIRED',
        },
      });

      // Calculate grace period
      const gracePeriodEnd = new Date();
      gracePeriodEnd.setDate(
        gracePeriodEnd.getDate() + ZATCA_CONSTANTS.RENEWAL.GRACE_PERIOD_DAYS,
      );

      // Complete rotation
      await this.prisma.zatcaCertificateRotation.update({
        where: { id: rotation.id },
        data: {
          rotationStatus: 'completed',
          completedAt: new Date(),
          cutoverDate: new Date(),
          gracePeriodEnd,
        },
      });

      await this.auditService.logAction({
        organisationId: oldCertificate.organisationId,
        certificateId,
        action: ZATCA_CONSTANTS.AUDIT_ACTIONS.ROTATION_COMPLETED,
        performedBy: userId,
        success: true,
        details: {
          rotationId: rotation.id,
          newCertificateId: newCertificate.id,
        },
      });

      this.logger.log(`Certificate renewal completed: ${certificateId} -> ${newCertificate.id}`);

      return {
        oldCertificateId: certificateId,
        newCertificateId: newCertificate.id,
        rotation,
      };
    } catch (error) {
      // Mark rotation as failed
      await this.prisma.zatcaCertificateRotation.update({
        where: { id: rotation.id },
        data: { rotationStatus: 'failed' },
      });

      await this.auditService.logAction({
        organisationId: oldCertificate.organisationId,
        certificateId,
        action: ZATCA_CONSTANTS.AUDIT_ACTIONS.ROTATION_FAILED,
        performedBy: userId,
        success: false,
        errorMessage: error.message,
        details: {
          rotationId: rotation.id,
        },
      });

      this.logger.error(`Certificate renewal failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get rotation history
   */
  async getRotationHistory(certificateId: string) {
    return this.prisma.zatcaCertificateRotation.findMany({
      where: {
        OR: [{ certificateId }, { oldCertificateId: certificateId }],
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get certificates expiring soon
   */
  async getCertificatesExpiringSoon(organisationId: string, days: number = 30) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    return this.prisma.zatcaCertificate.findMany({
      where: {
        organisationId,
        isActive: true,
        csidStatus: 'ACTIVE',
        validTo: {
          lte: futureDate,
          gt: new Date(),
        },
      },
      select: {
        id: true,
        name: true,
        certificateType: true,
        validTo: true,
        renewalNotificationSent: true,
      },
      orderBy: { validTo: 'asc' },
    });
  }

  /**
   * Revoke certificate
   */
  async revokeCertificate(certificateId: string, userId: string, reason: string) {
    const certificate = await this.prisma.zatcaCertificate.findUnique({
      where: { id: certificateId },
    });

    if (!certificate) {
      throw new NotFoundException('Certificate not found');
    }

    await this.prisma.zatcaCertificate.update({
      where: { id: certificateId },
      data: {
        csidStatus: 'REVOKED',
        isActive: false,
      },
    });

    await this.auditService.logAction({
      organisationId: certificate.organisationId,
      certificateId,
      action: ZATCA_CONSTANTS.AUDIT_ACTIONS.CERTIFICATE_REVOKED,
      performedBy: userId,
      success: true,
      details: { reason },
    });

    this.logger.warn(`Certificate revoked: ${certificateId}, reason: ${reason}`);
  }
}
