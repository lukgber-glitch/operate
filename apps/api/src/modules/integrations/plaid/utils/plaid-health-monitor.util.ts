import { Logger } from '@nestjs/common';

/**
 * Plaid Connection Health Monitor
 * Monitors connection health and provides proactive alerts
 */
export class PlaidHealthMonitor {
  private static readonly logger = new Logger(PlaidHealthMonitor.name);

  /**
   * Health status levels
   */
  static readonly HealthStatus = {
    HEALTHY: 'HEALTHY',
    WARNING: 'WARNING',
    CRITICAL: 'CRITICAL',
    UNKNOWN: 'UNKNOWN',
  } as const;

  /**
   * Analyze connection health and return status with recommendations
   */
  static analyzeHealth(params: {
    healthy: boolean;
    lastSync?: Date;
    error?: string;
    errorCode?: string;
    needsReauth: boolean;
  }): {
    status: string;
    severity: 'info' | 'warning' | 'error';
    message: string;
    actionRequired: boolean;
    recommendations: string[];
  } {
    const { healthy, lastSync, error, errorCode, needsReauth } = params;

    // Critical: Needs re-authentication
    if (needsReauth) {
      return {
        status: this.HealthStatus.CRITICAL,
        severity: 'error',
        message: 'Bank connection requires re-authentication',
        actionRequired: true,
        recommendations: [
          'User must re-authenticate their bank account',
          'Send notification to user with re-auth link',
          'Disable automatic syncs until re-authenticated',
          'Show banner in user interface',
        ],
      };
    }

    // Critical: Connection error
    if (!healthy && error) {
      const criticalErrors = [
        'INSTITUTION_NOT_RESPONDING',
        'INSTITUTION_DOWN',
        'INVALID_CREDENTIALS',
        'ITEM_LOCKED',
      ];

      if (errorCode && criticalErrors.includes(errorCode)) {
        return {
          status: this.HealthStatus.CRITICAL,
          severity: 'error',
          message: `Bank connection error: ${error}`,
          actionRequired: true,
          recommendations: this.getErrorRecommendations(errorCode),
        };
      }

      return {
        status: this.HealthStatus.WARNING,
        severity: 'warning',
        message: `Connection issue: ${error}`,
        actionRequired: true,
        recommendations: [
          'Check Plaid status page for known issues',
          'Retry connection after 5 minutes',
          'Contact support if issue persists',
        ],
      };
    }

    // Warning: No recent sync
    if (lastSync) {
      const daysSinceSync = this.getDaysSince(lastSync);

      if (daysSinceSync > 7) {
        return {
          status: this.HealthStatus.WARNING,
          severity: 'warning',
          message: `No sync in ${daysSinceSync} days`,
          actionRequired: true,
          recommendations: [
            'Trigger manual sync to check connection',
            'Verify webhook configuration',
            'Check if background job is running',
          ],
        };
      }

      if (daysSinceSync > 3) {
        return {
          status: this.HealthStatus.WARNING,
          severity: 'warning',
          message: `Last sync was ${daysSinceSync} days ago`,
          actionRequired: false,
          recommendations: [
            'Monitor sync frequency',
            'Consider triggering manual sync',
          ],
        };
      }
    }

    // Healthy
    if (healthy) {
      return {
        status: this.HealthStatus.HEALTHY,
        severity: 'info',
        message: 'Connection is healthy',
        actionRequired: false,
        recommendations: [],
      };
    }

    // Unknown state
    return {
      status: this.HealthStatus.UNKNOWN,
      severity: 'warning',
      message: 'Connection status unknown',
      actionRequired: true,
      recommendations: [
        'Check connection configuration',
        'Verify access token is valid',
        'Test connection with Plaid API',
      ],
    };
  }

