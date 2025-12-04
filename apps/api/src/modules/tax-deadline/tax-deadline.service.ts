/**
 * Tax Deadline Service
 * Manages tax deadline creation, tracking, and reminder scheduling
 *
 * Features:
 * - Multi-country tax deadline support
 * - Automatic deadline calculation
 * - Reminder scheduling
 * - Filing status tracking
 * - Calendar export (iCal)
 */

import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import {
  CreateTaxDeadlineDto,
  UpdateTaxDeadlineDto,
  MarkFiledDto,
  QueryTaxDeadlineDto,
} from './dto';
import {
  TaxDeadlineRule,
  getTaxDeadlineRule,
  getTaxDeadlineRulesForCountry,
  adjustToBusinessDay,
  TaxTypeEnum,
} from './constants/deadlines.constants';
import { TaxDeadlineReminder, TaxDeadlineReminderLog } from '@prisma/client';

export interface TaxDeadlineWithReminders extends TaxDeadlineReminder {
  reminders: TaxDeadlineReminderLog[];
}

@Injectable()
export class TaxDeadlineService {
  private readonly logger = new Logger(TaxDeadlineService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new tax deadline
   */
  async create(dto: CreateTaxDeadlineDto): Promise<TaxDeadlineReminder> {
    this.logger.log(
      `Creating tax deadline for organization ${dto.organizationId}, type ${dto.taxType}`,
    );

    try {
      const deadline = await this.prisma.taxDeadlineReminder.create({
        data: {
          organizationId: dto.organizationId,
          countryId: dto.countryId,
          taxType: dto.taxType,
          periodType: dto.periodType as any,
          periodStart: new Date(dto.periodStart),
          periodEnd: new Date(dto.periodEnd),
          dueDate: new Date(dto.dueDate),
          description: dto.description,
          notes: dto.notes,
          isAutoCreated: dto.isAutoCreated ?? false,
          isRecurring: dto.isRecurring ?? true,
        },
      });

      this.logger.log(`Created tax deadline ${deadline.id} due on ${deadline.dueDate}`);
      return deadline;
    } catch (error) {
      this.logger.error(`Failed to create tax deadline: ${error.message}`);
      throw new BadRequestException(`Failed to create tax deadline: ${error.message}`);
    }
  }

  /**
   * Find all tax deadlines with optional filtering
   */
  async findAll(query: QueryTaxDeadlineDto): Promise<{
    data: TaxDeadlineWithReminders[];
    total: number;
    page: number;
    limit: number;
  }> {
    const where: any = {};

    if (query.organizationId) {
      where.organizationId = query.organizationId;
    }

    if (query.countryId) {
      where.countryId = query.countryId;
    }

    if (query.taxType) {
      where.taxType = query.taxType;
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.dueDateFrom || query.dueDateTo) {
      where.dueDate = {};
      if (query.dueDateFrom) {
        where.dueDate.gte = new Date(query.dueDateFrom);
      }
      if (query.dueDateTo) {
        where.dueDate.lte = new Date(query.dueDateTo);
      }
    }

    const [data, total] = await Promise.all([
      this.prisma.taxDeadlineReminder.findMany({
        where,
        include: {
          reminders: {
            orderBy: { sentAt: 'desc' },
          },
        },
        orderBy: { dueDate: 'asc' },
        skip: query.offset,
        take: query.limit,
      }),
      this.prisma.taxDeadlineReminder.count({ where }),
    ]);

    return {
      data: data as TaxDeadlineWithReminders[],
      total,
      page: Math.floor(query.offset / query.limit),
      limit: query.limit,
    };
  }

  /**
   * Find a single tax deadline by ID
   */
  async findOne(id: string): Promise<TaxDeadlineWithReminders> {
    const deadline = await this.prisma.taxDeadlineReminder.findUnique({
      where: { id },
      include: {
        reminders: {
          orderBy: { sentAt: 'desc' },
        },
      },
    });

    if (!deadline) {
      throw new NotFoundException(`Tax deadline with ID ${id} not found`);
    }

    return deadline as TaxDeadlineWithReminders;
  }

  /**
   * Update a tax deadline
   */
  async update(id: string, dto: UpdateTaxDeadlineDto): Promise<TaxDeadlineReminder> {
    await this.findOne(id); // Ensure it exists

    const updateData: any = {};

    if (dto.taxType) updateData.taxType = dto.taxType;
    if (dto.periodType) updateData.periodType = dto.periodType;
    if (dto.periodStart) updateData.periodStart = new Date(dto.periodStart);
    if (dto.periodEnd) updateData.periodEnd = new Date(dto.periodEnd);
    if (dto.dueDate) updateData.dueDate = new Date(dto.dueDate);
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.notes !== undefined) updateData.notes = dto.notes;
    if (dto.status) updateData.status = dto.status;
    if (dto.isRecurring !== undefined) updateData.isRecurring = dto.isRecurring;

    return this.prisma.taxDeadlineReminder.update({
      where: { id },
      data: updateData,
    });
  }

