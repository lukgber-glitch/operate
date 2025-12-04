import {
  Injectable,
  Logger,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as crypto from 'crypto';
import * as https from 'https';
import * as tls from 'tls';
import { PeppolCertificate, PeppolConfig } from '../types/peppol.types';

/**
 * Peppol Certificate Service
 * Handles certificate management, validation, and TLS 1.3 configuration
 *
 * Security Features:
 * - TLS 1.3 minimum version enforcement
 * - Certificate pinning with SHA-256 fingerprints
 * - Automatic certificate validation and rotation
 * - X.509 certificate parsing and verification
 */
@Injectable()
export class PeppolCertificateService {
  private readonly logger = new Logger(PeppolCertificateService.name);
  private readonly config: PeppolConfig;
  private certificate: PeppolCertificate | null = null;
  private tlsAgent: https.Agent | null = null;

  constructor(private readonly configService: ConfigService) {
    this.config = {
      accessPointUrl: this.configService.get<string>('PEPPOL_ACCESS_POINT_URL') || '',
      participantId: this.configService.get<string>('PEPPOL_PARTICIPANT_ID') || '',
      certificatePath: this.configService.get<string>('PEPPOL_CERTIFICATE_PATH') || '',
      privateKeyPath: this.configService.get<string>('PEPPOL_PRIVATE_KEY_PATH') || '',
      certificatePassword: this.configService.get<string>('PEPPOL_CERTIFICATE_PASSWORD') || '',
      smlDomain: this.configService.get<string>('PEPPOL_SML_DOMAIN') || 'isml.peppol.eu',
      environment: (this.configService.get<string>('PEPPOL_ENVIRONMENT') || 'test') as 'production' | 'test',
      mockMode: this.configService.get<string>('PEPPOL_MOCK_MODE') === 'true',
      tlsMinVersion: 'TLSv1.3',
      certificatePinning: this.configService.get<string>('PEPPOL_CERTIFICATE_PINNING') !== 'false',
      pinnedCertificates: this.parsePinnedCertificates(),
    };

    if (!this.config.mockMode) {
      this.initializeCertificate();
      this.initializeTLSAgent();
    }
  }

  /**
   * Get TLS agent with TLS 1.3 and certificate pinning
   */
  getTLSAgent(): https.Agent {
    if (!this.tlsAgent) {
      throw new InternalServerErrorException('TLS Agent not initialized');
    }
    return this.tlsAgent;
  }

  /**
   * Get certificate information
   */
  getCertificate(): PeppolCertificate {
    if (!this.certificate) {
      throw new InternalServerErrorException('Certificate not loaded');
    }
    return this.certificate;
  }

  /**
   * Validate certificate is still valid
   */
  validateCertificate(): boolean {
    if (!this.certificate) {
      return false;
    }

    const now = new Date();
    const validFrom = new Date(this.certificate.validFrom);
    const validTo = new Date(this.certificate.validTo);

    if (now < validFrom || now > validTo) {
      this.logger.error('Certificate is expired or not yet valid');
      return false;
    }

    // Check if certificate expires within 30 days
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    if (validTo < thirtyDaysFromNow) {
      this.logger.warn('Certificate expires within 30 days', {
        expiresAt: validTo.toISOString(),
      });
    }

    return true;
  }

  /**
   * Sign data with private key
   */
  sign(data: string): string {
    if (!this.certificate || !this.certificate.privateKey) {
      throw new InternalServerErrorException('Certificate or private key not available');
    }

    try {
      const sign = crypto.createSign('RSA-SHA256');
      sign.update(data);
      sign.end();

      const signature = sign.sign({
        key: this.certificate.privateKey,
        passphrase: this.config.certificatePassword,
      }, 'base64');

      return signature;
    } catch (error) {
      this.logger.error('Failed to sign data', error);
      throw new InternalServerErrorException('Failed to sign data');
    }
  }

  /**
   * Verify signature
   */
  verify(data: string, signature: string, publicKey: string): boolean {
    try {
      const verify = crypto.createVerify('RSA-SHA256');
      verify.update(data);
      verify.end();

      return verify.verify(publicKey, signature, 'base64');
    } catch (error) {
      this.logger.error('Failed to verify signature', error);
      return false;
    }
  }

  /**
   * Calculate SHA-256 fingerprint of certificate
   */
  calculateFingerprint(certificate: string): string {
    const cert = certificate.replace(/-----BEGIN CERTIFICATE-----|-----END CERTIFICATE-----|\n/g, '');
    const hash = crypto.createHash('sha256');
    hash.update(Buffer.from(cert, 'base64'));
    return hash.digest('hex').toUpperCase();
  }

  /**
   * Parse X.509 certificate
   */
  private parseCertificate(certPath: string, keyPath?: string): PeppolCertificate {
    try {
      const certPem = fs.readFileSync(certPath, 'utf8');
      const cert = crypto.X509Certificate ? new crypto.X509Certificate(certPem) : null;

      if (!cert) {
        throw new Error('crypto.X509Certificate not available');
      }

      let privateKey: string | undefined;
      if (keyPath) {
        privateKey = fs.readFileSync(keyPath, 'utf8');
      }

      const fingerprint = this.calculateFingerprint(certPem);

      // Extract access point identifier from certificate subject
      const subject = cert.subject;
      const commonNameMatch = subject.match(/CN=([^,]+)/);
      const accessPointIdentifier = commonNameMatch ? commonNameMatch[1] : '';

      return {
        serialNumber: cert.serialNumber,
        subject: cert.subject,
        issuer: cert.issuer,
        validFrom: new Date(cert.validFrom),
        validTo: new Date(cert.validTo),
        fingerprint,
        publicKey: cert.publicKey.export({ type: 'spki', format: 'pem' }).toString(),
        privateKey,
        accessPointIdentifier,
      };
    } catch (error) {
      this.logger.error('Failed to parse certificate', error);
      throw new InternalServerErrorException('Failed to parse certificate');
    }
  }

  /**
   * Initialize certificate from file system
   */
  private initializeCertificate(): void {
    if (!this.config.certificatePath) {
      throw new Error('PEPPOL_CERTIFICATE_PATH not configured');
    }

    if (!fs.existsSync(this.config.certificatePath)) {
      throw new Error(`Certificate file not found: ${this.config.certificatePath}`);
    }

    this.certificate = this.parseCertificate(
      this.config.certificatePath,
      this.config.privateKeyPath,
    );

    this.logger.log('Certificate loaded successfully', {
      subject: this.certificate.subject,
      validFrom: this.certificate.validFrom,
      validTo: this.certificate.validTo,
      fingerprint: this.certificate.fingerprint,
    });

    // Validate certificate
    if (!this.validateCertificate()) {
      throw new Error('Certificate validation failed');
    }
  }

  /**
   * Initialize TLS agent with TLS 1.3 and certificate pinning
   */
  private initializeTLSAgent(): void {
    if (!this.certificate) {
      throw new Error('Certificate not loaded');
    }

    const cert = fs.readFileSync(this.config.certificatePath, 'utf8');
    const key = this.config.privateKeyPath
      ? fs.readFileSync(this.config.privateKeyPath, 'utf8')
      : undefined;

    const tlsOptions: https.AgentOptions = {
      cert,
      key,
      passphrase: this.config.certificatePassword || undefined,
      minVersion: 'TLSv1.3' as tls.SecureVersion,
      maxVersion: 'TLSv1.3' as tls.SecureVersion,
      rejectUnauthorized: true,
      requestCert: true,
      // Certificate pinning callback
      checkServerIdentity: this.config.certificatePinning
        ? (hostname: string, cert: any) => this.verifyCertificatePin(hostname, cert)
        : undefined,
    };

    this.tlsAgent = new https.Agent(tlsOptions);

    this.logger.log('TLS Agent initialized', {
      tlsVersion: 'TLSv1.3',
      certificatePinning: this.config.certificatePinning,
      pinnedCertificatesCount: this.config.pinnedCertificates?.length || 0,
    });
  }

  /**
   * Verify certificate pinning
   */
  private verifyCertificatePin(hostname: string, cert: any): Error | undefined {
    if (!this.config.certificatePinning || !this.config.pinnedCertificates || this.config.pinnedCertificates.length === 0) {
      return undefined;
    }

    const certFingerprint = cert.fingerprint256?.replace(/:/g, '').toUpperCase();

    if (!certFingerprint) {
      this.logger.error('Certificate fingerprint not available');
      return new Error('Certificate pinning failed: no fingerprint');
    }

    const isPinned = this.config.pinnedCertificates.some(
      (pinned) => pinned.toUpperCase() === certFingerprint,
    );

    if (!isPinned) {
      this.logger.error('Certificate pinning validation failed', {
        hostname,
        fingerprint: certFingerprint,
        pinnedCertificates: this.config.pinnedCertificates,
      });
      return new Error('Certificate pinning failed: fingerprint mismatch');
    }

    this.logger.debug('Certificate pinning validated', {
      hostname,
      fingerprint: certFingerprint,
    });

    return undefined;
  }

  /**
   * Parse pinned certificates from environment variable
   */
  private parsePinnedCertificates(): string[] {
    const pinnedCerts = this.configService.get<string>('PEPPOL_PINNED_CERTIFICATES');
    if (!pinnedCerts) {
      return [];
    }

    return pinnedCerts.split(',').map((cert) => cert.trim()).filter(Boolean);
  }

  /**
   * Rotate certificate (for periodic rotation)
   */
  async rotateCertificate(newCertPath: string, newKeyPath?: string): Promise<void> {
    this.logger.log('Rotating certificate', { newCertPath });

    const newCertificate = this.parseCertificate(newCertPath, newKeyPath);

    // Validate new certificate
    const now = new Date();
    if (now < newCertificate.validFrom || now > newCertificate.validTo) {
      throw new UnauthorizedException('New certificate is not valid');
    }

    // Update certificate
    this.certificate = newCertificate;

    // Reinitialize TLS agent with new certificate
    this.config.certificatePath = newCertPath;
    if (newKeyPath) {
      this.config.privateKeyPath = newKeyPath;
    }
    this.initializeTLSAgent();

    this.logger.log('Certificate rotated successfully', {
      subject: newCertificate.subject,
      validFrom: newCertificate.validFrom,
      validTo: newCertificate.validTo,
    });
  }
}
