import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { WiseService } from '../wise.service';
import {
  WiseQuote,
  WiseQuoteRequest,
  WiseTransfer,
  WiseRecipient,
  WiseCreateRecipientRequest,
  WiseCreateTransferRequest,
  WiseFundTransferRequest,
  WiseTransferStatus,
  WiseCurrency,
} from '../wise.types';
import {
  CreateQuoteDto,
  CreateRecipientDto,
  CreateTransferDto,
} from '../dto';

/**
 * Wise Transfer Service
 * Handles quote creation, recipient management, and transfer execution
 *
 * Workflow:
 * 1. Create quote (get exchange rate)
 * 2. Create/select recipient (bank account)
 * 3. Create transfer (initiate payment)
 * 4. Fund transfer (from balance or external)
 * 5. Track transfer status
 *
 * @see https://api-docs.wise.com/api-reference/transfer
 */
@Injectable()
export class WiseTransferService {
  private readonly logger = new Logger(WiseTransferService.name);

  constructor(private readonly wiseService: WiseService) {}

  /**
   * Get real-time exchange rate quote
   * Quotes are valid for a limited time (typically 5-60 minutes)
   */
  async createQuote(dto: CreateQuoteDto): Promise<WiseQuote> {
    try {
      const profileId = await this.wiseService.getBusinessProfileId();

      // Validate that either sourceAmount or targetAmount is provided
      if (!dto.sourceAmount && !dto.targetAmount) {
        throw new BadRequestException('Either sourceAmount or targetAmount must be provided');
      }

      const request: WiseQuoteRequest = {
        sourceCurrency: dto.sourceCurrency,
        targetCurrency: dto.targetCurrency,
        sourceAmount: dto.sourceAmount,
        targetAmount: dto.targetAmount,
        profile: profileId,
        type: dto.type || 'REGULAR',
      };

      const response = await this.wiseService
        .getApiClient()
        .post<WiseQuote>('/v3/profiles/{profileId}/quotes', request, {
          params: { profileId },
        });

      this.logger.log(`Quote created: ${response.data.id} (${dto.sourceCurrency} → ${dto.targetCurrency})`);
      return response.data;
    } catch (error) {
      this.logger.error('Failed to create quote', error);
      throw error;
    }
  }

  /**
   * Get quote by ID
   */
  async getQuote(quoteId: string): Promise<WiseQuote> {
    try {
      const response = await this.wiseService
        .getApiClient()
        .get<WiseQuote>(`/v3/quotes/${quoteId}`);

      return response.data;
    } catch (error) {
      this.logger.error(`Failed to get quote ${quoteId}`, error);
      throw error;
    }
  }

  /**
   * Create recipient account (beneficiary)
   * Different account types require different details based on country
   */
  async createRecipient(dto: CreateRecipientDto): Promise<WiseRecipient> {
    try {
      const profileId = await this.wiseService.getBusinessProfileId();

      const request: WiseCreateRecipientRequest = {
        currency: dto.currency,
        type: dto.type,
        profile: profileId,
        accountHolderName: dto.details.accountHolderName,
        details: {
          ...dto.details,
          currency: dto.currency,
          type: dto.type,
        },
      };

      const response = await this.wiseService
        .getApiClient()
        .post<WiseRecipient>('/v1/accounts', request);

      this.logger.log(`Recipient created: ${response.data.id} (${dto.details.accountHolderName})`);
      return response.data;
    } catch (error) {
      this.logger.error('Failed to create recipient', error);
      throw error;
    }
  }

  /**
   * Get all recipients for profile
   */
  async getRecipients(currency?: WiseCurrency): Promise<WiseRecipient[]> {
    try {
      const profileId = await this.wiseService.getBusinessProfileId();

      const response = await this.wiseService
        .getApiClient()
        .get<WiseRecipient[]>('/v1/accounts', {
          params: {
            profile: profileId,
            currency,
          },
        });

      return response.data;
    } catch (error) {
      this.logger.error('Failed to get recipients', error);
      throw error;
    }
  }

  /**
   * Get recipient by ID
   */
  async getRecipient(recipientId: number): Promise<WiseRecipient> {
    try {
      const response = await this.wiseService
        .getApiClient()
        .get<WiseRecipient>(`/v1/accounts/${recipientId}`);

      return response.data;
    } catch (error) {
      this.logger.error(`Failed to get recipient ${recipientId}`, error);
      throw error;
    }
  }

  /**
   * Delete recipient
   */
  async deleteRecipient(recipientId: number): Promise<void> {
    try {
      await this.wiseService
        .getApiClient()
        .delete(`/v1/accounts/${recipientId}`);

      this.logger.log(`Recipient deleted: ${recipientId}`);
    } catch (error) {
      this.logger.error(`Failed to delete recipient ${recipientId}`, error);
      throw error;
    }
  }

