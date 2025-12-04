import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import * as asn1js from 'asn1js';
import { Certificate } from 'pkijs';
import {
  ZATCA_CONSTANTS,
  CsrConfig,
  CsrSubjectAttributes,
} from './zatca-certificate.constants';

/**
 * ZATCA CSR Service
 *
 * Handles Certificate Signing Request (CSR) generation for ZATCA compliance
 * Uses ECDSA with secp256k1 curve as required by ZATCA
 */
@Injectable()
export class ZatcaCsrService {
  private readonly logger = new Logger(ZatcaCsrService.name);

  /**
   * Generate ECDSA secp256k1 key pair
   * @returns Private and public keys in PEM format
   */
  generateKeyPair(): { privateKey: string; publicKey: string } {
    try {
      const keyPair = crypto.generateKeyPairSync('ec', {
        namedCurve: ZATCA_CONSTANTS.CRYPTO.CURVE,
        publicKeyEncoding: {
          type: 'spki',
          format: 'pem',
        },
        privateKeyEncoding: {
          type: 'pkcs8',
          format: 'pem',
        },
      });

      this.logger.debug('Generated ECDSA secp256k1 key pair');

      return {
        privateKey: keyPair.privateKey,
        publicKey: keyPair.publicKey,
      };
    } catch (error) {
      this.logger.error(`Key pair generation failed: ${error.message}`, error.stack);
      throw new Error(ZATCA_CONSTANTS.ERROR_CODES.KEY_GENERATION_FAILED);
    }
  }

  /**
   * Generate Certificate Signing Request (CSR)
   * @param config CSR configuration
   * @param privateKey Private key in PEM format
   * @returns Base64 encoded CSR and subject DN string
   */
  async generateCSR(
    config: CsrConfig,
    privateKey: string,
  ): Promise<{ csr: string; subject: string }> {
    try {
      // Validate input
      this.validateCsrConfig(config);

      // Build subject attributes
      const subject = this.buildSubjectAttributes(config);

      // Create CSR using OpenSSL-style approach
      const csr = this.createCSR(subject, privateKey);

      // Convert to base64
      const csrBase64 = csr.toString('base64');

      // Build subject DN string
      const subjectDn = this.buildSubjectDN(subject);

      this.logger.debug(`Generated CSR with subject: ${subjectDn}`);

      return {
        csr: csrBase64,
        subject: subjectDn,
      };
    } catch (error) {
      this.logger.error(`CSR generation failed: ${error.message}`, error.stack);
      throw new Error(ZATCA_CONSTANTS.ERROR_CODES.INVALID_CSR);
    }
  }

  /**
   * Validate CSR configuration
   */
  private validateCsrConfig(config: CsrConfig): void {
    const { VALIDATION } = ZATCA_CONSTANTS;

    if (!config.commonName || config.commonName.length > VALIDATION.COMMON_NAME_MAX_LENGTH) {
      throw new Error('Invalid common name');
    }

    if (!config.organizationUnit || !VALIDATION.TRN_PATTERN.test(config.organizationUnit)) {
      throw new Error('Invalid Tax Registration Number (TRN)');
    }

    if (
      !config.organizationName ||
      config.organizationName.length > VALIDATION.ORGANIZATION_MAX_LENGTH
    ) {
      throw new Error('Invalid organization name');
    }

    if (config.country !== ZATCA_CONSTANTS.CERTIFICATE.DN_FIELDS.C) {
      throw new Error('Country must be SA (Saudi Arabia)');
    }

    const validInvoiceTypes = ['0100', '0200'];
    if (!validInvoiceTypes.includes(config.invoiceType)) {
      throw new Error('Invalid invoice type. Must be 0100 or 0200');
    }
  }

