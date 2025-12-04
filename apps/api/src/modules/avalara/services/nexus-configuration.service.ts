import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { NexusStatus } from '@prisma/client';
import {
  CreateNexusDto,
  UpdateNexusDto,
  NexusResponseDto,
  StateThresholdDto,
  NexusAlertDto,
} from '../dto/nexus.dto';
import {
  US_STATE_THRESHOLDS,
  getStateThreshold,
  getStatesWithNexusLaws,
  isApproachingThreshold,
} from '../data/us-state-thresholds';

/**
 * Nexus Configuration Service
 * Manages multi-state nexus registrations and economic nexus threshold tracking
 */
@Injectable()
export class NexusConfigurationService {
  private readonly logger = new Logger(NexusConfigurationService.name);
  private readonly ALERT_WARNING_THRESHOLD = 0.8; // 80%
  private readonly ALERT_CRITICAL_THRESHOLD = 0.95; // 95%

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all nexus configurations for an organization
   */
  async getAllNexusStates(orgId: string): Promise<NexusResponseDto[]> {
    this.logger.debug(`Fetching all nexus states for org ${orgId}`);

    const nexusRecords = await this.prisma.taxNexus.findMany({
      where: { orgId },
      orderBy: { state: 'asc' },
    });

    return nexusRecords.map(nexus => this.mapToResponseDto(nexus));
  }

  /**
   * Get active nexus states only
   */
  async getActiveNexusStates(orgId: string): Promise<NexusResponseDto[]> {
    this.logger.debug(`Fetching active nexus states for org ${orgId}`);

    const nexusRecords = await this.prisma.taxNexus.findMany({
      where: {
        orgId,
        status: NexusStatus.ACTIVE,
      },
      orderBy: { state: 'asc' },
    });

    return nexusRecords.map(nexus => this.mapToResponseDto(nexus));
  }

  /**
   * Add new state nexus registration
   */
  async addStateNexus(dto: CreateNexusDto): Promise<NexusResponseDto> {
    this.logger.debug(`Adding nexus for state ${dto.state} in org ${dto.orgId}`);

    // Validate state code
    const stateInfo = getStateThreshold(dto.state);
    if (!stateInfo) {
      throw new BadRequestException(`Invalid state code: ${dto.state}`);
    }

    // Check if states without sales tax
    if (stateInfo.salesThreshold === null && stateInfo.transactionThreshold === null) {
      this.logger.warn(`Attempting to create nexus for ${stateInfo.stateName}, which has no sales tax`);
    }

    // Check for existing nexus
    const existing = await this.prisma.taxNexus.findUnique({
      where: {
        orgId_state: {
          orgId: dto.orgId,
          state: dto.state.toUpperCase(),
        },
      },
    });

    if (existing && existing.status !== NexusStatus.INACTIVE) {
      throw new ConflictException(
        `Nexus already exists for ${dto.state} with status ${existing.status}`,
      );
    }

    // Use state default thresholds if not provided
    const salesThreshold = dto.salesThreshold ?? stateInfo.salesThreshold ?? undefined;
    const transactionThreshold = dto.transactionThreshold ?? stateInfo.transactionThreshold ?? undefined;

    const nexus = await this.prisma.taxNexus.create({
      data: {
        orgId: dto.orgId,
        state: dto.state.toUpperCase(),
        effectiveDate: dto.effectiveDate ? new Date(dto.effectiveDate) : new Date(),
        nexusTypeId: dto.nexusTypeId,
        hasLocalNexus: dto.hasLocalNexus ?? false,
        taxRegistrationId: dto.taxRegistrationId,
        salesThreshold,
        transactionThreshold,
        status: NexusStatus.ACTIVE,
        currentSales: 0,
        currentTransactions: 0,
      },
    });

    this.logger.log(`Created nexus ${nexus.id} for ${dto.state} in org ${dto.orgId}`);

    return this.mapToResponseDto(nexus);
  }

