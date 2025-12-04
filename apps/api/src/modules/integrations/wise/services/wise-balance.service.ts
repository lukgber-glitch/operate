import { Injectable, Logger } from '@nestjs/common';
import { WiseService } from '../wise.service';
import {
  WiseBalance,
  WiseStatement,
  WiseCurrency,
} from '../wise.types';

/**
 * Wise Balance Service
 * Handles multi-currency balance management
 *
 * Features:
 * - Get multi-currency balances
 * - Get balance statements (transactions)
 * - Convert between currencies (borderless)
 * - Get account details for each currency
 *
 * @see https://api-docs.wise.com/api-reference/balance
 */
@Injectable()
export class WiseBalanceService {
  private readonly logger = new Logger(WiseBalanceService.name);

  constructor(private readonly wiseService: WiseService) {}

  /**
   * Get all balances for business profile
   * Returns multi-currency balance accounts
   */
  async getBalances(): Promise<WiseBalance[]> {
    try {
      const profileId = await this.wiseService.getBusinessProfileId();

      const response = await this.wiseService
        .getApiClient()
        .get<WiseBalance[]>('/v4/profiles/{profileId}/balances', {
          params: { profileId },
        });

      this.logger.log(`Retrieved ${response.data.length} balance accounts`);
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get balances', error);
      throw error;
    }
  }

  /**
   * Get balance for specific currency
   */
  async getBalanceByCurrency(currency: WiseCurrency): Promise<WiseBalance | null> {
    try {
      const balances = await this.getBalances();
      const balance = balances.find((b) =>
        b.balances.some((bal) => bal.currency === currency),
      );

      return balance || null;
    } catch (error) {
      this.logger.error(`Failed to get balance for ${currency}`, error);
      throw error;
    }
  }

  /**
   * Get available balance amount for currency
   */
  async getAvailableBalance(currency: WiseCurrency): Promise<number> {
    try {
      const balance = await this.getBalanceByCurrency(currency);

      if (!balance) {
        return 0;
      }

      const currencyBalance = balance.balances.find((b) => b.currency === currency);

      if (!currencyBalance) {
        return 0;
      }

      return currencyBalance.amount.value;
    } catch (error) {
      this.logger.error(`Failed to get available balance for ${currency}`, error);
      throw error;
    }
  }

