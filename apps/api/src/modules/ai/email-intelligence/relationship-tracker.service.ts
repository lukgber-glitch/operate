/**
 * Relationship Tracker Service
 * Tracks customer/vendor relationship health based on email patterns
 *
 * Features:
 * - Calculates health scores (0-100) based on communication patterns
 * - Detects engagement trends (increasing/decreasing/stable)
 * - Identifies at-risk and dormant relationships
 * - Provides actionable alerts and recommendations
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  RelationshipMetrics,
  EmailMessage,
  CommunicationFrequency,
  CommunicationTrend,
  PaymentBehavior,
  HealthStatus,
  RelationshipAlert,
  AlertPriority,
  AtRiskRelationship,
  RelationshipSummary,
  CommunicationStats,
} from './types/relationship-metrics.types';

const DORMANT_THRESHOLD_DAYS = 90;
const DEFAULT_AT_RISK_THRESHOLD_DAYS = 60;

interface EmailRecord {
  date: Date;
  from: string;
  to: string;
  subject: string;
}

@Injectable()
export class RelationshipTrackerService {
  private readonly logger = new Logger(RelationshipTrackerService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Update relationship metrics for a customer or vendor after processing an email
   */
  async updateRelationshipMetrics(
    entityId: string,
    entityType: 'CUSTOMER' | 'VENDOR',
    email: EmailMessage,
    orgId: string,
  ): Promise<RelationshipMetrics> {
    this.logger.log(
      `Updating relationship metrics for ${entityType} ${entityId} from email: "${email.subject.substring(0, 50)}..."`,
    );

    try {
      // Get all emails for this entity (from metadata or separate tracking)
      const emailHistory = await this.getEmailHistory(entityId, entityType, orgId);

      // Add current email to history
      const updatedHistory = [
        ...emailHistory,
        {
          date: email.date || new Date(),
          from: email.from,
          to: email.to,
          subject: email.subject,
        },
      ];

      // Calculate metrics from email history
      const metrics = await this.calculateMetricsFromHistory(
        updatedHistory,
        entityId,
        entityType,
        orgId,
      );

      // Store metrics in database
      await this.storeMetrics(entityId, entityType, orgId, metrics);

      this.logger.log(
        `Relationship metrics updated: Health Score ${metrics.healthScore} (${metrics.healthStatus})`,
      );

      return metrics;
    } catch (error) {
      this.logger.error(
        `Failed to update relationship metrics: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Calculate health score for a customer or vendor
   * Score ranges from 0-100 based on multiple factors
   */
  async calculateHealthScore(
    entityId: string,
    entityType: 'CUSTOMER' | 'VENDOR',
    orgId: string,
  ): Promise<number> {
    this.logger.debug(`Calculating health score for ${entityType} ${entityId}`);

    try {
      // Get email history
      const emailHistory = await this.getEmailHistory(entityId, entityType, orgId);

      if (emailHistory.length === 0) {
        return 50; // Neutral score for new relationships
      }

      // Calculate metrics
      const metrics = await this.calculateMetricsFromHistory(
        emailHistory,
        entityId,
        entityType,
        orgId,
      );

      return metrics.healthScore;
    } catch (error) {
      this.logger.error(
        `Failed to calculate health score: ${error.message}`,
        error.stack,
      );
      return 50; // Default neutral score on error
    }
  }

  /**
   * Get relationships that need attention (at risk or declining)
   */
  async getAtRiskRelationships(
    orgId: string,
  ): Promise<AtRiskRelationship[]> {
    this.logger.log(`Finding at-risk relationships for org ${orgId}`);

    try {
      // Get all relationship metrics for this org
      const metricsRecords = await this.prisma.relationshipMetrics.findMany({
        where: {
          organisationId: orgId,
          OR: [
            { healthStatus: HealthStatus.AT_RISK },
            { healthStatus: HealthStatus.NEEDS_ATTENTION },
          ],
        },
        orderBy: {
          healthScore: 'asc', // Worst first
        },
      });

      const atRiskRelationships: AtRiskRelationship[] = [];

      for (const record of metricsRecords) {
        const metrics = record.metrics as unknown as RelationshipMetrics;

        // Get entity details
        let entityName = 'Unknown';
        if (record.entityType === 'CUSTOMER') {
          const customer = await this.prisma.customer.findUnique({
            where: { id: record.entityId },
          });
          entityName = customer?.name || 'Unknown Customer';
        } else {
          const vendor = await this.prisma.vendor.findUnique({
            where: { id: record.entityId },
          });
          entityName = vendor?.name || 'Unknown Vendor';
        }

        // Generate suggested action
        const suggestedAction = this.generateSuggestedAction(metrics, record.entityType);

        atRiskRelationships.push({
          entityId: record.entityId,
          entityType: record.entityType as 'CUSTOMER' | 'VENDOR',
          entityName,
          metrics,
          suggestedAction,
        });
      }

      this.logger.log(`Found ${atRiskRelationships.length} at-risk relationships`);

      return atRiskRelationships;
    } catch (error) {
      this.logger.error(
        `Failed to get at-risk relationships: ${error.message}`,
        error.stack,
      );
      return [];
    }
  }

  /**
   * Get dormant relationships (no contact for 90+ days)
   */
  async getDormantRelationships(
    orgId: string,
    daysSinceContact: number = DORMANT_THRESHOLD_DAYS,
  ): Promise<AtRiskRelationship[]> {
    this.logger.log(
      `Finding dormant relationships (${daysSinceContact}+ days) for org ${orgId}`,
    );

    try {
      const metricsRecords = await this.prisma.relationshipMetrics.findMany({
        where: {
          organisationId: orgId,
          healthStatus: HealthStatus.DORMANT,
        },
        orderBy: {
          lastUpdated: 'asc', // Oldest first
        },
      });

      const dormantRelationships: AtRiskRelationship[] = [];

      for (const record of metricsRecords) {
        const metrics = record.metrics as unknown as RelationshipMetrics;

        if (metrics.daysSinceLastContact < daysSinceContact) {
          continue; // Skip if not dormant enough
        }

        // Get entity details
        let entityName = 'Unknown';
        if (record.entityType === 'CUSTOMER') {
          const customer = await this.prisma.customer.findUnique({
            where: { id: record.entityId },
          });
          entityName = customer?.name || 'Unknown Customer';
        } else {
          const vendor = await this.prisma.vendor.findUnique({
            where: { id: record.entityId },
          });
          entityName = vendor?.name || 'Unknown Vendor';
        }

        dormantRelationships.push({
          entityId: record.entityId,
          entityType: record.entityType as 'CUSTOMER' | 'VENDOR',
          entityName,
          metrics,
          suggestedAction: `Re-engage ${record.entityType.toLowerCase()}. Last contact was ${metrics.daysSinceLastContact} days ago.`,
        });
      }

      this.logger.log(`Found ${dormantRelationships.length} dormant relationships`);

      return dormantRelationships;
    } catch (error) {
      this.logger.error(
        `Failed to get dormant relationships: ${error.message}`,
        error.stack,
      );
      return [];
    }
  }

  /**
   * Get summary of relationship health across organization
   */
  async getRelationshipSummary(orgId: string): Promise<RelationshipSummary> {
    this.logger.log(`Getting relationship summary for org ${orgId}`);

    try {
      const metricsRecords = await this.prisma.relationshipMetrics.findMany({
        where: {
          organisationId: orgId,
        },
      });

      const summary: RelationshipSummary = {
        excellent: 0,
        good: 0,
        needsAttention: 0,
        atRisk: 0,
        dormant: 0,
        totalRelationships: metricsRecords.length,
      };

      for (const record of metricsRecords) {
        switch (record.healthStatus) {
          case HealthStatus.EXCELLENT:
            summary.excellent++;
            break;
          case HealthStatus.GOOD:
            summary.good++;
            break;
          case HealthStatus.NEEDS_ATTENTION:
            summary.needsAttention++;
            break;
          case HealthStatus.AT_RISK:
            summary.atRisk++;
            break;
          case HealthStatus.DORMANT:
            summary.dormant++;
            break;
        }
      }

      this.logger.log(
        `Relationship summary: ${summary.excellent} excellent, ${summary.good} good, ${summary.needsAttention} needs attention, ${summary.atRisk} at risk, ${summary.dormant} dormant`,
      );

      return summary;
    } catch (error) {
      this.logger.error(
        `Failed to get relationship summary: ${error.message}`,
        error.stack,
      );
      return {
        excellent: 0,
        good: 0,
        needsAttention: 0,
        atRisk: 0,
        dormant: 0,
        totalRelationships: 0,
      };
    }
  }

  /**
   * Calculate all metrics from email history
   */
  private async calculateMetricsFromHistory(
    emailHistory: EmailRecord[],
    entityId: string,
    entityType: 'CUSTOMER' | 'VENDOR',
    orgId: string,
  ): Promise<RelationshipMetrics> {
    const now = new Date();

    // Sort by date
    const sortedEmails = emailHistory.sort(
      (a, b) => a.date.getTime() - b.date.getTime(),
    );

    // Communication metrics
    const totalEmails = sortedEmails.length;
    const emailsSent = sortedEmails.filter((e) => this.isEmailFromUs(e.from)).length;
    const emailsReceived = totalEmails - emailsSent;

    // Last contact
    const lastContactDate =
      sortedEmails.length > 0
        ? sortedEmails[sortedEmails.length - 1].date
        : now;
    const daysSinceLastContact = Math.floor(
      (now.getTime() - lastContactDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    // Average response time (simplified - hours between emails)
    const avgResponseTime = this.calculateAvgResponseTime(sortedEmails);

    // Communication frequency and trend
    const communicationFrequency = this.classifyFrequency(
      sortedEmails,
      daysSinceLastContact,
    );
    const trend = await this.calculateTrend(sortedEmails);

    // Financial metrics (for customers only)
    let financialMetrics = {};
    if (entityType === 'CUSTOMER') {
      financialMetrics = await this.calculateFinancialMetrics(entityId, orgId);
    }

    // Calculate health score
    const healthScore = this.calculateScore(
      daysSinceLastContact,
      avgResponseTime,
      trend,
      communicationFrequency,
      financialMetrics,
    );

    // Determine health status
    const healthStatus = this.getHealthStatus(healthScore, daysSinceLastContact);

    // Generate alerts
    const alerts = this.generateAlerts(
      healthScore,
      healthStatus,
      daysSinceLastContact,
      trend,
      financialMetrics,
      entityType,
    );

    return {
      totalEmails,
      emailsSent,
      emailsReceived,
      avgResponseTime,
      lastContactDate,
      daysSinceLastContact,
      communicationFrequency,
      trend,
      healthScore,
      healthStatus,
      alerts,
      lastCalculated: now,
      ...financialMetrics,
    };
  }

  /**
   * Calculate health score based on multiple factors
   * Base score: 50
   * Adjustments: +/- points for various factors
   * Final range: 0-100
   */
  private calculateScore(
    daysSinceLastContact: number,
    avgResponseTime: number,
    trend: CommunicationTrend,
    frequency: CommunicationFrequency,
    financialMetrics: any,
  ): number {
    let score = 50; // Base score

    // Communication recency (max +15, min -20)
    if (daysSinceLastContact <= 7) {
      score += 15;
    } else if (daysSinceLastContact <= 30) {
      score += 5;
    } else if (daysSinceLastContact <= 60) {
      score -= 10;
    } else {
      score -= 20; // Dormant
    }

    // Response time (max +10)
    if (avgResponseTime < 4) {
      score += 10;
    } else if (avgResponseTime < 24) {
      score += 5;
    } else if (avgResponseTime > 72) {
      score -= 5;
    }

    // Communication trend (max +10, min -10)
    if (trend === CommunicationTrend.INCREASING) {
      score += 10;
    } else if (trend === CommunicationTrend.DECREASING) {
      score -= 10;
    }

    // Communication frequency (max +10, min -10)
    switch (frequency) {
      case CommunicationFrequency.DAILY:
        score += 10;
        break;
      case CommunicationFrequency.WEEKLY:
        score += 5;
        break;
      case CommunicationFrequency.SPORADIC:
        score -= 5;
        break;
      case CommunicationFrequency.DORMANT:
        score -= 10;
        break;
    }

    // Payment behavior (customers only, max +20, min -20)
    if (financialMetrics.paymentBehavior) {
      switch (financialMetrics.paymentBehavior) {
        case PaymentBehavior.EARLY:
          score += 20;
          break;
        case PaymentBehavior.ON_TIME:
          score += 10;
          break;
        case PaymentBehavior.LATE:
          score -= 10;
          break;
        case PaymentBehavior.VERY_LATE:
          score -= 20;
          break;
      }
    }

    // Cap at 0-100
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Determine health status from score and days since contact
   */
  private getHealthStatus(
    score: number,
    daysSinceLastContact: number,
  ): HealthStatus {
    // Dormant overrides score
    if (daysSinceLastContact > DORMANT_THRESHOLD_DAYS) {
      return HealthStatus.DORMANT;
    }

    if (score >= 80) return HealthStatus.EXCELLENT;
    if (score >= 60) return HealthStatus.GOOD;
    if (score >= 40) return HealthStatus.NEEDS_ATTENTION;
    if (score >= 20) return HealthStatus.AT_RISK;
    return HealthStatus.DORMANT;
  }

  /**
   * Generate alerts based on metrics
   */
  private generateAlerts(
    healthScore: number,
    healthStatus: HealthStatus,
    daysSinceLastContact: number,
    trend: CommunicationTrend,
    financialMetrics: any,
    entityType: 'CUSTOMER' | 'VENDOR',
  ): RelationshipAlert[] {
    const alerts: RelationshipAlert[] = [];

    // Dormant alert
    if (healthStatus === HealthStatus.DORMANT) {
      alerts.push({
        type: 'DORMANT_RELATIONSHIP',
        message: `No contact in ${daysSinceLastContact} days. Consider reaching out.`,
        priority: AlertPriority.HIGH,
      });
    }

    // At risk alert
    if (healthStatus === HealthStatus.AT_RISK) {
      alerts.push({
        type: 'AT_RISK_RELATIONSHIP',
        message: `Relationship health is declining (score: ${healthScore}). Review engagement.`,
        priority: AlertPriority.HIGH,
      });
    }

    // Decreasing trend alert
    if (trend === CommunicationTrend.DECREASING) {
      alerts.push({
        type: 'DECREASING_ENGAGEMENT',
        message: 'Communication frequency is decreasing. Monitor closely.',
        priority: AlertPriority.MEDIUM,
      });
    }

    // Late payment alert (customers)
    if (
      entityType === 'CUSTOMER' &&
      (financialMetrics.paymentBehavior === PaymentBehavior.LATE ||
        financialMetrics.paymentBehavior === PaymentBehavior.VERY_LATE)
    ) {
      alerts.push({
        type: 'LATE_PAYMENT_PATTERN',
        message: `Customer has a pattern of late payments (avg ${financialMetrics.avgPaymentDays} days).`,
        priority: AlertPriority.HIGH,
      });
    }

    // Needs attention alert
    if (
      healthStatus === HealthStatus.NEEDS_ATTENTION &&
      daysSinceLastContact > 30
    ) {
      alerts.push({
        type: 'NEEDS_ATTENTION',
        message: `No contact in ${daysSinceLastContact} days. Schedule follow-up.`,
        priority: AlertPriority.MEDIUM,
      });
    }

    return alerts;
  }

  /**
   * Calculate average response time in hours
   */
  private calculateAvgResponseTime(emails: EmailRecord[]): number {
    if (emails.length < 2) return 24; // Default 24 hours

    const responseTimes: number[] = [];

    for (let i = 1; i < emails.length; i++) {
      const timeDiff = emails[i].date.getTime() - emails[i - 1].date.getTime();
      const hours = timeDiff / (1000 * 60 * 60);
      responseTimes.push(hours);
    }

    if (responseTimes.length === 0) return 24;

    const avg =
      responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
    return Math.round(avg * 10) / 10; // Round to 1 decimal
  }

  /**
   * Classify communication frequency
   */
  private classifyFrequency(
    emails: EmailRecord[],
    daysSinceLastContact: number,
  ): CommunicationFrequency {
    if (daysSinceLastContact > DORMANT_THRESHOLD_DAYS) {
      return CommunicationFrequency.DORMANT;
    }

    if (emails.length === 0) {
      return CommunicationFrequency.DORMANT;
    }

    // Calculate emails per day over last 90 days
    const last90Days = new Date();
    last90Days.setDate(last90Days.getDate() - 90);

    const recentEmails = emails.filter((e) => e.date >= last90Days);
    const emailsPerDay = recentEmails.length / 90;

    if (emailsPerDay >= 1) return CommunicationFrequency.DAILY;
    if (emailsPerDay >= 0.3) return CommunicationFrequency.WEEKLY; // ~2-3 per week
    if (emailsPerDay >= 0.1) return CommunicationFrequency.MONTHLY; // ~3-4 per month
    return CommunicationFrequency.SPORADIC;
  }

  /**
   * Calculate communication trend by comparing periods
   */
  private async calculateTrend(
    emails: EmailRecord[],
  ): Promise<CommunicationTrend> {
    if (emails.length < 2) {
      return CommunicationTrend.STABLE;
    }

    const now = new Date();

    // Last 30 days
    const last30DaysStart = new Date();
    last30DaysStart.setDate(now.getDate() - 30);
    const last30 = emails.filter((e) => e.date >= last30DaysStart);

    // Previous 30 days (31-60 days ago)
    const previous30DaysStart = new Date();
    previous30DaysStart.setDate(now.getDate() - 60);
    const previous30DaysEnd = new Date();
    previous30DaysEnd.setDate(now.getDate() - 30);
    const previous30 = emails.filter(
      (e) => e.date >= previous30DaysStart && e.date < previous30DaysEnd,
    );

    if (previous30.length === 0) {
      return CommunicationTrend.STABLE; // Not enough history
    }

    const changePercent = ((last30.length - previous30.length) / previous30.length) * 100;

    if (changePercent > 20) return CommunicationTrend.INCREASING;
    if (changePercent < -20) return CommunicationTrend.DECREASING;
    return CommunicationTrend.STABLE;
  }

  /**
   * Calculate financial metrics for a customer
   */
  private async calculateFinancialMetrics(
    customerId: string,
    orgId: string,
  ): Promise<{
    totalInvoiced?: number;
    totalPaid?: number;
    avgPaymentDays?: number;
    paymentBehavior?: PaymentBehavior;
  }> {
    // This would query invoice/payment data from Prisma
    // For now, return placeholder
    // TODO: Implement when invoice schema is available

    return {
      totalInvoiced: 0,
      totalPaid: 0,
      avgPaymentDays: 0,
      paymentBehavior: PaymentBehavior.UNKNOWN,
    };
  }

  /**
   * Get email history for an entity
   * Currently retrieves from entity metadata
   * TODO: Consider separate email tracking table
   */
  private async getEmailHistory(
    entityId: string,
    entityType: 'CUSTOMER' | 'VENDOR',
    orgId: string,
  ): Promise<EmailRecord[]> {
    try {
      let entity: any;

      if (entityType === 'CUSTOMER') {
        entity = await this.prisma.customer.findUnique({
          where: { id: entityId },
        });
      } else {
        entity = await this.prisma.vendor.findUnique({
          where: { id: entityId },
        });
      }

      if (!entity || !entity.metadata) {
        return [];
      }

      const metadata = entity.metadata as Prisma.InputJsonValue;
      const emailHistory = metadata.emailHistory || [];

      return emailHistory.map((e: any) => ({
        date: new Date(e.date),
        from: e.from,
        to: e.to,
        subject: e.subject,
      }));
    } catch (error) {
      this.logger.error(
        `Failed to get email history: ${error.message}`,
        error.stack,
      );
      return [];
    }
  }

  /**
   * Store relationship metrics in database
   */
  private async storeMetrics(
    entityId: string,
    entityType: 'CUSTOMER' | 'VENDOR',
    orgId: string,
    metrics: RelationshipMetrics,
  ): Promise<void> {
    try {
      await this.prisma.relationshipMetrics.upsert({
        where: {
          entityId_entityType_organisationId: {
            entityId,
            entityType,
            organisationId: orgId,
          },
        },
        update: {
          metrics: metrics as Prisma.InputJsonValue,
          healthScore: metrics.healthScore,
          healthStatus: metrics.healthStatus,
        },
        create: {
          entityId,
          entityType,
          organisationId: orgId,
          metrics: metrics as Prisma.InputJsonValue,
          healthScore: metrics.healthScore,
          healthStatus: metrics.healthStatus,
        },
      });

      this.logger.debug(`Stored relationship metrics for ${entityType} ${entityId}`);
    } catch (error) {
      this.logger.error(`Failed to store metrics: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Generate suggested action for at-risk relationship
   */
  private generateSuggestedAction(
    metrics: RelationshipMetrics,
    entityType: string,
  ): string {
    if (metrics.healthStatus === HealthStatus.DORMANT) {
      return `Re-engage dormant ${entityType.toLowerCase()}. Last contact was ${metrics.daysSinceLastContact} days ago. Consider sending a check-in email or special offer.`;
    }

    if (metrics.trend === CommunicationTrend.DECREASING) {
      return `${entityType} engagement is declining. Schedule a call or meeting to discuss their needs and strengthen the relationship.`;
    }

    if (metrics.paymentBehavior === PaymentBehavior.LATE || metrics.paymentBehavior === PaymentBehavior.VERY_LATE) {
      return `Customer has late payment patterns (avg ${metrics.avgPaymentDays} days). Consider adjusting payment terms or implementing automatic reminders.`;
    }

    if (metrics.healthStatus === HealthStatus.AT_RISK) {
      return `Relationship health is low (score: ${metrics.healthScore}). Review communication history and reach out proactively to address any concerns.`;
    }

    return `Monitor ${entityType.toLowerCase()} relationship. Consider regular check-ins to maintain engagement.`;
  }

  /**
   * Check if email is from our organization
   * TODO: Make this configurable per organization
   */
  private isEmailFromUs(fromAddress: string): boolean {
    // This is a simple heuristic
    // In production, would check against organization's email domains
    const ourDomains = ['operate.guru', 'example.com']; // TODO: Make configurable

    const domain = fromAddress.split('@')[1]?.toLowerCase();
    return ourDomains.some((d) => domain?.includes(d));
  }
}
