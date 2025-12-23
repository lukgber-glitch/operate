import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/modules/database/prisma.service';
import { KycVerificationService } from './kyc-verification.service';
import { KycDecisionService } from './kyc-decision.service';
import {
  KycStatus,
  KycLevel,
  CustomerType,
  RequirementType,
  KycRequirementData,
  KycWorkflowConfig,
} from '../types/kyc.types';

/**
 * KYC Workflow Service
 * Manages KYC verification workflows and requirements
 *
 * Features:
 * - Country-specific requirements management
 * - Workflow configuration by verification level
 * - Re-verification scheduling
 * - Requirement validation
 */
@Injectable()
export class KycWorkflowService {
  private readonly logger = new Logger(KycWorkflowService.name);

  // Default workflow configurations by level
  private readonly workflowConfigs: Record<KycLevel, KycWorkflowConfig> = {
    [KycLevel.BASIC]: {
      level: KycLevel.BASIC,
      autoApproveThreshold: 20,
      expiryDays: 365,
      requiredChecks: ['government_id', 'selfie'],
    },
    [KycLevel.ENHANCED]: {
      level: KycLevel.ENHANCED,
      autoApproveThreshold: 15,
      requireManualReview: true,
      expiryDays: 365,
      requiredChecks: ['government_id', 'selfie', 'proof_of_address', 'database_check'],
    },
    [KycLevel.FULL]: {
      level: KycLevel.FULL,
      requireManualReview: true,
      expiryDays: 365,
      requiredChecks: [
        'government_id',
        'selfie',
        'proof_of_address',
        'database_check',
        'sanctions_check',
        'pep_check',
      ],
    },
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly verificationService: KycVerificationService,
    private readonly decisionService: KycDecisionService,
  ) {}

  /**
   * Get KYC requirements for a country and customer type
   *
   * @param countryCode - ISO country code
   * @param customerType - Individual or business
   * @returns List of requirements
   */
  async getRequirements(
    countryCode: string,
    customerType: CustomerType,
  ): Promise<KycRequirementData[]> {
    this.logger.log(`Getting KYC requirements for ${countryCode} - ${customerType}`);

    const requirements = await this.prisma.$queryRaw<any[]>`
      SELECT *
      FROM kyc_requirements
      WHERE country_code = ${countryCode}
        AND customer_type = ${customerType}
      ORDER BY is_required DESC, requirement_type ASC
    `;

    if (requirements.length === 0) {
      // Return default requirements if country-specific ones don't exist
      return this.getDefaultRequirements(customerType);
    }

    return requirements.map(this.mapToRequirementData);
  }

  /**
   * Add or update a requirement
   *
   * @param requirement - Requirement data
   * @returns Created/updated requirement
   */
  async upsertRequirement(
    requirement: Omit<KycRequirementData, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<KycRequirementData> {
    this.logger.log(
      `Upserting requirement: ${requirement.countryCode} - ${requirement.customerType} - ${requirement.requirementType}`,
    );

    const existing = await this.prisma.$queryRaw<any[]>`
      SELECT id
      FROM kyc_requirements
      WHERE country_code = ${requirement.countryCode}
        AND customer_type = ${requirement.customerType}
        AND requirement_type = ${requirement.requirementType}
      LIMIT 1
    `;

    if (existing.length > 0) {
      // Update existing
      await this.prisma.$executeRaw`
        UPDATE kyc_requirements
        SET
          is_required = ${requirement.isRequired},
          description = ${requirement.description || null},
          accepted_docs = ${requirement.acceptedDocs}::text[],
          updated_at = NOW()
        WHERE id = ${existing[0].id}
      `;

      const updated = await this.prisma.$queryRaw<any[]>`
        SELECT * FROM kyc_requirements WHERE id = ${existing[0].id} LIMIT 1
      `;

      return this.mapToRequirementData(updated[0]);
    } else {
      // Create new
      const result = await this.prisma.$queryRaw<any[]>`
        INSERT INTO kyc_requirements
        (id, country_code, customer_type, requirement_type, is_required, description, accepted_docs, created_at, updated_at)
        VALUES
        (
          gen_random_uuid(),
          ${requirement.countryCode},
          ${requirement.customerType},
          ${requirement.requirementType},
          ${requirement.isRequired},
          ${requirement.description || null},
          ${requirement.acceptedDocs}::text[],
          NOW(),
          NOW()
        )
        RETURNING *
      `;

      return this.mapToRequirementData(result[0]);
    }
  }

  /**
   * Get workflow configuration for a verification level
   *
   * @param level - Verification level
   * @returns Workflow configuration
   */
  getWorkflowConfig(level: KycLevel): KycWorkflowConfig {
    return this.workflowConfigs[level];
  }

  /**
   * Check if verification is expiring soon
   *
   * @param userId - User ID
   * @param daysThreshold - Days threshold (default: 30)
   * @returns Whether verification is expiring soon
   */
  async isExpiringSoon(userId: string, daysThreshold: number = 30): Promise<boolean> {
    const verifications = await this.prisma.$queryRaw<any[]>`
      SELECT expires_at
      FROM kyc_verifications
      WHERE user_id = ${userId}
        AND status = ${KycStatus.APPROVED}
        AND expires_at IS NOT NULL
      LIMIT 1
    `;

    if (verifications.length === 0) {
      return false;
    }

    const expiresAt = new Date(verifications[0].expires_at);
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() + daysThreshold);

    return expiresAt <= thresholdDate;
  }