  /**
   * Mark a deadline as filed
   */
  async markAsFiled(id: string, dto: MarkFiledDto, userId: string): Promise<TaxDeadlineReminder> {
    await this.findOne(id); // Ensure it exists

    this.logger.log(`Marking deadline ${id} as filed by user ${userId}`);

    return this.prisma.taxDeadlineReminder.update({
      where: { id },
      data: {
        status: 'FILED',
        filedAt: dto.filedAt ? new Date(dto.filedAt) : new Date(),
        filedBy: userId,
        confirmationId: dto.confirmationId,
        notes: dto.notes || undefined,
      },
    });
  }

  /**
   * Delete a tax deadline
   */
  async remove(id: string): Promise<void> {
    await this.findOne(id); // Ensure it exists

    await this.prisma.taxDeadlineReminder.delete({
      where: { id },
    });

    this.logger.log(`Deleted tax deadline ${id}`);
  }

  /**
   * Get upcoming deadlines for an organization
   */
  async getUpcomingDeadlines(
    organizationId: string,
    days: number = 30,
  ): Promise<TaxDeadlineWithReminders[]> {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + days);

    const deadlines = await this.prisma.taxDeadlineReminder.findMany({
      where: {
        organizationId,
        dueDate: {
          gte: today,
          lte: futureDate,
        },
        status: {
          in: ['PENDING', 'EXTENDED'],
        },
      },
      include: {
        reminders: {
          orderBy: { sentAt: 'desc' },
        },
      },
      orderBy: { dueDate: 'asc' },
    });