  /**
   * Get balance statement (transactions)
   * Returns transactions for a specific currency and date range
   */
  async getStatement(
    currency: WiseCurrency,
    intervalStart: Date,
    intervalEnd: Date,
  ): Promise<WiseStatement> {
    try {
      const profileId = await this.wiseService.getBusinessProfileId();

      const response = await this.wiseService
        .getApiClient()
        .get<WiseStatement>('/v1/profiles/{profileId}/balance-statements/{currency}/statement.json', {
          params: {
            profileId,
            currency,
            intervalStart: intervalStart.toISOString(),
            intervalEnd: intervalEnd.toISOString(),
          },
        });

      this.logger.log(
        `Retrieved statement for ${currency}: ${response.data.transactions.length} transactions`,
      );
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to get statement for ${currency}`, error);
      throw error;
    }
  }

  /**
   * Get account details for a currency
   * Returns bank account details (IBAN, SWIFT, etc.) for receiving funds
   */
  async getAccountDetails(currency: WiseCurrency): Promise<any> {
    try {
      const balance = await this.getBalanceByCurrency(currency);

      if (!balance) {
        throw new Error(`No balance account found for ${currency}`);
      }

      const currencyBalance = balance.balances.find((b) => b.currency === currency);

      if (!currencyBalance?.bankDetails) {
        throw new Error(`No bank details available for ${currency}`);
      }

      return currencyBalance.bankDetails;
    } catch (error) {
      this.logger.error(`Failed to get account details for ${currency}`, error);
      throw error;
    }
  }

  /**
   * Convert between currencies (borderless account)
   * This creates an internal conversion within your Wise account
   */
  async convertCurrency(
    sourceCurrency: WiseCurrency,
    targetCurrency: WiseCurrency,
    sourceAmount: number,
  ): Promise<any> {
    try {
      const profileId = await this.wiseService.getBusinessProfileId();

      // Create quote for conversion
      const quoteResponse = await this.wiseService
        .getApiClient()
        .post('/v3/profiles/{profileId}/quotes', {
          sourceCurrency,
          targetCurrency,
          sourceAmount,
          profile: profileId,
          type: 'BALANCE_CONVERSION',
        });

      const quote = quoteResponse.data;

      this.logger.log(
        `Currency conversion quote: ${sourceAmount} ${sourceCurrency} → ${quote.targetAmount} ${targetCurrency} (rate: ${quote.rate})`,
      );

      // Execute conversion
      const conversionResponse = await this.wiseService
        .getApiClient()
        .post('/v2/profiles/{profileId}/balance-movements', {
          quoteId: quote.id,
        });

      this.logger.log(`Currency conversion executed: ${conversionResponse.data.id}`);

      return {
        quote,
        conversion: conversionResponse.data,
      };
    } catch (error) {
      this.logger.error(
        `Failed to convert ${sourceAmount} ${sourceCurrency} to ${targetCurrency}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Get balance movements (deposits, withdrawals, conversions)
   */
  async getBalanceMovements(
    currency?: WiseCurrency,
    limit = 100,
    offset = 0,
  ): Promise<any[]> {
    try {
      const profileId = await this.wiseService.getBusinessProfileId();

      const response = await this.wiseService
        .getApiClient()
        .get('/v1/profiles/{profileId}/balance-movements', {
          params: {
            profileId,
            currency,
            limit,
            offset,
          },
        });

      return response.data;
    } catch (error) {
      this.logger.error('Failed to get balance movements', error);
      throw error;
    }
  }

  /**
   * Get top-up details for a currency
   * Returns instructions for adding funds to your Wise balance
   */
  async getTopUpDetails(currency: WiseCurrency): Promise<any> {
    try {
      const profileId = await this.wiseService.getBusinessProfileId();

      const response = await this.wiseService
        .getApiClient()
        .get('/v1/profiles/{profileId}/balances/{currency}/top-up', {
          params: {
            profileId,
            currency,
          },
        });

      return response.data;
    } catch (error) {
      this.logger.error(`Failed to get top-up details for ${currency}`, error);
      throw error;
    }
  }

  /**
   * Check if balance is sufficient for transfer
   */
  async hasSufficientBalance(
    currency: WiseCurrency,
    amount: number,
  ): Promise<boolean> {
    try {
      const availableBalance = await this.getAvailableBalance(currency);
      return availableBalance >= amount;
    } catch (error) {
      this.logger.error(
        `Failed to check sufficient balance for ${amount} ${currency}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Get total balance in a base currency
   * Converts all balances to a single currency for reporting
   */
  async getTotalBalanceInCurrency(baseCurrency: WiseCurrency): Promise<number> {
    try {
      const balances = await this.getBalances();
      let total = 0;

      for (const balance of balances) {
        for (const currencyBalance of balance.balances) {
          if (currencyBalance.currency === baseCurrency) {
            total += currencyBalance.amount.value;
          } else {
            // Get exchange rate and convert
            const quoteResponse = await this.wiseService
              .getApiClient()
              .post('/v3/profiles/{profileId}/quotes', {
                sourceCurrency: currencyBalance.currency,
                targetCurrency: baseCurrency,
                sourceAmount: currencyBalance.amount.value,
                profile: await this.wiseService.getBusinessProfileId(),
                type: 'BALANCE_CONVERSION',
              });

            total += quoteResponse.data.targetAmount;
          }
        }
      }

      return total;
    } catch (error) {
      this.logger.error(`Failed to get total balance in ${baseCurrency}`, error);
      throw error;
    }
  }
}
