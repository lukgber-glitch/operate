/**
 * FinanzOnline Session Service Usage Examples
 * Demonstrates how to use the session service in various scenarios
 */

import { Injectable, Logger } from '@nestjs/common';
import {
  FinanzOnlineSessionService,
  LoginCredentials,
  SessionInfo,
} from '../index';
import {
  FinanzOnlineAuthType,
  FinanzOnlineEnvironment,
} from '../finanzonline.constants';

/**
 * Example 1: Basic Login/Logout
 */
@Injectable()
export class BasicSessionExample {
  private readonly logger = new Logger(BasicSessionExample.name);

  constructor(
    private readonly sessionService: FinanzOnlineSessionService,
  ) {}

  async example() {
    // Login
    const credentials: LoginCredentials = {
      teilnehmerId: 'T123456789',
      benId: 'U987654321',
      pin: '1234',
      authType: FinanzOnlineAuthType.USER_PIN,
      organizationId: 'org_demo_001',
      environment: FinanzOnlineEnvironment.TEST,
      autoRefresh: true,
    };

    const sessionInfo = await this.sessionService.login(credentials);
    this.logger.log(`Session created: ${sessionInfo.sessionId}`);
    this.logger.log(`Expires at: ${sessionInfo.expiresAt}`);

    // Use session for operations...
    // ...

    // Logout when done
    await this.sessionService.logout(sessionInfo.sessionId);
    this.logger.log('Session ended');
  }
}

/**
 * Example 2: Session with Auto-Refresh
 */
@Injectable()
export class AutoRefreshExample {
  private readonly logger = new Logger(AutoRefreshExample.name);

  constructor(
    private readonly sessionService: FinanzOnlineSessionService,
  ) {}

  async example() {
    // Create session with auto-refresh enabled
    const sessionInfo = await this.sessionService.login({
      teilnehmerId: 'T123456789',
      benId: 'U987654321',
      pin: '1234',
      authType: FinanzOnlineAuthType.USER_PIN,
      organizationId: 'org_demo_001',
      environment: FinanzOnlineEnvironment.TEST,
      autoRefresh: true, // Session will auto-refresh 5 min before expiry
    });

    this.logger.log(`Session ${sessionInfo.sessionId} will auto-refresh`);

    // Session automatically refreshes - no manual intervention needed
    // You can use the session for hours without worrying about expiry

    // Check session status anytime
    const info = await this.sessionService.getSessionInfo(sessionInfo.sessionId);
    this.logger.log(`Session valid: ${info.isValid}`);
    this.logger.log(`Remaining time: ${info.remainingTime}s`);
  }
}

/**
 * Example 3: Multi-Tenant Session Management
 */
@Injectable()
export class MultiTenantExample {
  private readonly logger = new Logger(MultiTenantExample.name);

  constructor(
    private readonly sessionService: FinanzOnlineSessionService,
  ) {}

  async example() {
    // Organization 1
    const org1Session = await this.sessionService.login({
      teilnehmerId: 'T111111111',
      benId: 'U111111111',
      pin: '1111',
      authType: FinanzOnlineAuthType.USER_PIN,
      organizationId: 'org_company_a',
      environment: FinanzOnlineEnvironment.TEST,
    });

    // Organization 2
    const org2Session = await this.sessionService.login({
      teilnehmerId: 'T222222222',
      benId: 'U222222222',
      pin: '2222',
      authType: FinanzOnlineAuthType.USER_PIN,
      organizationId: 'org_company_b',
      environment: FinanzOnlineEnvironment.TEST,
    });

    this.logger.log('Created sessions for 2 organizations');

    // Validate session belongs to organization
    const isValid = await this.sessionService.validateSession(
      org1Session.sessionId,
      'org_company_a',
    );

    this.logger.log(`Org1 session valid for org_company_a: ${isValid}`);

    // Find active session for organization
    const activeSession = await this.sessionService
      .findActiveSessionByOrganization('org_company_a');

    if (activeSession) {
      this.logger.log(`Found active session: ${activeSession.sessionId}`);
    }
  }
}

/**
 * Example 4: Session Lifecycle Management
 */
