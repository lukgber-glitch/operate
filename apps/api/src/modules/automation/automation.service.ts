import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import {
  UpdateAutomationDto,
  AutomationMode,
} from './dto/update-automation.dto';
import {
  AutomationLogDto,
  AuditFilterDto,
  AutomationFeature,
} from './dto/automation-log.dto';

/**
 * Automation Service
 * Manages automation settings and decision logic
 */
@Injectable()
export class AutomationService {
  private readonly logger = new Logger(AutomationService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Get all automation settings for an organisation
   */
  async getSettings(orgId: string) {
    this.logger.log(`Getting automation settings for org: ${orgId}`);

    const org = await this.prisma.organisation.findUnique({
      where: { id: orgId },
    });

    if (!org) {
      throw new NotFoundException(`Organisation ${orgId} not found`);
    }

    // Get all settings from database
    const settingsRows = await this.prisma.automationSettings.findMany({
      where: { orgId },
    });

    const features = ['classification', 'expense', 'deduction', 'invoice'];
    const result: any = {};

    for (const feature of features) {
      const row = settingsRows.find((s) => s.feature === feature);

      if (row) {
        result[feature] = {
          enabled: row.enabled,
          mode: row.mode,
          confidenceThreshold: row.confidenceThreshold?.toNumber() || 0.9,
          amountThreshold: row.amountThreshold?.toNumber() || null,
        };
      } else {
        // Return defaults for missing features
        const defaults: any = {
          classification: { enabled: true, mode: AutomationMode.SEMI_AUTO, confidenceThreshold: 0.9, amountThreshold: null },
          expense: { enabled: true, mode: AutomationMode.SEMI_AUTO, confidenceThreshold: 0.85, amountThreshold: 50000 },
          deduction: { enabled: true, mode: AutomationMode.SEMI_AUTO, confidenceThreshold: 0.95, amountThreshold: 100000 },
          invoice: { enabled: true, mode: AutomationMode.MANUAL, confidenceThreshold: 0.95, amountThreshold: 100000 },
        };
        result[feature] = defaults[feature];
      }
    }

    return result;
  }

  /**
   * Get automation settings for a specific feature
   */
  async getSettingsByFeature(orgId: string, feature: string) {
    this.logger.log(
      `Getting automation settings for org: ${orgId}, feature: ${feature}`,
    );

    // Validate feature
    const validFeatures = ['classification', 'expense', 'deduction', 'invoice'];
    if (!validFeatures.includes(feature)) {
      throw new BadRequestException(
        `Invalid feature. Must be one of: ${validFeatures.join(', ')}`,
      );
    }

    const settings = await this.getSettings(orgId);
    return settings[feature];
  }

  /**
   * Update automation settings for a specific feature
   */
  async updateSettings(
    orgId: string,
    feature: string,
    dto: UpdateAutomationDto,
  ) {
    this.logger.log(
      `Updating automation settings for org: ${orgId}, feature: ${feature}`,
    );

    // Validate feature
    const validFeatures = ['classification', 'expense', 'deduction', 'invoice'];
    if (!validFeatures.includes(feature)) {
      throw new BadRequestException(
        `Invalid feature. Must be one of: ${validFeatures.join(', ')}`,
      );
    }

    const org = await this.prisma.organisation.findUnique({
      where: { id: orgId },
    });

    if (!org) {
      throw new NotFoundException(`Organisation ${orgId} not found`);
    }

    // Get current settings for this feature
    const currentSettings = await this.getSettingsByFeature(orgId, feature);

    // Merge with updates
    const updatedFeatureSettings = {
      ...currentSettings,
      ...dto,
    };

    // Upsert settings in database using compound unique key
    const result = await this.prisma.automationSettings.upsert({
      where: {
        orgId_feature: {
          orgId: orgId,
          feature: feature,
        },
      },
      create: {
        orgId: orgId,
        feature: feature,
        mode: updatedFeatureSettings.mode || AutomationMode.SEMI_AUTO,
        confidenceThreshold: updatedFeatureSettings.confidenceThreshold || null,
        amountThreshold: updatedFeatureSettings.amountThreshold || null,
        enabled: updatedFeatureSettings.enabled !== undefined ? updatedFeatureSettings.enabled : true,
      },
      update: {
        mode: updatedFeatureSettings.mode,
        confidenceThreshold: updatedFeatureSettings.confidenceThreshold,
        amountThreshold: updatedFeatureSettings.amountThreshold,
        enabled: updatedFeatureSettings.enabled,
        updatedAt: new Date(),
      },
    });

    this.logger.log(
      `Updated automation settings for org: ${orgId}, feature: ${feature}`,
    );

    return {
      enabled: result.enabled,
      mode: result.mode,
      confidenceThreshold: result.confidenceThreshold?.toNumber() || null,
      amountThreshold: result.amountThreshold?.toNumber() || null,
    };
  }

  /**
   * Determine if a transaction should be auto-approved
   */
  async shouldAutoApprove(
    orgId: string,
    feature: string,
    confidence: number,
    amount: number,
  ): Promise<boolean> {
    const settings = await this.getSettingsByFeature(orgId, feature);

    // If disabled or manual mode, never auto-approve
    if (!settings.enabled || settings.mode === AutomationMode.MANUAL) {
      return false;
    }

    // Check confidence threshold
    if (confidence < settings.confidenceThreshold) {
      this.logger.debug(
        `Confidence ${confidence} below threshold ${settings.confidenceThreshold}`,
      );
      return false;
    }

    // Check amount threshold if set
    if (
      settings.amountThreshold !== null &&
      amount > settings.amountThreshold
    ) {
      this.logger.debug(
        `Amount ${amount} above threshold ${settings.amountThreshold}`,
      );
      return false;
    }

    // For FULL_AUTO mode, auto-approve if thresholds met
    if (settings.mode === AutomationMode.FULL_AUTO) {
      return true;
    }

    // For SEMI_AUTO, return true (but UI should show for review)
    return true;
  }

  /**
   * Log an automation action
   */
  async logAutomationAction(data: AutomationLogDto) {
    this.logger.log(
      `Logging automation action: ${data.feature} - ${data.action}`,
    );

    return this.prisma.automationAuditLog.create({
      data: {
        orgId: data.organisationId,
        feature: data.feature,
        action: data.action,
        entityType: 'transaction',
        entityId: data.resourceId,
        confidence: data.confidence,
      },
    });
  }

  /**
   * Get audit log for automation actions
   */
  async getAuditLog(orgId: string, filters: AuditFilterDto) {
    this.logger.log(`Getting audit log for org: ${orgId}`);

    const org = await this.prisma.organisation.findUnique({
      where: { id: orgId },
    });

    if (!org) {
      throw new NotFoundException(`Organisation ${orgId} not found`);
    }

    const where: any = {
      orgId: orgId,
    };

    // Apply filters
    if (filters.feature) {
      where.feature = filters.feature;
    }

    if (filters.action) {
      where.action = filters.action;
    }

    if (filters.startDate || filters.endDate) {
      where.executedAt = {};
      if (filters.startDate) {
        where.executedAt.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        where.executedAt.lte = new Date(filters.endDate);
      }
    }

    // Pagination
    const page = filters.page || 1;
    const limit = Math.min(filters.limit || 20, 100);
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      this.prisma.automationAuditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          executedAt: 'desc',
        },
      }),
      this.prisma.automationAuditLog.count({ where }),
    ]);

    return {
      data: logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Test automation rules (dry run)
   */
  async testAutomationRules(
    orgId: string,
    feature: string,
    testData: { confidence: number; amount: number },
  ) {
    this.logger.log(
      `Testing automation rules for org: ${orgId}, feature: ${feature}`,
    );

    const settings = await this.getSettingsByFeature(orgId, feature);
    const shouldAutoApprove = await this.shouldAutoApprove(
      orgId,
      feature,
      testData.confidence,
      testData.amount,
    );

    return {
      settings,
      testData,
      result: {
        shouldAutoApprove,
        reasons: this.getDecisionReasons(
          settings,
          testData.confidence,
          testData.amount,
          shouldAutoApprove,
        ),
      },
    };
  }

  /**
   * Get reasons for automation decision
   */
  private getDecisionReasons(
    settings: any,
    confidence: number,
    amount: number,
    shouldAutoApprove: boolean,
  ): string[] {
    const reasons: string[] = [];

    if (!settings.enabled) {
      reasons.push('Automation is disabled for this feature');
    } else if (settings.mode === AutomationMode.MANUAL) {
      reasons.push('Feature is in manual mode');
    } else {
      if (confidence >= settings.confidenceThreshold) {
        reasons.push(
          `Confidence ${confidence} meets threshold ${settings.confidenceThreshold}`,
        );
      } else {
        reasons.push(
          `Confidence ${confidence} below threshold ${settings.confidenceThreshold}`,
        );
      }

      if (settings.amountThreshold !== null) {
        if (amount <= settings.amountThreshold) {
          reasons.push(
            `Amount ${amount} within threshold ${settings.amountThreshold}`,
          );
        } else {
          reasons.push(
            `Amount ${amount} exceeds threshold ${settings.amountThreshold}`,
          );
        }
      }

      if (shouldAutoApprove) {
        reasons.push(
          settings.mode === AutomationMode.FULL_AUTO
            ? 'Full auto mode - will be auto-approved'
            : 'Semi-auto mode - will be suggested for approval',
        );
      }
    }

    return reasons;
  }
}
