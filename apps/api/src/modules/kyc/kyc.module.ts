import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { KycController } from './kyc.controller';
import { KycService } from './kyc.service';
import { KycVerificationService } from './services/kyc-verification.service';
import { KycDecisionService } from './services/kyc-decision.service';
import { KycWorkflowService } from './services/kyc-workflow.service';
import { KycReportingService } from './services/kyc-reporting.service';
import { DatabaseModule } from '../database/database.module';
import { PersonaModule } from '../integrations/persona/persona.module';

/**
 * KYC Verification Module
 * Comprehensive Know Your Customer (KYC) verification system
 *
 * Features:
 * - Multi-level verification (Basic, Enhanced, Full)
 * - Multi-provider support (Persona, Internal)
 * - Automated decision engine with risk scoring
 * - Manual review workflow
 * - Country-specific requirements
 * - Re-verification scheduling
 * - Comprehensive reporting and analytics
 * - Audit trail for all decisions
 *
 * Services:
 * - KycVerificationService - Orchestrates verification processes
 * - KycDecisionService - Handles automated and manual decisions
 * - KycWorkflowService - Manages workflows and requirements
 * - KycReportingService - Provides analytics and reporting
 *
 * Database Tables:
 * - kyc_verifications - Main verification records
 * - kyc_decisions - Decision history and audit trail
 * - kyc_requirements - Country/type-specific requirements
 *
 * Integration:
 * - Persona (via PersonaModule) - Identity verification provider
 * - Future: Add more providers as needed
 *
 * Workflow:
 * 1. Start verification -> Creates KYC record + provider inquiry
 * 2. User completes verification with provider
 * 3. Webhook updates status + syncs results
 * 4. Automated decision engine evaluates risk score
 * 5. Auto-approve (low risk) OR manual review (medium/high risk)
 * 6. Final decision recorded with audit trail
 * 7. Re-verification scheduled based on expiry
 *
 * Risk Levels:
 * - Low (0-25): Auto-approve eligible
 * - Medium (25-50): Manual review recommended
 * - High (50-75): Manual review required
 * - Critical (75-100): Auto-reject or escalate
 *
 * Verification Levels:
 * - Basic: Government ID + Selfie
 * - Enhanced: Basic + Address + Database checks
 * - Full: Enhanced + Sanctions + PEP checks
 */
@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    PersonaModule, // Import Persona integration
  ],
  controllers: [KycController],
  providers: [
    KycService,
    KycVerificationService,
    KycDecisionService,
    KycWorkflowService,
    KycReportingService,
  ],
  exports: [
    KycService,
    KycVerificationService,
    KycDecisionService,
    KycWorkflowService,
    KycReportingService,
  ],
})
export class KycModule {}
