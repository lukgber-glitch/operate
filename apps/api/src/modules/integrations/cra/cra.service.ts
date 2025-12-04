import { Injectable, Logger } from '@nestjs/common';
import { CraAuthService } from './cra-auth.service';
import { CraEfilerService } from './services/cra-efiler.service';
import {
  CraFilingRequest,
  CraFilingResponse,
  CraConnectionInfo,
  CraValidationResult,
  GstHstReturn,
} from './interfaces/cra.interface';

/**
 * CRA Service
 *
 * Main orchestration service for CRA NetFile integration
 * Coordinates authentication, validation, and filing operations
 */
@Injectable()
export class CraService {
  private readonly logger = new Logger(CraService.name);

  constructor(
    private readonly authService: CraAuthService,
    private readonly efilerService: CraEfilerService,
  ) {}

  /**
   * Connect organization to CRA
   */
  async connect(
    organizationId: string,
    businessNumber: string,
    webAccessCode?: string,
  ): Promise<{ success: boolean; sessionInfo?: any }> {
    try {
      const sessionInfo = await this.authService.authenticate(
        organizationId,
        businessNumber,
        webAccessCode,
      );

      return {
        success: true,
        sessionInfo,
      };
    } catch (error) {
      this.logger.error(`CRA connection failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Disconnect organization from CRA
   */
  async disconnect(organizationId: string): Promise<{ success: boolean }> {
    try {
      await this.authService.disconnect(organizationId);
      return { success: true };
    } catch (error) {
      this.logger.error(`CRA disconnect failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get CRA connection status
   */
  async getConnectionInfo(
    organizationId: string,
  ): Promise<CraConnectionInfo | null> {
    return this.authService.getConnectionInfo(organizationId);
  }

  /**
   * Validate GST/HST return
   */
  async validateReturn(
    organizationId: string,
    returnData: GstHstReturn,
  ): Promise<CraValidationResult> {
    return this.efilerService.validateReturn(organizationId, returnData);
  }

  /**
   * Submit GST/HST return
   */
  async submitReturn(
    filingRequest: CraFilingRequest,
  ): Promise<CraFilingResponse> {
    return this.efilerService.submitReturn(filingRequest);
  }

  /**
   * Check filing status
   */
  async checkStatus(
    organizationId: string,
    confirmationNumber: string,
  ): Promise<CraFilingResponse> {
    return this.efilerService.checkFilingStatus(organizationId, confirmationNumber);
  }

  /**
   * Get filing history
   */
  async getFilingHistory(
    organizationId: string,
    options?: {
      startDate?: Date;
      endDate?: Date;
      limit?: number;
    },
  ): Promise<any[]> {
    return this.efilerService.getFilingHistory(organizationId, options);
  }
}
