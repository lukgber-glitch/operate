import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { AutomationMode } from '@prisma/client';
import { AutomationSettingsService } from './automation-settings.service';

/**
 * Feature type for auto-approval
 */
type AutoApproveFeature = 'invoices' | 'expenses' | 'tax' | 'bankReconciliation';

/**
 * Auto-approval decision result
 */
interface AutoApproveDecision {
  autoApprove: boolean;
  reason: string;
}

/**
 * Auto-approval execution params
 */
interface ExecuteAutoApprovalParams {
  organisationId: string;
  feature: string;
  entityType: string;
  entityId: string;
  confidenceScore: number;
  inputData?: any;
}

/**
 * Log automation action params
 */
interface LogAutomationActionParams {
  organisationId: string;
  action: string;
  feature: string;
  mode: AutomationMode;
  entityType: string;
  entityId: string;
  confidenceScore?: number;
  wasAutoApproved: boolean;
  inputData?: any;
  outputData?: any;
  userId?: string;
}

/**
 * Auto-Approve Service
 * Workflow engine for auto-approval decisions
 */
@Injectable()
export class AutoApproveService {
  private readonly logger = new Logger(AutoApproveService.name);

  constructor(
    private prisma: PrismaService,
    private automationSettings: AutomationSettingsService,
  ) {}

  /**
   * Check if an item should be auto-approved based on settings
   *
   * Decision flow:
   * 1. Get automation settings for the feature
   * 2. Check if feature is in MANUAL mode -> no auto-approve
   * 3. Check confidence score against threshold
   * 4. Check amount against limit (if applicable)
   * 5. If FULL_AUTO -> auto-approve, if SEMI_AUTO -> suggest for approval
   */
  async shouldAutoApprove(params: {
    organisationId: string;
    feature: AutoApproveFeature;
    confidenceScore: number;
    amount?: number;
  }): Promise<AutoApproveDecision> {
    const { organisationId, feature, confidenceScore, amount } = params;

    this.logger.log(
      `Checking auto-approve for feature: ${feature}, confidence: ${confidenceScore}, amount: ${amount}`,
    );

    // Get settings for the organisation
    const settings = await this.automationSettings.getSettings(organisationId);
    const featureMode = await this.automationSettings.getFeatureMode(
      organisationId,
      feature,
    );

    // Check 1: Manual mode -> never auto-approve
    if (featureMode.mode === AutomationMode.MANUAL) {
      return {
        autoApprove: false,
        reason: `Feature '${feature}' is in MANUAL mode - requires manual review`,
      };
    }

    // Check 2: Confidence threshold
    const threshold = featureMode.confidenceThreshold;
    if (confidenceScore < threshold) {
      return {
        autoApprove: false,
        reason: `Confidence score ${confidenceScore}% is below threshold ${threshold}%`,
      };
    }

    // Check 3: Amount limit (if applicable and amount provided)
    if (
      amount !== undefined &&
      settings.maxAutoApproveAmount !== null &&
      amount > settings.maxAutoApproveAmount
    ) {
      return {
        autoApprove: false,
        reason: `Amount ${amount} exceeds max auto-approve limit ${settings.maxAutoApproveAmount}`,
      };
    }

    // Check 4: Mode determines final decision
    if (featureMode.mode === AutomationMode.FULL_AUTO) {
      return {
        autoApprove: true,
        reason: `FULL_AUTO mode: Confidence ${confidenceScore}% meets threshold ${threshold}% - auto-approved`,
      };
    }

    // SEMI_AUTO mode: suggest for approval (not auto-approve)
    return {
      autoApprove: false,
      reason: `SEMI_AUTO mode: Confidence ${confidenceScore}% meets threshold ${threshold}% - suggested for manual approval`,
    };
  }