  /**
   * Create transfer
   * This initiates the transfer but does NOT fund it
   */
  async createTransfer(dto: CreateTransferDto): Promise<WiseTransfer> {
    try {
      const request: WiseCreateTransferRequest = {
        targetAccount: dto.targetAccount,
        quoteUuid: dto.quoteUuid,
        customerTransactionId: dto.customerTransactionId,
        details: dto.details,
      };

      const response = await this.wiseService
        .getApiClient()
        .post<WiseTransfer>('/v1/transfers', request);

      this.logger.log(`Transfer created: ${response.data.id} (${dto.details.reference})`);
      return response.data;
    } catch (error) {
      this.logger.error('Failed to create transfer', error);
      throw error;
    }
  }

  /**
   * Fund transfer from Wise balance
   * This actually executes the transfer
   */
  async fundTransfer(transferId: number): Promise<WiseTransfer> {
    try {
      const request: WiseFundTransferRequest = {
        type: 'BALANCE',
      };

      const response = await this.wiseService
        .getApiClient()
        .post<WiseTransfer>(`/v3/profiles/{profileId}/transfers/${transferId}/payments`, request);

      this.logger.log(`Transfer funded: ${transferId}`);
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to fund transfer ${transferId}`, error);
      throw error;
    }
  }

  /**
   * Get transfer by ID
   */
  async getTransfer(transferId: number): Promise<WiseTransfer> {
    try {
      const response = await this.wiseService
        .getApiClient()
        .get<WiseTransfer>(`/v1/transfers/${transferId}`);

      return response.data;
    } catch (error) {
      this.logger.error(`Failed to get transfer ${transferId}`, error);
      throw error;
    }
  }

  /**
   * Get all transfers for profile
   */
  async getTransfers(
    limit = 100,
    offset = 0,
    status?: WiseTransferStatus,
  ): Promise<WiseTransfer[]> {
    try {
      const profileId = await this.wiseService.getBusinessProfileId();

      const response = await this.wiseService
        .getApiClient()
        .get<WiseTransfer[]>('/v1/transfers', {
          params: {
            profile: profileId,
            limit,
            offset,
            status,
          },
        });

      return response.data;
    } catch (error) {
      this.logger.error('Failed to get transfers', error);
      throw error;
    }
  }

  /**
   * Cancel transfer
   * Only possible if transfer is not yet processed
   */
  async cancelTransfer(transferId: number): Promise<WiseTransfer> {
    try {
      const response = await this.wiseService
        .getApiClient()
        .put<WiseTransfer>(`/v1/transfers/${transferId}/cancel`);

      this.logger.log(`Transfer cancelled: ${transferId}`);
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to cancel transfer ${transferId}`, error);
      throw error;
    }
  }

  /**
   * Get transfer delivery estimate
   */
  async getDeliveryEstimate(transferId: number): Promise<string> {
    try {
      const response = await this.wiseService
        .getApiClient()
        .get<{ estimatedDelivery: string }>(`/v1/transfers/${transferId}/delivery-estimate`);

      return response.data.estimatedDelivery;
    } catch (error) {
      this.logger.error(`Failed to get delivery estimate for transfer ${transferId}`, error);
      throw error;
    }
  }

  /**
   * Complete transfer workflow
   * This is a convenience method that:
   * 1. Creates a quote
   * 2. Creates a transfer
   * 3. Funds the transfer
   */
  async executeTransfer(
    dto: CreateTransferDto & CreateQuoteDto,
  ): Promise<{
    quote: WiseQuote;
    transfer: WiseTransfer;
  }> {
    try {
      // Step 1: Create quote
      const quote = await this.createQuote({
        sourceCurrency: dto.sourceCurrency,
        targetCurrency: dto.targetCurrency,
        sourceAmount: dto.sourceAmount,
        targetAmount: dto.targetAmount,
        type: dto.type,
      });

      this.logger.log(`Quote created: ${quote.id}, Rate: ${quote.rate}`);

      // Step 2: Create transfer
      const transfer = await this.createTransfer({
        targetAccount: dto.targetAccount,
        quoteUuid: quote.id,
        customerTransactionId: dto.customerTransactionId,
        details: dto.details,
      });

      this.logger.log(`Transfer created: ${transfer.id}`);

      // Step 3: Fund transfer
      const fundedTransfer = await this.fundTransfer(transfer.id);

      this.logger.log(`Transfer executed successfully: ${transfer.id}`);

      return {
        quote,
        transfer: fundedTransfer,
      };
    } catch (error) {
      this.logger.error('Failed to execute transfer workflow', error);
      throw error;
    }
  }
}
