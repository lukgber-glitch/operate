import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { AuditEntityType, AuditAction, AuditActorType } from '@prisma/client';

/**
 * Security Event Types
 */
export enum SecurityEventType {
  // Authentication Events
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILED = 'LOGIN_FAILED',
  LOGOUT = 'LOGOUT',
  SESSION_EXPIRED = 'SESSION_EXPIRED',

  // MFA Events
  MFA_ENABLED = 'MFA_ENABLED',
  MFA_DISABLED = 'MFA_DISABLED',
  MFA_SUCCESS = 'MFA_SUCCESS',
  MFA_FAILED = 'MFA_FAILED',

  // Password Events
  PASSWORD_CHANGED = 'PASSWORD_CHANGED',
  PASSWORD_RESET_REQUESTED = 'PASSWORD_RESET_REQUESTED',
  PASSWORD_RESET_COMPLETED = 'PASSWORD_RESET_COMPLETED',

  // Permission Events
  ROLE_CHANGED = 'ROLE_CHANGED',
  PERMISSION_GRANTED = 'PERMISSION_GRANTED',
  PERMISSION_REVOKED = 'PERMISSION_REVOKED',

  // Access Events
  SENSITIVE_DATA_ACCESS = 'SENSITIVE_DATA_ACCESS',
  BULK_EXPORT = 'BULK_EXPORT',

  // API Events
  API_KEY_CREATED = 'API_KEY_CREATED',
  API_KEY_REVOKED = 'API_KEY_REVOKED',
  API_KEY_USED = 'API_KEY_USED',

  // Suspicious Activity
  MULTIPLE_FAILED_LOGINS = 'MULTIPLE_FAILED_LOGINS',
  UNUSUAL_ACCESS_PATTERN = 'UNUSUAL_ACCESS_PATTERN',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  ACCOUNT_UNLOCKED = 'ACCOUNT_UNLOCKED',
}

/**
 * Security Audit Log Entry
 */
