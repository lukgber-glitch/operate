import { Injectable, Logger } from '@nestjs/common';
import { ScreeningService } from './services/screening.service';
import { MonitoringService } from './services/monitoring.service';
import { CaseManagementService } from './services/case-management.service';

/**
 * ComplyAdvantage Main Service
 * Aggregates all AML screening and monitoring functionality
 */
@Injectable()
export class ComplyAdvantageService {
  private readonly logger = new Logger(ComplyAdvantageService.name);

  constructor(
    public readonly screening: ScreeningService,
    public readonly monitoring: MonitoringService,
    public readonly caseManagement: CaseManagementService,
  ) {
    this.logger.log('ComplyAdvantage service initialized');
  }

  /**
   * Health check for ComplyAdvantage integration
   */
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
