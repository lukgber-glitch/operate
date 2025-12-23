/**
 * Fraud Prevention Service
 *
 * Manages fraud detection, alerts, and audit trails.
 * Integrates with @operate/ai fraud detection package.
 */

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { FraudDetector, Transaction as FraudTransaction, FraudAlertSeverity as AIFraudAlertSeverity } from '@operate/ai';
import { FraudAlertSeverity, FraudAlertStatus } from '@prisma/client';
import {
  FraudAlertDto,
  AlertFiltersDto,
  ReviewDecisionDto,
  FraudStatisticsDto,
  ThresholdStatusDto,
  FraudCheckResultDto,
} from './dto';

@Injectable()
export class FraudPreventionService {
  private readonly logger = new Logger(FraudPreventionService.name);
  private readonly fraudDetector: FraudDetector;

  constructor(private readonly prisma: PrismaService) {
    this.fraudDetector = new FraudDetector({
      // Conservative configuration
      duplicateScoreThreshold: 0.6,
      anomalyStdDeviationThreshold: 2,
      velocityIncreaseThreshold: 1.5,
      autoBlockDuplicateScore: 0.95,
      autoBlockSeverity: AIFraudAlertSeverity.CRITICAL,
      requireReviewAbove: 100000, // €1,000
      requireReviewForCategories: ['VEHICLE_BUSINESS', 'TRAVEL_BUSINESS'],
      logAllChecks: true,
      retainAlertsForYears: 10,
    });
  }

  /**
   * Check transaction for fraud signals
   */
  async checkTransaction(
    transactionId: string,
    orgId: string,
    userId: string,
    countryCode: string = 'DE',
  ): Promise<FraudCheckResultDto> {
    this.logger.log(
      `Checking transaction ${transactionId} for fraud signals`,
    );

    // Get transaction
    const transaction = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction || transaction.orgId !== orgId) {
      throw new NotFoundException('Transaction not found');
    }

    // Get historical transactions for org
    const history = await this.getTransactionHistory(
      orgId,
      transaction.category,
    );

    // Convert to fraud detection format
    const fraudTransaction = this.toFraudTransaction(transaction);
    const fraudHistory = history.map((t) => this.toFraudTransaction(t));

    // Run fraud detection
    const result = await this.fraudDetector.checkTransaction(
      fraudTransaction,
      fraudHistory,
      countryCode,
    );

    // Store audit log
    await this.createAuditLog({
      orgId,
      userId,
      transactionId,
      checkResult: result,
      countryCode,
    });

    // Store alerts
    for (const alert of result.alerts) {
      await this.storeAlert(alert);
    }

    this.logger.log(
      `Fraud check complete: ${result.alerts.length} alerts generated`,
    );

