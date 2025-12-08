import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { StripeService } from '../stripe.service';
import {
  CreateConnectAccountRequest,
  ConnectAccountResponse,
  CreateOnboardingLinkRequest,
  OnboardingLinkResponse,
  PayoutConfiguration,
  StripeAccountType,
  StripeAccountStatus,
  STRIPE_CAPABILITIES,
} from '../stripe.types';
import Stripe from 'stripe';

/**
 * Stripe Connect Service
 * Handles Stripe Connect account creation, onboarding, and management
 *
 * Features:
 * - Express and Standard account creation
 * - OAuth Connect flow support
 * - Account onboarding link generation
 * - Account status and capabilities checking
 * - Payout scheduling configuration
 * - Account balance retrieval
 */
@Injectable()
export class StripeConnectService {
  private readonly logger = new Logger(StripeConnectService.name);
  private readonly stripe: Stripe;

  constructor(
    private readonly stripeService: StripeService,
    private readonly prisma: PrismaService,
  ) {
    this.stripe = this.stripeService.getClient();
  }

  /**
   * Create a new Stripe Connect account
   */
  async createConnectAccount(
    request: CreateConnectAccountRequest,
  ): Promise<ConnectAccountResponse> {
    const startTime = Date.now();

    try {
      this.logger.log(
        `Creating Stripe Connect account for user ${request.userId}`,
      );

      // Create Stripe account
      const account = await this.stripe.accounts.create({
        type: request.type,
        email: request.email,
        country: request.country,
        capabilities: {
          [STRIPE_CAPABILITIES.CARD_PAYMENTS]: { requested: true },
          [STRIPE_CAPABILITIES.TRANSFERS]: { requested: true },
        },
        business_profile: request.businessProfile,
        metadata: {
          userId: request.userId,
          ...request.metadata,
        },
      });

      // Store account in database
      await this.storeConnectAccount(request.userId, account);

      // Log audit event
      await this.logAuditEvent({
        userId: request.userId,
        action: 'CONNECT_ACCOUNT_CREATED',
        metadata: {
          accountId: account.id,
          type: request.type,
          country: request.country,
          duration: Date.now() - startTime,
        },
      });

      return this.mapAccountToResponse(account);
    } catch (error) {
      this.logger.error('Failed to create Connect account', error);
      await this.logAuditEvent({
        userId: request.userId,
        action: 'CONNECT_ACCOUNT_CREATION_FAILED',
        metadata: {
          error: error.message,
          duration: Date.now() - startTime,
        },
      });
      throw this.stripeService.handleStripeError(error, 'createAccount');
    }
  }

  /**
   * Create onboarding link for account setup
   */
  async createOnboardingLink(
    request: CreateOnboardingLinkRequest,
  ): Promise<OnboardingLinkResponse> {
    try {
      this.logger.log(
        `Creating onboarding link for account ${request.accountId}`,
      );

      const accountLink = await this.stripe.accountLinks.create({
        account: request.accountId,
        refresh_url: request.refreshUrl,
        return_url: request.returnUrl,
        type: 'account_onboarding',
      });

      return {
        url: accountLink.url,
        expiresAt: accountLink.expires_at,
      };
    } catch (error) {
      this.logger.error('Failed to create onboarding link', error);
      throw this.stripeService.handleStripeError(
        error,
        'createAccountLink',
      );
    }
  }

  /**
   * Create account update link for modifying account details
   */
  async createAccountUpdateLink(
    accountId: string,
    refreshUrl: string,
    returnUrl: string,
  ): Promise<OnboardingLinkResponse> {
    try {
      this.logger.log(`Creating account update link for ${accountId}`);

      const accountLink = await this.stripe.accountLinks.create({
        account: accountId,
        refresh_url: refreshUrl,
        return_url: returnUrl,
        type: 'account_update',
      });

      return {
        url: accountLink.url,
        expiresAt: accountLink.expires_at,
      };
    } catch (error) {
      this.logger.error('Failed to create account update link', error);
      throw this.stripeService.handleStripeError(
        error,
        'createAccountUpdateLink',
      );
    }
  }