  /**
   * Update existing nexus configuration
   */
  async updateStateNexus(
    orgId: string,
    stateCode: string,
    dto: UpdateNexusDto,
  ): Promise<NexusResponseDto> {
    this.logger.debug(`Updating nexus for state ${stateCode} in org ${orgId}`);

    const existing = await this.prisma.taxNexus.findUnique({
      where: {
        orgId_state: {
          orgId,
          state: stateCode.toUpperCase(),
        },
      },
    });

    if (!existing) {
      throw new NotFoundException(`Nexus not found for state ${stateCode}`);
    }

    const updated = await this.prisma.taxNexus.update({
      where: {
        orgId_state: {
          orgId,
          state: stateCode.toUpperCase(),
        },
      },
      data: {
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        status: dto.status,
        nexusTypeId: dto.nexusTypeId,
        hasLocalNexus: dto.hasLocalNexus,
        taxRegistrationId: dto.taxRegistrationId,
        salesThreshold: dto.salesThreshold,
        transactionThreshold: dto.transactionThreshold,
      },
    });

    this.logger.log(`Updated nexus ${updated.id} for ${stateCode}`);

    return this.mapToResponseDto(updated);
  }

  /**
   * Remove/deactivate state nexus
   */
  async removeStateNexus(orgId: string, stateCode: string): Promise<NexusResponseDto> {
    this.logger.debug(`Removing nexus for state ${stateCode} in org ${orgId}`);

    const existing = await this.prisma.taxNexus.findUnique({
      where: {
        orgId_state: {
          orgId,
          state: stateCode.toUpperCase(),
        },
      },
    });

    if (!existing) {
      throw new NotFoundException(`Nexus not found for state ${stateCode}`);
    }

    const deactivated = await this.prisma.taxNexus.update({
      where: {
        orgId_state: {
          orgId,
          state: stateCode.toUpperCase(),
        },
      },
      data: {
        status: NexusStatus.INACTIVE,
        endDate: new Date(),
      },
    });

    this.logger.log(`Deactivated nexus ${deactivated.id} for ${stateCode}`);

    return this.mapToResponseDto(deactivated);
  }

  /**
   * Get economic nexus thresholds for all states
   */
  async getEconomicNexusThresholds(): Promise<StateThresholdDto[]> {
    this.logger.debug('Fetching economic nexus thresholds for all states');

    const statesWithLaws = getStatesWithNexusLaws();

    return statesWithLaws.map(state => ({
      state: state.state,
      stateName: state.stateName,
      salesThreshold: state.salesThreshold ?? undefined,
      transactionThreshold: state.transactionThreshold ?? undefined,
      operator: state.operator,
      effectiveDate: state.effectiveDate,
      isTaxHoliday: state.isTaxHoliday,
      isOriginBased: state.isOriginBased,
      notes: state.notes,
    }));
  }

  /**
   * Get threshold information for a specific state
   */
  async getStateThresholdInfo(stateCode: string): Promise<StateThresholdDto> {
    this.logger.debug(`Fetching threshold info for state ${stateCode}`);

    const stateInfo = getStateThreshold(stateCode);
    if (!stateInfo) {
      throw new BadRequestException(`Invalid state code: ${stateCode}`);
    }

    return {
      state: stateInfo.state,
      stateName: stateInfo.stateName,
      salesThreshold: stateInfo.salesThreshold ?? undefined,
      transactionThreshold: stateInfo.transactionThreshold ?? undefined,
      operator: stateInfo.operator,
      effectiveDate: stateInfo.effectiveDate,
      isTaxHoliday: stateInfo.isTaxHoliday,
      isOriginBased: stateInfo.isOriginBased,
      notes: stateInfo.notes,
    };
  }