    return result as unknown as FraudCheckResultDto;
  }

  /**
   * Check multiple transactions in batch
   */
  async checkBatch(
    transactionIds: string[],
    orgId: string,
    userId: string,
    countryCode: string = 'DE',
  ): Promise<FraudCheckResultDto[]> {
    this.logger.log(`Checking ${transactionIds.length} transactions in batch`);

    const results: FraudCheckResultDto[] = [];

    for (const transactionId of transactionIds) {
      const result = await this.checkTransaction(
        transactionId,
        orgId,
        userId,
        countryCode,
      );
      results.push(result);
    }

    return results;
  }

  /**
   * Get fraud alerts for organization
   */
  async getAlerts(
    orgId: string,
    filters?: AlertFiltersDto,
  ): Promise<FraudAlertDto[]> {
    const where: any = { orgId };

    if (filters?.status) {
      where.status = { in: filters.status };
    }

    if (filters?.severity) {
      where.severity = { in: filters.severity };
    }

    if (filters?.type) {
      where.type = { in: filters.type };
    }

    if (filters?.dateFrom || filters?.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) {
        where.createdAt.gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        where.createdAt.lte = filters.dateTo;
      }
    }

    if (filters?.categoryCode) {
      where.details = {
        path: ['categoryCode'],
        equals: filters.categoryCode,
      };
    }

    const alerts = await this.prisma.fraudAlert.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return alerts.map((a) => this.toAlertDto(a));
  }

  /**
   * Get alert by ID
   */
  async getAlert(alertId: string, orgId: string): Promise<FraudAlertDto> {
    const alert = await this.prisma.fraudAlert.findUnique({
      where: { id: alertId },
    });

    if (!alert || alert.orgId !== orgId) {
      throw new NotFoundException('Alert not found');
    }

    return this.toAlertDto(alert);
  }

  /**
   * Review fraud alert
   */
  async reviewAlert(
    alertId: string,
    orgId: string,
    userId: string,
    decision: ReviewDecisionDto,
  ): Promise<void> {
    this.logger.log(`Reviewing alert ${alertId}: ${decision.decision}`);

    const alert = await this.prisma.fraudAlert.findUnique({
      where: { id: alertId },
    });

    if (!alert || alert.orgId !== orgId) {
      throw new NotFoundException('Alert not found');
    }

    // Update alert
    await this.prisma.fraudAlert.update({
      where: { id: alertId },
      data: {
        status: decision.decision === 'confirm' ? FraudAlertStatus.RESOLVED : FraudAlertStatus.DISMISSED,
        resolvedBy: userId,
        resolvedAt: new Date(),
        resolution: decision.note,
      },
    });

    // Store review audit log
    await this.prisma.fraudAuditLog.create({
      data: {
        orgId,
        performedBy: userId,
        action: 'review_alert',
        alertId,
        details: {
          decision: decision.decision,
          note: decision.note,
          correctedCategoryCode: decision.correctedCategoryCode,
          correctedAmount: decision.correctedAmount,
        },
      },
    });

    this.logger.log(`Alert ${alertId} reviewed: ${decision.decision}`);
  }

  /**
   * Get threshold status for organization
   */
  async getThresholdStatus(
    orgId: string,
    year: number,
    countryCode: string = 'DE',
  ): Promise<ThresholdStatusDto[]> {
    // Get all transactions for the year
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31, 23, 59, 59);

    const transactions = await this.prisma.transaction.findMany({
      where: {
        orgId,
        date: {
          gte: startOfYear,
          lte: endOfYear,
        },
      },
    });

    // Get unique categories
    const categories = [
      ...new Set(transactions.map((t) => t.category).filter(Boolean)),
    ] as string[];

    // Calculate status for each category
    const statuses: ThresholdStatusDto[] = [];

    for (const categoryCode of categories) {
      const categoryTransactions = transactions.filter(
        (t) => t.category === categoryCode,
      );

      // Use fraud detector threshold monitor
      // This is simplified - in production, you'd call the actual threshold monitor
      const status: ThresholdStatusDto = {
        categoryCode: categoryCode,
        config: {
          countryCode,
          categoryCode: categoryCode,
          warningThreshold: 0.8,
        },
        dailyUsage: 0,
        monthlyUsage: 0,
        annualUsage: categoryTransactions.reduce(
          (sum, t) => sum + Number(t.amount),
          0,
        ),
        dailyPercentage: 0,
        monthlyPercentage: 0,
        annualPercentage: 0,
        hasWarning: false,
        hasExceeded: false,
      };

      statuses.push(status);
    }

    return statuses;
  }

  /**
   * Get fraud statistics
   */
  async getStatistics(
    orgId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<FraudStatisticsDto> {
    const alerts = await this.prisma.fraudAlert.findMany({
      where: {
        orgId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // Calculate statistics
    const totalAlerts = alerts.length;
    const reviewedAlerts = alerts.filter(
      (a) => a.status === FraudAlertStatus.RESOLVED || a.status === FraudAlertStatus.DISMISSED,
    ).length;
    const confirmedFraud = alerts.filter((a) => a.status === FraudAlertStatus.RESOLVED)
      .length;
    const falsePositives = alerts.filter((a) => a.status === FraudAlertStatus.DISMISSED)
      .length;

    const precision =
      confirmedFraud + falsePositives > 0
        ? confirmedFraud / (confirmedFraud + falsePositives)
        : 0;

    // Calculate average review time
    const reviewedWithTime = alerts.filter(
      (a) => a.resolvedAt && a.createdAt,
    );
    const avgReviewTime =
      reviewedWithTime.length > 0
        ? reviewedWithTime.reduce((sum, a) => {
            const diff =
              a.resolvedAt!.getTime() - a.createdAt.getTime();
            return sum + diff / (1000 * 60 * 60); // Convert to hours
          }, 0) / reviewedWithTime.length
        : 0;

    // Alerts by severity
    const alertsBySeverity = alerts.reduce(
      (acc, a) => {
        acc[a.severity] = (acc[a.severity] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    // Alerts by type
    const alertsByType = alerts.reduce(
      (acc, a) => {
        acc[a.type] = (acc[a.type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    // Top categories
    const categoryCount = new Map<string, number>();
    for (const alert of alerts) {
      if (alert.details && typeof alert.details === 'object' && 'categoryCode' in alert.details) {
        const cat = (alert.details as any).categoryCode as string;
        categoryCount.set(cat, (categoryCount.get(cat) || 0) + 1);
      }
    }

    const topCategories = Array.from(categoryCount.entries())
      .map(([categoryCode, alertCount]) => ({ categoryCode, alertCount }))
      .sort((a, b) => b.alertCount - a.alertCount)
      .slice(0, 10);

    return {
      orgId,
      period: {
        start: startDate,
        end: endDate,
      },
      totalAlerts,
      alertsBySeverity,
      alertsByType,
      reviewedAlerts,
      confirmedFraud,
      falsePositives,
      precision,
      avgReviewTime,
      topCategories,
    };
  }

  /**
   * Get transaction history for context
   */
  private async getTransactionHistory(
    orgId: string,
    category?: string | null,
    limit: number = 1000,
  ): Promise<any[]> {
    const where: any = { orgId };

    if (category) {
      where.category = category;
    }

    return this.prisma.transaction.findMany({
      where,
      orderBy: { date: 'desc' },
      take: limit,
    });
  }

  /**
   * Convert Prisma transaction to fraud detection format
   */
  private toFraudTransaction(transaction: any): FraudTransaction {
    return {
      id: transaction.id,
      orgId: transaction.orgId,
      amount: Number(transaction.amount) * 100, // Convert to cents
      date: transaction.date,
      description: transaction.description || '',
      counterparty: transaction.metadata?.counterparty,
      categoryCode: transaction.category,
      merchantId: transaction.metadata?.merchantId,
      metadata: transaction.metadata as Record<string, any>,
    };
  }

  /**
   * Store fraud alert in database
   */
  private async storeAlert(alert: any): Promise<void> {
    await this.prisma.fraudAlert.create({
      data: {
        id: alert.id,
        type: alert.type,
        severity: alert.severity,
        transactionId: alert.transactionId,
        orgId: alert.orgId,
        description: alert.description,
        details: {
          evidence: alert.evidence,
          recommendedAction: alert.recommendedAction,
          autoResolved: alert.autoResolved,
          categoryCode: alert.categoryCode,
        },
        riskScore: alert.riskScore || 0,
        status: alert.status,
      },
    });
  }

  /**
   * Create audit log entry
   */
  private async createAuditLog(params: {
    orgId: string;
    userId: string;
    transactionId: string;
    checkResult: any;
    countryCode: string;
  }): Promise<void> {
    await this.prisma.fraudAuditLog.create({
      data: {
        orgId: params.orgId,
        performedBy: params.userId,
        action: 'fraud_check',
        transactionId: params.transactionId,
        details: {
          checksPerformed: params.checkResult.checksPerformed,
          alertCount: params.checkResult.alerts.length,
          recommendedAction: params.checkResult.recommendedAction,
          blockedBySystem: params.checkResult.blockedBySystem,
          countryCode: params.countryCode,
        },
      },
    });
  }

  /**
   * Convert Prisma alert to DTO
   */
  private toAlertDto(alert: any): FraudAlertDto {
    const details = (alert.details || {}) as any;
    return {
      id: alert.id,
      type: alert.type,
      severity: alert.severity,
      transactionId: alert.transactionId,
      deductionId: details.deductionId,
      orgId: alert.orgId,
      title: details.title || alert.description,
      description: alert.description,
      evidence: details.evidence,
      status: alert.status,
      reviewedBy: alert.resolvedBy,
      reviewedAt: alert.resolvedAt,
      reviewNote: alert.resolution,
      createdAt: alert.createdAt,
      recommendedAction: details.recommendedAction,
      autoResolved: details.autoResolved,
    };
  }
}
