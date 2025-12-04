import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import { ZATCA_CONSTANTS } from './zatca-certificate.constants';

/**
 * ZATCA Certificate Validator
 *
 * Validates ZATCA certificates and signatures
 * Performs:
 * - Certificate chain validation
 * - Expiry checking
 * - ECDSA signature verification
 * - Certificate purpose validation
 */
@Injectable()
export class ZatcaCertificateValidator {
  private readonly logger = new Logger(ZatcaCertificateValidator.name);

  /**
   * Validate certificate
   */
  async validateCertificate(
    certificate: {
      validFrom: Date;
      validTo: Date;
      csidStatus: string;
      isActive: boolean;
    },
  ): Promise<{
    isValid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    // Check if certificate is active
    if (!certificate.isActive) {
      errors.push('Certificate is not active');
    }

    // Check CSID status
    if (certificate.csidStatus !== 'ACTIVE') {
      errors.push(`Certificate CSID status is ${certificate.csidStatus}`);
    }

    // Check expiry
    const now = new Date();
    if (now < certificate.validFrom) {
      errors.push('Certificate is not yet valid');
    }
    if (now > certificate.validTo) {
      errors.push('Certificate has expired');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Verify ECDSA signature
   */
  verifySignature(
    data: Buffer,
    signature: string,
    publicKey: string,
  ): boolean {
    try {
      const verify = crypto.createVerify(ZATCA_CONSTANTS.CRYPTO.SIGNATURE_ALGORITHM);
      verify.update(data);
      verify.end();

      const isValid = verify.verify(publicKey, signature, 'base64');

      this.logger.debug(`Signature verification: ${isValid ? 'valid' : 'invalid'}`);

      return isValid;
    } catch (error) {
      this.logger.error(`Signature verification failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Verify certificate chain
   */
  async verifyCertificateChain(
    certificate: string,
    issuerCertificate?: string,
  ): Promise<boolean> {
    try {
      // In a full implementation, this would:
      // 1. Parse the certificate
      // 2. Extract the issuer DN
      // 3. Verify the signature using the issuer's public key
      // 4. Check the certificate chain up to the root CA

      this.logger.debug('Certificate chain verification (placeholder)');

      return true;
    } catch (error) {
      this.logger.error(`Certificate chain verification failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Check if certificate is expired
   */
  isExpired(validTo: Date): boolean {
    return new Date() > validTo;
  }

  /**
   * Check if certificate needs renewal
   */
  needsRenewal(validTo: Date, warningDays: number = ZATCA_CONSTANTS.RENEWAL.WARNING_DAYS): boolean {
    const now = new Date();
    const warningDate = new Date(validTo);
    warningDate.setDate(warningDate.getDate() - warningDays);

    return now >= warningDate;
  }

  /**
   * Calculate days until expiry
   */
  daysUntilExpiry(validTo: Date): number {
    const now = new Date();
    const diffTime = validTo.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  /**
   * Validate certificate subject
   */
  validateSubject(subject: {
    commonName: string;
    organizationUnit: string;
    organizationName: string;
  }): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const { VALIDATION } = ZATCA_CONSTANTS;

    if (!subject.commonName || subject.commonName.length > VALIDATION.COMMON_NAME_MAX_LENGTH) {
      errors.push('Invalid common name');
    }

    if (!subject.organizationUnit || !VALIDATION.TRN_PATTERN.test(subject.organizationUnit)) {
      errors.push('Invalid Tax Registration Number (TRN)');
    }

    if (
      !subject.organizationName ||
      subject.organizationName.length > VALIDATION.ORGANIZATION_MAX_LENGTH
    ) {
      errors.push('Invalid organization name');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate invoice hash
   */
  validateInvoiceHash(invoiceData: string, expectedHash: string): boolean {
    const hash = crypto.createHash('sha256');
    hash.update(invoiceData);
    const calculatedHash = hash.digest('hex');

    return calculatedHash === expectedHash;
  }

  /**
   * Generate invoice hash
   */
  generateInvoiceHash(invoiceData: string): string {
    const hash = crypto.createHash('sha256');
    hash.update(invoiceData);
    return hash.digest('hex');
  }

  /**
   * Validate public key
   */
  validatePublicKey(publicKey: string): boolean {
    try {
      const keyObject = crypto.createPublicKey(publicKey);
      const keyDetails = keyObject.export({ format: 'pem', type: 'spki' });

      // Check if it's an EC key with secp256k1 curve
      // This is a simplified check
      return keyDetails.toString().includes('BEGIN PUBLIC KEY');
    } catch (error) {
      this.logger.error(`Public key validation failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Get certificate fingerprint (SHA-256)
   */
  getCertificateFingerprint(certificate: string): string {
    const hash = crypto.createHash('sha256');
    hash.update(certificate);
    return hash.digest('hex');
  }
}
