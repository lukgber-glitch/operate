import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/modules/database/prisma.service';
import { PersonaInquiryService } from '../../integrations/persona/services/persona-inquiry.service';
import { PersonaVerificationService } from '../../integrations/persona/services/persona-verification.service';
import {
  KycStatus,
  KycLevel,
  KycProvider,
  KycRiskLevel,
  DocumentInfo,
  CheckResult,
} from '../types/kyc.types';
import { StartVerificationDto } from '../dto/start-verification.dto';
import { VerificationStatusDto } from '../dto/verification-status.dto';
import { PersonaInquiryStatus } from '../../integrations/persona/types/persona.types';

/**
 * KYC Verification Service
 * Main orchestration service for KYC verification processes
 *
 * Features:
 * - Start verification with Persona or internal provider
 * - Get verification status
 * - Sync verification status from providers
 * - Calculate risk scores
 * - Map provider results to KYC status
 */
@Injectable()
export class KycVerificationService {
  private readonly logger = new Logger(KycVerificationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly personaInquiryService: PersonaInquiryService,
    private readonly personaVerificationService: PersonaVerificationService,
  ) {}

  /**
   * Start a new KYC verification process
   *
   * @param dto - Verification start parameters
   * @param initiatedBy - User ID who initiated the verification
   * @returns Verification status with embedded URL
   */
  async startVerification(
    dto: StartVerificationDto,
    initiatedBy: string,
  ): Promise<VerificationStatusDto> {
    this.logger.log(`Starting KYC verification for user ${dto.userId}`);

    // Check if user already has a verification
    const existing = await this.prisma.$queryRaw<any[]>`
      SELECT id, status, expires_at
      FROM kyc_verifications
      WHERE user_id = ${dto.userId}
      LIMIT 1
    `;

    if (existing.length > 0) {
      const verification = existing[0];

      // If active verification exists, return it
      if (
        verification.status === KycStatus.PENDING ||
        verification.status === KycStatus.IN_REVIEW
      ) {
        this.logger.log(`Active verification already exists for user ${dto.userId}`);
        return this.getVerificationStatus(dto.userId);
      }

      // If approved and not expired, return current status
      if (
        verification.status === KycStatus.APPROVED &&
        verification.expires_at &&
        new Date(verification.expires_at) > new Date()
      ) {
        this.logger.log(`User ${dto.userId} already has valid KYC approval`);
        return this.getVerificationStatus(dto.userId);
      }
    }

    const provider = dto.provider || KycProvider.PERSONA;

    // Calculate expiry date (1 year for KYC)
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    let providerRefId: string | undefined;
    let embeddedUrl: string | undefined;

    // Create verification with provider
    if (provider === KycProvider.PERSONA) {
      const templateId = this.getPersonaTemplateId(dto.level);

      const inquiry = await this.personaInquiryService.createInquiry(dto.userId, {
        templateId,
        organisationId: dto.organisationId,
        verificationLevel: dto.level,
        referenceId: `kyc-${dto.userId}`,
        metadata: dto.metadata,
      });

      providerRefId = inquiry.inquiryId;
      embeddedUrl = inquiry.embeddedUrl;
    }

    // Create or update KYC verification record
    const verificationId = await this.createOrUpdateVerification({
      userId: dto.userId,
      organisationId: dto.organisationId,
      status: KycStatus.PENDING,
      level: dto.level,
      provider,
      providerRefId,
      expiresAt,
    });

    this.logger.log(`KYC verification created: ${verificationId}`);

    // Get the full verification status
    const status = await this.getVerificationStatus(dto.userId);

    if (embeddedUrl) {
      status.embeddedUrl = embeddedUrl;
      status.nextSteps = 'Complete the identity verification using the provided link';
    }

    return status;
  }