  /**
   * Get Connect account by ID
   */
  async getAccount(accountId: string): Promise<ConnectAccountResponse> {
    try {
      this.logger.log(`Fetching Connect account ${accountId}`);

      const account = await this.stripe.accounts.retrieve(accountId);
      return this.mapAccountToResponse(account);
    } catch (error) {
      this.logger.error('Failed to fetch Connect account', error);
      throw this.stripeService.handleStripeError(error, 'retrieveAccount');
    }
  }

  /**
   * Get Connect account by user ID
   */
  async getAccountByUserId(
    userId: string,
  ): Promise<ConnectAccountResponse | null> {
    try {
      const dbAccount = await this.getStoredAccount(userId);
      if (!dbAccount) {
        return null;
      }

      return this.getAccount(dbAccount.stripeAccountId);
    } catch (error) {
      this.logger.error('Failed to fetch account by user ID', error);
      throw error;
    }
  }

  /**
   * Update Connect account
   */
  async updateAccount(
    accountId: string,
    updates: Partial<Stripe.AccountUpdateParams>,
  ): Promise<ConnectAccountResponse> {
    try {
      this.logger.log(`Updating Connect account ${accountId}`);

      const account = await this.stripe.accounts.update(accountId, updates);

      // Update database record
      await this.updateStoredAccount(accountId, account);

      return this.mapAccountToResponse(account);
    } catch (error) {
      this.logger.error('Failed to update Connect account', error);
      throw this.stripeService.handleStripeError(error, 'updateAccount');
    }
  }

  /**
   * Delete (deactivate) Connect account
   */
  async deleteAccount(accountId: string): Promise<void> {
    try {
      this.logger.log(`Deleting Connect account ${accountId}`);

      await this.stripe.accounts.del(accountId);

      // Mark as deleted in database
      await this.markAccountAsDeleted(accountId);
    } catch (error) {
      this.logger.error('Failed to delete Connect account', error);
      throw this.stripeService.handleStripeError(error, 'deleteAccount');
    }
  }

  /**
   * Configure payout schedule for Connect account
   */
  async configurePayouts(config: PayoutConfiguration): Promise<void> {
    try {
      this.logger.log(`Configuring payouts for account ${config.accountId}`);

      await this.stripe.accounts.update(config.accountId, {
        settings: {
          payouts: {
            schedule: {
              interval: config.schedule.interval,
              weekly_anchor: config.schedule.weeklyAnchor,
              monthly_anchor: config.schedule.monthlyAnchor,
              delay_days: config.schedule.delayDays || 2,
            },
          },
        },
      });
    } catch (error) {
      this.logger.error('Failed to configure payouts', error);
      throw this.stripeService.handleStripeError(error, 'configurePayouts');
    }
  }

  /**
   * Get account balance
   */
  async getAccountBalance(accountId: string): Promise<Stripe.Balance> {
    try {
      this.logger.log(`Fetching balance for account ${accountId}`);

      return await this.stripe.balance.retrieve({
        stripeAccount: accountId,
      });
    } catch (error) {
      this.logger.error('Failed to fetch account balance', error);
      throw this.stripeService.handleStripeError(
        error,
        'retrieveAccountBalance',
      );
    }
  }

  /**
   * Check if account can accept payments
   */
  async canAcceptPayments(accountId: string): Promise<boolean> {
    try {
      const account = await this.stripe.accounts.retrieve(accountId);
      return account.charges_enabled === true;
    } catch (error) {
      this.logger.error('Failed to check payment acceptance', error);
      return false;
    }
  }

