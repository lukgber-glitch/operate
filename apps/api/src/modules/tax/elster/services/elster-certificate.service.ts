import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/modules/database/prisma.service';
import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scrypt,
  createHash,
} from 'crypto';
import { promisify } from 'util';
import * as forge from 'node-forge';
import {
  CertificateMetadata,
  CertificateSummary,
  StoredCertificate,
  DecryptedCertificate,
  CertificateValidation,
  ExpiringCertificate,
  EncryptionResult,
  CertificateAuditAction,
  CertificateAuditEntry,
  RequestContext,
  StoreCertificateOptions,
  GetCertificateOptions,
  DeleteCertificateOptions,
  KeyRotationOptions,
  CertificateError,
  CertificateErrorCode,
} from '../types/elster-certificate.types';

const scryptAsync = promisify(scrypt);

/**
 * ELSTER Certificate Management Service
 *
 * Provides secure storage, retrieval, and management of digital certificates
 * required for ELSTER (German tax authority) integration.
 *
 * Security Features:
 * - AES-256-GCM encryption for certificates and passwords
 * - Environment-based master key management
 * - Comprehensive audit logging
 * - Certificate expiry tracking
 * - Access control validation
 *
 * @see https://www.elster.de
 */
@Injectable()
export class ElsterCertificateService {
  private readonly logger = new Logger(ElsterCertificateService.name);
  private readonly ALGORITHM = 'aes-256-gcm';
  private readonly KEY_LENGTH = 32; // 256 bits
  private readonly IV_LENGTH = 16; // 128 bits
  private readonly SALT_LENGTH = 32;
  private readonly AUTH_TAG_LENGTH = 16;
  private readonly EXPIRY_WARNING_DAYS = 30;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Store a new certificate with encryption
   */
  async storeCertificate(
    options: StoreCertificateOptions,
  ): Promise<CertificateSummary> {
    const { organisationId, certificate, password, metadata, context } =
      options;

    this.logger.log(
      `Storing certificate for organisation: ${organisationId}`,
    );

    try {
      // Validate the certificate before storing
      const validation = await this.validateCertificate(certificate, password);

      if (!validation.isValid) {
        await this.logAudit({
          certificateId: 'unknown',
          organisationId,
          action: CertificateAuditAction.VALIDATION_FAILED,
          performedBy: context.userId,
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
          success: false,
          errorMessage: validation.errors.join(', '),
          details: { errors: validation.errors },
          createdAt: new Date(),
        });

        throw new CertificateError(
          `Certificate validation failed: ${validation.errors.join(', ')}`,
          CertificateErrorCode.VALIDATION_FAILED,
          { errors: validation.errors },
        );
      }

      // Encrypt certificate and password
      const encryptedCert = await this.encrypt(certificate);
      const encryptedPass = await this.encrypt(Buffer.from(password, 'utf-8'));

      // Store in database
      const stored = await this.prisma.elsterCertificate.create({
        data: {
          organisationId,
          name: metadata.name,
          encryptedData: encryptedCert.encrypted,
          encryptedPassword: encryptedPass.encrypted,
          iv: encryptedCert.iv,
          authTag: encryptedCert.authTag,
          serialNumber: validation.metadata?.serialNumber,
          issuer: validation.metadata?.issuer,
          subject: validation.metadata?.subject,
          validFrom: validation.metadata?.validFrom || new Date(),
          validTo: validation.metadata?.validTo || new Date(),
          isActive: true,
          createdBy: context.userId,
        },
      });

      // Log successful creation
      await this.logAudit({
        certificateId: stored.id,
        organisationId,
        action: CertificateAuditAction.CREATED,
        performedBy: context.userId,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        success: true,
        details: {
          name: metadata.name,
          validTo: validation.metadata?.validTo,
        },
        createdAt: new Date(),
      });

      return this.toSummary(stored);
    } catch (error) {
      this.logger.error(
        `Failed to store certificate: ${error.message}`,
        error.stack,
      );

      if (error instanceof CertificateError) {
        throw error;
      }

      throw new CertificateError(
        'Failed to store certificate',
        CertificateErrorCode.STORAGE_FAILED,
        { originalError: error.message },
      );
    }
  }

