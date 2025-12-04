import { Injectable, Logger } from '@nestjs/common';
import * as forge from 'node-forge';
import {
  SpainCertificateValidation,
  SpainCertificateError,
  SpainCertificateErrorCode,
} from './interfaces/spain-certificate.interface';
import { CertificateStorageService } from './certificate-storage.service';

/**
 * Certificate Validator Service for Spanish FNMT Certificates
 *
 * Validates PKCS#12 certificates issued by FNMT (Fábrica Nacional de Moneda y Timbre)
 * for use with Spanish Tax Agency (AEAT) SII system.
 *
 * Validation includes:
 * - PKCS#12 format verification
 * - Password validation
 * - FNMT issuer verification
 * - Certificate expiry checking
 * - Spanish CIF/NIF extraction from subject
 * - Key usage validation
 *
 * @see https://www.cert.fnmt.es/ - FNMT Certificate Authority
 */
@Injectable()
export class CertificateValidatorService {
  private readonly logger = new Logger(CertificateValidatorService.name);
  private readonly EXPIRY_WARNING_DAYS = 30;

  // Known FNMT issuer patterns
  private readonly FNMT_ISSUER_PATTERNS = [
    'FNMT',
    'Fábrica Nacional de Moneda y Timbre',
    'AC FNMT',
    'FNMT Clase 2',
    'FNMT-RCM',
  ];

  constructor(
    private readonly storageService: CertificateStorageService,
  ) {}