  /**
   * Check if account can receive payouts
   */
  async canReceivePayouts(accountId: string): Promise<boolean> {
    try {
      const account = await this.stripe.accounts.retrieve(accountId);
      return account.payouts_enabled === true;
    } catch (error) {
      this.logger.error('Failed to check payout capability', error);
      return false;
    }
  }

  // Private helper methods

  private async storeConnectAccount(
    userId: string,
    account: Stripe.Account,
  ): Promise<void> {
    const status = this.getAccountStatus(account);
    const defaultCurrency = account.default_currency || 'usd';

    await this.prisma.$executeRaw`
      INSERT INTO stripe_connect_accounts
      (user_id, stripe_account_id, type, status, email, country, default_currency,
       charges_enabled, payouts_enabled, details_submitted, capabilities, metadata, created_at, updated_at)
      VALUES
      (${userId}, ${account.id}, ${account.type}, ${status}, ${account.email},
       ${account.country}, ${defaultCurrency}, ${account.charges_enabled},
       ${account.payouts_enabled}, ${account.details_submitted},
       ${JSON.stringify(account.capabilities)}::jsonb, ${JSON.stringify(account.metadata)}::jsonb,
       NOW(), NOW())
    `;
  }

  private async updateStoredAccount(
    accountId: string,
    account: Stripe.Account,
  ): Promise<void> {
    const status = this.getAccountStatus(account);

    await this.prisma.$executeRaw`
      UPDATE stripe_connect_accounts
      SET
        status = ${status},
        charges_enabled = ${account.charges_enabled},
        payouts_enabled = ${account.payouts_enabled},
        details_submitted = ${account.details_submitted},
        capabilities = ${JSON.stringify(account.capabilities)}::jsonb,
        metadata = ${JSON.stringify(account.metadata)}::jsonb,
        updated_at = NOW()
      WHERE stripe_account_id = ${accountId}
    `;
  }

  private async getStoredAccount(userId: string): Promise<any> {
    const result = await this.prisma.$queryRaw<Array<any>>`
      SELECT stripe_account_id, user_id, status
      FROM stripe_connect_accounts
      WHERE user_id = ${userId} AND deleted_at IS NULL
      ORDER BY created_at DESC
      LIMIT 1
    `;
    return result.length > 0 ? result[0] : null;
  }

  private async markAccountAsDeleted(accountId: string): Promise<void> {
    await this.prisma.$executeRaw`
      UPDATE stripe_connect_accounts
      SET
        status = ${StripeAccountStatus.DISABLED},
        deleted_at = NOW(),
        updated_at = NOW()
      WHERE stripe_account_id = ${accountId}
    `;
  }

  private mapAccountToResponse(
    account: Stripe.Account,
  ): ConnectAccountResponse {
    return {
      accountId: account.id,
      type: account.type as StripeAccountType,
      status: this.getAccountStatus(account),
      chargesEnabled: account.charges_enabled || false,
      payoutsEnabled: account.payouts_enabled || false,
      detailsSubmitted: account.details_submitted || false,
      email: account.email || '',
      country: account.country || '',
      defaultCurrency: account.default_currency || 'usd',
      capabilities: account.capabilities,
      metadata: account.metadata,
    };
  }

  private getAccountStatus(account: Stripe.Account): StripeAccountStatus {
    if (!account.charges_enabled && !account.payouts_enabled) {
      if (account.details_submitted) {
        return StripeAccountStatus.RESTRICTED;
      }
      return StripeAccountStatus.PENDING;
    }
    return StripeAccountStatus.ACTIVE;
  }

  private async logAuditEvent(event: {
    userId: string;
    action: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    try {
      await this.prisma.$executeRaw`
        INSERT INTO stripe_audit_logs
        (user_id, action, metadata, created_at)
        VALUES
        (${event.userId}, ${event.action}, ${JSON.stringify(event.metadata)}::jsonb, NOW())
      `;
    } catch (error) {
      this.logger.error('Failed to log audit event', error);
    }
  }
}