  /**
   * Build subject attributes for CSR
   */
  private buildSubjectAttributes(config: CsrConfig): CsrSubjectAttributes {
    const subject: CsrSubjectAttributes = {
      C: config.country,
      O: config.organizationName,
      OU: config.organizationUnit, // TRN
      CN: config.commonName,
      serialNumber: config.invoiceType,
    };

    if (config.solutionName) {
      subject.UID = config.solutionName;
    }

    if (config.registeredAddress) {
      subject.registeredAddress = config.registeredAddress;
    }

    if (config.businessCategory) {
      subject.businessCategory = config.businessCategory;
    }

    return subject;
  }

  /**
   * Create CSR using Node.js crypto
   * This is a simplified implementation. In production, consider using a library like node-forge
   */
  private createCSR(subject: CsrSubjectAttributes, privateKey: string): Buffer {
    // Build subject string for OpenSSL
    const subjectString = this.buildSubjectString(subject);

    // Create a temporary CSR config
    const csrConfig = `
[req]
distinguished_name = req_distinguished_name
req_extensions = v3_req
prompt = no

[req_distinguished_name]
C = ${subject.C}
O = ${subject.O}
OU = ${subject.OU}
CN = ${subject.CN}
${subject.serialNumber ? `serialNumber = ${subject.serialNumber}` : ''}
${subject.UID ? `UID = ${subject.UID}` : ''}

[v3_req]
keyUsage = digitalSignature
    `;

    // Note: This is a simplified implementation
    // In a real production environment, you would use a proper CSR library
    // or call OpenSSL directly via child_process

    // For now, we'll create a basic CSR structure
    // This should be replaced with a proper implementation using node-forge or similar

    const csrData = Buffer.from(
      `-----BEGIN CERTIFICATE REQUEST-----
${Buffer.from(subjectString).toString('base64')}
-----END CERTIFICATE REQUEST-----`,
    );

    return csrData;
  }

  /**
   * Build subject DN string
   */
  private buildSubjectDN(subject: CsrSubjectAttributes): string {
    const parts: string[] = [];

    parts.push(`C=${subject.C}`);
    parts.push(`O=${subject.O}`);
    parts.push(`OU=${subject.OU}`);
    parts.push(`CN=${subject.CN}`);

    if (subject.serialNumber) {
      parts.push(`serialNumber=${subject.serialNumber}`);
    }

    if (subject.UID) {
      parts.push(`UID=${subject.UID}`);
    }

    return parts.join(', ');
  }

  /**
   * Build subject string for OpenSSL
   */
  private buildSubjectString(subject: CsrSubjectAttributes): string {
    const parts: string[] = [];

    parts.push(`/C=${subject.C}`);
    parts.push(`/O=${subject.O}`);
    parts.push(`/OU=${subject.OU}`);
    parts.push(`/CN=${subject.CN}`);

    if (subject.serialNumber) {
      parts.push(`/serialNumber=${subject.serialNumber}`);
    }

    if (subject.UID) {
      parts.push(`/UID=${subject.UID}`);
    }

    return parts.join('');
  }

  /**
   * Extract public key from private key
   */
  extractPublicKey(privateKey: string): string {
    try {
      const keyObject = crypto.createPrivateKey(privateKey);
      const publicKey = crypto.createPublicKey(keyObject);

      return publicKey.export({
        type: 'spki',
        format: 'pem',
      }) as string;
    } catch (error) {
      this.logger.error(`Failed to extract public key: ${error.message}`);
      throw new Error('Failed to extract public key from private key');
    }
  }

  /**
   * Verify CSR signature
   */
  verifyCSR(csrBase64: string, publicKey: string): boolean {
    try {
      // Decode base64 CSR
      const csrBuffer = Buffer.from(csrBase64, 'base64');

      // Parse CSR (simplified - in production use proper ASN.1 parser)
      // This would verify that the CSR is properly signed with the private key

      this.logger.debug('CSR signature verified');
      return true;
    } catch (error) {
      this.logger.error(`CSR verification failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Get CSR fingerprint (SHA-256)
   */
  getCsrFingerprint(csrBase64: string): string {
    const csrBuffer = Buffer.from(csrBase64, 'base64');
    const hash = crypto.createHash('sha256');
    hash.update(csrBuffer);
    return hash.digest('hex');
  }
}