  /**
   * Validate a PKCS#12 certificate for SII use
   *
   * @param certificate - Raw PKCS#12 certificate buffer
   * @param password - Certificate password
   * @returns Validation result with metadata
   */
  async validateCertificate(
    certificate: Buffer,
    password: string,
  ): Promise<SpainCertificateValidation> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Attempt to parse PKCS#12 certificate
      const p12Asn1 = forge.asn1.fromDer(certificate.toString('binary'));
      const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, password);

      // Extract certificate and key bags
      const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
      const pkcs8Bags = p12.getBags({
        bagType: forge.pki.oids.pkcs8ShroudedKeyBag,
      });

      // Validate certificate bag exists
      if (
        !certBags[forge.pki.oids.certBag] ||
        certBags[forge.pki.oids.certBag].length === 0
      ) {
        errors.push('No certificate found in PKCS#12 file');
      }

      // Validate private key exists
      if (
        !pkcs8Bags[forge.pki.oids.pkcs8ShroudedKeyBag] ||
        pkcs8Bags[forge.pki.oids.pkcs8ShroudedKeyBag].length === 0
      ) {
        errors.push('No private key found in PKCS#12 file');
      }

      if (errors.length > 0) {
        return { isValid: false, errors, warnings };
      }

      // Get the first certificate (main certificate)
      const certBag = certBags[forge.pki.oids.certBag][0];
      const cert = certBag.cert;

      if (!cert) {
        errors.push('Failed to parse certificate from PKCS#12 file');
        return { isValid: false, errors, warnings };
      }

      // Extract certificate metadata
      const serialNumber = cert.serialNumber;
      const issuer = this.extractIssuerCN(cert);
      const subject = this.extractSubjectCN(cert);
      const validFrom = cert.validity.notBefore;
      const validTo = cert.validity.notAfter;

      // Verify FNMT issuer
      const isFNMT = this.isFNMTIssuer(cert);
      if (!isFNMT) {
        warnings.push(
          'Certificate does not appear to be issued by FNMT. ' +
            'Ensure you are using a valid FNMT certificate for AEAT/SII.',
        );
      }

      // Extract Spanish CIF/NIF from certificate subject
      const cifNif = this.extractCifNif(cert);

      // Generate thumbprint
      const thumbprint = this.storageService.generateThumbprint(certificate);

      // Validate certificate dates
      const now = new Date();
      if (now < validFrom) {
        errors.push(
          `Certificate is not yet valid. Valid from: ${validFrom.toISOString()}`,
        );
      }

      if (now > validTo) {
        errors.push(
          `Certificate has expired on: ${validTo.toISOString()}`,
        );
      }

      // Check for expiry warning
      const daysUntilExpiry = Math.floor(
        (validTo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (
        daysUntilExpiry <= this.EXPIRY_WARNING_DAYS &&
        daysUntilExpiry > 0
      ) {
        warnings.push(
          `Certificate expires in ${daysUntilExpiry} days on ${validTo.toISOString()}`,
        );
      }

      // Extract key usage extensions
      const keyUsage = this.extractKeyUsage(cert);
      const extendedKeyUsage = this.extractExtendedKeyUsage(cert);

      // Validate key usage for digital signatures (required for SII)
      if (keyUsage.length > 0 && !keyUsage.includes('digitalSignature')) {
        warnings.push(
          'Certificate may not have digitalSignature key usage. ' +
            'This may cause issues with SII submissions.',
        );
      }

      const metadata = {
        serialNumber,
        issuer,
        subject,
        validFrom,
        validTo,
        cifNif,
        thumbprint,
        keyUsage,
        extendedKeyUsage,
        isFNMT,
      };

      this.logger.log(
        `Certificate validation ${errors.length === 0 ? 'passed' : 'failed'}. ` +
          `Issuer: ${issuer}, Subject: ${subject}, CIF/NIF: ${cifNif || 'not found'}`,
      );

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        metadata,
      };
    } catch (error) {
      this.logger.error(
        `Certificate validation error: ${error.message}`,
        error.stack,
      );

      // Handle specific error cases
      if (
        error.message.includes('Invalid password') ||
        error.message.includes('PKCS#12 MAC could not be verified')
      ) {
        errors.push('Invalid certificate password');
      } else if (error.message.includes('ASN.1')) {
        errors.push('Invalid PKCS#12 format. Ensure the file is a valid .p12 or .pfx certificate.');
      } else {
        errors.push(`Certificate parsing failed: ${error.message}`);
      }

      return { isValid: false, errors, warnings };
    }
  }

  /**
   * Extract Common Name from issuer
   */
  private extractIssuerCN(cert: forge.pki.Certificate): string {
    try {
      const cnField = cert.issuer.getField('CN');
      if (cnField) {
        return cnField.value as string;
      }

      // Fallback to full issuer DN
      return cert.issuer.attributes
        .map((attr) => `${attr.shortName}=${attr.value}`)
        .join(', ');
    } catch (error) {
      this.logger.warn(`Failed to extract issuer CN: ${error.message}`);
      return 'Unknown Issuer';
    }
  }

  /**
   * Extract Common Name from subject
   */
  private extractSubjectCN(cert: forge.pki.Certificate): string {
    try {
      const cnField = cert.subject.getField('CN');
      if (cnField) {
        return cnField.value as string;
      }

      // Fallback to full subject DN
      return cert.subject.attributes
        .map((attr) => `${attr.shortName}=${attr.value}`)
        .join(', ');
    } catch (error) {
      this.logger.warn(`Failed to extract subject CN: ${error.message}`);
      return 'Unknown Subject';
    }
  }

  /**
   * Check if certificate is issued by FNMT
   */
  private isFNMTIssuer(cert: forge.pki.Certificate): boolean {
    try {
      const issuerDN = cert.issuer.attributes
        .map((attr) => attr.value)
        .join(' ');

      return this.FNMT_ISSUER_PATTERNS.some((pattern) =>
        issuerDN.includes(pattern),
      );
    } catch (error) {
      this.logger.warn(`Failed to check FNMT issuer: ${error.message}`);
      return false;
    }
  }

  /**
   * Extract Spanish CIF/NIF from certificate subject
   * FNMT certificates typically include serialNumber field with CIF/NIF
   */
  private extractCifNif(cert: forge.pki.Certificate): string | undefined {
    try {
      // Try to extract from serialNumber attribute (common in FNMT certs)
      const serialNumberField = cert.subject.getField('serialNumber');
      if (serialNumberField) {
        const value = serialNumberField.value as string;
        // Spanish CIF/NIF format: Letter + 7-8 digits + optional letter
        const match = value.match(/([A-Z][0-9]{7}[A-Z0-9])/);
        if (match) {
          return match[1];
        }
      }

      // Try to extract from OU or other fields
      const ouField = cert.subject.getField('OU');
      if (ouField) {
        const value = ouField.value as string;
        const match = value.match(/([A-Z][0-9]{7}[A-Z0-9])/);
        if (match) {
          return match[1];
        }
      }

      return undefined;
    } catch (error) {
      this.logger.warn(`Failed to extract CIF/NIF: ${error.message}`);
      return undefined;
    }
  }

  /**
   * Extract key usage extensions
   */
  private extractKeyUsage(cert: forge.pki.Certificate): string[] {
    try {
      const keyUsageExt = cert.getExtension('keyUsage');
      if (!keyUsageExt || !keyUsageExt.value) {
        return [];
      }

      const usage: string[] = [];
      const keyUsage = keyUsageExt as any;

      if (keyUsage.digitalSignature) usage.push('digitalSignature');
      if (keyUsage.nonRepudiation) usage.push('nonRepudiation');
      if (keyUsage.keyEncipherment) usage.push('keyEncipherment');
      if (keyUsage.dataEncipherment) usage.push('dataEncipherment');
      if (keyUsage.keyAgreement) usage.push('keyAgreement');
      if (keyUsage.keyCertSign) usage.push('keyCertSign');
      if (keyUsage.cRLSign) usage.push('cRLSign');

      return usage;
    } catch (error) {
      this.logger.warn(`Failed to extract key usage: ${error.message}`);
      return [];
    }
  }

  /**
   * Extract extended key usage extensions
   */
  private extractExtendedKeyUsage(cert: forge.pki.Certificate): string[] {
    try {
      const extKeyUsageExt = cert.getExtension('extKeyUsage');
      if (!extKeyUsageExt) {
        return [];
      }

      const extKeyUsage = extKeyUsageExt as any;
      return extKeyUsage.value || [];
    } catch (error) {
      this.logger.warn(
        `Failed to extract extended key usage: ${error.message}`,
      );
      return [];
    }
  }
}
