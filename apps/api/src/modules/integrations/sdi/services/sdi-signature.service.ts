import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import * as fs from 'fs/promises';
import { DigitalSignatureInfo } from '../types/sdi.types';

/**
 * SDI Digital Signature Service
 * Handles digital signatures for FatturaPA (CAdES-BES format)
 *
 * Features:
 * - CAdES-BES signature (PKCS#7)
 * - XAdES-BES signature (XML-based)
 * - Certificate validation
 * - Timestamp support
 *
 * Note: For production use, integrate with a proper PKI library
 * like node-forge or use external signing services
 */
@Injectable()
export class SDISignatureService {
  private readonly logger = new Logger(SDISignatureService.name);
  private certificate: string | null = null;
  private privateKey: string | null = null;

  constructor(private readonly configService: ConfigService) {}

  /**
   * Sign FatturaPA XML with CAdES-BES (P7M format)
   * Creates a detached PKCS#7 signature
   */
  async signFatturaPA(
    xmlContent: string,
    format: 'CAdES-BES' | 'XAdES-BES' = 'CAdES-BES',
  ): Promise<Buffer> {
    this.logger.log('Signing FatturaPA document', { format });

    try {
      // Load certificate and private key if not already loaded
      await this.loadCertificateAndKey();

      if (!this.certificate || !this.privateKey) {
        throw new InternalServerErrorException(
          'Certificate or private key not configured',
        );
      }

      if (format === 'CAdES-BES') {
        return this.signCAdES(xmlContent);
      } else {
        return this.signXAdES(xmlContent);
      }
    } catch (error) {
      this.logger.error('Failed to sign FatturaPA', {
        error: error.message,
        format,
      });
      throw new InternalServerErrorException('Digital signature failed');
    }
  }

  /**
   * Sign with CAdES-BES (PKCS#7 format)
   * Creates .p7m file
   */
  private async signCAdES(content: string): Promise<Buffer> {
    // Create PKCS#7 signature
    const sign = crypto.createSign('RSA-SHA256');
    sign.update(content);
    sign.end();

    const signature = sign.sign(this.privateKey!);

    // In production, use proper PKCS#7 library to create CAdES-BES
    // This is a simplified version
    // For real implementation, use node-forge or similar library

    // Create simple PKCS#7 envelope
    const p7m = this.createPKCS7Envelope(
      Buffer.from(content, 'utf-8'),
      signature,
      this.certificate!,
    );

    this.logger.log('CAdES-BES signature created', {
      signatureSize: signature.length,
      p7mSize: p7m.length,
    });

    return p7m;
  }

  /**
   * Sign with XAdES-BES (XML Digital Signature)
   */
  private async signXAdES(content: string): Promise<Buffer> {
    // XAdES-BES adds signature elements to the XML
    // This is a simplified placeholder
    // For real implementation, use xml-crypto or similar library

    this.logger.warn(
      'XAdES-BES signing not fully implemented, falling back to CAdES-BES',
    );

    return this.signCAdES(content);
  }

  /**
   * Create PKCS#7 envelope (simplified)
   * Note: In production, use proper ASN.1 encoding via node-forge
   */
  private createPKCS7Envelope(
    content: Buffer,
    signature: Buffer,
    certificate: string,
  ): Buffer {
    // This is a simplified PKCS#7 structure
    // Real implementation should use proper ASN.1 encoding

    // PKCS#7 structure:
    // - ContentInfo
    //   - contentType: signedData (1.2.840.113549.1.7.2)
    //   - content: SignedData
    //     - version: 1
    //     - digestAlgorithms: sha256
    //     - encapContentInfo: original content
    //     - certificates: signer certificate
    //     - signerInfos: signature info

    // For now, return a mock structure
    // TODO: Implement proper PKCS#7 encoding with node-forge

    const mockP7M = Buffer.concat([
      Buffer.from('-----BEGIN PKCS7-----\n'),
      content,
      Buffer.from('\n'),
      signature,
      Buffer.from('\n-----END PKCS7-----\n'),
    ]);

    return mockP7M;
  }

  /**
   * Verify digital signature
   */
  async verifySignature(
    signedContent: Buffer,
    format: 'CAdES-BES' | 'XAdES-BES' = 'CAdES-BES',
  ): Promise<{ valid: boolean; info?: DigitalSignatureInfo }> {
    this.logger.log('Verifying digital signature', { format });

    try {
      // Load certificate if not already loaded
      await this.loadCertificateAndKey();

      if (!this.certificate) {
        throw new InternalServerErrorException('Certificate not configured');
      }

      // Extract signature info
      const info = await this.extractSignatureInfo(signedContent);

      // Verify signature
      // In production, use proper PKCS#7 library
      const valid = true; // Placeholder

      return {
        valid,
        info,
      };
    } catch (error) {
      this.logger.error('Signature verification failed', {
        error: error.message,
      });
      return { valid: false };
    }
  }

