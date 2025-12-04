import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { KeyManagementService } from '@/modules/security/key-management.service';
import { ZatcaCsrService } from './zatca-csr.service';
import { ZatcaAuditService } from './zatca-audit.service';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import {
  ZATCA_CONSTANTS,
  ZatcaApiResponse,
  CsrConfig,
  CsidRequestConfig,
} from './zatca-certificate.constants';
import { CreateZatcaCertificateDto } from './dto/create-zatca-certificate.dto';
import { Prisma } from '@prisma/client';

/**
 * ZATCA Certificate Service
 *
 * Main service for managing ZATCA certificates (CSID)
 * Handles:
 * - Key pair generation
 * - CSR creation
 * - CSID onboarding
 * - Certificate storage and retrieval
 * - Certificate lifecycle management
 */
@Injectable()
export class ZatcaCertificateService {
  private readonly logger = new Logger(ZatcaCertificateService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly keyManagement: KeyManagementService,
    private readonly csrService: ZatcaCsrService,
    private readonly auditService: ZatcaAuditService,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Create a new ZATCA certificate
   * This initiates the complete onboarding flow
   */
  async createCertificate(
    organisationId: string,
    userId: string,
    dto: CreateZatcaCertificateDto,
  ) {
    this.logger.log(
      `Creating ZATCA certificate for organisation: ${organisationId}, type: ${dto.certificateType}`,
    );

    try {
      // Step 1: Generate ECDSA key pair
      const keyPair = this.csrService.generateKeyPair();

      await this.auditService.logAction({
        organisationId,
        action: ZATCA_CONSTANTS.AUDIT_ACTIONS.KEY_PAIR_GENERATED,
        performedBy: userId,
        success: true,
        details: {
          certificateType: dto.certificateType,
          invoiceType: dto.invoiceType,
        },
      });

      // Step 2: Encrypt private key
      const keyId = this.keyManagement.generateKeyId();
      const { encryptedData, iv, authTag } = this.keyManagement.encrypt(
        keyPair.privateKey,
        keyId,
      );

      // Step 3: Generate CSR
      const csrConfig: CsrConfig = {
        commonName: dto.commonName,
        organizationName: dto.organizationName,
        organizationUnit: dto.organizationUnit,
        country: 'SA',
        invoiceType: dto.invoiceType === 'TAX_INVOICE' ? '0100' : '0200',
        solutionName: dto.solutionName,
        registeredAddress: dto.registeredAddress,
        businessCategory: dto.businessCategory,
      };

      const { csr, subject } = await this.csrService.generateCSR(
        csrConfig,
        keyPair.privateKey,
      );

      await this.auditService.logAction({
        organisationId,
        action: ZATCA_CONSTANTS.AUDIT_ACTIONS.CSR_CREATED,
        performedBy: userId,
        success: true,
        details: {
          subject,
          csrFingerprint: this.csrService.getCsrFingerprint(csr),
        },
      });

      // Step 4: Calculate validity dates
      const validFrom = new Date();
      const validTo = new Date();
      validTo.setDate(
        validTo.getDate() +
          (dto.certificateType === 'COMPLIANCE'
            ? ZATCA_CONSTANTS.CERTIFICATE.VALIDITY_DAYS.COMPLIANCE
            : ZATCA_CONSTANTS.CERTIFICATE.VALIDITY_DAYS.PRODUCTION),
      );

      // Step 5: Create certificate record
      const certificate = await this.prisma.zatcaCertificate.create({
        data: {
          organisationId,
          name: dto.name,
          description: dto.description,
          certificateType: dto.certificateType,
          invoiceType: dto.invoiceType,
          commonName: dto.commonName,
          organizationName: dto.organizationName,
          organizationUnit: dto.organizationUnit,
          encryptedPrivateKey: encryptedData,
          encryptionKeyId: keyId,
          iv,
          authTag,
          csrData: csr,
          csrSubject: subject,
          csidStatus: 'PENDING',
          validFrom,
          validTo,
          environment: dto.environment || 'sandbox',
          createdBy: userId,
          otp: dto.otp, // Store temporarily for CSID request
        },
      });

      this.logger.log(`Certificate created with ID: ${certificate.id}`);

      // Step 6: Request CSID from ZATCA
      try {
        await this.requestCSID(certificate.id, userId);

        // Auto-activate if requested
        if (dto.autoActivate) {
          await this.activateCertificate(certificate.id, userId);
        }
      } catch (error) {
        this.logger.error(`CSID request failed: ${error.message}`, error.stack);
        // Update status to failed
        await this.prisma.zatcaCertificate.update({
          where: { id: certificate.id },
          data: { csidStatus: 'FAILED' },
        });

        await this.auditService.logAction({
          organisationId,
          certificateId: certificate.id,
          action: ZATCA_CONSTANTS.AUDIT_ACTIONS.CSID_REJECTED,
          performedBy: userId,
          success: false,
          errorMessage: error.message,
        });
      }

      return this.getCertificate(certificate.id);
    } catch (error) {
      this.logger.error(`Certificate creation failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Request CSID from ZATCA
   */
  async requestCSID(certificateId: string, userId: string) {
    const certificate = await this.prisma.zatcaCertificate.findUnique({
      where: { id: certificateId },
    });

    if (!certificate) {
      throw new NotFoundException('Certificate not found');
    }

    this.logger.log(`Requesting CSID for certificate: ${certificateId}`);

    const isProduction = certificate.certificateType === 'PRODUCTION';
    const environment = certificate.environment === 'production' ? 'PRODUCTION' : 'SANDBOX';
    const baseUrl = ZATCA_CONSTANTS.ENDPOINTS[environment].BASE_URL;
    const endpoint = isProduction
      ? ZATCA_CONSTANTS.ENDPOINTS[environment].PRODUCTION_CSID
      : ZATCA_CONSTANTS.ENDPOINTS[environment].COMPLIANCE_CSID;

    const url = `${baseUrl}${endpoint}`;

    // Build request payload
    const requestConfig: CsidRequestConfig = {
      csr: certificate.csrData!,
    };

    if (isProduction && certificate.otp) {
      requestConfig.otp = certificate.otp;
    }

    try {
      const response = await firstValueFrom(
        this.httpService.post<ZatcaApiResponse>(url, requestConfig, {
          headers: {
            'Accept-Version': ZATCA_CONSTANTS.HEADERS.ACCEPT_VERSION,
            'Content-Type': ZATCA_CONSTANTS.HEADERS.CONTENT_TYPE,
            'Accept-Language': ZATCA_CONSTANTS.HEADERS.ACCEPT_LANGUAGE,
          },
        }),
      );

      const { binarySecurityToken, secret, requestID } = response.data;

      if (!binarySecurityToken || !secret) {
        throw new Error('Invalid CSID response from ZATCA');
      }

      // Update certificate with CSID
      await this.prisma.zatcaCertificate.update({
        where: { id: certificateId },
        data: {
          csid: binarySecurityToken,
          csidSecret: secret,
          csidRequestId: requestID,
          csidStatus: 'ACTIVE',
          encryptedCertificate: Buffer.from(binarySecurityToken, 'base64'),
          otp: null, // Clear OTP after successful request
        },
      });

      await this.auditService.logAction({
        organisationId: certificate.organisationId,
        certificateId: certificate.id,
        action: ZATCA_CONSTANTS.AUDIT_ACTIONS.CSID_APPROVED,
        performedBy: userId,
        success: true,
        zatcaRequestId: requestID,
        details: response.data,
      });

      this.logger.log(`CSID approved for certificate: ${certificateId}`);
    } catch (error) {
      this.logger.error(`CSID request failed: ${error.message}`, error.stack);

      await this.auditService.logAction({
        organisationId: certificate.organisationId,
        certificateId: certificate.id,
        action: ZATCA_CONSTANTS.AUDIT_ACTIONS.CSID_REJECTED,
        performedBy: userId,
        success: false,
        errorMessage: error.message,
        details: error.response?.data,
      });

      throw error;
    }
  }

  /**
   * Activate certificate for use
   */
  async activateCertificate(certificateId: string, userId: string) {
    const certificate = await this.prisma.zatcaCertificate.findUnique({
      where: { id: certificateId },
    });

    if (!certificate) {
      throw new NotFoundException('Certificate not found');
    }

    if (certificate.csidStatus !== 'ACTIVE') {
      throw new BadRequestException('Certificate CSID is not active');
    }

    await this.prisma.zatcaCertificate.update({
      where: { id: certificateId },
      data: { isActive: true },
    });

    await this.auditService.logAction({
      organisationId: certificate.organisationId,
      certificateId: certificate.id,
      action: ZATCA_CONSTANTS.AUDIT_ACTIONS.CERTIFICATE_ACTIVATED,
      performedBy: userId,
      success: true,
    });

    this.logger.log(`Certificate activated: ${certificateId}`);
  }

  /**
   * Deactivate certificate
   */
  async deactivateCertificate(certificateId: string, userId: string) {
    const certificate = await this.prisma.zatcaCertificate.findUnique({
      where: { id: certificateId },
    });

    if (!certificate) {
      throw new NotFoundException('Certificate not found');
    }

    await this.prisma.zatcaCertificate.update({
      where: { id: certificateId },
      data: { isActive: false },
    });

    await this.auditService.logAction({
      organisationId: certificate.organisationId,
      certificateId: certificate.id,
      action: ZATCA_CONSTANTS.AUDIT_ACTIONS.CERTIFICATE_DEACTIVATED,
      performedBy: userId,
      success: true,
    });

    this.logger.log(`Certificate deactivated: ${certificateId}`);
  }

  /**
   * Get certificate by ID
   */
  async getCertificate(certificateId: string) {
    const certificate = await this.prisma.zatcaCertificate.findUnique({
      where: { id: certificateId },
      include: {
        auditLogs: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!certificate) {
      throw new NotFoundException('Certificate not found');
    }

    // Remove sensitive data
    const { encryptedPrivateKey, encryptionKeyId, iv, authTag, csidSecret, otp, ...safe } =
      certificate;

    return safe;
  }

  /**
   * List certificates for organisation
   */
  async listCertificates(organisationId: string, filters?: {
    isActive?: boolean;
    certificateType?: string;
    environment?: string;
  }) {
    const where: Prisma.ZatcaCertificateWhereInput = {
      organisationId,
      ...filters,
    };

    const certificates = await this.prisma.zatcaCertificate.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        description: true,
        certificateType: true,
        invoiceType: true,
        csidStatus: true,
        validFrom: true,
        validTo: true,
        isActive: true,
        environment: true,
        invoicesSigned: true,
        lastUsedAt: true,
        createdAt: true,
      },
    });

    return certificates;
  }

  /**
   * Get decrypted private key
   * This should be used with extreme caution and logged
   */
  async getPrivateKey(certificateId: string, userId: string): Promise<string> {
    const certificate = await this.prisma.zatcaCertificate.findUnique({
      where: { id: certificateId },
    });

    if (!certificate) {
      throw new NotFoundException('Certificate not found');
    }

    // Decrypt private key
    const decryptedKey = this.keyManagement.decrypt(
      certificate.encryptedPrivateKey,
      certificate.iv,
      certificate.authTag,
      certificate.encryptionKeyId,
    );

    // Log access
    await this.auditService.logAction({
      organisationId: certificate.organisationId,
      certificateId: certificate.id,
      action: ZATCA_CONSTANTS.AUDIT_ACTIONS.PRIVATE_KEY_ACCESSED,
      performedBy: userId,
      success: true,
    });

    return decryptedKey.toString('utf8');
  }

  /**
   * Check certificate expiry
   */
  async checkExpiry(certificateId: string): Promise<{
    isExpired: boolean;
    daysUntilExpiry: number;
    needsRenewal: boolean;
  }> {
    const certificate = await this.prisma.zatcaCertificate.findUnique({
      where: { id: certificateId },
    });

    if (!certificate) {
      throw new NotFoundException('Certificate not found');
    }

    const now = new Date();
    const validTo = new Date(certificate.validTo);
    const daysUntilExpiry = Math.floor(
      (validTo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );

    return {
      isExpired: now > validTo,
      daysUntilExpiry,
      needsRenewal: daysUntilExpiry <= ZATCA_CONSTANTS.RENEWAL.WARNING_DAYS,
    };
  }

  /**
   * Update certificate usage statistics
   */
  async incrementInvoiceCount(certificateId: string) {
    await this.prisma.zatcaCertificate.update({
      where: { id: certificateId },
      data: {
        invoicesSigned: { increment: 1 },
        lastUsedAt: new Date(),
      },
    });
  }
}