  /**
   * Retrieve and decrypt a certificate
   */
  async getCertificate(
    options: GetCertificateOptions,
  ): Promise<DecryptedCertificate> {
    const {
      organisationId,
      certificateId,
      context,
      updateLastUsed = true,
    } = options;

    this.logger.log(
      `Retrieving certificate ${certificateId} for organisation ${organisationId}`,
    );

    try {
      // Fetch certificate
      const cert = await this.prisma.elsterCertificate.findFirst({
        where: {
          id: certificateId,
          organisationId,
          isActive: true,
        },
      });

      if (!cert) {
        await this.logAudit({
          certificateId,
          organisationId,
          action: CertificateAuditAction.ACCESSED,
          performedBy: context.userId,
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
          success: false,
          errorMessage: 'Certificate not found',
          createdAt: new Date(),
        });

        throw new CertificateError(
          'Certificate not found',
          CertificateErrorCode.NOT_FOUND,
        );
      }

      // Check if expired
      if (new Date() > cert.validTo) {
        await this.logAudit({
          certificateId,
          organisationId,
          action: CertificateAuditAction.ACCESSED,
          performedBy: context.userId,
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
          success: false,
          errorMessage: 'Certificate expired',
          createdAt: new Date(),
        });

        throw new CertificateError(
          'Certificate has expired',
          CertificateErrorCode.CERTIFICATE_EXPIRED,
          { validTo: cert.validTo },
        );
      }

      // Decrypt certificate and password
      const decryptedCert = await this.decrypt({
        encrypted: cert.encryptedData,
        iv: cert.iv,
        authTag: cert.authTag,
      });

      const decryptedPass = await this.decrypt({
        encrypted: cert.encryptedPassword,
        iv: cert.iv,
        authTag: cert.authTag,
      });

      // Update last used timestamp
      if (updateLastUsed) {
        await this.prisma.elsterCertificate.update({
          where: { id: certificateId },
          data: { lastUsedAt: new Date() },
        });
      }

      // Log successful access
      await this.logAudit({
        certificateId,
        organisationId,
        action: CertificateAuditAction.ACCESSED,
        performedBy: context.userId,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        success: true,
        createdAt: new Date(),
      });

      return {
        id: cert.id,
        organisationId: cert.organisationId,
        name: cert.name,
        certificate: decryptedCert,
        password: decryptedPass.toString('utf-8'),
        metadata: { name: cert.name },
        validFrom: cert.validFrom,
        validTo: cert.validTo,
      };
    } catch (error) {
      this.logger.error(
        `Failed to retrieve certificate: ${error.message}`,
        error.stack,
      );

      if (error instanceof CertificateError) {
        throw error;
      }

      throw new CertificateError(
        'Failed to retrieve certificate',
        CertificateErrorCode.DECRYPTION_FAILED,
        { originalError: error.message },
      );
    }
  }

  /**
   * List all certificates for an organisation
   */
  async listCertificates(
    organisationId: string,
  ): Promise<CertificateSummary[]> {
    this.logger.log(`Listing certificates for organisation: ${organisationId}`);

    const certificates = await this.prisma.elsterCertificate.findMany({
      where: {
        organisationId,
        isActive: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return certificates.map((cert) => this.toSummary(cert));
  }

  /**
   * Delete a certificate
   */
  async deleteCertificate(options: DeleteCertificateOptions): Promise<void> {
    const { organisationId, certificateId, context } = options;

    this.logger.log(
      `Deleting certificate ${certificateId} for organisation ${organisationId}`,
    );

    try {
      // Verify certificate exists and belongs to organisation
      const cert = await this.prisma.elsterCertificate.findFirst({
        where: {
          id: certificateId,
          organisationId,
        },
      });

      if (!cert) {
        throw new CertificateError(
          'Certificate not found',
          CertificateErrorCode.NOT_FOUND,
        );
      }

      // Soft delete by marking as inactive
      await this.prisma.elsterCertificate.update({
        where: { id: certificateId },
        data: { isActive: false },
      });

      // Log deletion
      await this.logAudit({
        certificateId,
        organisationId,
        action: CertificateAuditAction.DELETED,
        performedBy: context.userId,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        success: true,
        createdAt: new Date(),
      });

      this.logger.log(`Certificate ${certificateId} deleted successfully`);
    } catch (error) {
      this.logger.error(
        `Failed to delete certificate: ${error.message}`,
        error.stack,
      );

      if (error instanceof CertificateError) {
        throw error;
      }

      throw new CertificateError(
        'Failed to delete certificate',
        CertificateErrorCode.STORAGE_FAILED,
        { originalError: error.message },
      );
    }
  }

  /**
   * Validate a certificate and extract metadata
   */
  async validateCertificate(
    certificate: Buffer,
    password: string,
  ): Promise<CertificateValidation> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Parse PKCS#12 certificate
      const p12Asn1 = forge.asn1.fromDer(certificate.toString('binary'));
      const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, password);

      // Extract certificate bags
      const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
      const pkcs8Bags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });

      if (!certBags[forge.pki.oids.certBag] || certBags[forge.pki.oids.certBag].length === 0) {
        errors.push('No certificate found in PKCS#12 file');
      }

      if (!pkcs8Bags[forge.pki.oids.pkcs8ShroudedKeyBag] || pkcs8Bags[forge.pki.oids.pkcs8ShroudedKeyBag].length === 0) {
        errors.push('No private key found in PKCS#12 file');
      }

      if (errors.length > 0) {
        return { isValid: false, errors, warnings };
      }

      // Get the first certificate
      const certBag = certBags[forge.pki.oids.certBag][0];
      const cert = certBag.cert;

      if (!cert) {
        errors.push('Failed to parse certificate');
        return { isValid: false, errors, warnings };
      }

      // Extract metadata
      const metadata = {
        serialNumber: cert.serialNumber,
        issuer: cert.issuer.getField('CN')?.value || 'Unknown',
        subject: cert.subject.getField('CN')?.value || 'Unknown',
        validFrom: cert.validity.notBefore,
        validTo: cert.validity.notAfter,
      };

      // Check expiry
      const now = new Date();
      if (now < metadata.validFrom) {
        errors.push('Certificate is not yet valid');
      }

      if (now > metadata.validTo) {
        errors.push('Certificate has expired');
      }

      // Check expiry warning
      const daysUntilExpiry = Math.floor(
        (metadata.validTo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (daysUntilExpiry <= this.EXPIRY_WARNING_DAYS && daysUntilExpiry > 0) {
        warnings.push(`Certificate expires in ${daysUntilExpiry} days`);
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        metadata,
      };
    } catch (error) {
      this.logger.error(`Certificate validation error: ${error.message}`);

      if (error.message.includes('Invalid password')) {
        errors.push('Invalid certificate password');
      } else {
        errors.push(`Invalid certificate format: ${error.message}`);
      }

      return { isValid: false, errors, warnings };
    }
  }

  /**
   * Get certificates expiring soon
   */
  async getExpiringCertificates(
    daysAhead: number,
  ): Promise<ExpiringCertificate[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() + daysAhead);

    const certificates = await this.prisma.elsterCertificate.findMany({
      where: {
        isActive: true,
        validTo: {
          gte: new Date(),
          lte: cutoffDate,
        },
      },
      orderBy: {
        validTo: 'asc',
      },
    });