  /**
   * Get verification status for a user
   *
   * @param userId - User ID
   * @returns Verification status
   */
  async getVerificationStatus(userId: string): Promise<VerificationStatusDto> {
    this.logger.log(`Getting KYC verification status for user ${userId}`);

    const verifications = await this.prisma.$queryRaw<any[]>`
      SELECT *
      FROM kyc_verifications
      WHERE user_id = ${userId}
      LIMIT 1
    `;

    if (verifications.length === 0) {
      throw new NotFoundException(`No KYC verification found for user ${userId}`);
    }

    const verification = verifications[0];

    // If using Persona, sync the latest status
    if (verification.provider === KycProvider.PERSONA && verification.provider_ref_id) {
      await this.syncPersonaStatus(verification.provider_ref_id, verification.id);

      // Re-fetch after sync
      const updated = await this.prisma.$queryRaw<any[]>`
        SELECT *
        FROM kyc_verifications
        WHERE id = ${verification.id}
        LIMIT 1
      `;

      if (updated.length > 0) {
        return this.mapToStatusDto(updated[0]);
      }
    }

    return this.mapToStatusDto(verification);
  }

  /**
   * Sync verification status from Persona
   *
   * @param inquiryId - Persona inquiry ID
   * @param verificationId - KYC verification ID
   */
  async syncPersonaStatus(inquiryId: string, verificationId: string): Promise<void> {
    try {
      this.logger.log(`Syncing Persona status for inquiry ${inquiryId}`);

      const inquiry = await this.personaInquiryService.getInquiry(inquiryId);
      const verifications = await this.personaVerificationService.getVerificationsByInquiry(inquiryId);

      // Map Persona status to KYC status
      const kycStatus = this.mapPersonaStatusToKycStatus(
        inquiry.attributes.status as PersonaInquiryStatus,
      );

      // Calculate risk score from verification results
      const riskScore = this.calculateRiskScore(verifications);
      const riskLevel = this.getRiskLevel(riskScore);

      // Map verification checks
      const checks: CheckResult[] = verifications.map((v: any) => ({
        checkType: v.verification_type,
        status: v.status === 'passed' ? 'passed' : v.status === 'failed' ? 'failed' : 'pending',
        completedAt: v.completed_at ? new Date(v.completed_at) : undefined,
        details: v.metadata || {},
      }));

      // Update verification record
      await this.prisma.$executeRaw`
        UPDATE kyc_verifications
        SET
          status = ${kycStatus},
          risk_score = ${riskScore},
          risk_level = ${riskLevel},
          checks = ${JSON.stringify(checks)}::jsonb,
          submitted_at = CASE
            WHEN submitted_at IS NULL AND ${kycStatus} != ${KycStatus.NOT_STARTED}
            THEN NOW()
            ELSE submitted_at
          END,
          updated_at = NOW()
        WHERE id = ${verificationId}
      `;

      this.logger.log(`Synced verification ${verificationId} to status ${kycStatus}`);
    } catch (error) {
      this.logger.error(`Failed to sync Persona status for inquiry ${inquiryId}`, error);
      // Don't throw - sync is best effort
    }
  }

  /**
   * Map Persona inquiry status to KYC status
   */
  private mapPersonaStatusToKycStatus(personaStatus: PersonaInquiryStatus): KycStatus {
    const mapping: Record<PersonaInquiryStatus, KycStatus> = {
      [PersonaInquiryStatus.CREATED]: KycStatus.NOT_STARTED,
      [PersonaInquiryStatus.PENDING]: KycStatus.PENDING,
      [PersonaInquiryStatus.COMPLETED]: KycStatus.IN_REVIEW,
      [PersonaInquiryStatus.APPROVED]: KycStatus.APPROVED,
      [PersonaInquiryStatus.DECLINED]: KycStatus.REJECTED,
      [PersonaInquiryStatus.EXPIRED]: KycStatus.EXPIRED,
      [PersonaInquiryStatus.FAILED]: KycStatus.REJECTED,
      [PersonaInquiryStatus.MARKED_FOR_REVIEW]: KycStatus.IN_REVIEW,
    };

    return mapping[personaStatus] || KycStatus.PENDING;
  }

