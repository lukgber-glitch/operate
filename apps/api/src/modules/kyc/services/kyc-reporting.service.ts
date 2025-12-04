import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { KycStatus, KycRiskLevel, KycProvider, KycStatistics } from '../types/kyc.types';
import { KycStatisticsDto, PendingReviewItemDto } from '../dto/kyc-report.dto';

/**
 * KYC Reporting Service
 * Provides reporting and analytics for KYC verifications
 *
 * Features:
 * - Overall statistics
 * - Pending review queue
 * - Performance metrics
 * - Trend analysis
 */
@Injectable()
export class KycReportingService {
  private readonly logger = new Logger(KycReportingService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get KYC verification statistics
   *
   * @param organisationId - Optional organization filter
   * @param startDate - Optional start date
   * @param endDate - Optional end date
   * @returns Statistics
   */
  async getStatistics(
    organisationId?: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<KycStatisticsDto> {
    this.logger.log('Generating KYC statistics');

    // Build WHERE clause
    const whereConditions: string[] = [];
    const params: any[] = [];

    if (organisationId) {
      whereConditions.push(`organisation_id = $${params.length + 1}`);
      params.push(organisationId);
    }

    if (startDate) {
      whereConditions.push(`created_at >= $${params.length + 1}`);
      params.push(startDate);
    }

    if (endDate) {
      whereConditions.push(`created_at <= $${params.length + 1}`);
      params.push(endDate);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Get total count
    const totalResult = await this.prisma.$queryRaw<any[]>`
      SELECT COUNT(*)::int as total
      FROM kyc_verifications
      ${whereClause ? this.prisma.$queryRawUnsafe(`WHERE ${whereConditions.join(' AND ')}`, ...params) : this.prisma.$queryRaw``}
    `;

    const total = whereClause
      ? await this.getCountWithFilter(whereConditions, params)
      : await this.getTotalCount();

    // Get counts by status
    const byStatus = await this.getCountByField('status', whereConditions, params);

    // Get counts by risk level
    const byRiskLevel = await this.getCountByField('risk_level', whereConditions, params);

    // Get counts by provider
    const byProvider = await this.getCountByField('provider', whereConditions, params);

    // Get average processing time
    const avgProcessingTime = await this.getAverageProcessingTime(whereConditions, params);

    // Get pending review count
    const pendingReview = byStatus[KycStatus.IN_REVIEW] || 0;

    // Get expiring count
    const expiringIn30Days = await this.getExpiringCount(30, whereConditions, params);

    // Calculate rates
    const approved = byStatus[KycStatus.APPROVED] || 0;
    const rejected = byStatus[KycStatus.REJECTED] || 0;
    const completed = approved + rejected;
    const approvalRate = completed > 0 ? (approved / completed) * 100 : 0;
    const rejectionRate = completed > 0 ? (rejected / completed) * 100 : 0;

    return {
      total,
      byStatus,
      byRiskLevel,
      byProvider,
      averageProcessingTime: avgProcessingTime,
      pendingReview,
      expiringIn30Days,
      approvalRate: Math.round(approvalRate * 10) / 10,
      rejectionRate: Math.round(rejectionRate * 10) / 10,
    };
  }

  /**
   * Get pending review queue
   *
   * @param organisationId - Optional organization filter
   * @param limit - Maximum results
   * @returns List of verifications pending review
   */
  async getPendingReview(
    organisationId?: string,
    limit: number = 50,
  ): Promise<PendingReviewItemDto[]> {
    this.logger.log('Getting pending review queue');

    const orgFilter = organisationId ? `AND v.organisation_id = ${organisationId}` : '';

    const pending = await this.prisma.$queryRaw<any[]>`
      SELECT
        v.id,
        v.user_id,
        v.organisation_id,
        v.level,
        v.risk_score,
        v.risk_level,
        v.submitted_at,
        v.provider_ref_id,
        u.email,
        u.first_name,
        u.last_name,
        o.name as organisation_name,
        EXTRACT(DAY FROM NOW() - v.submitted_at)::int as days_waiting
      FROM kyc_verifications v
      INNER JOIN users u ON v.user_id = u.id
      INNER JOIN organisations o ON v.organisation_id = o.id
      WHERE v.status = ${KycStatus.IN_REVIEW}
        ${orgFilter ? this.prisma.$queryRawUnsafe(orgFilter) : this.prisma.$queryRaw``}
      ORDER BY v.submitted_at ASC
      LIMIT ${limit}
    `;

    return pending.map((item) => ({
      id: item.id,
      userId: item.user_id,
      userName: `${item.first_name} ${item.last_name}`,
      userEmail: item.email,
      organisationId: item.organisation_id,
      organisationName: item.organisation_name,
      level: item.level,
      riskScore: item.risk_score,
      riskLevel: item.risk_level,
      submittedAt: item.submitted_at,
      daysWaiting: item.days_waiting || 0,
      providerRefId: item.provider_ref_id,
    }));
  }

  /**
   * Get verification trend data
   *
   * @param days - Number of days to include
   * @param organisationId - Optional organization filter
   * @returns Daily verification counts
   */
  async getVerificationTrend(
    days: number = 30,
    organisationId?: string,
  ): Promise<Array<{ date: string; count: number; approved: number; rejected: number }>> {
    this.logger.log(`Getting verification trend for last ${days} days`);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const orgFilter = organisationId ? `AND organisation_id = ${organisationId}` : '';

    const trend = await this.prisma.$queryRaw<any[]>`
      SELECT
        DATE(created_at) as date,
        COUNT(*)::int as count,
        COUNT(*) FILTER (WHERE status = ${KycStatus.APPROVED})::int as approved,
        COUNT(*) FILTER (WHERE status = ${KycStatus.REJECTED})::int as rejected
      FROM kyc_verifications
      WHERE created_at >= ${startDate}
        ${orgFilter ? this.prisma.$queryRawUnsafe(orgFilter) : this.prisma.$queryRaw``}
      GROUP BY DATE(created_at)
      ORDER BY DATE(created_at) ASC
    `;

    return trend.map((item) => ({
      date: item.date.toISOString().split('T')[0],
      count: item.count,
      approved: item.approved,
      rejected: item.rejected,
    }));
  }

  /**
   * Get risk distribution
   *
   * @param organisationId - Optional organization filter
   * @returns Risk score distribution
   */
  async getRiskDistribution(
    organisationId?: string,
  ): Promise<Array<{ range: string; count: number }>> {
    this.logger.log('Getting risk score distribution');

    const orgFilter = organisationId ? `WHERE organisation_id = ${organisationId}` : '';

    const distribution = await this.prisma.$queryRaw<any[]>`
      SELECT
        CASE
          WHEN risk_score IS NULL THEN 'Unknown'
          WHEN risk_score < 25 THEN '0-25 (Low)'
          WHEN risk_score < 50 THEN '25-50 (Medium)'
          WHEN risk_score < 75 THEN '50-75 (High)'
          ELSE '75-100 (Critical)'
        END as range,
        COUNT(*)::int as count
      FROM kyc_verifications
      ${orgFilter ? this.prisma.$queryRawUnsafe(orgFilter) : this.prisma.$queryRaw``}
      GROUP BY range
      ORDER BY
        CASE range
          WHEN '0-25 (Low)' THEN 1
          WHEN '25-50 (Medium)' THEN 2
          WHEN '50-75 (High)' THEN 3
          WHEN '75-100 (Critical)' THEN 4
          ELSE 5
        END
    `;

    return distribution;
  }

  /**
   * Get total count with optional filters
   */
  private async getTotalCount(): Promise<number> {
    const result = await this.prisma.$queryRaw<any[]>`
      SELECT COUNT(*)::int as total FROM kyc_verifications
    `;
    return result[0].total;
  }

  /**
   * Get count with filters
   */
  private async getCountWithFilter(
    whereConditions: string[],
    params: any[],
  ): Promise<number> {
    if (whereConditions.length === 0) {
      return this.getTotalCount();
    }

    const query = `SELECT COUNT(*)::int as total FROM kyc_verifications WHERE ${whereConditions.join(' AND ')}`;
    const result = await this.prisma.$queryRawUnsafe<any[]>(query, ...params);
    return result[0].total;
  }

  /**
   * Get count grouped by field
   */
  private async getCountByField(
    field: string,
    whereConditions: string[],
    params: any[],
  ): Promise<Record<string, number>> {
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const query = `
      SELECT ${field}, COUNT(*)::int as count
      FROM kyc_verifications
      ${whereClause}
      GROUP BY ${field}
    `;

    const results = whereConditions.length > 0
      ? await this.prisma.$queryRawUnsafe<any[]>(query, ...params)
      : await this.prisma.$queryRawUnsafe<any[]>(query);

    const counts: Record<string, number> = {};
    for (const row of results) {
      const key = row[field];
      if (key) {
        counts[key] = row.count;
      }
    }

    return counts;
  }

  /**
   * Get average processing time in hours
   */
  private async getAverageProcessingTime(
    whereConditions: string[],
    params: any[],
  ): Promise<number> {
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const query = `
      SELECT
        EXTRACT(EPOCH FROM AVG(reviewed_at - submitted_at)) / 3600 as avg_hours
      FROM kyc_verifications
      ${whereClause}
        ${whereConditions.length > 0 ? 'AND' : 'WHERE'} submitted_at IS NOT NULL
        AND reviewed_at IS NOT NULL
    `;

    const result = whereConditions.length > 0
      ? await this.prisma.$queryRawUnsafe<any[]>(query, ...params)
      : await this.prisma.$queryRawUnsafe<any[]>(query);

    return result[0]?.avg_hours ? Math.round(result[0].avg_hours * 10) / 10 : 0;
  }

  /**
   * Get count of verifications expiring within days
   */
  private async getExpiringCount(
    days: number,
    whereConditions: string[],
    params: any[],
  ): Promise<number> {
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() + days);

    const conditions = [
      ...whereConditions,
      `status = '${KycStatus.APPROVED}'`,
      'expires_at IS NOT NULL',
      `expires_at <= $${params.length + 1}`,
      'expires_at > NOW()',
    ];

    const query = `
      SELECT COUNT(*)::int as count
      FROM kyc_verifications
      WHERE ${conditions.join(' AND ')}
    `;

    const result = await this.prisma.$queryRawUnsafe<any[]>(query, ...params, thresholdDate);
    return result[0]?.count || 0;
  }
}