  /**
   * Get all verifications expiring within threshold
   *
   * @param daysThreshold - Days threshold (default: 30)
   * @returns List of expiring verifications
   */
  async getExpiring(daysThreshold: number = 30): Promise<any[]> {
    this.logger.log(`Getting verifications expiring within ${daysThreshold} days`);

    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() + daysThreshold);

    const expiring = await this.prisma.$queryRaw<any[]>`
      SELECT
        v.*,
        u.email,
        u.first_name,
        u.last_name,
        o.name as organisation_name
      FROM kyc_verifications v
      INNER JOIN users u ON v.user_id = u.id
      INNER JOIN organisations o ON v.organisation_id = o.id
      WHERE v.status = ${KycStatus.APPROVED}
        AND v.expires_at IS NOT NULL
        AND v.expires_at <= ${thresholdDate}
        AND v.expires_at > NOW()
      ORDER BY v.expires_at ASC
    `;

    return expiring;
  }

  /**
   * Mark expired verifications
   *
   * @returns Number of verifications marked as expired
   */
  async markExpiredVerifications(): Promise<number> {
    this.logger.log('Marking expired verifications');

    const result = await this.prisma.$executeRaw`
      UPDATE kyc_verifications
      SET
        status = ${KycStatus.EXPIRED},
        updated_at = NOW()
      WHERE status = ${KycStatus.APPROVED}
        AND expires_at IS NOT NULL
        AND expires_at <= NOW()
    `;

    this.logger.log(`Marked ${result} verifications as expired`);
    return result as number;
  }

  /**
   * Process webhook event from verification provider
   *
   * @param providerRefId - Provider reference ID
   * @param event - Event type
   * @param data - Event data
   */
  async processWebhookEvent(
    providerRefId: string,
    event: string,
    data: any,
  ): Promise<void> {
    this.logger.log(`Processing webhook event ${event} for ${providerRefId}`);

    // Find verification by provider reference
    const verifications = await this.prisma.$queryRaw<any[]>`
      SELECT id, status
      FROM kyc_verifications
      WHERE provider_ref_id = ${providerRefId}
      LIMIT 1
    `;

    if (verifications.length === 0) {
      this.logger.warn(`No verification found for provider ref ${providerRefId}`);
      return;
    }

    const verification = verifications[0];

    // Sync latest status
    await this.verificationService.syncPersonaStatus(providerRefId, verification.id);

    // Check if automated decision should be processed
    if (
      verification.status === KycStatus.IN_REVIEW ||
      verification.status === KycStatus.PENDING
    ) {
      await this.decisionService.processAutomatedDecision(verification.id);
    }
  }

  /**
   * Get default requirements for customer type
   */
  private getDefaultRequirements(customerType: CustomerType): KycRequirementData[] {
    const baseRequirements: Omit<KycRequirementData, 'id'>[] = [
      {
        countryCode: 'DEFAULT',
        customerType,
        requirementType: RequirementType.GOVERNMENT_ID,
        isRequired: true,
        description: 'Government-issued photo ID (passport, driver license, national ID)',
        acceptedDocs: ['passport', 'drivers_license', 'national_id'],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        countryCode: 'DEFAULT',
        customerType,
        requirementType: RequirementType.SELFIE,
        isRequired: true,
        description: 'Live selfie for identity verification',
        acceptedDocs: ['selfie'],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        countryCode: 'DEFAULT',
        customerType,
        requirementType: RequirementType.PROOF_OF_ADDRESS,
        isRequired: false,
        description: 'Proof of residential address (utility bill, bank statement)',
        acceptedDocs: ['utility_bill', 'bank_statement', 'rental_agreement'],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    if (customerType === CustomerType.BUSINESS) {
      baseRequirements.push({
        countryCode: 'DEFAULT',
        customerType,
        requirementType: RequirementType.BUSINESS_REGISTRATION,
        isRequired: true,
        description: 'Business registration documents',
        acceptedDocs: ['business_registration', 'articles_of_incorporation'],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    return baseRequirements.map((req, index) => ({
      ...req,
      id: `default-${index}`,
    }));
  }

  /**
   * Map database record to requirement data
   */
  private mapToRequirementData(record: any): KycRequirementData {
    return {
      id: record.id,
      countryCode: record.country_code,
      customerType: record.customer_type,
      requirementType: record.requirement_type,
      isRequired: record.is_required,
      description: record.description,
      acceptedDocs: record.accepted_docs || [],
      createdAt: record.created_at,
      updatedAt: record.updated_at,
    };
  }
}
