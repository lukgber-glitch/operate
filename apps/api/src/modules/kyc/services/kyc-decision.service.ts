import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/modules/database/prisma.service';
import {
  KycStatus,
  KycDecisionType,
  KycDecisionSource,
  KycRiskLevel,
  KycAutomationRule,
} from '../types/kyc.types';
import { MakeDecisionDto, KycDecisionResponseDto } from '../dto/kyc-decision.dto';

/**
 * KYC Decision Service
 * Handles automated and manual decision-making for KYC verifications
 *
 * Features:
 * - Automated decision engine based on risk scores and checks
 * - Manual decision workflow
 * - Decision history tracking
 * - Rule-based automation
 */
@Injectable()
export class KycDecisionService {
  private readonly logger = new Logger(KycDecisionService.name);

  // Automation rules for KYC decisions
  private readonly automationRules: KycAutomationRule[] = [
    {
      name: 'Auto-approve low risk',
      condition: {
        riskScore: { max: 25 },
        allChecksPassed: true,
      },
      action: {
        decision: KycDecisionType.APPROVE,
      },
    },
    {
      name: 'Auto-reject critical risk',
      condition: {
        riskScore: { min: 75 },
      },
      action: {
        decision: KycDecisionType.REJECT,
      },
    },
    {
      name: 'Escalate high risk for manual review',
      condition: {
        riskScore: { min: 50, max: 75 },
      },
      action: {
        decision: KycDecisionType.ESCALATE,
        assignToReviewer: true,
      },
    },
  ];

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Make a manual decision on a KYC verification
   *
   * @param dto - Decision parameters
   * @param decidedBy - User ID making the decision
   * @returns Decision record
   */
  async makeDecision(
    dto: MakeDecisionDto,
    decidedBy: string,
  ): Promise<KycDecisionResponseDto> {
    this.logger.log(`Making decision on verification ${dto.verificationId}`);

    // Get verification
    const verifications = await this.prisma.$queryRaw<any[]>`
      SELECT *
      FROM kyc_verifications
      WHERE id = ${dto.verificationId}
      LIMIT 1
    `;

    if (verifications.length === 0) {
      throw new NotFoundException(`Verification ${dto.verificationId} not found`);
    }

    const verification = verifications[0];
    const previousStatus = verification.status as KycStatus;

    // Validate decision is allowed
    this.validateDecision(previousStatus, dto.decision);

    // Determine new status based on decision
    const newStatus = this.getNewStatus(dto.decision, previousStatus);

    // Create decision record
    const decisionId = await this.createDecision({
      verificationId: dto.verificationId,
      decision: dto.decision,
      reason: dto.reason,
      decidedBy,
      decisionType: KycDecisionSource.MANUAL,
      previousStatus,
      newStatus,
      metadata: dto.metadata,
    });

    // Update verification status
    await this.updateVerificationStatus(
      dto.verificationId,
      newStatus,
      decidedBy,
      dto.reason,
    );

    // Get the created decision
    const decisions = await this.prisma.$queryRaw<any[]>`
      SELECT *
      FROM kyc_decisions
      WHERE id = ${decisionId}
      LIMIT 1
    `;

    return this.mapToDecisionDto(decisions[0]);
  }

  /**
   * Process automated decision based on verification results
   *
   * @param verificationId - Verification ID
   * @returns Decision record if automated decision was made
   */
  async processAutomatedDecision(
    verificationId: string,
  ): Promise<KycDecisionResponseDto | null> {
    this.logger.log(`Processing automated decision for verification ${verificationId}`);

    // Get verification
    const verifications = await this.prisma.$queryRaw<any[]>`
      SELECT *
      FROM kyc_verifications
      WHERE id = ${verificationId}
      LIMIT 1
    `;

    if (verifications.length === 0) {
      throw new NotFoundException(`Verification ${verificationId} not found`);
    }

    const verification = verifications[0];
    const previousStatus = verification.status as KycStatus;

    // Only process automated decisions for pending or in_review status
    if (previousStatus !== KycStatus.IN_REVIEW && previousStatus !== KycStatus.PENDING) {
      this.logger.log(`Verification ${verificationId} not eligible for automated decision`);
      return null;
    }

    // Check if all checks are complete
    const checks = verification.checks || [];
    const allChecksComplete = checks.every(
      (check: any) => check.status === 'passed' || check.status === 'failed',
    );

    if (!allChecksComplete) {
      this.logger.log(`Not all checks complete for verification ${verificationId}`);
      return null;
    }

    // Find matching automation rule
    const rule = this.findMatchingRule(verification);

    if (!rule) {
      this.logger.log(`No automation rule matched for verification ${verificationId}`);
      return null;
    }

    this.logger.log(`Applying automation rule: ${rule.name}`);

    const decision = rule.action.decision;
    const newStatus = this.getNewStatus(decision, previousStatus);

    // Create decision record
    const decisionId = await this.createDecision({
      verificationId,
      decision,
      reason: `Automated decision: ${rule.name}`,
      decidedBy: 'system',
      decisionType: KycDecisionSource.AUTOMATED,
      previousStatus,
      newStatus,
      metadata: { ruleName: rule.name, ruleCondition: rule.condition },
    });

    // Update verification status
    await this.updateVerificationStatus(
      verificationId,
      newStatus,
      'system',
      `Automated decision: ${rule.name}`,
    );

    // Get the created decision
    const decisions = await this.prisma.$queryRaw<any[]>`
      SELECT *
      FROM kyc_decisions
      WHERE id = ${decisionId}
      LIMIT 1
    `;

    return this.mapToDecisionDto(decisions[0]);
  }