  /**
   * Calculate risk score from verification results
   */
  private calculateRiskScore(verifications: any[]): number {
    if (verifications.length === 0) return 50; // Default medium risk

    const totalChecks = verifications.length;
    const passedChecks = verifications.filter((v) => v.status === 'passed').length;
    const failedChecks = verifications.filter((v) => v.status === 'failed').length;

    // Calculate base score (lower is better)
    const passRate = passedChecks / totalChecks;
    const failRate = failedChecks / totalChecks;

    let score = (1 - passRate) * 100; // 0-100 scale
    score += failRate * 50; // Add penalty for failures

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Get risk level from risk score
   */
  private getRiskLevel(riskScore: number): KycRiskLevel {
    if (riskScore < 25) return KycRiskLevel.LOW;
    if (riskScore < 50) return KycRiskLevel.MEDIUM;
    if (riskScore < 75) return KycRiskLevel.HIGH;
    return KycRiskLevel.CRITICAL;
  }

  /**
   * Get Persona template ID for verification level
   */
  private getPersonaTemplateId(level: KycLevel): string {
    // These would be configured per environment
    const templates: Record<KycLevel, string> = {
      [KycLevel.BASIC]: process.env.PERSONA_TEMPLATE_BASIC || 'itmpl_basic',
      [KycLevel.ENHANCED]: process.env.PERSONA_TEMPLATE_ENHANCED || 'itmpl_enhanced',
      [KycLevel.FULL]: process.env.PERSONA_TEMPLATE_FULL || 'itmpl_full',
    };

    return templates[level];
  }

  /**
   * Create or update verification record
   */
  private async createOrUpdateVerification(data: {
    userId: string;
    organisationId: string;
    status: KycStatus;
    level: KycLevel;
    provider: KycProvider;
    providerRefId?: string;
    expiresAt: Date;
  }): Promise<string> {
    const existing = await this.prisma.$queryRaw<any[]>`
      SELECT id FROM kyc_verifications WHERE user_id = ${data.userId} LIMIT 1
    `;

    if (existing.length > 0) {
      // Update existing
      await this.prisma.$executeRaw`
        UPDATE kyc_verifications
        SET
          organisation_id = ${data.organisationId},
          status = ${data.status},
          level = ${data.level},
          provider = ${data.provider},
          provider_ref_id = ${data.providerRefId || null},
          expires_at = ${data.expiresAt},
          updated_at = NOW()
        WHERE id = ${existing[0].id}
      `;
      return existing[0].id;
    } else {
      // Create new
      const result = await this.prisma.$queryRaw<any[]>`
        INSERT INTO kyc_verifications
        (id, user_id, organisation_id, status, level, provider, provider_ref_id, expires_at, created_at, updated_at)
        VALUES
        (gen_random_uuid(), ${data.userId}, ${data.organisationId}, ${data.status}, ${data.level}, ${data.provider}, ${data.providerRefId || null}, ${data.expiresAt}, NOW(), NOW())
        RETURNING id
      `;
      return result[0].id;
    }
  }

  /**
   * Map database record to DTO
   */
  private mapToStatusDto(verification: any): VerificationStatusDto {
    return {
      id: verification.id,
      userId: verification.user_id,
      organisationId: verification.organisation_id,
      status: verification.status as KycStatus,
      level: verification.level as KycLevel,
      provider: verification.provider as KycProvider,
      providerRefId: verification.provider_ref_id,
      riskScore: verification.risk_score,
      riskLevel: verification.risk_level as KycRiskLevel,
      submittedAt: verification.submitted_at,
      reviewedAt: verification.reviewed_at,
      reviewedBy: verification.reviewed_by,
      decisionReason: verification.decision_reason,
      expiresAt: verification.expires_at,
      documents: verification.documents || [],
      checks: verification.checks || [],
      createdAt: verification.created_at,
      updatedAt: verification.updated_at,
    };
  }
}