  /**
   * Get threshold alerts for approaching/exceeded thresholds
   */
  async getThresholdAlerts(orgId: string): Promise<NexusAlertDto[]> {
    this.logger.debug(`Fetching threshold alerts for org ${orgId}`);

    // Get all tracked states (both active and pending)
    const nexusRecords = await this.prisma.taxNexus.findMany({
      where: {
        orgId,
        status: {
          in: [NexusStatus.ACTIVE, NexusStatus.PENDING],
        },
      },
    });

    const alerts: NexusAlertDto[] = [];

    for (const nexus of nexusRecords) {
      const stateInfo = getStateThreshold(nexus.state);
      if (!stateInfo) continue;

      const currentSales = Number(nexus.currentSales);
      const currentTransactions = nexus.currentTransactions;

      const thresholdCheck = isApproachingThreshold(
        nexus.state,
        currentSales,
        currentTransactions,
        this.ALERT_WARNING_THRESHOLD,
      );

      if (thresholdCheck.isApproaching || thresholdCheck.exceedsThreshold) {
        // Determine severity
        let severity: 'WARNING' | 'CRITICAL' = 'WARNING';
        const maxPercent = Math.max(
          thresholdCheck.salesPercent ?? 0,
          thresholdCheck.transactionsPercent ?? 0,
        );

        if (thresholdCheck.exceedsThreshold || maxPercent >= this.ALERT_CRITICAL_THRESHOLD) {
          severity = 'CRITICAL';
        }

        alerts.push({
          nexusId: nexus.id,
          state: nexus.state,
          stateName: stateInfo.stateName,
          severity,
          message: thresholdCheck.message,
          currentSales,
          salesThreshold: nexus.salesThreshold ? Number(nexus.salesThreshold) : undefined,
          salesPercent: thresholdCheck.salesPercent ?? undefined,
          currentTransactions,
          transactionThreshold: nexus.transactionThreshold ?? undefined,
          transactionsPercent: thresholdCheck.transactionsPercent ?? undefined,
          registrationRecommended: thresholdCheck.exceedsThreshold && nexus.status !== NexusStatus.ACTIVE,
        });
      }
    }

    // Sort by severity (CRITICAL first) then by state
    alerts.sort((a, b) => {
      if (a.severity !== b.severity) {
        return a.severity === 'CRITICAL' ? -1 : 1;
      }
      return a.state.localeCompare(b.state);
    });

    this.logger.debug(`Found ${alerts.length} threshold alerts for org ${orgId}`);

    return alerts;
  }

  /**
   * Track sales for nexus threshold monitoring
   * This should be called after each completed transaction
   */
  async trackSalesForNexus(
    orgId: string,
    stateCode: string,
    saleAmount: number,
  ): Promise<void> {
    this.logger.debug(`Tracking $${saleAmount} sale in ${stateCode} for org ${orgId}`);

    const nexus = await this.prisma.taxNexus.findUnique({
      where: {
        orgId_state: { orgId, state: stateCode.toUpperCase() },
      },
    });

    if (!nexus) {
      // No nexus registration yet, check if we should create one
      const stateInfo = getStateThreshold(stateCode);
      if (stateInfo && (stateInfo.salesThreshold || stateInfo.transactionThreshold)) {
        this.logger.warn(
          `Sale in ${stateCode} but no nexus tracking. Consider adding nexus monitoring for this state.`,
        );
      }
      return;
    }

    // Update sales and transaction count
    await this.prisma.taxNexus.update({
      where: {
        orgId_state: { orgId, state: stateCode.toUpperCase() },
      },
      data: {
        currentSales: {
          increment: saleAmount,
        },
        currentTransactions: {
          increment: 1,
        },
      },
    });

    // Check if threshold is approaching or exceeded
    const updatedSales = Number(nexus.currentSales) + saleAmount;
    const updatedTransactions = nexus.currentTransactions + 1;

    const thresholdCheck = isApproachingThreshold(
      stateCode,
      updatedSales,
      updatedTransactions,
    );

    if (thresholdCheck.exceedsThreshold) {
      this.logger.warn(
        `⚠️  CRITICAL: Economic nexus threshold EXCEEDED in ${stateCode} for org ${orgId}. Registration required!`,
      );

      // Auto-update status to PENDING if currently inactive
      if (nexus.status === NexusStatus.INACTIVE) {
        await this.prisma.taxNexus.update({
          where: {
            orgId_state: { orgId, state: stateCode.toUpperCase() },
          },
          data: {
            status: NexusStatus.PENDING,
          },
        });
      }
    } else if (thresholdCheck.isApproaching) {
      this.logger.warn(
        `⚠️  WARNING: ${thresholdCheck.message} - Current: $${updatedSales} / ${updatedTransactions} txns`,
      );
    }
  }

