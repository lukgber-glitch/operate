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

    // Get or create settings from database
    let settings = await this.prisma.automationSettings.findUnique({
      where: { organisationId: orgId },
    });

    if (!settings) {
      // Create default settings
      settings = await this.prisma.automationSettings.create({
        data: {
          orgId: orgId,
          organisation: { connect: { id: orgId } },
          invoiceCreation: AutomationMode.SEMI_AUTO,
          expenseApproval: AutomationMode.SEMI_AUTO,
          bankReconciliation: AutomationMode.SEMI_AUTO,
          taxClassification: AutomationMode.SEMI_AUTO,
          paymentReminders: AutomationMode.SEMI_AUTO,
          invoiceConfidenceThreshold: 85,
          expenseConfidenceThreshold: 80,
          taxConfidenceThreshold: 90,
        },
      });
    }

    // Map to feature-based response format
    const result: any = {
      invoice: {
        mode: settings.invoiceCreation,
        confidenceThreshold: settings.invoiceConfidenceThreshold / 100,
        amountThreshold: settings.maxAutoApproveAmount?.toNumber() || null,
      },
      expense: {
        mode: settings.expenseApproval,
        confidenceThreshold: settings.expenseConfidenceThreshold / 100,
        amountThreshold: settings.maxAutoApproveAmount?.toNumber() || null,
      },
      classification: {
        mode: settings.taxClassification,
        confidenceThreshold: settings.taxConfidenceThreshold / 100,
        amountThreshold: null,
      },
      deduction: {
        mode: settings.taxClassification,
        confidenceThreshold: settings.taxConfidenceThreshold / 100,
        amountThreshold: null,
      },
    };

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

    // Map feature to database fields
    const updateData: any = {};

    if (feature === 'invoice') {
      if (dto.mode !== undefined) updateData.invoiceCreation = dto.mode;
      if (dto.confidenceThreshold !== undefined) {
        updateData.invoiceConfidenceThreshold = Math.round(dto.confidenceThreshold * 100);
      }
    } else if (feature === 'expense') {
      if (dto.mode !== undefined) updateData.expenseApproval = dto.mode;
      if (dto.confidenceThreshold !== undefined) {
        updateData.expenseConfidenceThreshold = Math.round(dto.confidenceThreshold * 100);
      }
    } else if (feature === 'classification' || feature === 'deduction') {
      if (dto.mode !== undefined) updateData.taxClassification = dto.mode;
      if (dto.confidenceThreshold !== undefined) {
        updateData.taxConfidenceThreshold = Math.round(dto.confidenceThreshold * 100);
      }
    }

    if (dto.amountThreshold !== undefined) {
      updateData.maxAutoApproveAmount = dto.amountThreshold;
    }

    // Upsert settings in database
    const result = await this.prisma.automationSettings.upsert({
      where: {
        organisationId: orgId,
      },
      create: {
        orgId: orgId,
        organisation: { connect: { id: orgId } },
        invoiceCreation: AutomationMode.SEMI_AUTO,
        expenseApproval: AutomationMode.SEMI_AUTO,
        bankReconciliation: AutomationMode.SEMI_AUTO,
        taxClassification: AutomationMode.SEMI_AUTO,
        paymentReminders: AutomationMode.SEMI_AUTO,
        invoiceConfidenceThreshold: 85,
        expenseConfidenceThreshold: 80,
        taxConfidenceThreshold: 90,
        ...updateData,
      },
      update: updateData,
    });

    this.logger.log(
      `Updated automation settings for org: ${orgId}, feature: ${feature}`,
    );

    // Return in the expected format
    if (feature === 'invoice') {
      return {
        mode: result.invoiceCreation,
        confidenceThreshold: result.invoiceConfidenceThreshold / 100,
        amountThreshold: result.maxAutoApproveAmount?.toNumber() || null,
      };
    } else if (feature === 'expense') {
      return {
        mode: result.expenseApproval,
        confidenceThreshold: result.expenseConfidenceThreshold / 100,
        amountThreshold: result.maxAutoApproveAmount?.toNumber() || null,
      };
    } else {
      return {
        mode: result.taxClassification,
        confidenceThreshold: result.taxConfidenceThreshold / 100,
        amountThreshold: null,
      };
    }
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

    // If manual mode, never auto-approve
    if (settings.mode === AutomationMode.MANUAL) {
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
        organisation: { connect: { id: data.organisationId } },
        feature: data.feature,
        action: data.action,
        mode: AutomationMode.SEMI_AUTO, // Default mode, could be passed in dto
        entityType: 'transaction',
        entityId: data.resourceId,
        confidenceScore: data.confidence,
        wasAutoApproved: false, // Could be passed in dto
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
      organisationId: orgId,
    };

    // Apply filters
    if (filters.feature) {
      where.feature = filters.feature;
    }

    if (filters.action) {
      where.action = filters.action;
    }

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        where.createdAt.lte = new Date(filters.endDate);
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
          createdAt: 'desc',
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

    if (settings.mode === AutomationMode.MANUAL) {
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
