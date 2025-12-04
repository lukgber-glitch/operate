import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { AutomationMode } from '@prisma/client';
import {
  UpdateAutomationSettingsDto,
  FeatureModeDto,
  UpdateFeatureModeDto,
} from './dto/automation-settings.dto';

/**
 * Feature names mapping to database fields
 */
type FeatureName = 'invoices' | 'expenses' | 'tax' | 'bankReconciliation';

const FEATURE_FIELD_MAP = {
  invoices: 'invoiceCreation',
  expenses: 'expenseApproval',
  tax: 'taxClassification',
  bankReconciliation: 'bankReconciliation',
} as const;

const THRESHOLD_FIELD_MAP = {
  invoices: 'invoiceConfidenceThreshold',
  expenses: 'expenseConfidenceThreshold',
  tax: 'taxConfidenceThreshold',
  bankReconciliation: null, // No specific threshold
} as const;

/**
 * Automation Settings Service
 * Manages CRUD operations for automation settings per organisation
 */
@Injectable()
export class AutomationSettingsService {
  private readonly logger = new Logger(AutomationSettingsService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Get automation settings for an organisation
   * Creates default settings if none exist
   */
  async getSettings(organisationId: string) {
    this.logger.log(`Getting automation settings for org: ${organisationId}`);

    // Verify organisation exists
    const org = await this.prisma.organisation.findUnique({
      where: { id: organisationId },
    });

    if (!org) {
      throw new NotFoundException(`Organisation ${organisationId} not found`);
    }

    // Get or create settings
    let settings = await this.prisma.automationSettings.findUnique({
      where: { organisationId },
    });

    if (!settings) {
      // Create default settings
      settings = await this.prisma.automationSettings.create({
        data: {
          organisationId,
          // Default values from schema
          invoiceCreation: AutomationMode.SEMI_AUTO,
          expenseApproval: AutomationMode.SEMI_AUTO,
          bankReconciliation: AutomationMode.SEMI_AUTO,
          taxClassification: AutomationMode.SEMI_AUTO,
          paymentReminders: AutomationMode.SEMI_AUTO,
          invoiceConfidenceThreshold: 85,
          expenseConfidenceThreshold: 80,
          taxConfidenceThreshold: 90,
          maxAutoApproveAmount: null,
        },
      });

      this.logger.log(`Created default automation settings for org: ${organisationId}`);
    }

    return {
      id: settings.id,
      organisationId: settings.organisationId,
      invoiceCreation: settings.invoiceCreation,
      expenseApproval: settings.expenseApproval,
      bankReconciliation: settings.bankReconciliation,
      taxClassification: settings.taxClassification,
      paymentReminders: settings.paymentReminders,
      invoiceConfidenceThreshold: settings.invoiceConfidenceThreshold,
      expenseConfidenceThreshold: settings.expenseConfidenceThreshold,
      taxConfidenceThreshold: settings.taxConfidenceThreshold,
      maxAutoApproveAmount: settings.maxAutoApproveAmount
        ? Number(settings.maxAutoApproveAmount)
        : null,
      createdAt: settings.createdAt,
      updatedAt: settings.updatedAt,
    };
  }

  /**
   * Update automation settings for an organisation
   */
  async updateSettings(
    organisationId: string,
    dto: UpdateAutomationSettingsDto,
  ) {
    this.logger.log(`Updating automation settings for org: ${organisationId}`);

    // Verify organisation exists
    const org = await this.prisma.organisation.findUnique({
      where: { id: organisationId },
    });

    if (!org) {
      throw new NotFoundException(`Organisation ${organisationId} not found`);
    }

    // Validate thresholds
    if (dto.invoiceConfidenceThreshold !== undefined) {
      this.validateThreshold(dto.invoiceConfidenceThreshold);
    }
    if (dto.expenseConfidenceThreshold !== undefined) {
      this.validateThreshold(dto.expenseConfidenceThreshold);
    }
    if (dto.taxConfidenceThreshold !== undefined) {
      this.validateThreshold(dto.taxConfidenceThreshold);
    }

    // Validate modes
    if (dto.invoiceCreation !== undefined) {
      this.validateMode(dto.invoiceCreation);
    }
    if (dto.expenseApproval !== undefined) {
      this.validateMode(dto.expenseApproval);
    }
    if (dto.bankReconciliation !== undefined) {
      this.validateMode(dto.bankReconciliation);
    }
    if (dto.taxClassification !== undefined) {
      this.validateMode(dto.taxClassification);
    }
    if (dto.paymentReminders !== undefined) {
      this.validateMode(dto.paymentReminders);
    }

    // Update settings
    const settings = await this.prisma.automationSettings.upsert({
      where: { organisationId },
      create: {
        organisationId,
        invoiceCreation: dto.invoiceCreation ?? AutomationMode.SEMI_AUTO,
        expenseApproval: dto.expenseApproval ?? AutomationMode.SEMI_AUTO,
        bankReconciliation: dto.bankReconciliation ?? AutomationMode.SEMI_AUTO,
        taxClassification: dto.taxClassification ?? AutomationMode.SEMI_AUTO,
        paymentReminders: dto.paymentReminders ?? AutomationMode.SEMI_AUTO,
        invoiceConfidenceThreshold: dto.invoiceConfidenceThreshold ?? 85,
        expenseConfidenceThreshold: dto.expenseConfidenceThreshold ?? 80,
        taxConfidenceThreshold: dto.taxConfidenceThreshold ?? 90,
        maxAutoApproveAmount: dto.maxAutoApproveAmount ?? null,
      },
      update: {
        ...(dto.invoiceCreation !== undefined && { invoiceCreation: dto.invoiceCreation }),
        ...(dto.expenseApproval !== undefined && { expenseApproval: dto.expenseApproval }),
        ...(dto.bankReconciliation !== undefined && { bankReconciliation: dto.bankReconciliation }),
        ...(dto.taxClassification !== undefined && { taxClassification: dto.taxClassification }),
        ...(dto.paymentReminders !== undefined && { paymentReminders: dto.paymentReminders }),
        ...(dto.invoiceConfidenceThreshold !== undefined && { invoiceConfidenceThreshold: dto.invoiceConfidenceThreshold }),
        ...(dto.expenseConfidenceThreshold !== undefined && { expenseConfidenceThreshold: dto.expenseConfidenceThreshold }),
        ...(dto.taxConfidenceThreshold !== undefined && { taxConfidenceThreshold: dto.taxConfidenceThreshold }),
        ...(dto.maxAutoApproveAmount !== undefined && { maxAutoApproveAmount: dto.maxAutoApproveAmount }),
      },
    });

    this.logger.log(`Updated automation settings for org: ${organisationId}`);

    return this.getSettings(organisationId);
  }

  /**
   * Get current automation mode for a specific feature
   */
  async getFeatureMode(
    organisationId: string,
    feature: FeatureName,
  ): Promise<FeatureModeDto> {
    this.logger.log(`Getting automation mode for feature: ${feature}, org: ${organisationId}`);

    this.validateFeature(feature);

    const settings = await this.getSettings(organisationId);
    const modeField = FEATURE_FIELD_MAP[feature];
    const thresholdField = THRESHOLD_FIELD_MAP[feature];

    return {
      mode: settings[modeField],
      confidenceThreshold: thresholdField ? settings[thresholdField] : 0,
    };
  }

  /**
   * Update individual feature mode
   */
  async updateFeatureMode(
    organisationId: string,
    feature: FeatureName,
    dto: UpdateFeatureModeDto,
  ): Promise<FeatureModeDto> {
    this.logger.log(`Updating feature mode for: ${feature}, org: ${organisationId}`);

    this.validateFeature(feature);

    if (dto.mode !== undefined) {
      this.validateMode(dto.mode);
    }
    if (dto.confidenceThreshold !== undefined) {
      this.validateThreshold(dto.confidenceThreshold);
    }

    const modeField = FEATURE_FIELD_MAP[feature];
    const thresholdField = THRESHOLD_FIELD_MAP[feature];

    const updateData: any = {};
    if (dto.mode !== undefined) {
      updateData[modeField] = dto.mode;
    }
    if (dto.confidenceThreshold !== undefined && thresholdField) {
      updateData[thresholdField] = dto.confidenceThreshold;
    }

    await this.prisma.automationSettings.upsert({
      where: { organisationId },
      create: {
        organisationId,
        ...updateData,
      },
      update: updateData,
    });

    return this.getFeatureMode(organisationId, feature);
  }

  /**
   * Validate feature name
   */
  private validateFeature(feature: string): asserts feature is FeatureName {
    const validFeatures = Object.keys(FEATURE_FIELD_MAP);
    if (!validFeatures.includes(feature)) {
      throw new BadRequestException(
        `Invalid feature. Must be one of: ${validFeatures.join(', ')}`,
      );
    }
  }

  /**
   * Validate automation mode
   */
  private validateMode(mode: AutomationMode): void {
    const validModes = Object.values(AutomationMode);
    if (!validModes.includes(mode)) {
      throw new BadRequestException(
        `Invalid mode. Must be one of: ${validModes.join(', ')}`,
      );
    }
  }

  /**
   * Validate confidence threshold
   */
  private validateThreshold(threshold: number): void {
    if (threshold < 0 || threshold > 100) {
      throw new BadRequestException(
        'Confidence threshold must be between 0 and 100',
      );
    }
  }
}
