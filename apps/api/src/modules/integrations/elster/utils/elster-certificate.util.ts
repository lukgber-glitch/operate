import * as crypto from 'crypto';
import * as forge from 'node-forge';
import { Logger } from '@nestjs/common';
import {
  ElsterCertificate,
  ElsterCertificateValidation,
} from '../interfaces/elster-config.interface';

/**
 * ELSTER Certificate Utility
 * Handles certificate operations for ELSTER authentication
 */
export class ElsterCertificateUtil {
  private static readonly logger = new Logger(ElsterCertificateUtil.name);
  private static readonly ENCRYPTION_ALGORITHM = 'aes-256-gcm';
  private static readonly IV_LENGTH = 16;
  private static readonly AUTH_TAG_LENGTH = 16;

  /**
   * Load and parse a PFX certificate
   */
  static async loadPfxCertificate(
    pfxBuffer: Buffer,
    password: string,
  ): Promise<{
    certificate: forge.pki.Certificate;
    privateKey: forge.pki.PrivateKey;
  }> {
    try {
      const pfxData = forge.util.decode64(pfxBuffer.toString('base64'));
      const p12Asn1 = forge.asn1.fromDer(pfxData);
      const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, password);

      // Get certificate bags
      const certBags = p12.getBags({
        bagType: forge.pki.oids.certBag,
      });
      const pkcs8Bags = p12.getBags({
        bagType: forge.pki.oids.pkcs8ShroudedKeyBag,
      });

      const certBag = certBags[forge.pki.oids.certBag];
      const pkcs8Bag = pkcs8Bags[forge.pki.oids.pkcs8ShroudedKeyBag];

      if (!certBag || certBag.length === 0) {
        throw new Error('No certificate found in PFX file');
      }

      if (!pkcs8Bag || pkcs8Bag.length === 0) {
        throw new Error('No private key found in PFX file');
      }

      const certificate = certBag[0].cert;
      const privateKey = pkcs8Bag[0].key;

      if (!certificate || !privateKey) {
        throw new Error('Failed to extract certificate or private key');
      }

      this.logger.log('Successfully loaded PFX certificate');
      return { certificate, privateKey };
    } catch (error) {
      this.logger.error('Failed to load PFX certificate', error);
      throw new Error(`Certificate loading failed: ${error.message}`);
    }
  }

  /**
   * Validate certificate is valid and not expired
   */
  static validateCertificate(
    certificate: forge.pki.Certificate,
  ): ElsterCertificateValidation {
    const now = new Date();
    const validFrom = certificate.validity.notBefore;
    const validUntil = certificate.validity.notAfter;

    const errors: string[] = [];

    // Check if certificate is expired
    if (now < validFrom) {
      errors.push('Certificate is not yet valid');
    }

    if (now > validUntil) {
      errors.push('Certificate has expired');
    }

    // Calculate days until expiration
    const daysUntilExpiration = Math.floor(
      (validUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );

    // Warn if expiring soon (within 30 days)
    if (daysUntilExpiration > 0 && daysUntilExpiration <= 30) {
      this.logger.warn(
        `Certificate expires in ${daysUntilExpiration} days`,
      );
    }

    const subject = certificate.subject.attributes
      .map((attr: forge.pki.CertificateField) => `${attr.shortName}=${attr.value}`)
      .join(', ');

    const issuer = certificate.issuer.attributes
      .map((attr: forge.pki.CertificateField) => `${attr.shortName}=${attr.value}`)
      .join(', ');

    return {
      valid: errors.length === 0,
      subject,
      issuer,
      validFrom,
      validUntil,
      daysUntilExpiration,
      errors,
    };
  }

  /**
   * Encrypt certificate data for secure storage
   */
  static encryptCertificateData(
    data: Buffer,
    encryptionKey: string,
  ): Buffer {
    try {
      // Generate a random IV
      const iv = crypto.randomBytes(this.IV_LENGTH);

      // Create cipher
      const key = crypto
        .createHash('sha256')
        .update(encryptionKey)
        .digest();
      const cipher = crypto.createCipheriv(
        this.ENCRYPTION_ALGORITHM,
        key,
        iv,
      );

      // Encrypt data
      const encrypted = Buffer.concat([
        cipher.update(data),
        cipher.final(),
      ]);

      // Get auth tag
      const authTag = cipher.getAuthTag();

      // Combine IV + encrypted data + auth tag
      return Buffer.concat([iv, encrypted, authTag]);
    } catch (error) {
      this.logger.error('Failed to encrypt certificate data', error);
      throw new Error(`Encryption failed: ${error.message}`);
    }
  }

  /**
   * Decrypt certificate data from storage
   */
  static decryptCertificateData(
    encryptedData: Buffer,
    encryptionKey: string,
  ): Buffer {
    try {
      // Extract IV, encrypted data, and auth tag
      const iv = encryptedData.slice(0, this.IV_LENGTH);
      const authTag = encryptedData.slice(-this.AUTH_TAG_LENGTH);
      const encrypted = encryptedData.slice(
        this.IV_LENGTH,
        -this.AUTH_TAG_LENGTH,
      );

      // Create decipher
      const key = crypto
        .createHash('sha256')
        .update(encryptionKey)
        .digest();
      const decipher = crypto.createDecipheriv(
        this.ENCRYPTION_ALGORITHM,
        key,
        iv,
      );

      // Set auth tag
      decipher.setAuthTag(authTag);

      // Decrypt data
      return Buffer.concat([
        decipher.update(encrypted),
        decipher.final(),
      ]);
    } catch (error) {
      this.logger.error('Failed to decrypt certificate data', error);
      throw new Error(`Decryption failed: ${error.message}`);
    }
  }

  /**
   * Encrypt password for secure storage
   */
  static encryptPassword(
    password: string,
    encryptionKey: string,
  ): string {
    const encrypted = this.encryptCertificateData(
      Buffer.from(password, 'utf8'),
      encryptionKey,
    );
    return encrypted.toString('base64');
  }

  /**
   * Decrypt password from storage
   */
  static decryptPassword(
    encryptedPassword: string,
    encryptionKey: string,
  ): string {
    const decrypted = this.decryptCertificateData(
      Buffer.from(encryptedPassword, 'base64'),
      encryptionKey,
    );
    return decrypted.toString('utf8');
  }

  /**
   * Extract certificate information
   */
  static extractCertificateInfo(certificate: forge.pki.Certificate): {
    subject: string;
    issuer: string;
    validFrom: Date;
    validUntil: Date;
    serialNumber: string;
  } {
    const subject = certificate.subject.attributes
      .map((attr: forge.pki.CertificateField) => `${attr.shortName}=${attr.value}`)
      .join(', ');

    const issuer = certificate.issuer.attributes
      .map((attr: forge.pki.CertificateField) => `${attr.shortName}=${attr.value}`)
      .join(', ');

    return {
      subject,
      issuer,
      validFrom: certificate.validity.notBefore,
      validUntil: certificate.validity.notAfter,
      serialNumber: certificate.serialNumber,
    };
  }

  /**
   * Get certificate fingerprint (SHA-256)
   */
  static getCertificateFingerprint(
    certificate: forge.pki.Certificate,
  ): string {
    const der = forge.asn1.toDer(
      forge.pki.certificateToAsn1(certificate),
    ).getBytes();
    const hash = crypto.createHash('sha256');
    hash.update(der, 'binary');
    return hash.digest('hex').toUpperCase();
  }

  /**
   * Convert certificate to PEM format
   */
  static certificateToPem(certificate: forge.pki.Certificate): string {
    return forge.pki.certificateToPem(certificate);
  }

  /**
   * Convert private key to PEM format
   */
  static privateKeyToPem(privateKey: forge.pki.PrivateKey): string {
    return forge.pki.privateKeyToPem(privateKey);
  }

  /**
   * Sign data with private key
   */
  static signData(
    data: string,
    privateKey: forge.pki.PrivateKey,
  ): string {
    const md = forge.md.sha256.create();
    md.update(data, 'utf8');
    const signature = (privateKey as any).sign(md);
    return forge.util.encode64(signature);
  }

  /**
   * Verify signature with certificate
   */
  static verifySignature(
    data: string,
    signature: string,
    certificate: forge.pki.Certificate,
  ): boolean {
    try {
      const md = forge.md.sha256.create();
      md.update(data, 'utf8');
      const signatureBytes = forge.util.decode64(signature);
      return (certificate.publicKey as any).verify(
        md.digest().bytes(),
        signatureBytes,
      );
    } catch (error) {
      this.logger.error('Signature verification failed', error);
      return false;
    }
  }

  /**
   * Check if certificate is issued by ELSTER-CA
   */
  static isElsterCertificate(certificate: forge.pki.Certificate): boolean {
    const issuer = certificate.issuer.attributes
      .find((attr: forge.pki.CertificateField) => attr.shortName === 'CN')
      ?.value?.toString()
      .toLowerCase();

    return !!(
      issuer?.includes('elster') || issuer?.includes('tax authority')
    );
  }

  /**
   * Get certificate common name (CN)
   */
  static getCommonName(certificate: forge.pki.Certificate): string {
    return (
      certificate.subject.attributes
        .find((attr: forge.pki.CertificateField) => attr.shortName === 'CN')
        ?.value?.toString() || ''
    );
  }

  /**
   * Check if certificate will expire within specified days
   */
  static willExpireSoon(
    certificate: forge.pki.Certificate,
    days: number = 30,
  ): boolean {
    const now = new Date();
    const validUntil = certificate.validity.notAfter;
    const daysUntilExpiration = Math.floor(
      (validUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );

    return daysUntilExpiration <= days && daysUntilExpiration > 0;
  }
}
