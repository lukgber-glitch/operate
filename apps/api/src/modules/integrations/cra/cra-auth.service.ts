import {
  Injectable,
  Logger,
  UnauthorizedException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import axios, { AxiosInstance } from 'axios';
import * as https from 'https';
import {
  CraConfig,
  CraAuthCredentials,
  CraSessionInfo,
  CraConnectionInfo,
  CraConnectionStatus,
  CraAuditLog,
  CraAuditAction,
  EncryptedCraCredentials,
} from './interfaces/cra.interface';
import {
  getCraEndpoints,
  validateCraConfig,
  CRA_SESSION_CONFIG,
  CRA_TLS_CONFIG,
} from './cra.constants';
import { CraEncryptionUtil } from './utils/cra-encryption.util';

/**
 * CRA Authentication Service
 *
 * Handles authentication and session management for CRA NetFile API
 *
 * Security Features:
 * - TLS 1.2+ for all communications
 * - AES-256-GCM encrypted credential storage
 * - Session management with automatic expiry
 * - Comprehensive audit logging
 * - Web Access Code (WAC) authentication
 * - EFILE certification number validation
 *
 * @see https://www.canada.ca/en/revenue-agency/services/e-services/digital-services-businesses/business-account.html
 */
@Injectable()
export class CraAuthService {
  private readonly logger = new Logger(CraAuthService.name);
  private readonly config: CraConfig;
  private readonly endpoints: ReturnType<typeof getCraEndpoints>;
  private readonly encryptionKey: string;
  private readonly httpClient: AxiosInstance;
  private readonly activeSessions: Map<string, CraSessionInfo> = new Map();

  // Session cleanup interval (5 minutes)
  private readonly SESSION_CLEANUP_INTERVAL = 5 * 60 * 1000;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    // Load configuration from environment
    this.config = {
      efileNumber: this.configService.get<string>('CRA_EFILE_NUMBER') || '',
      webAccessCode: this.configService.get<string>('CRA_WEB_ACCESS_CODE'),
      environment:
        this.configService.get<string>('CRA_SANDBOX') === 'true' ? 'sandbox' : 'production',
      organizationId: '', // Set per request
      tlsVersion: '1.2',
    };

    // Validate configuration
    validateCraConfig(this.config);

    // Get endpoints based on environment
    this.endpoints = getCraEndpoints(this.config.environment);

    // Get encryption key
    this.encryptionKey =
      this.configService.get<string>('CRA_ENCRYPTION_KEY') ||
      this.configService.get<string>('JWT_ACCESS_SECRET') ||
      '';

    if (!CraEncryptionUtil.validateMasterKey(this.encryptionKey)) {
      throw new Error('Invalid or missing CRA_ENCRYPTION_KEY');
    }

    // Initialize HTTPS client with TLS 1.2+
    this.httpClient = axios.create({
      timeout: 30000,
      httpsAgent: new https.Agent({
        minVersion: CRA_TLS_CONFIG.minVersion,
        maxVersion: CRA_TLS_CONFIG.maxVersion,
        ciphers: CRA_TLS_CONFIG.ciphers,
        rejectUnauthorized: this.config.environment === 'production',
      }),
      headers: {
        'Content-Type': 'application/xml',
        'Accept': 'application/xml',
        'User-Agent': 'Operate-CoachOS/1.0',
      },
    });

    // Start session cleanup job
    this.startSessionCleanup();

    this.logger.log(
      `CRA Auth Service initialized for ${this.config.environment} environment`,
    );
  }

  /**
   * Authenticate with CRA using Web Access Code
   */
  async authenticate(
    organizationId: string,
    businessNumber: string,
    webAccessCode?: string,
  ): Promise<CraSessionInfo> {
    try {
      this.logger.log(`Authenticating CRA for org: ${organizationId}`);

      // Use provided WAC or config WAC
      const accessCode = webAccessCode || this.config.webAccessCode;
      if (!accessCode) {
        throw new UnauthorizedException('Web Access Code is required');
      }

      // Validate business number format
      if (!this.isValidBusinessNumber(businessNumber)) {
        throw new BadRequestException('Invalid Business Number format');
      }

      // Create authentication request
      const authRequest = this.buildAuthRequest(businessNumber, accessCode);

      // Call CRA authentication endpoint
      const response = await this.httpClient.post(
        this.endpoints.authUrl,
        authRequest,
      );

      // Parse response and create session
      const sessionId = this.generateSessionId();
      const expiresAt = new Date(Date.now() + CRA_SESSION_CONFIG.sessionTtl * 1000);

      const sessionInfo: CraSessionInfo = {
        sessionId,
        organizationId,
        businessNumber,
        expiresAt,
        createdAt: new Date(),
      };

      // Store session in memory
      this.activeSessions.set(sessionId, sessionInfo);

      // Store encrypted credentials in database
      await this.storeCredentials(organizationId, {
        efileNumber: this.config.efileNumber,
        webAccessCode: accessCode,
        businessNumber,
        sessionToken: sessionId,
        expiresAt,
      });

      // Audit log
      await this.auditLog(organizationId, CraAuditAction.CONNECT, {
        businessNumber,
        sessionId,
      });

      this.logger.log(`CRA authentication successful for org: ${organizationId}`);
      return sessionInfo;
    } catch (error) {
      this.logger.error(`CRA authentication failed: ${error.message}`, error.stack);
      await this.auditLog(organizationId, CraAuditAction.ERROR, {
        action: 'authenticate',
        error: error.message,
      });
      throw new UnauthorizedException(`CRA authentication failed: ${error.message}`);
    }
  }

  /**
   * Validate existing session
   */
  async validateSession(sessionId: string): Promise<boolean> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      return false;
    }

    // Check if expired
    if (new Date() > session.expiresAt) {
      this.activeSessions.delete(sessionId);
      return false;
    }

    return true;
  }

  /**
   * Get session info
   */
  async getSession(sessionId: string): Promise<CraSessionInfo | null> {
    const session = this.activeSessions.get(sessionId);
    if (!session || !(await this.validateSession(sessionId))) {
      return null;
    }
    return session;
  }

  /**
   * Disconnect CRA session
   */
  async disconnect(organizationId: string): Promise<void> {
    try {
      this.logger.log(`Disconnecting CRA for org: ${organizationId}`);

      // Find and remove active sessions
      for (const [sessionId, session] of this.activeSessions.entries()) {
        if (session.organizationId === organizationId) {
          this.activeSessions.delete(sessionId);
        }
      }

      // Delete stored credentials
      await this.deleteCredentials(organizationId);

      // Audit log
      await this.auditLog(organizationId, CraAuditAction.DISCONNECT, {});

      this.logger.log(`CRA disconnected for org: ${organizationId}`);
    } catch (error) {
      this.logger.error(`CRA disconnect failed: ${error.message}`, error.stack);
      throw new InternalServerErrorException(
        `Failed to disconnect CRA: ${error.message}`,
      );
    }
  }

  /**
   * Get connection info for organization
   */
  async getConnectionInfo(organizationId: string): Promise<CraConnectionInfo | null> {
    try {
      // Check for active session
      let hasActiveSession = false;
      let lastSessionInfo: CraSessionInfo | null = null;

      for (const session of this.activeSessions.values()) {
        if (session.organizationId === organizationId) {
          hasActiveSession = await this.validateSession(session.sessionId);
          if (hasActiveSession) {
            lastSessionInfo = session;
            break;
          }
        }
      }

      // Get stored credentials
      const credentials = await this.getStoredCredentials(organizationId);
      if (!credentials) {
        return null;
      }

      // Determine status
      let status: CraConnectionStatus;
      if (hasActiveSession) {
        status = CraConnectionStatus.CONNECTED;
      } else if (credentials.expiresAt && new Date() > credentials.expiresAt) {
        status = CraConnectionStatus.EXPIRED;
      } else {
        status = CraConnectionStatus.DISCONNECTED;
      }

      return {
        organizationId,
        businessNumber: credentials.businessNumber,
        efileNumber: credentials.efileNumber,
        status,
        connectedAt: lastSessionInfo?.createdAt || new Date(),
        lastUsedAt: lastSessionInfo?.createdAt,
        expiresAt: credentials.expiresAt,
      };
    } catch (error) {
      this.logger.error(
        `Failed to get connection info: ${error.message}`,
        error.stack,
      );
      return null;
    }
  }

  /**
   * Store encrypted credentials in database
   */
  private async storeCredentials(
    organizationId: string,
    credentials: CraAuthCredentials,
  ): Promise<void> {
    const encrypted = CraEncryptionUtil.encrypt(
      JSON.stringify(credentials),
      this.encryptionKey,
    );

    await this.prisma.integrationCredentials.upsert({
      where: {
        organizationId_provider: {
          organizationId,
          provider: 'CRA',
        },
      },
      create: {
        organizationId,
        provider: 'CRA',
        encryptedData: encrypted.encryptedData,
        iv: encrypted.iv,
        authTag: encrypted.authTag,
        expiresAt: credentials.expiresAt,
      },
      update: {
        encryptedData: encrypted.encryptedData,
        iv: encrypted.iv,
        authTag: encrypted.authTag,
        expiresAt: credentials.expiresAt,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Get stored credentials from database
   */
  private async getStoredCredentials(
    organizationId: string,
  ): Promise<CraAuthCredentials | null> {
    const stored = await this.prisma.integrationCredentials.findUnique({
      where: {
        organizationId_provider: {
          organizationId,
          provider: 'CRA',
        },
      },
    });

    if (!stored) {
      return null;
    }

    try {
      const decrypted = CraEncryptionUtil.decrypt(
        {
          encryptedData: stored.encryptedData,
          iv: stored.iv,
          authTag: stored.authTag,
          version: '1',
        },
        this.encryptionKey,
      );

      return JSON.parse(decrypted);
    } catch (error) {
      this.logger.error(`Failed to decrypt credentials: ${error.message}`);
      return null;
    }
  }

  /**
   * Delete stored credentials
   */
  private async deleteCredentials(organizationId: string): Promise<void> {
    await this.prisma.integrationCredentials.deleteMany({
      where: {
        organizationId,
        provider: 'CRA',
      },
    });
  }

  /**
   * Build CRA authentication request XML
   */
  private buildAuthRequest(businessNumber: string, accessCode: string): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<AuthRequest xmlns="http://www.cra-arc.gc.ca/xmlns/auth">
  <EFileNumber>${this.config.efileNumber}</EFileNumber>
  <BusinessNumber>${businessNumber}</BusinessNumber>
  <WebAccessCode>${accessCode}</WebAccessCode>
</AuthRequest>`;
  }

  /**
   * Validate business number format
   */
  private isValidBusinessNumber(bn: string): boolean {
    // Format: 9 digits + 2 letters + 4 digits (e.g., 123456789RT0001)
    const pattern = /^\d{9}[A-Z]{2}\d{4}$/;
    const cleaned = bn.replace(/[\s-]/g, '');
    return pattern.test(cleaned);
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `cra_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Audit logging
   */
  private async auditLog(
    organizationId: string,
    action: CraAuditAction,
    details: Record<string, any>,
  ): Promise<void> {
    try {
      await this.prisma.integrationAuditLog.create({
        data: {
          organizationId,
          provider: 'CRA',
          action,
          details,
          timestamp: new Date(),
        },
      });
    } catch (error) {
      this.logger.error(`Failed to write audit log: ${error.message}`);
    }
  }

  /**
   * Start background session cleanup job
   */
  private startSessionCleanup(): void {
    setInterval(() => {
      const now = new Date();
      let cleanedCount = 0;

      for (const [sessionId, session] of this.activeSessions.entries()) {
        if (now > session.expiresAt) {
          this.activeSessions.delete(sessionId);
          cleanedCount++;
        }
      }

      if (cleanedCount > 0) {
        this.logger.log(`Cleaned up ${cleanedCount} expired CRA sessions`);
      }
    }, this.SESSION_CLEANUP_INTERVAL);
  }

  /**
   * Cleanup on service destruction
   */
  onModuleDestroy() {
    this.activeSessions.clear();
  }
}