  /**
   * Get decision history for a verification
   *
   * @param verificationId - Verification ID
   * @returns List of decisions
   */
  async getDecisionHistory(verificationId: string): Promise<KycDecisionResponseDto[]> {
    this.logger.log(`Getting decision history for verification ${verificationId}`);

    const decisions = await this.prisma.$queryRaw<any[]>`
      SELECT *
      FROM kyc_decisions
      WHERE verification_id = ${verificationId}
      ORDER BY created_at DESC
    `;

    return decisions.map((d) => this.mapToDecisionDto(d));
  }

  /**
   * Find automation rule that matches verification
   */
  private findMatchingRule(verification: any): KycAutomationRule | null {
    const riskScore = verification.risk_score || 50;
    const checks = verification.checks || [];
    const allChecksPassed = checks.every((check: any) => check.status === 'passed');

    for (const rule of this.automationRules) {
      const { condition } = rule;

      // Check risk score range
      if (condition.riskScore) {
        if (condition.riskScore.min !== undefined && riskScore < condition.riskScore.min) {
          continue;
        }
        if (condition.riskScore.max !== undefined && riskScore > condition.riskScore.max) {
          continue;
        }
      }

      // Check if all checks passed
      if (condition.allChecksPassed !== undefined) {
        if (condition.allChecksPassed !== allChecksPassed) {
          continue;
        }
      }

      // Rule matched
      return rule;
    }

    return null;
  }

  /**
   * Validate that a decision is allowed for current status
   */
  private validateDecision(currentStatus: KycStatus, decision: KycDecisionType): void {
    // Can't make decisions on approved or rejected verifications
    if (currentStatus === KycStatus.APPROVED || currentStatus === KycStatus.REJECTED) {
      throw new BadRequestException(
        `Cannot make decision on verification with status ${currentStatus}`,
      );
    }

    // Expired verifications need to be restarted
    if (currentStatus === KycStatus.EXPIRED) {
      throw new BadRequestException('Cannot make decision on expired verification');
    }
  }

  /**
   * Get new status based on decision
   */
  private getNewStatus(decision: KycDecisionType, currentStatus: KycStatus): KycStatus {
    switch (decision) {
      case KycDecisionType.APPROVE:
        return KycStatus.APPROVED;
      case KycDecisionType.REJECT:
        return KycStatus.REJECTED;
      case KycDecisionType.REQUEST_INFO:
        return KycStatus.PENDING;
      case KycDecisionType.ESCALATE:
        return KycStatus.IN_REVIEW;
      default:
        return currentStatus;
    }
  }

  /**
   * Create decision record
   */
  private async createDecision(data: {
    verificationId: string;
    decision: KycDecisionType;
    reason?: string;
    decidedBy: string;
    decisionType: KycDecisionSource;
    previousStatus: KycStatus;
    newStatus: KycStatus;
    metadata?: Record<string, any>;
  }): Promise<string> {
    const result = await this.prisma.$queryRaw<any[]>`
      INSERT INTO kyc_decisions
      (id, verification_id, decision, reason, decided_by, decision_type, previous_status, new_status, metadata, created_at)
      VALUES
      (
        gen_random_uuid(),
        ${data.verificationId},
        ${data.decision},
        ${data.reason || null},
        ${data.decidedBy},
        ${data.decisionType},
        ${data.previousStatus},
        ${data.newStatus},
        ${JSON.stringify(data.metadata || {})}::jsonb,
        NOW()
      )
      RETURNING id
    `;

    return result[0].id;
  }

  /**
   * Update verification status
   */
  private async updateVerificationStatus(
    verificationId: string,
    status: KycStatus,
    reviewedBy: string,
    reason?: string,
  ): Promise<void> {
    await this.prisma.$executeRaw`
      UPDATE kyc_verifications
      SET
        status = ${status},
        reviewed_by = ${reviewedBy},
        reviewed_at = NOW(),
        decision_reason = ${reason || null},
        updated_at = NOW()
      WHERE id = ${verificationId}
    `;
  }

  /**
   * Map database record to DTO
   */
  private mapToDecisionDto(decision: any): KycDecisionResponseDto {
    return {
      id: decision.id,
      verificationId: decision.verification_id,
      decision: decision.decision as KycDecisionType,
      reason: decision.reason,
      decidedBy: decision.decided_by,
      decisionType: decision.decision_type,
      previousStatus: decision.previous_status as KycStatus,
      newStatus: decision.new_status as KycStatus,
      metadata: decision.metadata,
      createdAt: decision.created_at,
    };
  }
}
