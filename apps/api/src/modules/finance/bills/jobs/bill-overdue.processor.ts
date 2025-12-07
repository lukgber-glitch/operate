import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { NotificationsService } from '../../../notifications/notifications.service';
import { BillStatus, PaymentStatus } from '@prisma/client';

/**
 * Bill Overdue Processor
 * Handles background jobs for marking bills as overdue and creating urgent notifications
 */
@Processor('bill-reminders')
@Injectable()
export class BillOverdueProcessor {
  private readonly logger = new Logger(BillOverdueProcessor.name);

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  /**
   * Process: Check for overdue bills and mark them
   * Creates urgent notifications for overdue bills
   */
  @Process('check-overdue-bills')
  async handleCheckOverdueBills(job: Job): Promise<void> {
    this.logger.log('Processing overdue bills check job');

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Find all bills that are past due date and not yet marked as overdue
      const overdueBills = await this.prisma.bill.findMany({
        where: {
          dueDate: {
            lt: today,
          },
          paymentStatus: {
            not: PaymentStatus.COMPLETED,
          },
          status: {
            not: BillStatus.OVERDUE,
          },
        },
        include: {
          vendor: true,
        },
      });

      this.logger.log(
        `Found ${overdueBills.length} bills to mark as overdue`,
      );

      let updatedCount = 0;
      let notificationsCreated = 0;

      for (const bill of overdueBills) {
        try {
          // Update bill status to OVERDUE
          await this.prisma.bill.update({
            where: { id: bill.id },
            data: {
              status: BillStatus.OVERDUE,
            },
          });

          updatedCount++;

          // Create urgent notification
          await this.createOverdueNotification(bill);
          notificationsCreated++;

          this.logger.debug(`Marked bill ${bill.id} as overdue`);
        } catch (error) {
          this.logger.error(
            `Failed to process overdue bill ${bill.id}: ${error.message}`,
          );
          // Continue with other bills
        }
      }

      this.logger.log(
        `Marked ${updatedCount} bills as overdue and created ${notificationsCreated} notifications`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to process overdue bills check: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Create an urgent notification for an overdue bill
   */
  private async createOverdueNotification(bill: any): Promise<void> {
    // Get users in the organization
    const users = await this.prisma.membership.findMany({
      where: {
        orgId: bill.organisationId,
      },
      select: {
        userId: true,
      },
    });

    const amount = Number(bill.totalAmount);
    const amountRemaining = amount - Number(bill.paidAmount);
    const formattedAmount = new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: bill.currency,
    }).format(amountRemaining);

    // Calculate how many days overdue
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(bill.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    const daysOverdue = Math.floor(
      (today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    const title = 'Bill Payment Overdue';
    const message = `Bill from ${bill.vendorName} (${formattedAmount}) is ${daysOverdue} ${daysOverdue === 1 ? 'day' : 'days'} overdue`;

    // Create urgent notification for each user
    for (const member of users) {
      try {
        await this.notificationsService.createNotification({
          userId: member.userId,
          orgId: bill.organisationId,
          type: 'deadline',
          title,
          message,
          priority: 5, // URGENT
          data: {
            billId: bill.id,
            vendorName: bill.vendorName,
            amount: amountRemaining,
            currency: bill.currency,
            dueDate: bill.dueDate,
            daysOverdue,
            billNumber: bill.billNumber,
            link: `/bills/${bill.id}`,
            isOverdue: true,
          },
        });

        this.logger.debug(
          `Created overdue notification for bill ${bill.id} for user ${member.userId}`,
        );
      } catch (error) {
        this.logger.error(
          `Failed to create overdue notification for bill ${bill.id} for user ${member.userId}: ${error.message}`,
        );
        // Continue with other users
      }
    }
  }

  /**
   * Process: Mark a specific bill as overdue
   * Used when manually triggering overdue status
   */
  @Process('mark-bill-overdue')
  async handleMarkBillOverdue(job: Job<{ billId: string }>): Promise<void> {
    const { billId } = job.data;

    this.logger.log(`Processing mark overdue for bill ${billId}`);

    try {
      const bill = await this.prisma.bill.findUnique({
        where: { id: billId },
        include: {
          vendor: true,
        },
      });

      if (!bill) {
        this.logger.warn(`Bill ${billId} not found`);
        return;
      }

      // Check if bill is already paid
      if (bill.paymentStatus === PaymentStatus.COMPLETED) {
        this.logger.log(`Bill ${billId} is already paid, not marking as overdue`);
        return;
      }

      // Check if bill is already marked overdue
      if (bill.status === BillStatus.OVERDUE) {
        this.logger.log(`Bill ${billId} is already marked as overdue`);
        return;
      }

      // Check if bill is actually overdue
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const dueDate = new Date(bill.dueDate);
      dueDate.setHours(0, 0, 0, 0);

      if (dueDate >= today) {
        this.logger.log(`Bill ${billId} is not overdue yet`);
        return;
      }

      // Update status to OVERDUE
      await this.prisma.bill.update({
        where: { id: billId },
        data: {
          status: BillStatus.OVERDUE,
        },
      });

      // Create urgent notification
      await this.createOverdueNotification(bill);

      this.logger.log(`Successfully marked bill ${billId} as overdue`);
    } catch (error) {
      this.logger.error(
        `Failed to mark bill ${billId} as overdue: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
