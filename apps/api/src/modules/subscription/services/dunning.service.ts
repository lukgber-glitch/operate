import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PrismaService } from '../../database/prisma.service';
import { DunningStatus } from '@prisma/client';

/**
 * Dunning Service
 * Manages automated payment failure recovery workflow
 *
 * Dunning Schedule:
 * - Day 0: Immediate retry
 * - Day 3: Retry + warning email
 * - Day 7: Retry + "action required" email
 * - Day 14: Retry + "final warning" email
 * - Day 21: Suspend account + email
 *
 * State Machine Flow:
 * RETRYING -> WARNING_SENT -> ACTION_REQUIRED -> FINAL_WARNING -> SUSPENDED
 *                                                                    ↓
 *                                                               RESOLVED
 */

export const DUNNING_RETRY_QUEUE = 'dunning-retry';
export const DUNNING_ESCALATE_QUEUE = 'dunning-escalate';

interface CreateDunningStateParams {
  subscriptionId: string;
  failedAt?: Date;
  lastError?: string;
}

interface DunningSchedule {
  dayOffset: number;
  state: DunningStatus;
  requiresEmail: boolean;
  emailTemplate: string;
}

@Injectable()
export class DunningService {
  private readonly logger = new Logger(DunningService.name);

  // Dunning schedule configuration
  private readonly DUNNING_SCHEDULE: DunningSchedule[] = [
    {
      dayOffset: 0,
      state: DunningStatus.RETRYING,
      requiresEmail: false,
      emailTemplate: '',
    },
    {
      dayOffset: 3,
      state: DunningStatus.WARNING_SENT,
      requiresEmail: true,
      emailTemplate: 'payment-failed-warning',
    },
    {
      dayOffset: 7,
      state: DunningStatus.ACTION_REQUIRED,
      requiresEmail: true,
      emailTemplate: 'payment-action-required',
    },
    {
      dayOffset: 14,
      state: DunningStatus.FINAL_WARNING,
      requiresEmail: true,
      emailTemplate: 'payment-final-warning',
    },
    {
      dayOffset: 21,
      state: DunningStatus.SUSPENDED,
      requiresEmail: true,
      emailTemplate: 'account-suspended',
    },
  ];

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(DUNNING_RETRY_QUEUE)
    private readonly retryQueue: Queue,
    @InjectQueue(DUNNING_ESCALATE_QUEUE)
    private readonly escalateQueue: Queue,
  ) {}

  /**
   * Start dunning process for a failed payment
   */
  async startDunning(params: CreateDunningStateParams): Promise<void> {
    const { subscriptionId, failedAt = new Date(), lastError } = params;

    this.logger.log(`Starting dunning process for subscription ${subscriptionId}`);

    // Check if dunning already exists
    const existing = await this.prisma.dunningState.findUnique({
      where: { subscriptionId },
    });

    if (existing && existing.state !== DunningStatus.RESOLVED) {
      this.logger.warn(
        `Dunning already in progress for subscription ${subscriptionId}, state: ${existing.state}`,
      );
      return;
    }

    // Create or reset dunning state
    await this.prisma.dunningState.upsert({
      where: { subscriptionId },
      create: {
        subscriptionId,
        failedAt,
        retryCount: 0,
        state: DunningStatus.RETRYING,
        lastError,
        nextRetryAt: this.calculateNextRetry(0),
      },
      update: {
        failedAt,
        retryCount: 0,
        state: DunningStatus.RETRYING,
        lastError,
        nextRetryAt: this.calculateNextRetry(0),
        resolvedAt: null,
      },
    });

    // Schedule immediate retry
    await this.scheduleRetry(subscriptionId, 0);
  }

  /**
   * Retry failed payment
   */
  async retryPayment(subscriptionId: string): Promise<boolean> {
    this.logger.log(`Attempting payment retry for subscription ${subscriptionId}`);

    const dunningState = await this.prisma.dunningState.findUnique({
      where: { subscriptionId },
    });

    if (!dunningState) {
      this.logger.error(`No dunning state found for subscription ${subscriptionId}`);
      return false;
    }

    try {
      // Get subscription from Stripe
      const subscription = await this.getSubscriptionFromStripe(subscriptionId);

      if (!subscription) {
        throw new Error('Subscription not found');
      }

      // Attempt to retry the latest invoice
      const success = await this.retryLatestInvoice(subscription.stripeSubscriptionId);

      if (success) {
        // Payment succeeded - resolve dunning
        await this.resolveDunning(subscriptionId, 'Payment succeeded');
        return true;
      }

      // Payment failed - escalate
      const newRetryCount = dunningState.retryCount + 1;
      await this.escalateDunning(subscriptionId, newRetryCount);
      return false;
    } catch (error) {
      this.logger.error(
        `Error retrying payment for subscription ${subscriptionId}: ${error.message}`,
      );

      // Update error and escalate
      await this.prisma.dunningState.update({
        where: { subscriptionId },
        data: {
          lastError: error.message,
          retryCount: { increment: 1 },
        },
      });

      const newRetryCount = dunningState.retryCount + 1;
      await this.escalateDunning(subscriptionId, newRetryCount);
      return false;
    }
  }

  /**
   * Escalate dunning to next state
   */
  async escalateDunning(subscriptionId: string, retryCount: number): Promise<void> {
    this.logger.log(`Escalating dunning for subscription ${subscriptionId}, retry ${retryCount}`);

    const dunningState = await this.prisma.dunningState.findUnique({
      where: { subscriptionId },
    });

    if (!dunningState) {
      this.logger.error(`No dunning state found for subscription ${subscriptionId}`);
      return;
    }

    // Find next state based on days since failure
    const daysSinceFailure = this.getDaysSince(dunningState.failedAt);
    const nextSchedule = this.getScheduleForDay(daysSinceFailure);

    if (!nextSchedule) {
      this.logger.warn(`No schedule found for day ${daysSinceFailure}, suspending account`);
      await this.suspendAccount(subscriptionId);
      return;
    }

    // Update dunning state
    await this.prisma.dunningState.update({
      where: { subscriptionId },
      data: {
        state: nextSchedule.state,
        retryCount,
        nextRetryAt: this.calculateNextRetry(daysSinceFailure),
      },
    });

    // Send email if required
    if (nextSchedule.requiresEmail) {
      await this.sendDunningEmail(subscriptionId, nextSchedule.emailTemplate);
    }

    // Check if we should suspend
    if (nextSchedule.state === DunningStatus.SUSPENDED) {
      await this.suspendAccount(subscriptionId);
    } else {
      // Schedule next retry
      await this.scheduleRetry(subscriptionId, daysSinceFailure);
    }
  }

  /**
   * Resolve dunning (payment recovered)
   */
  async resolveDunning(subscriptionId: string, reason: string): Promise<void> {
    this.logger.log(`Resolving dunning for subscription ${subscriptionId}: ${reason}`);

    await this.prisma.dunningState.update({
      where: { subscriptionId },
      data: {
        state: DunningStatus.RESOLVED,
        resolvedAt: new Date(),
        metadata: {
          resolvedReason: reason,
          resolvedBy: 'system',
        },
      },
    });

    // Reactivate subscription if it was suspended
    await this.reactivateSubscription(subscriptionId);

    // Send recovery email
    await this.sendDunningEmail(subscriptionId, 'payment-recovered');

    // Remove scheduled jobs
    await this.removeScheduledJobs(subscriptionId);
  }

  /**
   * Manually resolve dunning (admin override)
   */
  async manualResolve(subscriptionId: string, adminUserId: string): Promise<void> {
    this.logger.log(`Manually resolving dunning for subscription ${subscriptionId} by ${adminUserId}`);

    await this.prisma.dunningState.update({
      where: { subscriptionId },
      data: {
        state: DunningStatus.RESOLVED,
        resolvedAt: new Date(),
        metadata: {
          resolvedReason: 'Manual override',
          resolvedBy: adminUserId,
        },
      },
    });

    await this.reactivateSubscription(subscriptionId);
    await this.removeScheduledJobs(subscriptionId);
  }

  /**
   * Manually suspend account (admin override)
   */
  async manualSuspend(subscriptionId: string, adminUserId: string): Promise<void> {
    this.logger.log(`Manually suspending subscription ${subscriptionId} by ${adminUserId}`);

    await this.prisma.dunningState.update({
      where: { subscriptionId },
      data: {
        state: DunningStatus.SUSPENDED,
        metadata: {
          suspendedBy: adminUserId,
          suspendedAt: new Date(),
        },
      },
    });

    await this.suspendAccount(subscriptionId);
  }

  /**
   * Get all subscriptions in dunning
   */
  async getDunningList(state?: DunningStatus) {
    const where = state ? { state } : {};

    return this.prisma.dunningState.findMany({
      where,
      orderBy: {
        failedAt: 'desc',
      },
    });
  }

  /**
   * Get dunning state for a subscription
   */
  async getDunningState(subscriptionId: string) {
    return this.prisma.dunningState.findUnique({
      where: { subscriptionId },
    });
  }

  // Private helper methods

  private calculateNextRetry(currentDayOffset: number): Date {
    const nextSchedule = this.DUNNING_SCHEDULE.find(
      (s) => s.dayOffset > currentDayOffset,
    );

    if (!nextSchedule) {
      return null; // No more retries
    }

    const daysUntilRetry = nextSchedule.dayOffset - currentDayOffset;
    const nextRetry = new Date();
    nextRetry.setDate(nextRetry.getDate() + daysUntilRetry);

    return nextRetry;
  }

  private getScheduleForDay(day: number): DunningSchedule | null {
    // Find the appropriate schedule for the given day
    for (let i = this.DUNNING_SCHEDULE.length - 1; i >= 0; i--) {
      if (day >= this.DUNNING_SCHEDULE[i].dayOffset) {
        return this.DUNNING_SCHEDULE[i];
      }
    }
    return this.DUNNING_SCHEDULE[0];
  }

  private getDaysSince(date: Date): number {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  private async scheduleRetry(subscriptionId: string, currentDayOffset: number): Promise<void> {
    const nextRetryDate = this.calculateNextRetry(currentDayOffset);

    if (!nextRetryDate) {
      this.logger.log(`No more retries scheduled for subscription ${subscriptionId}`);
      return;
    }

    const delay = nextRetryDate.getTime() - Date.now();

    await this.retryQueue.add(
      'retry-payment',
      { subscriptionId },
      {
        delay: delay > 0 ? delay : 0,
        jobId: `retry-${subscriptionId}`,
        removeOnComplete: true,
      },
    );

    this.logger.log(
      `Scheduled retry for subscription ${subscriptionId} in ${Math.round(delay / 1000 / 60)} minutes`,
    );
  }

  private async removeScheduledJobs(subscriptionId: string): Promise<void> {
    // Remove retry job
    const retryJob = await this.retryQueue.getJob(`retry-${subscriptionId}`);
    if (retryJob) {
      await retryJob.remove();
    }

    // Remove escalate job
    const escalateJob = await this.escalateQueue.getJob(`escalate-${subscriptionId}`);
    if (escalateJob) {
      await escalateJob.remove();
    }
  }

  private async suspendAccount(subscriptionId: string): Promise<void> {
    this.logger.warn(`Suspending account for subscription ${subscriptionId}`);

    // Update subscription status
    await this.prisma.$executeRaw`
      UPDATE stripe_subscriptions
      SET status = 'SUSPENDED', updated_at = NOW()
      WHERE stripe_subscription_id = ${subscriptionId}
    `;

    // TODO: Additional suspension logic (disable features, etc.)
  }

  private async reactivateSubscription(subscriptionId: string): Promise<void> {
    this.logger.log(`Reactivating subscription ${subscriptionId}`);

    // Update subscription status back to active
    await this.prisma.$executeRaw`
      UPDATE stripe_subscriptions
      SET status = 'ACTIVE', updated_at = NOW()
      WHERE stripe_subscription_id = ${subscriptionId}
    `;

    // TODO: Additional reactivation logic
  }

  private async getSubscriptionFromStripe(subscriptionId: string): Promise<any> {
    // Query stripe_subscriptions table
    const result = await this.prisma.$queryRaw<any[]>`
      SELECT * FROM stripe_subscriptions
      WHERE stripe_subscription_id = ${subscriptionId}
      LIMIT 1
    `;

    return result[0] || null;
  }

  private async retryLatestInvoice(stripeSubscriptionId: string): Promise<boolean> {
    // This should call Stripe API to retry the invoice
    // For now, we'll return a placeholder
    // TODO: Implement actual Stripe invoice retry logic
    this.logger.log(`Retrying latest invoice for subscription ${stripeSubscriptionId}`);

    // In real implementation, this would:
    // 1. Get latest unpaid invoice from Stripe
    // 2. Call stripe.invoices.pay(invoiceId)
    // 3. Return true if successful, false otherwise

    return false; // Placeholder
  }

  private async sendDunningEmail(subscriptionId: string, templateName: string): Promise<void> {
    this.logger.log(`Sending dunning email '${templateName}' for subscription ${subscriptionId}`);

    // TODO: Integrate with email service
    // This should:
    // 1. Get customer email from subscription
    // 2. Load appropriate email template
    // 3. Send email via notification service
  }
}