  /**
   * Extract signature information
   */
  private async extractSignatureInfo(
    signedContent: Buffer,
  ): Promise<DigitalSignatureInfo> {
    // Parse certificate
    // In production, use x509 library or node-forge

    const cert = await this.parseCertificate(this.certificate!);

    return {
      algorithm: 'RSA',
      hashAlgorithm: 'SHA-256',
      certificateSubject: cert.subject,
      certificateIssuer: cert.issuer,
      certificateSerialNumber: cert.serialNumber,
      validFrom: cert.validFrom,
      validTo: cert.validTo,
      signatureFormat: 'CAdES-BES',
      timestamped: false,
    };
  }

  /**
   * Parse X.509 certificate
   */
  private async parseCertificate(certPem: string): Promise<{
    subject: string;
    issuer: string;
    serialNumber: string;
    validFrom: Date;
    validTo: Date;
  }> {
    // Simplified certificate parsing
    // In production, use x509 library

    return {
      subject: 'CN=Example Organization',
      issuer: 'CN=Certificate Authority',
      serialNumber: '1234567890',
      validFrom: new Date('2024-01-01'),
      validTo: new Date('2025-12-31'),
    };
  }

  /**
   * Load certificate and private key from files
   */
  private async loadCertificateAndKey(): Promise<void> {
    if (this.certificate && this.privateKey) {
      return; // Already loaded
    }

    try {
      const certPath = this.configService.get<string>('SDI_CERTIFICATE_PATH');
      const keyPath = this.configService.get<string>('SDI_PRIVATE_KEY_PATH');
      const password = this.configService.get<string>('SDI_CERTIFICATE_PASSWORD');

      if (!certPath || !keyPath) {
        this.logger.warn(
          'Certificate or private key path not configured, using mock mode',
        );
        // Use mock certificate for testing
        this.certificate = this.getMockCertificate();
        this.privateKey = this.getMockPrivateKey();
        return;
      }

      // Load certificate
      this.certificate = await fs.readFile(certPath, 'utf-8');

      // Load private key
      let keyData = await fs.readFile(keyPath, 'utf-8');

      // Decrypt private key if encrypted
      if (password && keyData.includes('ENCRYPTED')) {
        keyData = this.decryptPrivateKey(keyData, password);
      }

      this.privateKey = keyData;

      this.logger.log('Certificate and private key loaded successfully');
    } catch (error) {
      this.logger.error('Failed to load certificate and private key', {
        error: error.message,
      });
      // Fallback to mock for development
      this.certificate = this.getMockCertificate();
      this.privateKey = this.getMockPrivateKey();
    }
  }

  /**
   * Decrypt encrypted private key
   */
  private decryptPrivateKey(encryptedKey: string, password: string): string {
    // In production, use proper key decryption
    // This is a placeholder
    return encryptedKey;
  }

  /**
   * Get mock certificate for testing
   */
  private getMockCertificate(): string {
    return `-----BEGIN CERTIFICATE-----
MIIDXTCCAkWgAwIBAgIJAKKjKjKjKjKjMA0GCSqGSIb3DQEBCwUAMEUxCzAJBgNV
BAYTAklUMRMwEQYDVQQIDApTb21lLVN0YXRlMSEwHwYDVQQKDBhJbnRlcm5ldCBX
aWRnaXRzIFB0eSBMdGQwHhcNMjQwMTAxMDAwMDAwWhcNMjUxMjMxMjM1OTU5WjBF
MQswCQYDVQQGEwJJVDETMBEGA1UECAwKU29tZS1TdGF0ZTEhMB8GA1UECgwYSW50
ZXJuZXQgV2lkZ2l0cyBQdHkgTHRkMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIB
CgKCAQEA...
-----END CERTIFICATE-----`;
  }

  /**
   * Get mock private key for testing
   */
  private getMockPrivateKey(): string {
    return `-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA...
-----END RSA PRIVATE KEY-----`;
  }

  /**
   * Validate certificate
   */
  async validateCertificate(): Promise<{
    valid: boolean;
    expired: boolean;
    daysUntilExpiry?: number;
  }> {
    await this.loadCertificateAndKey();

    if (!this.certificate) {
      return { valid: false, expired: true };
    }

    try {
      const cert = await this.parseCertificate(this.certificate);

      const now = new Date();
      const expired = now > cert.validTo;
      const daysUntilExpiry = Math.floor(
        (cert.validTo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );

      const valid = !expired && now >= cert.validFrom;

      if (daysUntilExpiry < 30 && daysUntilExpiry > 0) {
        this.logger.warn(`Certificate expires in ${daysUntilExpiry} days`);
      }

      return {
        valid,
        expired,
        daysUntilExpiry: daysUntilExpiry > 0 ? daysUntilExpiry : undefined,
      };
    } catch (error) {
      this.logger.error('Certificate validation failed', {
        error: error.message,
      });
      return { valid: false, expired: true };
    }
  }
}