export interface SecurityAuditLog {
  id: string;
  timestamp: Date;
  userId?: string;
  organisationId?: string;
  eventType: SecurityEventType;
  action: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  success: boolean;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Security Audit Service
 *
 * Comprehensive security event logging for:
 * - Authentication attempts (success/failure)
 * - Password changes
 * - Permission changes
 * - Sensitive data access
 * - API key usage
 * - MFA events
 *
 * Uses the existing AuditLog table with entityType=USER for security events
 */
@Injectable()
export class SecurityAuditService {
  private readonly logger = new Logger(SecurityAuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Log authentication attempt
   */
  async logLoginAttempt(params: {
    userId?: string;
    email: string;
    success: boolean;
    ipAddress?: string;
    userAgent?: string;
    reason?: string;
    mfaRequired?: boolean;
  }) {
    const eventType = params.success
      ? SecurityEventType.LOGIN_SUCCESS
      : SecurityEventType.LOGIN_FAILED;

    const riskLevel = params.success ? 'low' : 'medium';

    this.logger.log(
      `Login attempt: ${params.email} - ${params.success ? 'SUCCESS' : 'FAILED'} from ${params.ipAddress}`,
    );

    // Use the user's first organisation if available
    let organisationId: string | undefined;
    if (params.userId) {
      const membership = await this.prisma.membership.findFirst({
        where: { userId: params.userId },
        select: { orgId: true },
      });
      organisationId = membership?.orgId;
    }

    return this.createSecurityLog({
      userId: params.userId,
      organisationId,
      entityId: params.userId || params.email,
      eventType,
      action: params.success ? 'LOGIN_SUCCESS' : 'LOGIN_FAILED',
      success: params.success,
      riskLevel,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      metadata: {
        email: params.email,
        reason: params.reason,
        mfaRequired: params.mfaRequired,
      },
    });
  }

  /**
   * Log logout event
   */
  async logLogout(params: {
    userId: string;
    organisationId?: string;
    ipAddress?: string;
    userAgent?: string;
    allDevices?: boolean;
  }) {
    this.logger.log(`Logout: User ${params.userId} ${params.allDevices ? '(all devices)' : ''}`);

    return this.createSecurityLog({
      userId: params.userId,
      organisationId: params.organisationId,
      entityId: params.userId,
      eventType: SecurityEventType.LOGOUT,
      action: 'LOGOUT',
      success: true,
      riskLevel: 'low',
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      metadata: {
        allDevices: params.allDevices,
      },
    });
  }

  /**
   * Log MFA event
   */
  async logMfaEvent(params: {
    userId: string;
    organisationId?: string;
    eventType: SecurityEventType.MFA_ENABLED | SecurityEventType.MFA_DISABLED | SecurityEventType.MFA_SUCCESS | SecurityEventType.MFA_FAILED;
    success: boolean;
    ipAddress?: string;
    userAgent?: string;
    metadata?: Record<string, any>;
  }) {
    this.logger.log(`MFA Event: ${params.eventType} for user ${params.userId}`);

    const riskLevel = params.eventType === SecurityEventType.MFA_DISABLED ? 'high' : 'low';

    return this.createSecurityLog({
      userId: params.userId,
      organisationId: params.organisationId,
      entityId: params.userId,
      eventType: params.eventType,
      action: params.eventType,
      success: params.success,
      riskLevel,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      metadata: params.metadata,
    });
  }

  /**
   * Log password change
   */
  async logPasswordChange(params: {
    userId: string;
    organisationId?: string;
    changeType: 'set' | 'change' | 'reset';
    ipAddress?: string;
    userAgent?: string;
  }) {
    this.logger.log(`Password ${params.changeType}: User ${params.userId}`);

    return this.createSecurityLog({
      userId: params.userId,
      organisationId: params.organisationId,
      entityId: params.userId,
      eventType: SecurityEventType.PASSWORD_CHANGED,
      action: `PASSWORD_${params.changeType.toUpperCase()}`,
      success: true,
      riskLevel: 'medium',
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      metadata: {
        changeType: params.changeType,
      },
    });
  }

  /**
   * Log password reset request
   */
  async logPasswordResetRequest(params: {
    email: string;
    ipAddress?: string;
    userAgent?: string;
  }) {
    this.logger.log(`Password reset requested: ${params.email}`);

    return this.createSecurityLog({
      entityId: params.email,
      eventType: SecurityEventType.PASSWORD_RESET_REQUESTED,
      action: 'PASSWORD_RESET_REQUEST',
      success: true,
      riskLevel: 'medium',
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      metadata: {
        email: params.email,
      },
    });
  }

  /**
   * Log permission change
   */
  async logPermissionChange(params: {
    userId: string;
    organisationId: string;
    targetUserId: string;
    changeType: 'role_changed' | 'permission_granted' | 'permission_revoked';
    previousRole?: string;
    newRole?: string;
    permission?: string;
    ipAddress?: string;
    userAgent?: string;
  }) {
    this.logger.log(
      `Permission change: ${params.changeType} for user ${params.targetUserId} by ${params.userId}`,
    );

    return this.createSecurityLog({
      userId: params.userId,
      organisationId: params.organisationId,
      entityId: params.targetUserId,
      eventType: SecurityEventType.ROLE_CHANGED,
      action: params.changeType.toUpperCase(),
      success: true,
      riskLevel: 'high',
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      metadata: {
        targetUserId: params.targetUserId,
        previousRole: params.previousRole,
        newRole: params.newRole,
        permission: params.permission,
      },
    });
  }

  /**
   * Log sensitive data access
   */
  async logSensitiveDataAccess(params: {
    userId: string;
    organisationId: string;
    dataType: string;
    entityId: string;
    ipAddress?: string;
    userAgent?: string;
    metadata?: Record<string, any>;
  }) {
    this.logger.debug(
      `Sensitive data access: ${params.dataType} ${params.entityId} by user ${params.userId}`,
    );

    return this.createSecurityLog({
      userId: params.userId,
      organisationId: params.organisationId,
      entityId: params.entityId,
      eventType: SecurityEventType.SENSITIVE_DATA_ACCESS,
      action: 'DATA_ACCESS',
      success: true,
      riskLevel: 'low',
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      metadata: {
        ...params.metadata,
        dataType: params.dataType,
      },
    });
  }

  /**
   * Log API key event
   */
  async logApiKeyEvent(params: {
    userId: string;
    organisationId: string;
    eventType: SecurityEventType.API_KEY_CREATED | SecurityEventType.API_KEY_REVOKED | SecurityEventType.API_KEY_USED;
    apiKeyId?: string;
    ipAddress?: string;
    userAgent?: string;
    metadata?: Record<string, any>;
  }) {
    this.logger.log(`API Key event: ${params.eventType} by user ${params.userId}`);

    const riskLevel = params.eventType === SecurityEventType.API_KEY_CREATED ? 'medium' : 'low';

    return this.createSecurityLog({
      userId: params.userId,
      organisationId: params.organisationId,
      entityId: params.apiKeyId || params.userId,
      eventType: params.eventType,
      action: params.eventType,
      success: true,
      riskLevel,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      metadata: params.metadata,
    });
  }

  /**
   * Log suspicious activity
   */
  async logSuspiciousActivity(params: {
    userId?: string;
    organisationId?: string;
    eventType: SecurityEventType;
    description: string;
    ipAddress?: string;
    userAgent?: string;
    metadata?: Record<string, any>;
  }) {
    this.logger.warn(
      `SUSPICIOUS ACTIVITY: ${params.eventType} - ${params.description}`,
    );

    return this.createSecurityLog({
      userId: params.userId,
      organisationId: params.organisationId,
      entityId: params.userId || 'unknown',
      eventType: params.eventType,
      action: 'SUSPICIOUS_ACTIVITY',
      success: false,
      riskLevel: 'critical',
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      metadata: {
        ...params.metadata,
        description: params.description,
      },
    });
  }

  /**
   * Get security audit trail for a user
   */
  async getUserSecurityAuditTrail(
    userId: string,
    limit = 100,
  ): Promise<SecurityAuditLog[]> {
    const logs = await this.prisma.auditLog.findMany({
      where: {
        entityType: AuditEntityType.USER,
        actorId: userId,
      },
      orderBy: {
        timestamp: 'desc',
      },
      take: limit,
    });

    return logs.map(this.mapToSecurityAuditLog);
  }

  /**
   * Get recent security events for organization
   */
  async getOrganizationSecurityEvents(
    organisationId: string,
    limit = 100,
  ): Promise<SecurityAuditLog[]> {
    const logs = await this.prisma.auditLog.findMany({
      where: {
        tenantId: organisationId,
        entityType: AuditEntityType.USER,
      },
      orderBy: {
        timestamp: 'desc',
      },
      take: limit,
    });

    return logs.map(this.mapToSecurityAuditLog);
  }

  /**
   * Detect multiple failed login attempts
   */
  async detectFailedLoginAttempts(
    email: string,
    timeWindowMinutes = 15,
  ): Promise<{ count: number; shouldLock: boolean }> {
    const since = new Date(Date.now() - timeWindowMinutes * 60 * 1000);

    const failedLogins = await this.prisma.auditLog.count({
      where: {
        entityType: AuditEntityType.USER,
        entityId: email,
        action: AuditAction.CREATE,
        timestamp: { gte: since },
        metadata: {
          path: ['eventType'],
          equals: SecurityEventType.LOGIN_FAILED,
        },
      },
    });

    const shouldLock = failedLogins >= 5; // Lock after 5 failed attempts

    if (shouldLock) {
      this.logger.warn(
        `SECURITY ALERT: ${failedLogins} failed login attempts for ${email} in ${timeWindowMinutes} minutes`,
      );
    }

    return {
      count: failedLogins,
      shouldLock,
    };
  }

  /**
   * Create security audit log entry
   */
  private async createSecurityLog(params: {
    userId?: string;
    organisationId?: string;
    entityId: string;
    eventType: SecurityEventType;
    action: string;
    success: boolean;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    ipAddress?: string;
    userAgent?: string;
    metadata?: Record<string, any>;
  }) {
    try {
      // If we have userId but no organisationId, try to find it
      let tenantId = params.organisationId;
      if (!tenantId && params.userId) {
        const membership = await this.prisma.membership.findFirst({
          where: { userId: params.userId },
          select: { orgId: true },
        });
        tenantId = membership?.orgId;
      }

      // Security logs require a tenant ID for proper isolation
      if (!tenantId) {
        this.logger.warn(
          `Security log without tenant ID: ${params.eventType} for ${params.entityId}`,
        );
        // We'll use a special "system" tenant for global security events
        tenantId = 'system';
      }

      const auditLog = await this.prisma.auditLog.create({
        data: {
          tenantId,
          entityType: AuditEntityType.USER,
          entityId: params.entityId,
          action: AuditAction.CREATE, // All security events are CREATE actions
          actorType: params.userId ? AuditActorType.USER : AuditActorType.SYSTEM,
          actorId: params.userId,
          ipAddress: params.ipAddress,
          userAgent: params.userAgent,
          metadata: {
            eventType: params.eventType,
            success: params.success,
            riskLevel: params.riskLevel,
            ...params.metadata,
          },
          // Hash chain fields (simplified - not implementing full chain for security logs)
          hash: '',
          previousHash: null,
        },
      });

      return this.mapToSecurityAuditLog(auditLog);
    } catch (error) {
      this.logger.error(
        `Failed to create security log: ${error.message}`,
        error.stack,
      );
      // Don't throw - logging should not break operations
      return null;
    }
  }

  /**
   * Map AuditLog to SecurityAuditLog
   */
  private mapToSecurityAuditLog(log: any): SecurityAuditLog {
    const metadata = log.metadata as Record<string, any>;

    return {
      id: log.id,
      timestamp: log.timestamp,
      userId: log.actorId,
      organisationId: log.tenantId !== 'system' ? log.tenantId : undefined,
      eventType: metadata?.eventType || SecurityEventType.SENSITIVE_DATA_ACCESS,
      action: log.action,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      metadata,
      success: metadata?.success ?? true,
      riskLevel: metadata?.riskLevel || 'low',
    };
  }
}
