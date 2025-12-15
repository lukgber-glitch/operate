import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { StripeService } from '../integrations/stripe/stripe.service';
import Stripe from 'stripe';

export type PlanTier = 'FREE' | 'STARTER' | 'PRO' | 'BUSINESS';
export type BillingCycle = 'MONTHLY' | 'ANNUAL';
export type SubscriptionStatus = 'ACTIVE' | 'CANCELLED' | 'PAST_DUE' | 'TRIALING';
export type InvoiceStatus = 'PAID' | 'PENDING' | 'FAILED';

export interface PlanLimits {
  aiMessages: number;
  bankConnections: number;
  invoicesPerMonth: number;
  teamMembers: number;
  storage: number; // in GB
}

export interface CurrentUsage {
  aiMessages: number;
  bankConnections: number;
  invoicesThisMonth: number;
  teamMembers: number;
  storageUsed: number; // in GB
}

export interface SubscriptionResponse {
  id: string;
  planTier: PlanTier;
  billingCycle: BillingCycle;
  status: SubscriptionStatus;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  trialEndsAt: string | null;
  limits: PlanLimits;
  price: {
    amount: number;
    currency: string;
  };
}

export interface BillingInvoice {
  id: string;
  number: string;
  amount: number;
  currency: string;
  status: InvoiceStatus;
  date: string;
  dueDate: string;
  pdfUrl: string | null;
  periodStart: string;
  periodEnd: string;
}

export interface PaymentMethod {
  id: string;
  type: 'card';
  card: {
    brand: string;
    last4: string;
    expiryMonth: number;
    expiryYear: number;
  };
  isDefault: boolean;
  createdAt: string;
}

/**
 * Billing Service
 * Handles subscription management, usage tracking, and billing operations
 */
