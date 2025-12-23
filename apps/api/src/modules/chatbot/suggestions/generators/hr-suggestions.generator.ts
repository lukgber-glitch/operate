/**
 * HR Suggestions Generator
 * Generates suggestions related to HR (leave requests, contracts, etc.)
 */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/modules/database/prisma.service';
import { BaseSuggestionGenerator } from './base.generator';
import {
  GeneratorResult,
  Suggestion,
  SuggestionContext,
  SuggestionPriority,
  SuggestionType,
  Reminder,
  ReminderType,
} from '../suggestion.types';

@Injectable()
export class HRSuggestionsGenerator extends BaseSuggestionGenerator {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async generate(context: SuggestionContext): Promise<GeneratorResult> {
    this.logger.debug(`Generating HR suggestions for org ${context.orgId}`);

    const suggestions: Suggestion[] = [];
    const reminders: Reminder[] = [];

    try {
      // Check pending leave requests
      const leaveResult = await this.checkPendingLeaveRequests(context);
      suggestions.push(...leaveResult.suggestions);

      // Check contract expirations
      const contractReminders = await this.checkContractExpirations(context);
      reminders.push(...contractReminders);

      // Create suggestions from contract reminders
      for (const reminder of contractReminders) {
        if (reminder.daysRemaining <= 30) {
          suggestions.push({
            id: reminder.id,
            type: SuggestionType.DEADLINE,
            title: reminder.title,
            description: reminder.description,
            action: reminder.action,
            priority: reminder.severity,
            dismissible: false,
            metadata: {
              dueDate: reminder.dueDate,
              daysRemaining: reminder.daysRemaining,
              type: reminder.type,
            },
          });
        }
      }

      // Check probation periods ending
      const probationResult = await this.checkProbationPeriods(context);
      suggestions.push(...probationResult.suggestions);

      return {
        suggestions,
        insights: [],
        reminders,
        optimizations: [],
      };
    } catch (error) {
      this.logger.error('Error generating HR suggestions:', error);
      return this.emptyResult();
    }
  }

  /**
   * Check pending leave requests
   */
  private async checkPendingLeaveRequests(
    context: SuggestionContext,
  ): Promise<{ suggestions: Suggestion[] }> {
    // Check if Leave model exists
    const pendingCount = await this.prisma.leaveRequest
      .count({
        where: {
          employee: { orgId: context.orgId },
          status: 'PENDING',
        },
      })
      .catch(() => 0);

    if (pendingCount === 0) {
      return { suggestions: [] };
    }

    const suggestion: Suggestion = {
      id: this.createSuggestionId('hr', 'leave', context.orgId),
      type: SuggestionType.QUICK_ACTION,
      title: `${pendingCount} pending leave request${pendingCount > 1 ? 's' : ''}`,
      description: `You have ${pendingCount} leave request${pendingCount > 1 ? 's' : ''} waiting for approval.`,
      action: {
        type: 'navigate',
        label: 'Review Requests',
        params: { path: '/hr/leave?status=pending' },
      },
      priority: SuggestionPriority.MEDIUM,
      dismissible: true,
      metadata: {
        count: pendingCount,
      },
    };

    return { suggestions: [suggestion] };
  }

  /**
   * Check contract expirations
   */
  private async checkContractExpirations(
    context: SuggestionContext,
  ): Promise<Reminder[]> {
    const reminders: Reminder[] = [];
    const now = new Date();
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);

    try {
      // Note: contractEndDate field does not exist in Employee model
      // This feature is disabled until the schema is updated
      const expiringContracts: any[] = [];
      // const expiringContracts = await this.prisma.employee
      //   .findMany({
      //     where: {
      //       orgId: context.orgId,
      //       contractEndDate: {
      //         gte: now,
      //         lte: threeMonthsFromNow,
      //       },
      //       status: 'ACTIVE',
      //     },
      //     select: {
      //       id: true,
      //       firstName: true,
      //       lastName: true,
      //       contractEndDate: true,
      //     },
      //   })
      //   .catch(() => []);

      for (const employee of expiringContracts) {
        if (!employee.contractEndDate) continue;

        const daysRemaining = this.getDaysBetween(now, employee.contractEndDate);

        const severity =
          daysRemaining <= 30
            ? SuggestionPriority.HIGH
            : daysRemaining <= 60
              ? SuggestionPriority.MEDIUM
              : SuggestionPriority.LOW;

        reminders.push({
          id: this.createSuggestionId(
            'reminder',
            'contract',
            employee.id,
            context.orgId,
          ),
          title: `Contract expiring: ${employee.firstName} ${employee.lastName}`,
          description: `${employee.firstName} ${employee.lastName}'s contract expires in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}`,
          dueDate: employee.contractEndDate,
          daysRemaining,
          type: ReminderType.DOCUMENT_EXPIRY,
          severity,
          action: {
            type: 'navigate',
            label: 'View Contract',
            params: {
              path: `/hr/employees/${employee.id}`,
            },
          },
        });
      }
    } catch (error) {
      this.logger.debug('Employee model not available or error occurred');
    }

    return reminders;
  }

  /**
   * Check probation periods ending
   */
  private async checkProbationPeriods(
    context: SuggestionContext,
  ): Promise<{ suggestions: Suggestion[] }> {
    const now = new Date();
    const oneMonthFromNow = new Date();
    oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);

    try {
      // Note: probationEndDate field does not exist in Employee model
      // This feature is disabled until the schema is updated
      const endingProbation: any[] = [];
      // const endingProbation = await this.prisma.employee
      //   .findMany({
      //     where: {
      //       orgId: context.orgId,
      //       probationEndDate: {
      //         gte: now,
      //         lte: oneMonthFromNow,
      //       },
      //       status: 'ACTIVE',
      //     },
      //     select: {
      //       id: true,
      //       firstName: true,
      //       lastName: true,
      //       probationEndDate: true,
      //     },
      //   })
      //   .catch(() => []);

      if (endingProbation.length === 0) {
        return { suggestions: [] };
      }

      const employeeNames = endingProbation
        .slice(0, 3)
        .map(e => `${e.firstName} ${e.lastName}`)
        .join(', ');

      const description =
        endingProbation.length <= 3
          ? `Probation period ending soon for ${employeeNames}. Schedule evaluation meetings.`
          : `${endingProbation.length} employees' probation periods ending soon (${employeeNames}, ...). Schedule evaluation meetings.`;

      const suggestion: Suggestion = {
        id: this.createSuggestionId('hr', 'probation', context.orgId),
        type: SuggestionType.DEADLINE,
        title: `${endingProbation.length} probation period${endingProbation.length > 1 ? 's' : ''} ending`,
        description,
        action: {
          type: 'navigate',
          label: 'Review Employees',
          params: { path: '/hr/employees?probation_ending=true' },
        },
        priority: SuggestionPriority.MEDIUM,
        dismissible: true,
        metadata: {
          count: endingProbation.length,
          employeeIds: endingProbation.map(e => e.id),
        },
      };

      return { suggestions: [suggestion] };
    } catch (error) {
      this.logger.debug('Probation period check not available');
      return { suggestions: [] };
    }
  }
}