  /**
   * Get error-specific recommendations
   */
  private static getErrorRecommendations(errorCode: string): string[] {
    const recommendations: Record<string, string[]> = {
      ITEM_LOGIN_REQUIRED: [
        'User must re-authenticate with their bank',
        'Send email notification with re-auth link',
        'Disable sync until re-authenticated',
      ],
      INVALID_CREDENTIALS: [
        'User entered wrong credentials',
        'Prompt user to update credentials',
        'Provide bank-specific help',
      ],
      INSTITUTION_NOT_RESPONDING: [
        'Bank API is temporarily unavailable',
        'Retry automatically after 10 minutes',
        'Check Plaid status page for updates',
        'Notify user if issue persists > 1 hour',
      ],
      INSTITUTION_DOWN: [
        'Bank is down for maintenance',
        'Check bank status page',
        'Retry after 30 minutes',
        'Subscribe to Plaid status updates',
      ],
      ITEM_LOCKED: [
        'User account is locked at bank level',
        'User must contact their bank',
        'Cannot be resolved through Plaid',
      ],
      RATE_LIMIT_EXCEEDED: [
        'Too many API requests',
        'Wait before retrying',
        'Review rate limiting implementation',
        'Consider implementing request queuing',
      ],
      PRODUCT_NOT_READY: [
        'Bank data still being processed',
        'Normal for new connections',
        'Retry after 5 minutes',
        'Should resolve within 30 minutes',
      ],
    };

    return recommendations[errorCode] || [
      'Review error details in logs',
      'Check Plaid documentation',
      'Contact Plaid support if needed',
    ];
  }

  /**
   * Calculate days since a date
   */
  private static getDaysSince(date: Date): number {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  /**
   * Determine if notification should be sent to user
   */
  static shouldNotifyUser(params: {
    healthy: boolean;
    errorCode?: string;
    lastSync?: Date;
    lastNotificationSent?: Date;
  }): boolean {
    const { healthy, errorCode, lastSync, lastNotificationSent } = params;

    // Don't spam notifications - wait at least 24 hours
    if (lastNotificationSent) {
      const hoursSinceNotification = this.getHoursSince(lastNotificationSent);
      if (hoursSinceNotification < 24) {
        return false;
      }
    }

    // Critical errors: notify immediately
    const criticalErrors = [
      'ITEM_LOGIN_REQUIRED',
      'INVALID_CREDENTIALS',
      'ITEM_LOCKED',
      'USER_PERMISSION_REVOKED',
    ];

    if (errorCode && criticalErrors.includes(errorCode)) {
      return true;
    }

    // Long sync gap: notify after 7 days
    if (lastSync && this.getDaysSince(lastSync) > 7) {
      return true;
    }

    return false;
  }

  /**
   * Get hours since a date
   */
  private static getHoursSince(date: Date): number {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    return Math.floor(diff / (1000 * 60 * 60));
  }

  /**
   * Format health check result for logging
   */
  static formatHealthLog(
    itemId: string,
    health: {
      healthy: boolean;
      lastSync?: Date;
      error?: string;
      errorCode?: string;
      needsReauth: boolean;
    },
  ): string {
    const analysis = this.analyzeHealth(health);
    return [
      `Item: ${itemId}`,
      `Status: ${analysis.status}`,
      `Message: ${analysis.message}`,
      `Action Required: ${analysis.actionRequired}`,
      health.lastSync ? `Last Sync: ${health.lastSync.toISOString()}` : '',
      health.errorCode ? `Error Code: ${health.errorCode}` : '',
    ]
      .filter(Boolean)
      .join(' | ');
  }

  /**
   * Batch health check results
   */
  static summarizeHealthChecks(
    results: Array<{
      itemId: string;
      healthy: boolean;
      errorCode?: string;
      needsReauth: boolean;
    }>,
  ): {
    total: number;
    healthy: number;
    needsReauth: number;
    errors: number;
    healthPercentage: number;
  } {
    const summary = {
      total: results.length,
      healthy: results.filter((r) => r.healthy).length,
      needsReauth: results.filter((r) => r.needsReauth).length,
      errors: results.filter((r) => !r.healthy && r.errorCode).length,
      healthPercentage: 0,
    };

    summary.healthPercentage =
      summary.total > 0
        ? Math.round((summary.healthy / summary.total) * 100)
        : 0;

    return summary;
  }
}