    return certificates.map((cert) => ({
      id: cert.id,
      organisationId: cert.organisationId,
      name: cert.name,
      validTo: cert.validTo,
      daysUntilExpiry: Math.floor(
        (cert.validTo.getTime() - new Date().getTime()) /
          (1000 * 60 * 60 * 24),
      ),
      serialNumber: cert.serialNumber,
    }));
  }

  /**
   * Rotate encryption key
   */
  async rotateEncryptionKey(options: KeyRotationOptions): Promise<void> {
    const { oldKey, newKey, context } = options;

    this.logger.log('Starting encryption key rotation');

    try {
      // Get all active certificates
      const certificates = await this.prisma.elsterCertificate.findMany({
        where: { isActive: true },
      });

      for (const cert of certificates) {
        // Decrypt with old key
        const decryptedCert = await this.decrypt(
          {
            encrypted: cert.encryptedData,
            iv: cert.iv,
            authTag: cert.authTag,
          },
          oldKey,
        );

        const decryptedPass = await this.decrypt(
          {
            encrypted: cert.encryptedPassword,
            iv: cert.iv,
            authTag: cert.authTag,
          },
          oldKey,
        );

        // Re-encrypt with new key
        const reencryptedCert = await this.encrypt(decryptedCert, newKey);
        const reencryptedPass = await this.encrypt(decryptedPass, newKey);

        // Update in database
        await this.prisma.elsterCertificate.update({
          where: { id: cert.id },
          data: {
            encryptedData: reencryptedCert.encrypted,
            encryptedPassword: reencryptedPass.encrypted,
            iv: reencryptedCert.iv,
            authTag: reencryptedCert.authTag,
          },
        });

        // Log rotation for this certificate
        await this.logAudit({
          certificateId: cert.id,
          organisationId: cert.organisationId,
          action: CertificateAuditAction.ENCRYPTION_KEY_ROTATED,
          performedBy: context.userId,
          success: true,
          createdAt: new Date(),
        });
      }

      this.logger.log(
        `Successfully rotated encryption key for ${certificates.length} certificates`,
      );
    } catch (error) {
      this.logger.error(
        `Key rotation failed: ${error.message}`,
        error.stack,
      );

      throw new CertificateError(
        'Encryption key rotation failed',
        CertificateErrorCode.KEY_ROTATION_FAILED,
        { originalError: error.message },
      );
    }
  }

  /**
   * Encrypt data using AES-256-GCM
   */
  private async encrypt(
    data: Buffer,
    masterKey?: string,
  ): Promise<EncryptionResult> {
    const key = masterKey || this.getMasterKey();
    const salt = randomBytes(this.SALT_LENGTH);
    const iv = randomBytes(this.IV_LENGTH);

    // Derive key from master key using scrypt
    const derivedKey = (await scryptAsync(key, salt, this.KEY_LENGTH)) as Buffer;

    // Create cipher
    const cipher = createCipheriv(this.ALGORITHM, derivedKey, iv);

    // Encrypt
    const encrypted = Buffer.concat([
      salt,
      cipher.update(data),
      cipher.final(),
    ]);

    const authTag = cipher.getAuthTag();

    return {
      encrypted,
      iv,
      authTag,
    };
  }

  /**
   * Decrypt data using AES-256-GCM
   */
  private async decrypt(
    encrypted: {
      encrypted: Buffer;
      iv: Buffer;
      authTag: Buffer;
    },
    masterKey?: string,
  ): Promise<Buffer> {
    try {
      const key = masterKey || this.getMasterKey();

      // Extract salt from encrypted data
      const salt = encrypted.encrypted.subarray(0, this.SALT_LENGTH);
      const ciphertext = encrypted.encrypted.subarray(this.SALT_LENGTH);

      // Derive key from master key using scrypt
      const derivedKey = (await scryptAsync(
        key,
        salt,
        this.KEY_LENGTH,
      )) as Buffer;

      // Create decipher
      const decipher = createDecipheriv(this.ALGORITHM, derivedKey, encrypted.iv);
      decipher.setAuthTag(encrypted.authTag);

      // Decrypt
      const decrypted = Buffer.concat([
        decipher.update(ciphertext),
        decipher.final(),
      ]);

      return decrypted;
    } catch (error) {
      this.logger.error(`Decryption failed: ${error.message}`);
      throw new CertificateError(
        'Failed to decrypt data',
        CertificateErrorCode.DECRYPTION_FAILED,
        { originalError: error.message },
      );
    }
  }

  /**
   * Get master encryption key from environment
   */
  private getMasterKey(): string {
    const key = this.config.get<string>('ELSTER_CERT_ENCRYPTION_KEY');

    if (!key) {
      throw new Error(
        'ELSTER_CERT_ENCRYPTION_KEY environment variable is not set',
      );
    }

    if (key.length < 32) {
      throw new Error(
        'ELSTER_CERT_ENCRYPTION_KEY must be at least 32 characters',
      );
    }

    return key;
  }

  /**
   * Log audit entry
   */
  private async logAudit(entry: CertificateAuditEntry): Promise<void> {
    try {
      await this.prisma.elsterCertificateAuditLog.create({
        data: {
          certificateId: entry.certificateId,
          organisationId: entry.organisationId,
          action: entry.action,
          performedBy: entry.performedBy,
          ipAddress: entry.ipAddress,
          userAgent: entry.userAgent,
          success: entry.success,
          errorMessage: entry.errorMessage,
          details: entry.details,
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
  private toSummary(cert: any): CertificateSummary {
    const now = new Date();
    const daysUntilExpiry = Math.floor(
      (cert.validTo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );

    return {
      id: cert.id,
      organisationId: cert.organisationId,
      name: cert.name,
      serialNumber: cert.serialNumber,
      issuer: cert.issuer,
      subject: cert.subject,
      validFrom: cert.validFrom,
      validTo: cert.validTo,
      isActive: cert.isActive,
      lastUsedAt: cert.lastUsedAt,
      createdAt: cert.createdAt,
      updatedAt: cert.updatedAt,
      createdBy: cert.createdBy,
      daysUntilExpiry,
      isExpired: now > cert.validTo,
      isExpiringSoon: daysUntilExpiry <= this.EXPIRY_WARNING_DAYS && daysUntilExpiry > 0,
    };
  }
}