    return deadlines as TaxDeadlineWithReminders[];
  }

  /**
   * Get overdue deadlines for an organization
   */
  async getOverdueDeadlines(organizationId: string): Promise<TaxDeadlineWithReminders[]> {
    const today = new Date();

    // First, update all overdue deadlines
    await this.prisma.taxDeadlineReminder.updateMany({
      where: {
        organizationId,
        dueDate: {
          lt: today,
        },
        status: 'PENDING',
      },
      data: {
        status: 'OVERDUE',
      },
    });

    // Then fetch them
    const deadlines = await this.prisma.taxDeadlineReminder.findMany({
      where: {
        organizationId,
        status: 'OVERDUE',
      },
      include: {
        reminders: {
          orderBy: { sentAt: 'desc' },
        },
      },
      orderBy: { dueDate: 'asc' },
    });

    return deadlines as TaxDeadlineWithReminders[];
  }

  /**
   * Calculate deadline date based on tax rules
   */
  calculateDeadlineDate(
    rule: TaxDeadlineRule,
    periodStart: Date,
    periodEnd: Date,
  ): Date {
    let dueDate: Date;

    if (rule.specificMonth && rule.specificDayOfMonth) {
      // Annual filings with specific date
      const year = periodEnd.getFullYear();
      dueDate = new Date(year, rule.specificMonth - 1, rule.specificDayOfMonth);

      // If the date has passed this year, use next year
      if (dueDate <= periodEnd) {
        dueDate = new Date(year + 1, rule.specificMonth - 1, rule.specificDayOfMonth);
      }
    } else if (rule.specificDayOfMonth) {
      // Monthly/quarterly filings with specific day of next month
      const nextMonth = new Date(periodEnd);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      nextMonth.setDate(rule.specificDayOfMonth);
      dueDate = nextMonth;
    } else {
      // Use days after period end
      dueDate = new Date(periodEnd);
      dueDate.setDate(dueDate.getDate() + rule.daysAfterPeriodEnd);
    }

    // Adjust for weekends and holidays if needed
    if (rule.adjustForWeekends || rule.adjustForHolidays) {
      dueDate = adjustToBusinessDay(
        dueDate,
        rule.country,
        rule.adjustForWeekends,
        rule.adjustForHolidays,
      );
    }

    return dueDate;
  }

  /**
   * Auto-generate tax deadlines for an organization
   * Based on country and tax configuration
   */
  async autoGenerateDeadlines(
    organizationId: string,
    countryCode: string,
    year: number,
  ): Promise<TaxDeadlineReminder[]> {
    this.logger.log(
      `Auto-generating tax deadlines for organization ${organizationId}, country ${countryCode}, year ${year}`,
    );

    const rules = getTaxDeadlineRulesForCountry(countryCode);

    if (rules.length === 0) {
      this.logger.warn(`No tax deadline rules found for country ${countryCode}`);
      return [];
    }

    const deadlines: TaxDeadlineReminder[] = [];

    for (const rule of rules) {
      const periods = this.generatePeriods(year, rule.periodType);

      for (const period of periods) {
        const dueDate = this.calculateDeadlineDate(rule, period.start, period.end);

        // Check if deadline already exists
        const existing = await this.prisma.taxDeadlineReminder.findFirst({
          where: {
            organizationId,
            taxType: rule.taxType,
            periodStart: period.start,
            periodEnd: period.end,
          },
        });

        if (!existing) {
          const deadline = await this.create({
            organizationId,
            countryId: countryCode,
            taxType: rule.taxType,
            periodType: rule.periodType,
            periodStart: period.start.toISOString(),
            periodEnd: period.end.toISOString(),
            dueDate: dueDate.toISOString(),
            description: rule.description,
            isAutoCreated: true,
            isRecurring: true,
          });

          deadlines.push(deadline);
        }
      }
    }

    this.logger.log(`Generated ${deadlines.length} tax deadlines`);
    return deadlines;
  }

  /**
   * Generate periods for a given year and period type
   */
  private generatePeriods(
    year: number,
    periodType: string,
  ): Array<{ start: Date; end: Date }> {
    const periods: Array<{ start: Date; end: Date }> = [];

    switch (periodType) {
      case 'MONTHLY':
        for (let month = 0; month < 12; month++) {
          periods.push({
            start: new Date(year, month, 1),
            end: new Date(year, month + 1, 0, 23, 59, 59),
          });
        }
        break;

      case 'QUARTERLY':
        for (let quarter = 0; quarter < 4; quarter++) {
          const startMonth = quarter * 3;
          periods.push({
            start: new Date(year, startMonth, 1),
            end: new Date(year, startMonth + 3, 0, 23, 59, 59),
          });
        }
        break;

      case 'ANNUAL':
        periods.push({
          start: new Date(year, 0, 1),
          end: new Date(year, 11, 31, 23, 59, 59),
        });
        break;

      case 'SEMI_ANNUAL':
        periods.push(
          {
            start: new Date(year, 0, 1),
            end: new Date(year, 5, 30, 23, 59, 59),
          },
          {
            start: new Date(year, 6, 1),
            end: new Date(year, 11, 31, 23, 59, 59),
          },
        );
        break;

      case 'BI_MONTHLY':
        for (let period = 0; period < 6; period++) {
          const startMonth = period * 2;
          periods.push({
            start: new Date(year, startMonth, 1),
            end: new Date(year, startMonth + 2, 0, 23, 59, 59),
          });
        }
        break;
    }

    return periods;
  }

  /**
   * Export deadlines to iCal format
   */
  async exportToICal(organizationId: string): Promise<string> {
    const deadlines = await this.prisma.taxDeadlineReminder.findMany({
      where: {
        organizationId,
        status: {
          in: ['PENDING', 'EXTENDED'],
        },
      },
      orderBy: { dueDate: 'asc' },
    });

    let ical = 'BEGIN:VCALENDAR\r\n';
    ical += 'VERSION:2.0\r\n';
    ical += 'PRODID:-//Operate//Tax Deadline Reminders//EN\r\n';
    ical += 'CALSCALE:GREGORIAN\r\n';
    ical += 'METHOD:PUBLISH\r\n';
    ical += 'X-WR-CALNAME:Tax Deadlines\r\n';
    ical += 'X-WR-TIMEZONE:UTC\r\n';

    for (const deadline of deadlines) {
      const uid = `${deadline.id}@operate.app`;
      const dtstart = this.formatICalDate(deadline.dueDate);
      const summary = `${deadline.taxType} - ${deadline.description || 'Tax Filing Due'}`;
      const description = deadline.notes || `Tax deadline for ${deadline.taxType}`;

      ical += 'BEGIN:VEVENT\r\n';
      ical += `UID:${uid}\r\n`;
      ical += `DTSTAMP:${this.formatICalDate(new Date())}\r\n`;
      ical += `DTSTART;VALUE=DATE:${dtstart}\r\n`;
      ical += `SUMMARY:${summary}\r\n`;
      ical += `DESCRIPTION:${description}\r\n`;
      ical += `STATUS:CONFIRMED\r\n`;
      ical += `TRANSP:OPAQUE\r\n`;

      // Add alarms (reminders)
      const reminderDays = [7, 3, 1];
      for (const days of reminderDays) {
        ical += 'BEGIN:VALARM\r\n';
        ical += 'ACTION:DISPLAY\r\n';
        ical += `DESCRIPTION:Reminder: ${summary} in ${days} day(s)\r\n`;
        ical += `TRIGGER:-P${days}D\r\n`;
        ical += 'END:VALARM\r\n';
      }

      ical += 'END:VEVENT\r\n';
    }

    ical += 'END:VCALENDAR\r\n';

    return ical;
  }

  /**
   * Format date for iCal format (YYYYMMDD)
   */
  private formatICalDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
  }
}