  /**
   * Reset year-to-date counters (typically called at start of calendar year)
   */
  async resetYearToDateCounters(orgId: string): Promise<void> {
    this.logger.log(`Resetting YTD counters for org ${orgId}`);

    await this.prisma.taxNexus.updateMany({
      where: { orgId },
      data: {
        currentSales: 0,
        currentTransactions: 0,
      },
    });

    this.logger.log(`Reset YTD counters for all nexus states in org ${orgId}`);
  }

  /**
   * Check if organization should register for nexus in a state
   */
  async shouldRegisterForNexus(
    orgId: string,
    stateCode: string,
  ): Promise<{
    shouldRegister: boolean;
    reason: string;
    currentSales: number;
    currentTransactions: number;
    threshold: StateThresholdDto | null;
  }> {
    const stateInfo = getStateThreshold(stateCode);
    if (!stateInfo) {
      return {
        shouldRegister: false,
        reason: 'Invalid state code',
        currentSales: 0,
        currentTransactions: 0,
        threshold: null,
      };
    }

    if (stateInfo.salesThreshold === null && stateInfo.transactionThreshold === null) {
      return {
        shouldRegister: false,
        reason: `${stateInfo.stateName} has no state sales tax`,
        currentSales: 0,
        currentTransactions: 0,
        threshold: null,
      };
    }

    const nexus = await this.prisma.taxNexus.findUnique({
      where: {
        orgId_state: { orgId, state: stateCode.toUpperCase() },
      },
    });

    const currentSales = nexus ? Number(nexus.currentSales) : 0;
    const currentTransactions = nexus ? nexus.currentTransactions : 0;

    const thresholdCheck = isApproachingThreshold(
      stateCode,
      currentSales,
      currentTransactions,
    );

    return {
      shouldRegister: thresholdCheck.exceedsThreshold,
      reason: thresholdCheck.exceedsThreshold
        ? `Economic nexus threshold exceeded: ${thresholdCheck.message}`
        : thresholdCheck.isApproaching
        ? `Approaching threshold: ${thresholdCheck.message}`
        : 'Below threshold',
      currentSales,
      currentTransactions,
      threshold: {
        state: stateInfo.state,
        stateName: stateInfo.stateName,
        salesThreshold: stateInfo.salesThreshold ?? undefined,
        transactionThreshold: stateInfo.transactionThreshold ?? undefined,
        operator: stateInfo.operator,
        effectiveDate: stateInfo.effectiveDate,
        isTaxHoliday: stateInfo.isTaxHoliday,
        isOriginBased: stateInfo.isOriginBased,
        notes: stateInfo.notes,
      },
    };
  }

  /**
   * Private helper to map Prisma model to response DTO
   */
  private mapToResponseDto(nexus: any): NexusResponseDto {
    const stateInfo = getStateThreshold(nexus.state);

    return {
      id: nexus.id,
      orgId: nexus.orgId,
      state: nexus.state,
      stateName: stateInfo?.stateName || nexus.state,
      effectiveDate: nexus.effectiveDate,
      endDate: nexus.endDate,
      status: nexus.status,
      nexusTypeId: nexus.nexusTypeId,
      hasLocalNexus: nexus.hasLocalNexus,
      taxRegistrationId: nexus.taxRegistrationId,
      salesThreshold: nexus.salesThreshold ? Number(nexus.salesThreshold) : undefined,
      transactionThreshold: nexus.transactionThreshold,
      currentSales: Number(nexus.currentSales),
      currentTransactions: nexus.currentTransactions,
      createdAt: nexus.createdAt,
      updatedAt: nexus.updatedAt,
    };
  }
}
