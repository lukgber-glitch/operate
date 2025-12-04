import { Injectable, Logger } from '@nestjs/common';
import { KycVerificationService } from './services/kyc-verification.service';
import { KycDecisionService } from './services/kyc-decision.service';
import { KycWorkflowService } from './services/kyc-workflow.service';
import { KycReportingService } from './services/kyc-reporting.service';

/**
 * KYC Service
 * Main facade service for KYC module
 * Delegates to specialized services
 */
@Injectable()
export class KycService {
  private readonly logger = new Logger(KycService.name);

  constructor(
    public readonly verification: KycVerificationService,
    public readonly decision: KycDecisionService,
    public readonly workflow: KycWorkflowService,
    public readonly reporting: KycReportingService,
  ) {
    this.logger.log('KYC Service initialized');
  }

  /**
   * Health check for KYC service
   */
  async healthCheck(): Promise<{ status: string; services: Record<string, boolean> }> {
    return {
      status: 'healthy',
      services: {
        verification: true,
        decision: true,
        workflow: true,
        reporting: true,
      },
    };
  }
}