@Injectable()
export class SessionLifecycleExample {
  private readonly logger = new Logger(SessionLifecycleExample.name);

  constructor(
    private readonly sessionService: FinanzOnlineSessionService,
  ) {}

  async example() {
    // 1. Create session
    const sessionInfo = await this.sessionService.login({
      teilnehmerId: 'T123456789',
      benId: 'U987654321',
      pin: '1234',
      authType: FinanzOnlineAuthType.USER_PIN,
      organizationId: 'org_demo_001',
      environment: FinanzOnlineEnvironment.TEST,
      autoRefresh: false, // Disable auto-refresh for this example
    });

    this.logger.log('1. Session created');

    // 2. Get session info
    let info = await this.sessionService.getSessionInfo(sessionInfo.sessionId);
    this.logger.log(`2. Session info: ${info.remainingTime}s remaining`);

    // 3. Keep session alive
    info = await this.sessionService.keepAlive(sessionInfo.sessionId);
    this.logger.log('3. Session kept alive');

    // 4. Check if still valid
    const isValid = await this.sessionService.validateSession(
      sessionInfo.sessionId,
      'org_demo_001',
    );
    this.logger.log(`4. Session valid: ${isValid}`);

    // 5. Logout
    await this.sessionService.logout(sessionInfo.sessionId);
    this.logger.log('5. Session logged out');
  }
}

/**
 * Example 5: Error Handling
 */
@Injectable()
export class ErrorHandlingExample {
  private readonly logger = new Logger(ErrorHandlingExample.name);

  constructor(
    private readonly sessionService: FinanzOnlineSessionService,
  ) {}

  async example() {
    try {
      // Attempt login with invalid credentials
      await this.sessionService.login({
        teilnehmerId: 'INVALID',
        benId: 'INVALID',
        pin: 'wrong',
        authType: FinanzOnlineAuthType.USER_PIN,
        organizationId: 'org_demo_001',
        environment: FinanzOnlineEnvironment.TEST,
      });
    } catch (error) {
      this.logger.error('Login failed:', error.message);
      // Handle invalid credentials
    }

    try {
      // Attempt to use expired session
      const info = await this.sessionService.getSessionInfo('invalid_session');
    } catch (error) {
      this.logger.error('Session not found:', error.message);
      // Handle session not found
    }

    try {
      // Validate wrong organization
      const isValid = await this.sessionService.validateSession(
        'some_session',
        'wrong_org',
      );
      if (!isValid) {
        this.logger.warn('Session does not belong to organization');
      }
    } catch (error) {
      this.logger.error('Validation failed:', error.message);
    }
  }
}

/**
 * Example 6: Reusing Existing Sessions
 */
@Injectable()
export class ReuseSessionExample {
  private readonly logger = new Logger(ReuseSessionExample.name);

  constructor(
    private readonly sessionService: FinanzOnlineSessionService,
  ) {}

  async getOrCreateSession(organizationId: string): Promise<SessionInfo> {
    // Try to find existing active session
    const existing = await this.sessionService
      .findActiveSessionByOrganization(organizationId);

    if (existing) {
      this.logger.log('Reusing existing session');
      return {
        sessionId: existing.sessionId,
        teilnehmerId: existing.teilnehmerId,
        organizationId: existing.organizationId,
        createdAt: existing.createdAt,
        expiresAt: existing.expiresAt,
        isValid: true,
        remainingTime: Math.floor(
          (existing.expiresAt.getTime() - Date.now()) / 1000,
        ),
        environment: existing.environment,
        participantInfo: existing.participantInfo,
      };
    }

    // Create new session if none exists
    this.logger.log('Creating new session');
    return await this.sessionService.login({
      teilnehmerId: 'T123456789',
      benId: 'U987654321',
      pin: '1234',
      authType: FinanzOnlineAuthType.USER_PIN,
      organizationId,
      environment: FinanzOnlineEnvironment.TEST,
      autoRefresh: true,
    });
  }

  async example() {
    const session1 = await this.getOrCreateSession('org_demo_001');
    const session2 = await this.getOrCreateSession('org_demo_001'); // Reuses session1

    this.logger.log(`Same session: ${session1.sessionId === session2.sessionId}`);
  }
}

