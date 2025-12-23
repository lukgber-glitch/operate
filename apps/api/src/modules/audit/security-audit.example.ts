/**
 * Security Audit Service - Usage Examples
 *
 * This file demonstrates how to integrate the SecurityAuditService
 * into your authentication and authorization flows.
 */

import { UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { SecurityAuditService, SecurityEventType } from './security-audit.service';

/**
 * Example 1: Logging Login Attempts
 *
 * Integrate this into your AuthService or AuthController
 */
export class AuthServiceExample {
  constructor(private readonly securityAudit: SecurityAuditService) {}

  async login(email: string, password: string, req: Request) {
    try {
      // Validate credentials (your existing logic)
      const user = await this.validateCredentials(email, password);

      if (!user) {
        // Log failed login
        await this.securityAudit.logLoginAttempt({
          email,
          success: false,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
          reason: 'Invalid credentials',
        });

        throw new UnauthorizedException('Invalid credentials');
      }

      // Check for multiple failed attempts
      const failedAttempts = await this.securityAudit.detectFailedLoginAttempts(email, 15);

      if (failedAttempts.shouldLock) {
        // Lock account and log suspicious activity
        await this.securityAudit.logSuspiciousActivity({
          userId: user.id,
          eventType: SecurityEventType.MULTIPLE_FAILED_LOGINS,
          description: `${failedAttempts.count} failed login attempts in 15 minutes`,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        });

        throw new UnauthorizedException('Account temporarily locked due to multiple failed attempts');
      }

      // Log successful login
      await this.securityAudit.logLoginAttempt({
        userId: user.id,
        email,
        success: true,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        mfaRequired: user.mfaEnabled,
      });

      return { user, token: '...' };
    } catch (error) {
      throw error;
    }
  }

  async logout(userId: string, req: Request, allDevices = false) {
    // Your logout logic...

    // Log logout event
    await this.securityAudit.logLogout({
      userId,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      allDevices,
    });
  }

  private async validateCredentials(email: string, password: string) {
    // Your validation logic...
    return null;
  }
}

/**
 * Example 2: Logging MFA Events
 *
 * Integrate this into your MfaService
 */
export class MfaServiceExample {
  constructor(private readonly securityAudit: SecurityAuditService) {}

  async enableMfa(userId: string, req: Request) {
    // Your MFA setup logic...

    // Log MFA enabled
    await this.securityAudit.logMfaEvent({
      userId,
      eventType: SecurityEventType.MFA_ENABLED,
      success: true,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      metadata: {
        method: 'totp',
      },
    });
  }

  async disableMfa(userId: string, req: Request) {
    // Your MFA disable logic...

    // Log MFA disabled (high risk!)
    await this.securityAudit.logMfaEvent({
      userId,
      eventType: SecurityEventType.MFA_DISABLED,
      success: true,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      metadata: {
        reason: 'User requested',
      },
    });
  }

  async verifyMfaCode(userId: string, code: string, req: Request) {
    const isValid = await this.validateMfaCode(userId, code);

    // Log verification attempt
    await this.securityAudit.logMfaEvent({
      userId,
      eventType: isValid ? SecurityEventType.MFA_SUCCESS : SecurityEventType.MFA_FAILED,
      success: isValid,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return isValid;
  }

  private async validateMfaCode(userId: string, code: string): Promise<boolean> {
    // Your validation logic...
    return true;
  }
}

/**
 * Example 3: Logging Password Changes
 *
 * Integrate this into your password management endpoints
 */
export class PasswordServiceExample {
  constructor(private readonly securityAudit: SecurityAuditService) {}

  async changePassword(userId: string, oldPassword: string, newPassword: string, req: Request) {
    // Your password change logic...

    // Log password change
    await this.securityAudit.logPasswordChange({
      userId,
      changeType: 'change',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
  }

  async resetPassword(token: string, newPassword: string, req: Request) {
    // Validate reset token and update password...
    const userId = await this.getUserFromResetToken(token);

    // Log password reset
    await this.securityAudit.logPasswordChange({
      userId,
      changeType: 'reset',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
  }

  async requestPasswordReset(email: string, req: Request) {
    // Send reset email...

    // Log reset request
    await this.securityAudit.logPasswordResetRequest({
      email,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
  }

  private async getUserFromResetToken(token: string): Promise<string> {
    // Your logic...
    return 'user-id';
  }
}

/**
 * Example 4: Logging Permission Changes
 *
 * Integrate this into your RBAC/permissions system
 */
export class PermissionsServiceExample {
  constructor(private readonly securityAudit: SecurityAuditService) {}

  async changeUserRole(
    actorUserId: string,
    targetUserId: string,
    organisationId: string,
    newRole: string,
    req: Request,
  ) {
    // Get current role
    const currentRole = await this.getCurrentRole(targetUserId, organisationId);

    // Update role...

    // Log permission change
    await this.securityAudit.logPermissionChange({
      userId: actorUserId,
      organisationId,
      targetUserId,
      changeType: 'role_changed',
      previousRole: currentRole,
      newRole,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
  }

  private async getCurrentRole(userId: string, orgId: string): Promise<string> {
    // Your logic...
    return 'MEMBER';
  }
}

/**
 * Example 5: Logging Sensitive Data Access
 *
 * Integrate this into controllers that access financial data
 */
export class FinancialDataControllerExample {
  constructor(private readonly securityAudit: SecurityAuditService) {}

  async getBankAccountDetails(userId: string, accountId: string, organisationId: string, req: Request) {
    // Get bank account data...

    // Log sensitive data access
    await this.securityAudit.logSensitiveDataAccess({
      userId,
      organisationId,
      dataType: 'bank_account',
      entityId: accountId,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      metadata: {
        action: 'view_details',
      },
    });

    return { accountNumber: '****1234', balance: 10000 };
  }

  async exportTransactions(userId: string, organisationId: string, req: Request) {
    // Generate export...

    // Log export (high risk for data exfiltration)
    await this.securityAudit.logSensitiveDataAccess({
      userId,
      organisationId,
      dataType: 'transactions_export',
      entityId: 'bulk',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      metadata: {
        action: 'export',
        format: 'csv',
        recordCount: 1500,
      },
    });

    return { downloadUrl: '...' };
  }
}

/**
 * Example 6: Logging API Key Events
 *
 * Integrate this into your API key management system
 */
export class ApiKeyServiceExample {
  constructor(private readonly securityAudit: SecurityAuditService) {}

  async createApiKey(userId: string, organisationId: string, name: string, req: Request) {
    // Generate API key...
    const apiKey = { id: 'key-123', key: 'sk_live_...' };

    // Log API key creation
    await this.securityAudit.logApiKeyEvent({
      userId,
      organisationId,
      eventType: SecurityEventType.API_KEY_CREATED,
      apiKeyId: apiKey.id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      metadata: {
        name,
        permissions: ['read', 'write'],
      },
    });

    return apiKey;
  }

  async revokeApiKey(userId: string, organisationId: string, apiKeyId: string, req: Request) {
    // Revoke API key...

    // Log revocation
    await this.securityAudit.logApiKeyEvent({
      userId,
      organisationId,
      eventType: SecurityEventType.API_KEY_REVOKED,
      apiKeyId,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
  }

  async logApiKeyUsage(apiKeyId: string, organisationId: string, req: Request) {
    // This would be called from API middleware

    await this.securityAudit.logApiKeyEvent({
      userId: undefined, // API key usage doesn't have a userId
      organisationId,
      eventType: SecurityEventType.API_KEY_USED,
      apiKeyId,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      metadata: {
        endpoint: req.url,
        method: req.method,
      },
    });
  }
}

/**
 * Example 7: Querying Security Events
 *
 * For security dashboards and compliance reporting
 */
export class SecurityDashboardServiceExample {
  constructor(private readonly securityAudit: SecurityAuditService) {}

  async getUserSecurityHistory(userId: string) {
    // Get last 100 security events for a user
    const events = await this.securityAudit.getUserSecurityAuditTrail(userId, 100);

    return events;
  }

  async getOrganizationSecurityEvents(organisationId: string) {
    // Get last 100 security events for the organization
    const events = await this.securityAudit.getOrganizationSecurityEvents(organisationId, 100);

    // Filter by risk level
    const criticalEvents = events.filter(e => e.riskLevel === 'critical');
    const highRiskEvents = events.filter(e => e.riskLevel === 'high');

    return {
      all: events,
      critical: criticalEvents,
      highRisk: highRiskEvents,
    };
  }

  async checkForSuspiciousActivity(userId: string, email: string) {
    // Check failed login attempts
    const failedLogins = await this.securityAudit.detectFailedLoginAttempts(email, 60);

    if (failedLogins.shouldLock) {
      // Send alert to security team
      console.log(`SECURITY ALERT: User ${email} has ${failedLogins.count} failed login attempts`);
    }

    return failedLogins;
  }
}

/**
 * Example 8: Integration with Guards/Interceptors
 *
 * Automatically log certain actions
 */
export class SecurityLoggingInterceptor {
  constructor(private readonly securityAudit: SecurityAuditService) {}

  async intercept(context: any, next: any) {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const organisationId = request.organisationId;

    // Check if this is a sensitive endpoint
    const isSensitive = this.isSensitiveEndpoint(request.url);

    if (isSensitive && user) {
      // Log access to sensitive data
      await this.securityAudit.logSensitiveDataAccess({
        userId: user.id,
        organisationId,
        dataType: this.extractDataType(request.url),
        entityId: this.extractEntityId(request.params),
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'],
        metadata: {
          endpoint: request.url,
          method: request.method,
        },
      });
    }

    return next.handle();
  }

  private isSensitiveEndpoint(url: string): boolean {
    const sensitivePatterns = [
      '/api/bank-accounts',
      '/api/transactions',
      '/api/invoices',
      '/api/expenses',
    ];
    return sensitivePatterns.some(pattern => url.includes(pattern));
  }

  private extractDataType(url: string): string {
    if (url.includes('/bank-accounts')) return 'bank_account';
    if (url.includes('/transactions')) return 'transaction';
    if (url.includes('/invoices')) return 'invoice';
    return 'unknown';
  }

  private extractEntityId(params: any): string {
    return params.id || 'unknown';
  }
}
