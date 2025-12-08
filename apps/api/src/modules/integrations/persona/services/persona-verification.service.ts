import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { PersonaService } from '../persona.service';
import {
  PersonaVerificationObject,
  PersonaVerificationStatus,
  PersonaVerificationType,
  PersonaInquiryObject,
} from '../types/persona.types';
import { VerificationResultDto, VerificationDto } from '../dto';

/**
 * Persona Verification Service
 * Manages verification results and checks
 *
 * Features:
 * - Process verification results from inquiries
 * - Store verification checks in database
 * - Retrieve verification history
 * - Analyze failure reasons
 */
@Injectable()
export class PersonaVerificationService {
  private readonly logger = new Logger(PersonaVerificationService.name);

  constructor(
    private readonly personaService: PersonaService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Process verification results for an inquiry
   *
   * @param inquiryId - Persona inquiry ID
   * @returns Complete verification results
   */
  async processVerificationResults(
    inquiryId: string,
  ): Promise<VerificationResultDto> {
    this.logger.log(`Processing verification results for inquiry ${inquiryId}`);

    try {
      // Get inquiry details with included verifications
      const inquiry = await this.personaService.get<PersonaInquiryObject>(
        `/inquiries/${inquiryId}`,
        { include: 'verifications' },
      );

      // Get verification IDs from relationships
      const verificationIds =
        inquiry.data.relationships?.verifications?.data?.map((v) => v.id) || [];

      // Fetch each verification
      const verifications: VerificationDto[] = [];
      for (const verificationId of verificationIds) {
        const verification = await this.getVerification(verificationId);
        verifications.push(verification);

        // Store in database
        await this.storeVerification(inquiryId, verification);
      }

      // Get user and organization from database
      const inquiryRecord = await this.prisma.$queryRaw<any[]>`
        SELECT user_id, organization_id, reference_id
        FROM persona_inquiries
        WHERE inquiry_id = ${inquiryId}
        LIMIT 1
      `;

      if (inquiryRecord.length === 0) {
        throw new Error(`Inquiry ${inquiryId} not found in database`);
      }

      const { user_id, organization_id, reference_id } = inquiryRecord[0];

      // Determine if approved
      const isApproved =
        inquiry.data.attributes.status === 'approved' ||
        verifications.every(
          (v) => v.status === PersonaVerificationStatus.PASSED,
        );

      // Collect failure reasons
      const failureReasons: string[] = [];
      verifications.forEach((v) => {
        v.checks.forEach((check) => {
          if (
            check.status === PersonaVerificationStatus.FAILED &&
            check.reasons
          ) {
            failureReasons.push(...check.reasons);
          }
        });
      });

      this.logger.log(
        `Verification results processed for inquiry ${inquiryId}: ${isApproved ? 'APPROVED' : 'DECLINED'}`,
      );

      return {
        inquiryId,
        status: inquiry.data.attributes.status as Prisma.InputJsonValue,
        referenceId: reference_id,
        userId: user_id,
        organizationId: organization_id,
        verifications,
        createdAt: new Date(inquiry.data.attributes['created-at']),
        completedAt: inquiry.data.attributes['completed-at']
          ? new Date(inquiry.data.attributes['completed-at'])
          : undefined,
        isApproved,
        failureReasons: failureReasons.length > 0 ? failureReasons : undefined,
      };
    } catch (error) {
      this.logger.error(
        `Failed to process verification results for ${inquiryId}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Get verification details
   *
   * @param verificationId - Persona verification ID
   * @returns Verification details
   */
  async getVerification(verificationId: string): Promise<VerificationDto> {
    this.logger.log(`Retrieving verification: ${verificationId}`);

    try {
      const response = await this.personaService.get<PersonaVerificationObject>(
        `/verifications/${verificationId}`,
      );

      const verification = response.data;

      return {
        id: verification.id,
        type: verification.type as PersonaVerificationType,
        status: verification.attributes.status,
        checks:
          verification.attributes.checks?.map((check) => ({
            name: check.name,
            status: check.status,
            reasons: check.reasons,
            metadata: check.metadata,
          })) || [],
        createdAt: new Date(verification.attributes['created-at']),
        completedAt: verification.attributes['completed-at']
          ? new Date(verification.attributes['completed-at'])
          : undefined,
      };
    } catch (error) {
      this.logger.error(`Failed to retrieve verification ${verificationId}`, error);
      throw error;
    }
  }

  /**
   * Store verification in database
   *
   * @param inquiryId - Associated inquiry ID
   * @param verification - Verification data
   */
  private async storeVerification(
    inquiryId: string,
    verification: VerificationDto,
  ): Promise<void> {
    try {
      await this.prisma.$executeRaw`
        INSERT INTO persona_verifications
        (id, inquiry_id, verification_type, status, checks, created_at, updated_at)
        VALUES
        (
          gen_random_uuid(),
          ${inquiryId},
          ${verification.type},
          ${verification.status},
          ${JSON.stringify(verification.checks)}::jsonb,
          NOW(),
          NOW()
        )
        ON CONFLICT (inquiry_id, verification_type)
        DO UPDATE SET
          status = EXCLUDED.status,
          checks = EXCLUDED.checks,
          updated_at = NOW()
      `;

      this.logger.log(
        `Stored verification ${verification.id} for inquiry ${inquiryId}`,
      );
    } catch (error) {
      this.logger.error('Failed to store verification', error);
      // Don't throw - continue processing other verifications
    }
  }

  /**
   * Get verification history for an inquiry
   *
   * @param inquiryId - Persona inquiry ID
   * @returns List of verifications
   */
  async getVerificationHistory(inquiryId: string): Promise<any[]> {
    this.logger.log(`Retrieving verification history for ${inquiryId}`);

    try {
      const verifications = await this.prisma.$queryRaw<any[]>`
        SELECT
          id,
          verification_type,
          status,
          checks,
          created_at,
          updated_at
        FROM persona_verifications
        WHERE inquiry_id = ${inquiryId}
        ORDER BY created_at DESC
      `;

      return verifications;
    } catch (error) {
      this.logger.error(
        `Failed to retrieve verification history for ${inquiryId}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Get verification statistics for a user
   *
   * @param userId - User ID
   * @returns Verification statistics
   */
  async getUserVerificationStats(userId: string): Promise<{
    total: number;
    approved: number;
    declined: number;
    pending: number;
    passRate: number;
  }> {
    this.logger.log(`Retrieving verification stats for user ${userId}`);

    try {
      const stats = await this.prisma.$queryRaw<any[]>`
        SELECT
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE status = 'approved') as approved,
          COUNT(*) FILTER (WHERE status = 'declined') as declined,
          COUNT(*) FILTER (WHERE status IN ('pending', 'needs_review')) as pending
        FROM persona_inquiries
        WHERE user_id = ${userId}
      `;

      const { total, approved, declined, pending } = stats[0];
      const passRate = total > 0 ? (approved / total) * 100 : 0;

      return {
        total: parseInt(total, 10),
        approved: parseInt(approved, 10),
        declined: parseInt(declined, 10),
        pending: parseInt(pending, 10),
        passRate: Math.round(passRate * 100) / 100,
      };
    } catch (error) {
      this.logger.error(
        `Failed to retrieve verification stats for user ${userId}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Analyze common failure reasons across verifications
   *
   * @param organizationId - Organization ID
   * @returns Top failure reasons
   */
  async analyzeFailureReasons(organizationId: string): Promise<
    Array<{
      reason: string;
      count: number;
      percentage: number;
    }>
  > {
    this.logger.log(
      `Analyzing failure reasons for organization ${organizationId}`,
    );

    try {
      // This would require more complex JSON aggregation
      // For now, return a simplified version
      const verifications = await this.prisma.$queryRaw<any[]>`
        SELECT checks
        FROM persona_verifications pv
        JOIN persona_inquiries pi ON pv.inquiry_id = pi.inquiry_id
        WHERE pi.organization_id = ${organizationId}
          AND pv.status = 'failed'
      `;

      // Aggregate failure reasons
      const reasonCounts: Record<string, number> = {};
      let totalReasons = 0;

      verifications.forEach((v) => {
        const checks = v.checks;
        if (Array.isArray(checks)) {
          checks.forEach((check: any) => {
            if (check.reasons && Array.isArray(check.reasons)) {
              check.reasons.forEach((reason: string) => {
                reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
                totalReasons++;
              });
            }
          });
        }
      });

      // Convert to sorted array
      const results = Object.entries(reasonCounts)
        .map(([reason, count]) => ({
          reason,
          count,
          percentage: Math.round((count / totalReasons) * 100 * 100) / 100,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10); // Top 10

      return results;
    } catch (error) {
      this.logger.error('Failed to analyze failure reasons', error);
      throw error;
    }
  }
}