  /**
   * Execute auto-approval for an entity
   * Creates an audit log entry for the action
   */
  async executeAutoApproval(params: ExecuteAutoApprovalParams) {
    const {
      organisationId,
      feature,
      entityType,
      entityId,
      confidenceScore,
      inputData,
    } = params;

    this.logger.log(
      `Executing auto-approval: ${entityType}/${entityId} for feature: ${feature}`,
    );

    // Get the feature mode to include in audit log
    const featureMode = await this.automationSettings.getFeatureMode(
      organisationId,
      feature as AutoApproveFeature,
    );

    // Check if should auto-approve
    const decision = await this.shouldAutoApprove({
      organisationId,
      feature: feature as AutoApproveFeature,
      confidenceScore,
      amount: inputData?.amount,
    });

    // Log the automation action
    const auditLog = await this.logAutomationAction({
      organisationId,
      action: decision.autoApprove ? 'AUTO_APPROVED' : 'SUGGESTED_FOR_REVIEW',
      feature,
      mode: featureMode.mode,
      entityType,
      entityId,
      confidenceScore,
      wasAutoApproved: decision.autoApprove,
      inputData: {
        ...inputData,
        decision: decision.reason,
      },
      outputData: {
        autoApproved: decision.autoApprove,
        timestamp: new Date().toISOString(),
      },
    });

    this.logger.log(
      `Auto-approval executed: ${decision.autoApprove ? 'APPROVED' : 'SUGGESTED'} - ${decision.reason}`,
    );

    return auditLog;
  }

  /**
   * Log automation action (for audit trail)
   * Creates an entry in AutomationAuditLog table
   */
  async logAutomationAction(params: LogAutomationActionParams) {
    const {
      organisationId,
      action,
      feature,
      mode,
      entityType,
      entityId,
      confidenceScore,
      wasAutoApproved,
      inputData,
      outputData,
      userId,
    } = params;

    this.logger.log(
      `Logging automation action: ${action} for ${entityType}/${entityId}`,
    );

    try {
      const auditLog = await this.prisma.automationAuditLog.create({
        data: {
          organisationId,
          action,
          feature,
          mode,
          entityType,
          entityId,
          confidenceScore: confidenceScore !== undefined ? confidenceScore : null,
          wasAutoApproved,
          inputData: inputData || null,
          outputData: outputData || null,
          userId: userId || null,
        },
      });

      this.logger.log(`Logged automation action: ${auditLog.id}`);

      return auditLog;
    } catch (error) {
      this.logger.error(
        `Failed to log automation action: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Get automation statistics for an organisation
   * Returns counts of auto-approved vs manual items
   */
  async getAutomationStats(
    organisationId: string,
    feature?: string,
    startDate?: Date,
    endDate?: Date,
  ) {
    this.logger.log(`Getting automation stats for org: ${organisationId}`);

    const where: any = {
      organisationId,
    };

    if (feature) {
      where.feature = feature;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = startDate;
      }
      if (endDate) {
        where.createdAt.lte = endDate;
      }
    }

    const [totalActions, autoApproved, suggested] = await Promise.all([
      this.prisma.automationAuditLog.count({ where }),
      this.prisma.automationAuditLog.count({
        where: { ...where, wasAutoApproved: true },
      }),
      this.prisma.automationAuditLog.count({
        where: { ...where, wasAutoApproved: false },
      }),
    ]);

    const autoApprovalRate =
      totalActions > 0 ? (autoApproved / totalActions) * 100 : 0;

    return {
      totalActions,
      autoApproved,
      suggested,
      autoApprovalRate: Math.round(autoApprovalRate * 100) / 100,
    };
  }

  /**
   * Get recent automation actions
   */
  async getRecentActions(
    organisationId: string,
    limit: number = 10,
    feature?: string,
  ) {
    this.logger.log(`Getting recent automation actions for org: ${organisationId}`);

    const where: any = {
      organisationId,
    };

    if (feature) {
      where.feature = feature;
    }

    const actions = await this.prisma.automationAuditLog.findMany({
      where,
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        action: true,
        feature: true,
        mode: true,
        entityType: true,
        entityId: true,
        confidenceScore: true,
        wasAutoApproved: true,
        createdAt: true,
      },
    });

    return actions;
  }
}