@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  // Plan tier limits configuration
  private readonly PLAN_LIMITS: Record<PlanTier, PlanLimits> = {
    FREE: {
      aiMessages: 50,
      bankConnections: 1,
      invoicesPerMonth: 10,
      teamMembers: 1,
      storage: 1,
    },
    STARTER: {
      aiMessages: 500,
      bankConnections: 3,
      invoicesPerMonth: 50,
      teamMembers: 1,
      storage: 10,
    },
    PRO: {
      aiMessages: 2000,
      bankConnections: 10,
      invoicesPerMonth: 200,
      teamMembers: 5,
      storage: 50,
    },
    BUSINESS: {
      aiMessages: -1, // unlimited
      bankConnections: -1,
      invoicesPerMonth: -1,
      teamMembers: -1,
      storage: 500,
    },
  };

  // Plan pricing (in cents)
  private readonly PLAN_PRICING: Record<
    PlanTier,
    { monthly: number; annual: number }
  > = {
    FREE: { monthly: 0, annual: 0 },
    STARTER: { monthly: 2900, annual: 29000 },
    PRO: { monthly: 7900, annual: 79000 },
    BUSINESS: { monthly: 19900, annual: 199000 },
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly stripeService: StripeService,
  ) {}

  /**
   * Get current subscription for user's organization
   */
  async getSubscription(userId: string): Promise<SubscriptionResponse> {
    try {
      // Get user's organization
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          memberships: {
            include: {
              organisation: true,
            },
          },
        },
      });

      if (!user || !user.memberships || user.memberships.length === 0) {
        throw new NotFoundException('User organization not found');
      }

      const membership = user.memberships[0];
      if (!membership || !membership.organisation) {
        throw new NotFoundException('User organization not found');
      }

      const organisation = membership.organisation;

      // Map organization subscription tier to PlanTier
      const planTier = this.mapTierToPlanTier(organisation.subscriptionTier);
      const limits = this.PLAN_LIMITS[planTier];
      const pricing = this.PLAN_PRICING[planTier];

      // For now, we'll use mock data for subscription details
      // In a real implementation, this would fetch from Stripe subscriptions
      return {
        id: organisation.id,
        planTier,
        billingCycle: 'MONTHLY', // Default to monthly
        status: 'ACTIVE',
        currentPeriodStart: new Date().toISOString(),
        currentPeriodEnd: new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000,
        ).toISOString(),
        cancelAtPeriodEnd: false,
        trialEndsAt: null,
        limits,
        price: {
          amount: pricing.monthly,
          currency: organisation.currency || 'EUR',
        },
      };
    } catch (error) {
      this.logger.error('Failed to get subscription', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to retrieve subscription',
      );
    }
  }

  /**
   * Get current usage statistics for user's organization
   */
  async getUsage(userId: string): Promise<CurrentUsage> {
    try {
      // Get user's organization
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          memberships: {
            include: {
              organisation: true,
            },
          },
        },
      });

      if (!user || !user.memberships || user.memberships.length === 0) {
        throw new NotFoundException('User organization not found');
      }

      const organisationId = user.memberships[0].orgId;

      // Get AI messages count for this month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const aiMessages = await this.prisma.usageEvent.count({
        where: {
          organisationId,
          feature: 'AI_MESSAGES',
          timestamp: {
            gte: startOfMonth,
          },
        },
      });

      // Get bank connections count
      const bankConnections = await this.prisma.bankConnection.count({
        where: {
          orgId: organisationId,
        },
      });

      // Get invoices count for this month
      const invoicesThisMonth = await this.prisma.invoice.count({
        where: {
          orgId: organisationId,
          createdAt: {
            gte: startOfMonth,
          },
        },
      });

      // Get team members count
      const teamMembers = await this.prisma.membership.count({
        where: {
          orgId: organisationId,
        },
      });

      // Get storage used (sum of document file sizes)
      const storageQuota = await this.prisma.storageQuota.findUnique({
        where: { orgId: organisationId },
      });

      const storageUsedBytes = storageQuota?.usedSpace || BigInt(0);
      const storageUsedGB = Number((Number(storageUsedBytes) / (1024 * 1024 * 1024)).toFixed(2));

      return {
        aiMessages,
        bankConnections,
        invoicesThisMonth,
        teamMembers,
        storageUsed: storageUsedGB,
      };
    } catch (error) {
      this.logger.error('Failed to get usage', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to retrieve usage data');
    }
  }

  /**
   * Get payment methods for user's organization
   */
  async getPaymentMethods(userId: string): Promise<PaymentMethod[]> {
    try {
      // For now, return empty array
      // In a real implementation, this would fetch from Stripe customer payment methods
      return [];
    } catch (error) {
      this.logger.error('Failed to get payment methods', error);
      throw new InternalServerErrorException(
        'Failed to retrieve payment methods',
      );
    }
  }

  /**
   * Get billing invoices for user's organization
   */
  async getInvoices(userId: string): Promise<BillingInvoice[]> {
    try {
      // For now, return empty array
      // In a real implementation, this would fetch from Stripe invoices
      return [];
    } catch (error) {
      this.logger.error('Failed to get invoices', error);
      throw new InternalServerErrorException('Failed to retrieve invoices');
    }
  }

  /**
   * Change subscription plan
   */
  async changePlan(
    userId: string,
    planTier: PlanTier,
    billingCycle: BillingCycle,
  ): Promise<SubscriptionResponse> {
    try {
      // Get user's organization
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          memberships: {
            include: {
              organisation: true,
            },
          },
        },
      });

      if (!user || !user.memberships || user.memberships.length === 0) {
        throw new NotFoundException('User organization not found');
      }

      const membership = user.memberships[0];
      if (!membership || !membership.organisation) {
        throw new NotFoundException('User organization not found');
      }

      const organisation = membership.organisation;

      // Map plan tier to subscription tier string
      const subscriptionTier = planTier.toLowerCase();

      // Update organization subscription tier
      await this.prisma.organisation.update({
        where: { id: organisation.id },
        data: { subscriptionTier },
      });

      // In a real implementation, this would:
      // 1. Create/update Stripe subscription
      // 2. Handle proration
      // 3. Process payment

      // Return updated subscription
      return this.getSubscription(userId);
    } catch (error) {
      this.logger.error('Failed to change plan', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to change plan');
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(userId: string): Promise<SubscriptionResponse> {
    try {
      // Get current subscription
      const subscription = await this.getSubscription(userId);

      // In a real implementation, this would:
      // 1. Cancel Stripe subscription at period end
      // 2. Update database with cancellation date

      this.logger.log(
        `Subscription cancelled for user ${userId}, effective at period end`,
      );

      // Return subscription with cancelAtPeriodEnd = true
      return {
        ...subscription,
        cancelAtPeriodEnd: true,
      };
    } catch (error) {
      this.logger.error('Failed to cancel subscription', error);
      throw new InternalServerErrorException(
        'Failed to cancel subscription',
      );
    }
  }

  /**
   * Resume cancelled subscription
   */
  async resumeSubscription(userId: string): Promise<SubscriptionResponse> {
    try {
      // Get current subscription
      const subscription = await this.getSubscription(userId);

      // In a real implementation, this would:
      // 1. Resume Stripe subscription
      // 2. Update database

      this.logger.log(`Subscription resumed for user ${userId}`);

      // Return subscription with cancelAtPeriodEnd = false
      return {
        ...subscription,
        cancelAtPeriodEnd: false,
      };
    } catch (error) {
      this.logger.error('Failed to resume subscription', error);
      throw new InternalServerErrorException(
        'Failed to resume subscription',
      );
    }
  }

  /**
   * Add payment method
   */
  async addPaymentMethod(
    userId: string,
    paymentMethodId: string,
  ): Promise<PaymentMethod> {
    try {
      // In a real implementation, this would:
      // 1. Attach payment method to Stripe customer
      // 2. Optionally set as default

      throw new BadRequestException('Payment method management not yet implemented');
    } catch (error) {
      this.logger.error('Failed to add payment method', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to add payment method');
    }
  }

  /**
   * Remove payment method
   */
  async removePaymentMethod(
    userId: string,
    paymentMethodId: string,
  ): Promise<void> {
    try {
      // In a real implementation, this would detach from Stripe customer
      throw new BadRequestException('Payment method management not yet implemented');
    } catch (error) {
      this.logger.error('Failed to remove payment method', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to remove payment method',
      );
    }
  }

  /**
   * Set default payment method
   */
  async setDefaultPaymentMethod(
    userId: string,
    paymentMethodId: string,
  ): Promise<void> {
    try {
      // In a real implementation, this would update Stripe customer default payment method
      throw new BadRequestException('Payment method management not yet implemented');
    } catch (error) {
      this.logger.error('Failed to set default payment method', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to set default payment method',
      );
    }
  }

  /**
   * Helper: Map subscription tier string to PlanTier enum
   */
  private mapTierToPlanTier(tier: string): PlanTier {
    const upperTier = tier.toUpperCase();
    if (
      upperTier === 'FREE' ||
      upperTier === 'STARTER' ||
      upperTier === 'PRO' ||
      upperTier === 'BUSINESS'
    ) {
      return upperTier as PlanTier;
    }
    // Default to FREE if unknown
    return 'FREE';
  }
}