/**
 * Example 7: Cleanup and Maintenance
 */
@Injectable()
export class CleanupExample {
  private readonly logger = new Logger(CleanupExample.name);

  constructor(
    private readonly sessionService: FinanzOnlineSessionService,
  ) {}

  async runCleanup() {
    this.logger.log('Running session cleanup...');

    const cleanedCount = await this.sessionService.cleanupExpiredSessions();

    this.logger.log(`Cleaned up ${cleanedCount} expired sessions`);
  }

  // This could be run as a cron job
  // @Cron('0 */30 * * * *') // Every 30 minutes
  async scheduledCleanup() {
    await this.runCleanup();
  }
}

/**
 * Example 8: Production Usage Pattern
 */
@Injectable()
export class ProductionUsageExample {
  private readonly logger = new Logger(ProductionUsageExample.name);

  constructor(
    private readonly sessionService: FinanzOnlineSessionService,
  ) {}

  async submitVatReturn(organizationId: string, vatData: any) {
    let sessionInfo: SessionInfo;

    try {
      // 1. Get or create session
      const existingSession = await this.sessionService
        .findActiveSessionByOrganization(organizationId);

      if (existingSession) {
        // Validate session is still valid
        const isValid = await this.sessionService.validateSession(
          existingSession.sessionId,
          organizationId,
        );

        if (isValid) {
          sessionInfo = await this.sessionService.getSessionInfo(
            existingSession.sessionId,
          );
        } else {
          // Session expired, create new one
          sessionInfo = await this.createNewSession(organizationId);
        }
      } else {
        // No session exists, create new one
        sessionInfo = await this.createNewSession(organizationId);
      }

      // 2. Use session for VAT return submission
      this.logger.log(`Submitting VAT return with session ${sessionInfo.sessionId}`);
      // ... perform VAT submission using sessionInfo.sessionId

      // 3. Keep session alive for next operation
      await this.sessionService.keepAlive(sessionInfo.sessionId);

      return { success: true };

    } catch (error) {
      this.logger.error(`VAT return submission failed: ${error.message}`);
      throw error;
    }
  }

  private async createNewSession(organizationId: string): Promise<SessionInfo> {
    // In production, credentials would come from secure storage
    return await this.sessionService.login({
      teilnehmerId: process.env.FON_TEILNEHMER_ID!,
      benId: process.env.FON_BEN_ID!,
      pin: process.env.FON_PIN!,
      authType: FinanzOnlineAuthType.USER_PIN,
      organizationId,
      environment: FinanzOnlineEnvironment.PRODUCTION,
      autoRefresh: true,
    });
  }
}

/**
 * Example 9: Certificate Authentication
 */
@Injectable()
export class CertificateAuthExample {
  private readonly logger = new Logger(CertificateAuthExample.name);

  constructor(
    private readonly sessionService: FinanzOnlineSessionService,
  ) {}

  async example() {
    // Using certificate-based authentication
    const sessionInfo = await this.sessionService.login({
      teilnehmerId: 'T123456789',
      benId: 'U987654321',
      // No PIN needed for certificate auth
      authType: FinanzOnlineAuthType.CERTIFICATE,
      organizationId: 'org_demo_001',
      environment: FinanzOnlineEnvironment.TEST,
      herstellerId: 'OPERATE',
    });

    this.logger.log(`Certificate auth session: ${sessionInfo.sessionId}`);
  }
}

/**
 * Example 10: Testing Helper
 */
export class SessionTestHelper {
  static createMockCredentials(
    organizationId: string,
    overrides?: Partial<LoginCredentials>,
  ): LoginCredentials {
    return {
      teilnehmerId: 'T123456789',
      benId: 'U987654321',
      pin: '1234',
      authType: FinanzOnlineAuthType.USER_PIN,
      organizationId,
      environment: FinanzOnlineEnvironment.TEST,
      autoRefresh: true,
      ...overrides,
    };
  }

  static async createTestSession(
    service: FinanzOnlineSessionService,
    organizationId = 'test_org',
  ): Promise<SessionInfo> {
    const credentials = this.createMockCredentials(organizationId);
    return await service.login(credentials);
  }
}
