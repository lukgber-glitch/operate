import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../../../database/prisma.service';
import { ZatcaCertificateService } from './zatca-certificate.service';
import { ZatcaCertificateValidator } from './zatca-certificate-validator';
import { ZatcaAuditService } from './zatca-audit.service';
import { ZATCA_CONSTANTS } from './zatca-certificate.constants';
import { SignInvoiceDto } from './dto/sign-invoice.dto';

/**
 * ZATCA Signing Service
 *
 * Handles invoice signing operations for ZATCA e-invoicing
 * - Signs invoices with ECDSA private key
 * - Generates invoice hashes
 * - Tracks signing operations
 */
@Injectable()
export class ZatcaSigningService {
  private readonly logger = new Logger(ZatcaSigningService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly certificateService: ZatcaCertificateService,
    private readonly validator: ZatcaCertificateValidator,
    private readonly auditService: ZatcaAuditService,
  ) {}

  /**
   * Sign an invoice
   */
  async signInvoice(
    organisationId: string,
    userId: string,
    dto: SignInvoiceDto,
  ) {
    this.logger.log(`Signing invoice: ${dto.invoiceId} for organisation: ${organisationId}`);

    // Find active certificate for this invoice type
    const certificate = await this.getActiveCertificate(organisationId, dto.invoiceType);

    if (!certificate) {
      throw new NotFoundException(
        `No active certificate found for invoice type: ${dto.invoiceType}`,
      );
    }

    // Validate certificate
    const validation = await this.validator.validateCertificate(certificate);
    if (!validation.isValid) {
      throw new BadRequestException(`Invalid certificate: ${validation.errors.join(', ')}`);
    }

    // Get private key
    const privateKey = await this.certificateService.getPrivateKey(certificate.id, userId);

    // Calculate invoice hash if not provided
    const invoiceHash =
      dto.invoiceHash || this.validator.generateInvoiceHash(dto.invoiceData);

    // Sign the invoice hash
    const signature = this.signData(invoiceHash, privateKey);

    // Get public key hash
    const publicKey = this.extractPublicKeyFromPrivate(privateKey);
    const publicKeyHash = this.validator.getCertificateFingerprint(publicKey);

    // Record signing operation
    const signingOperation = await this.prisma.zatcaSigningOperation.create({
      data: {
        certificateId: certificate.id,
        organisationId,
        invoiceId: dto.invoiceId,
        invoiceType: dto.invoiceType,
        invoiceHash,
        invoiceNumber: dto.invoiceNumber,
        signature,
        signatureAlg: ZATCA_CONSTANTS.CRYPTO.SIGNATURE_ALGORITHM,
        publicKeyHash,
        certificateSerial: certificate.serialNumber,
        success: true,
      },
    });

    // Update certificate usage
    await this.certificateService.incrementInvoiceCount(certificate.id);

    // Log to audit
    await this.auditService.logAction({
      organisationId,
      certificateId: certificate.id,
      action: ZATCA_CONSTANTS.AUDIT_ACTIONS.INVOICE_SIGNED,
      performedBy: userId,
      success: true,
      details: {
        invoiceId: dto.invoiceId,
        invoiceNumber: dto.invoiceNumber,
        invoiceType: dto.invoiceType,
      },
    });

    this.logger.log(`Invoice signed successfully: ${dto.invoiceId}`);

    return {
      signingOperationId: signingOperation.id,
      invoiceHash,
      signature,
      publicKeyHash,
      certificateId: certificate.id,
      timestamp: signingOperation.createdAt,
    };
  }

  /**
   * Sign data with private key
   */
  private signData(data: string, privateKey: string): string {
    const sign = crypto.createSign(ZATCA_CONSTANTS.CRYPTO.SIGNATURE_ALGORITHM);
    sign.update(data);
    sign.end();

    const signature = sign.sign(privateKey, 'base64');
    return signature;
  }

  /**
   * Extract public key from private key
   */
  private extractPublicKeyFromPrivate(privateKey: string): string {
    const keyObject = crypto.createPrivateKey(privateKey);
    const publicKey = crypto.createPublicKey(keyObject);

    return publicKey.export({
      type: 'spki',
      format: 'pem',
    }) as string;
  }

  /**
   * Get active certificate for organisation and invoice type
   */
  private async getActiveCertificate(
    organisationId: string,
    invoiceType: string,
  ) {
    return this.prisma.zatcaCertificate.findFirst({
      where: {
        organisationId,
        invoiceType,
        isActive: true,
        csidStatus: 'ACTIVE',
        validTo: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Verify invoice signature
   */
  async verifyInvoiceSignature(
    signingOperationId: string,
  ): Promise<boolean> {
    const operation = await this.prisma.zatcaSigningOperation.findUnique({
      where: { id: signingOperationId },
      include: { certificate: true },
    });

    if (!operation) {
      throw new NotFoundException('Signing operation not found');
    }

    // Get private key to extract public key
    const privateKey = await this.certificateService.getPrivateKey(
      operation.certificateId,
      'system',
    );
    const publicKey = this.extractPublicKeyFromPrivate(privateKey);

    // Verify signature
    const isValid = this.validator.verifySignature(
      Buffer.from(operation.invoiceHash),
      operation.signature,
      publicKey,
    );

    return isValid;
  }

  /**
   * Get signing statistics
   */
  async getSigningStatistics(
    organisationId: string,
    startDate?: Date,
    endDate?: Date,
  ) {
    const where = {
      organisationId,
      ...(startDate &&
        endDate && {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        }),
    };

    const [total, successful, failed, byCertificate] = await Promise.all([
      this.prisma.zatcaSigningOperation.count({ where }),
      this.prisma.zatcaSigningOperation.count({
        where: { ...where, success: true },
      }),
      this.prisma.zatcaSigningOperation.count({
        where: { ...where, success: false },
      }),
      this.prisma.zatcaSigningOperation.groupBy({
        by: ['certificateId'],
        where,
        _count: true,
      }),
    ]);

    return {
      total,
      successful,
      failed,
      successRate: total > 0 ? (successful / total) * 100 : 0,
      byCertificate: byCertificate.map((item) => ({
        certificateId: item.certificateId,
        count: item._count,
      })),
    };
  }

  /**
   * Get recent signing operations
   */
  async getRecentSigningOperations(
    organisationId: string,
    limit: number = 50,
  ) {
    return this.prisma.zatcaSigningOperation.findMany({
      where: { organisationId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        invoiceId: true,
        invoiceNumber: true,
        invoiceType: true,
        signature: true,
        success: true,
        createdAt: true,
        certificate: {
          select: {
            id: true,
            name: true,
            certificateType: true,
          },
        },
      },
    });
  }
}
