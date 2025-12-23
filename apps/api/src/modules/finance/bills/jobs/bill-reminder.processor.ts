import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/modules/database/prisma.service';
import { NotificationsService } from '../../../notifications/notifications.service';
import { PaymentStatus } from '@prisma/client';

/**
 * Bill Reminder Processor
 * Handles background jobs for checking bills due soon and creating reminders
 *
 * Reminder levels:
 * - 7 days: MEDIUM priority
 * - 3 days: HIGH priority
 * - 1 day: URGENT priority
 */
@Processor('bill-reminders')
@Injectable()
export class BillReminderProcessor {
  private readonly logger = new Logger(BillReminderProcessor.name);

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  /**
   * Process: Check for bills due in 7, 3, and 1 days
   * Creates in-app notifications to remind users to pay
   */
  @Process('check-due-bills')
  async handleCheckDueBills(job: Job): Promise<void> {
    this.logger.log('Processing bill reminder check job');

    try {
      // Get all organizations (in production, this could be paginated)
      const organizations = await this.prisma.organisation.findMany({
        select: { id: true },
      });

      let totalRemindersCreated = 0;

      for (const org of organizations) {
        const remindersCreated = await this.checkBillsForOrganisation(org.id);
        totalRemindersCreated += remindersCreated;
      }

      this.logger.log(
        `Completed bill reminder check. Created ${totalRemindersCreated} reminders across ${organizations.length} organizations`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to process bill reminder check: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Check bills for a specific organization and create reminders
   */
  private async checkBillsForOrganisation(organisationId: string): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Calculate reminder dates
    const sevenDaysFromNow = new Date(today);
    sevenDaysFromNow.setDate(today.getDate() + 7);
    sevenDaysFromNow.setHours(23, 59, 59, 999);

    const threeDaysFromNow = new Date(today);
    threeDaysFromNow.setDate(today.getDate() + 3);
    threeDaysFromNow.setHours(23, 59, 59, 999);

    const oneDayFromNow = new Date(today);
    oneDayFromNow.setDate(today.getDate() + 1);
    oneDayFromNow.setHours(23, 59, 59, 999);

    let remindersCreated = 0;

    // Check bills due in 7 days (MEDIUM priority)
    const billsDueIn7Days = await this.getBillsDueOnDate(
      organisationId,
      sevenDaysFromNow,
    );

    for (const bill of billsDueIn7Days) {
      await this.createBillReminder(bill, 7, 3);
      remindersCreated++;
    }

    // Check bills due in 3 days (HIGH priority)
    const billsDueIn3Days = await this.getBillsDueOnDate(
      organisationId,
      threeDaysFromNow,
    );

    for (const bill of billsDueIn3Days) {
      await this.createBillReminder(bill, 3, 4);
      remindersCreated++;
    }

    // Check bills due in 1 day (URGENT priority)
    const billsDueIn1Day = await this.getBillsDueOnDate(
      organisationId,
      oneDayFromNow,
    );

    for (const bill of billsDueIn1Day) {
      await this.createBillReminder(bill, 1, 5);
      remindersCreated++;
    }

    return remindersCreated;
  }

  /**
   * Get unpaid bills due on a specific date
   */
  private async getBillsDueOnDate(organisationId: string, dueDate: Date) {
    const startOfDay = new Date(dueDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(dueDate);
    endOfDay.setHours(23, 59, 59, 999);

    return this.prisma.bill.findMany({
      where: {
        organisationId,
        dueDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
        paymentStatus: {
          not: PaymentStatus.COMPLETED,
        },
      },
      include: {
        vendor: true,
      },
    });
  }

  /**
   * Create an in-app notification reminder for a bill
   */
  private async createBillReminder(
    bill: any,
    daysUntilDue: number,
    priority: number,
  ): Promise<void> {
    // Get users in the organization who should receive reminders
    // For now, get all users in the organization
    // In production, this could be filtered by role/permissions
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

    const dueText = daysUntilDue === 1 ? 'tomorrow' : `in ${daysUntilDue} days`;

    const title = `Bill Payment Due ${dueText.charAt(0).toUpperCase() + dueText.slice(1)}`;
    const message = `Bill from ${bill.vendorName} (${formattedAmount}) is due ${dueText}`;

    // Create notification for each user
    for (const member of users) {
      try {
        await this.notificationsService.createNotification({
          userId: member.userId,
          orgId: bill.organisationId,
          type: 'deadline',
          title,
          message,
          priority,
          data: {
            billId: bill.id,
            vendorName: bill.vendorName,
            amount: amountRemaining,
            currency: bill.currency,
            dueDate: bill.dueDate,
            daysUntilDue,
            billNumber: bill.billNumber,
            link: `/bills/${bill.id}`,
          },
        });

        this.logger.debug(
          `Created reminder for bill ${bill.id} (${daysUntilDue} days) for user ${member.userId}`,
        );
      } catch (error) {
        this.logger.error(
          `Failed to create reminder for bill ${bill.id} for user ${member.userId}: ${error.message}`,
        );
        // Continue with other users
      }
    }
  }

  /**
   * Process: Create reminder for a specific bill
   * Used when manually triggering a reminder
   */
  @Process('remind-bill')
  async handleRemindBill(job: Job<{ billId: string }>): Promise<void> {
    const { billId } = job.data;

    this.logger.log(`Processing manual reminder for bill ${billId}`);

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

      // Check if bill is paid
      if (bill.paymentStatus === PaymentStatus.COMPLETED) {
        this.logger.log(`Skipping reminder for bill ${billId} - already paid`);
        return;
      }

      // Calculate days until due
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const dueDate = new Date(bill.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      const daysUntilDue = Math.ceil(
        (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
      );

      // Determine priority based on days until due
      let priority = 3; // Default
      if (daysUntilDue <= 1) {
        priority = 5; // URGENT
      } else if (daysUntilDue <= 3) {
        priority = 4; // HIGH
      }

      await this.createBillReminder(bill, daysUntilDue, priority);

      this.logger.log(`Successfully created manual reminder for bill ${billId}`);
    } catch (error) {
      this.logger.error(
        `Failed to create manual reminder for bill ${billId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
