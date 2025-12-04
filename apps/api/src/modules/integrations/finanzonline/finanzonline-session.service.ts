/**
 * FinanzOnline Session Management Service
 * Handles session lifecycle, credential management, and multi-tenant support
 *
 * Features:
 * - Session authentication and lifecycle management
 * - Secure credential storage with encryption
 * - Redis-based session caching
 * - Auto-refresh sessions before expiry
 * - Multi-tenant organization support
 * - Audit logging for security compliance
 */

import {
  Injectable,
  Logger,
  UnauthorizedException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../../cache/redis.service';
import { FinanzOnlineClient } from './finanzonline.client';
import {
  FinanzOnlineEnvironment,
  FinanzOnlineAuthType,
  FINANZONLINE_CACHE_KEYS,
  FINANZONLINE_CACHE_TTL,
  FINANZONLINE_SESSION_TIMEOUT,
  FINANZONLINE_ERROR_CODES,
} from './finanzonline.constants';
import {
  FinanzOnlineSession,
  LoginRequest,
  LoginResponse,
  LogoutRequest,
  LogoutResponse,
  PingRequest,
  PingResponse,
  ParticipantInfo,
} from './finanzonline.types';
import {
  encrypt,
  decrypt,
  EncryptionResult,
} from '../finanzonline/utils/fon-auth.util';

/**
 * Stored credential data (encrypted)
 */
interface StoredCredentials {
  teilnehmerId: string;
  benId: string;
  pinEncrypted?: EncryptionResult;
  authType: FinanzOnlineAuthType;
  herstellerId?: string;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Extended session with organization context
 */
interface ExtendedSession extends FinanzOnlineSession {
  organizationId: string;
  autoRefresh: boolean;
  lastRefreshed?: Date;
}

/**
 * Session info response
 */
export interface SessionInfo {
  sessionId: string;
  teilnehmerId: string;
  organizationId: string;
  createdAt: Date;
  expiresAt: Date;
  isValid: boolean;
  remainingTime: number; // in seconds
  environment: FinanzOnlineEnvironment;
  participantInfo?: ParticipantInfo;
}

/**
 * Login credentials DTO
 */
export interface LoginCredentials {
  teilnehmerId: string;
  benId: string;
  pin?: string;
  authType: FinanzOnlineAuthType;
  herstellerId?: string;
  organizationId: string;
  environment?: FinanzOnlineEnvironment;
  autoRefresh?: boolean;
}

@Injectable()
export class FinanzOnlineSessionService {
  private readonly logger = new Logger(FinanzOnlineSessionService.name);
  private readonly encryptionKey: string;
  private readonly clients: Map<string, FinanzOnlineClient> = new Map();
  private readonly autoRefreshIntervals: Map<string, NodeJS.Timeout> = new Map();

  constructor(
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) {
    this.encryptionKey =
      this.configService.get<string>('FON_ENCRYPTION_KEY') ||
      'default-insecure-key-change-in-production';

    if (this.encryptionKey === 'default-insecure-key-change-in-production') {
      this.logger.warn(
        'Using default encryption key. Please set FON_ENCRYPTION_KEY in production!',
      );
    }
  }

  /**
   * Login to FinanzOnline and create session
   */
  async login(credentials: LoginCredentials): Promise<SessionInfo> {
    try {
      this.logger.log(
        `Initiating login for organization ${credentials.organizationId}, participant ${credentials.teilnehmerId}`,
      );

      // Check if session already exists for this organization
      const existingSession = await this.findActiveSessionByOrganization(
        credentials.organizationId,
      );

      if (existingSession && this.isSessionValid(existingSession)) {
        this.logger.log(
          `Active session found for organization ${credentials.organizationId}`,
        );
        return this.sessionToInfo(existingSession);
      }

      // Get or create SOAP client
      const client = await this.getOrCreateClient(
        credentials.environment || FinanzOnlineEnvironment.TEST,
      );

      // Prepare login request
      const loginRequest: LoginRequest = {
        teilnehmerId: credentials.teilnehmerId,
        benId: credentials.benId,
        pin: credentials.pin,
        authType: credentials.authType,
        herstellerId: credentials.herstellerId,
      };

      // Perform login via SOAP client
      const loginResponse: LoginResponse = await client.login(loginRequest);

      // Create extended session
      const session: ExtendedSession = {
        sessionId: loginResponse.sessionId,
        token: loginResponse.sessionToken,
        teilnehmerId: credentials.teilnehmerId,
        benId: credentials.benId,
        createdAt: loginResponse.sessionCreated,
        expiresAt: loginResponse.sessionExpires,
        environment: credentials.environment || FinanzOnlineEnvironment.TEST,
        participantInfo: loginResponse.participantInfo,
        organizationId: credentials.organizationId,
        autoRefresh: credentials.autoRefresh ?? true,
      };

      // Store session in Redis
      await this.storeSession(session);

      // Store credentials (encrypted) for auto-refresh
      if (credentials.autoRefresh !== false) {
        await this.storeCredentials(session.sessionId, credentials);
      }

      // Setup auto-refresh if enabled
      if (session.autoRefresh) {
        this.setupAutoRefresh(session);
      }

      // Log successful login (audit trail)
      this.logger.log(
        `Login successful for organization ${credentials.organizationId}, session ${session.sessionId}`,
      );

      return this.sessionToInfo(session);
    } catch (error) {
      this.logger.error(
        `Login failed for organization ${credentials.organizationId}: ${error.message}`,
        error.stack,
      );

      if (error.code === FINANZONLINE_ERROR_CODES.INVALID_CREDENTIALS) {
        throw new UnauthorizedException('Invalid credentials provided');
      }

      if (error.code === FINANZONLINE_ERROR_CODES.ACCOUNT_LOCKED) {
        throw new UnauthorizedException('Account is locked');
      }

      throw new InternalServerErrorException(
        `Login failed: ${error.message}`,
      );
    }
  }

  /**
   * Logout and invalidate session
   */
  async logout(sessionId: string): Promise<void> {
    try {
      this.logger.log(`Logging out session ${sessionId}`);

      // Get session
      const session = await this.getSession(sessionId);
      if (!session) {
        this.logger.warn(`Session ${sessionId} not found`);
        return;
      }

      // Get SOAP client
      const client = await this.getOrCreateClient(session.environment);

      // Perform logout via SOAP
      const logoutRequest: LogoutRequest = {
        sessionId: session.sessionId,
      };

      try {
        await client.logout(logoutRequest);
      } catch (error) {
        this.logger.warn(
          `SOAP logout failed for session ${sessionId}: ${error.message}`,
        );
        // Continue with cleanup even if SOAP logout fails
      }

      // Clear auto-refresh
      this.clearAutoRefresh(sessionId);

      // Delete session from Redis
      await this.deleteSession(sessionId);

      // Delete stored credentials
      await this.deleteCredentials(sessionId);

      this.logger.log(`Session ${sessionId} logged out successfully`);
    } catch (error) {
      this.logger.error(
        `Logout failed for session ${sessionId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Keep session alive (ping)
   */
  async keepAlive(sessionId: string): Promise<SessionInfo> {
    try {
      this.logger.debug(`Keeping session ${sessionId} alive`);

      // Get session
      const session = await this.getSession(sessionId);
      if (!session) {
        throw new UnauthorizedException('Session not found');
      }

      // Check if session is expired
      if (!this.isSessionValid(session)) {
        throw new UnauthorizedException('Session expired');
      }

      // Get SOAP client
      const client = await this.getOrCreateClient(session.environment);

      // Perform ping via SOAP
      const pingRequest: PingRequest = {
        sessionId: session.sessionId,
      };

      const pingResponse: PingResponse = await client.ping(pingRequest);

      // Update session expiration if provided
      if (pingResponse.sessionExpires) {
        session.expiresAt = pingResponse.sessionExpires;
        session.lastRefreshed = new Date();
        await this.storeSession(session);
      }

      this.logger.debug(`Session ${sessionId} kept alive successfully`);

      return this.sessionToInfo(session);
    } catch (error) {
      this.logger.error(
        `Keep alive failed for session ${sessionId}: ${error.message}`,
        error.stack,
      );

      if (error.code === FINANZONLINE_ERROR_CODES.INVALID_SESSION_ID) {
        throw new UnauthorizedException('Invalid session');
      }

      throw error;
    }
  }

  /**
   * Get session information
   */
  async getSessionInfo(sessionId: string): Promise<SessionInfo> {
    const session = await this.getSession(sessionId);
    if (!session) {
      throw new UnauthorizedException('Session not found');
    }

    return this.sessionToInfo(session);
  }

  /**
   * Find active session by organization
   */
  async findActiveSessionByOrganization(
    organizationId: string,
  ): Promise<ExtendedSession | null> {
    try {
      // Get all session keys
      const pattern = `${FINANZONLINE_CACHE_KEYS.SESSION}*`;
      const keys = await this.redisService.keys(pattern);

      // Find session for organization
      for (const key of keys) {
        const session = await this.redisService.get<ExtendedSession>(key);
        if (
          session &&
          session.organizationId === organizationId &&
          this.isSessionValid(session)
        ) {
          return session;
        }
      }

      return null;
    } catch (error) {
      this.logger.error(
        `Failed to find session for organization ${organizationId}`,
        error,
      );
      return null;
    }
  }

  /**
   * Validate session token
   */
  async validateSession(
    sessionId: string,
    organizationId: string,
  ): Promise<boolean> {
    try {
      const session = await this.getSession(sessionId);
      if (!session) {
        return false;
      }

      // Check organization match
      if (session.organizationId !== organizationId) {
        this.logger.warn(
          `Organization mismatch for session ${sessionId}: expected ${organizationId}, got ${session.organizationId}`,
        );
        return false;
      }

      // Check if valid
      return this.isSessionValid(session);
    } catch (error) {
      this.logger.error(`Session validation failed: ${error.message}`, error);
      return false;
    }
  }

  /**
   * Cleanup expired sessions
   */
  async cleanupExpiredSessions(): Promise<number> {
    try {
      this.logger.log('Starting cleanup of expired sessions');

      const pattern = `${FINANZONLINE_CACHE_KEYS.SESSION}*`;
      const keys = await this.redisService.keys(pattern);

      let cleanedCount = 0;

      for (const key of keys) {
        const session = await this.redisService.get<ExtendedSession>(key);
        if (session && !this.isSessionValid(session)) {
          await this.deleteSession(session.sessionId);
          this.clearAutoRefresh(session.sessionId);
          cleanedCount++;
        }
      }

      this.logger.log(`Cleaned up ${cleanedCount} expired sessions`);
      return cleanedCount;
    } catch (error) {
      this.logger.error('Failed to cleanup expired sessions', error);
      return 0;
    }
  }

  /**
   * Store session in Redis
   */
  private async storeSession(session: ExtendedSession): Promise<void> {
    const key = `${FINANZONLINE_CACHE_KEYS.SESSION}${session.sessionId}`;
    const ttl = Math.floor(
      (session.expiresAt.getTime() - Date.now()) / 1000,
    );

    await this.redisService.set(key, session, ttl > 0 ? ttl : FINANZONLINE_CACHE_TTL.SESSION);
  }

  /**
   * Get session from Redis
   */
  private async getSession(
    sessionId: string,
  ): Promise<ExtendedSession | null> {
    const key = `${FINANZONLINE_CACHE_KEYS.SESSION}${sessionId}`;
    const session = await this.redisService.get<ExtendedSession>(key);

    if (session) {
      // Convert date strings to Date objects
      session.createdAt = new Date(session.createdAt);
      session.expiresAt = new Date(session.expiresAt);
      if (session.lastRefreshed) {
        session.lastRefreshed = new Date(session.lastRefreshed);
      }
    }

    return session;
  }

  /**
   * Delete session from Redis
   */
  private async deleteSession(sessionId: string): Promise<void> {
    const key = `${FINANZONLINE_CACHE_KEYS.SESSION}${sessionId}`;
    await this.redisService.del(key);
  }

  /**
   * Store encrypted credentials
   */
  private async storeCredentials(
    sessionId: string,
    credentials: LoginCredentials,
  ): Promise<void> {
    try {
      const stored: StoredCredentials = {
        teilnehmerId: credentials.teilnehmerId,
        benId: credentials.benId,
        authType: credentials.authType,
        herstellerId: credentials.herstellerId,
        organizationId: credentials.organizationId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Encrypt PIN if provided
      if (credentials.pin) {
        stored.pinEncrypted = encrypt(credentials.pin, this.encryptionKey);
      }

      const key = `${FINANZONLINE_CACHE_KEYS.SESSION}${sessionId}:credentials`;
      await this.redisService.set(key, stored, FINANZONLINE_CACHE_TTL.SESSION);
    } catch (error) {
      this.logger.error(
        `Failed to store credentials for session ${sessionId}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Get stored credentials
   */
  private async getCredentials(
    sessionId: string,
  ): Promise<LoginCredentials | null> {
    try {
      const key = `${FINANZONLINE_CACHE_KEYS.SESSION}${sessionId}:credentials`;
      const stored = await this.redisService.get<StoredCredentials>(key);

      if (!stored) {
        return null;
      }

      const credentials: LoginCredentials = {
        teilnehmerId: stored.teilnehmerId,
        benId: stored.benId,
        authType: stored.authType,
        herstellerId: stored.herstellerId,
        organizationId: stored.organizationId,
      };

      // Decrypt PIN if present
      if (stored.pinEncrypted) {
        credentials.pin = decrypt(
          stored.pinEncrypted.encrypted,
          stored.pinEncrypted.iv,
          stored.pinEncrypted.authTag,
          this.encryptionKey,
        );
      }

      return credentials;
    } catch (error) {
      this.logger.error(
        `Failed to get credentials for session ${sessionId}`,
        error,
      );
      return null;
    }
  }

  /**
   * Delete stored credentials
   */
  private async deleteCredentials(sessionId: string): Promise<void> {
    const key = `${FINANZONLINE_CACHE_KEYS.SESSION}${sessionId}:credentials`;
    await this.redisService.del(key);
  }

  /**
   * Get or create SOAP client for environment
   */
  private async getOrCreateClient(
    environment: FinanzOnlineEnvironment,
  ): Promise<FinanzOnlineClient> {
    const clientKey = environment;

    if (!this.clients.has(clientKey)) {
      const client = new FinanzOnlineClient({
        environment,
        debug: this.configService.get<boolean>('FON_DEBUG') || false,
      });

      await client.initialize();
      this.clients.set(clientKey, client);
    }

    return this.clients.get(clientKey)!;
  }

  /**
   * Check if session is valid (not expired)
   */
  private isSessionValid(session: ExtendedSession): boolean {
    const now = new Date();
    return now < new Date(session.expiresAt);
  }

  /**
   * Convert session to session info
   */
  private sessionToInfo(session: ExtendedSession): SessionInfo {
    const now = Date.now();
    const expiresAt = new Date(session.expiresAt).getTime();
    const remainingTime = Math.max(0, Math.floor((expiresAt - now) / 1000));

    return {
      sessionId: session.sessionId,
      teilnehmerId: session.teilnehmerId,
      organizationId: session.organizationId,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
      isValid: this.isSessionValid(session),
      remainingTime,
      environment: session.environment,
      participantInfo: session.participantInfo,
    };
  }

  /**
   * Setup auto-refresh for session
   */
  private setupAutoRefresh(session: ExtendedSession): void {
    // Clear any existing interval
    this.clearAutoRefresh(session.sessionId);

    // Calculate refresh time (5 minutes before expiry)
    const refreshBeforeExpiry = 5 * 60 * 1000; // 5 minutes in ms
    const expiresAt = new Date(session.expiresAt).getTime();
    const refreshAt = expiresAt - refreshBeforeExpiry;
    const delay = Math.max(0, refreshAt - Date.now());

    if (delay <= 0) {
      this.logger.warn(
        `Session ${session.sessionId} expires too soon for auto-refresh`,
      );
      return;
    }

    this.logger.debug(
      `Setting up auto-refresh for session ${session.sessionId} in ${delay}ms`,
    );

    const timeout = setTimeout(async () => {
      try {
        await this.refreshSession(session.sessionId);
      } catch (error) {
        this.logger.error(
          `Auto-refresh failed for session ${session.sessionId}`,
          error,
        );
      }
    }, delay);

    this.autoRefreshIntervals.set(session.sessionId, timeout);
  }

  /**
   * Clear auto-refresh timer
   */
  private clearAutoRefresh(sessionId: string): void {
    const timeout = this.autoRefreshIntervals.get(sessionId);
    if (timeout) {
      clearTimeout(timeout);
      this.autoRefreshIntervals.delete(sessionId);
    }
  }

  /**
   * Refresh session by re-authenticating
   */
  private async refreshSession(sessionId: string): Promise<void> {
    try {
      this.logger.log(`Refreshing session ${sessionId}`);

      // Get session
      const session = await this.getSession(sessionId);
      if (!session) {
        this.logger.warn(`Session ${sessionId} not found for refresh`);
        return;
      }

      // Get stored credentials
      const credentials = await this.getCredentials(sessionId);
      if (!credentials) {
        this.logger.warn(
          `Credentials not found for session ${sessionId}, cannot auto-refresh`,
        );
        return;
      }

      // Logout old session
      await this.logout(sessionId);

      // Re-login with stored credentials
      await this.login({
        ...credentials,
        environment: session.environment,
        autoRefresh: true,
      });

      this.logger.log(`Session ${sessionId} refreshed successfully`);
    } catch (error) {
      this.logger.error(
        `Failed to refresh session ${sessionId}: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Cleanup on service destroy
   */
  async onModuleDestroy(): Promise<void> {
    // Clear all auto-refresh timers
    for (const [sessionId, timeout] of this.autoRefreshIntervals.entries()) {
      clearTimeout(timeout);
    }
    this.autoRefreshIntervals.clear();

    // Destroy all clients
    for (const client of this.clients.values()) {
      client.destroy();
    }
    this.clients.clear();

    this.logger.log('FinanzOnline Session Service destroyed');
  }
}
