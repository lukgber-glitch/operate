/**
 * Get Time Summary Action Handler
 * Gets time tracking summary for a period via chatbot
 */

import { Injectable } from '@nestjs/common';
import { BaseActionHandler } from './base.handler';
import {
  ActionType,
  ActionResult,
  ActionContext,
  ParameterDefinition,
} from '../action.types';
import { TimeTrackingService } from '../../../time-tracking/time-tracking.service';

@Injectable()
export class GetTimeSummaryHandler extends BaseActionHandler {
  constructor(private timeTrackingService: TimeTrackingService) {
    super('GetTimeSummaryHandler');
  }

  get actionType(): ActionType {
    return ActionType.GET_TIME_SUMMARY;
  }

  getRequiredParameters(): ParameterDefinition[] {
    return [
      {
        name: 'period',
        type: 'string',
        required: false,
        description: 'Period: today, this_week, this_month',
        default: 'today',
        validation: (value) =>
          ['today', 'this_week', 'this_month'].includes(value),
      },
    ];
  }

  async execute(
    params: Record<string, any>,
    context: ActionContext,
  ): Promise<ActionResult> {
    try {
      if (!this.hasPermission(context, 'time:view')) {
        return this.error(
          'You do not have permission to view time entries',
          'PERMISSION_DENIED',
        );
      }

      const normalized = this.normalizeParams(params);
      const period = normalized.period || 'today';

      // Calculate date range based on period
      const now = new Date();
      let startDate: Date;

      switch (period) {
        case 'today':
          startDate = new Date(now.setHours(0, 0, 0, 0));
          break;
        case 'this_week':
          const dayOfWeek = now.getDay();
          const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
          startDate = new Date(now.setDate(diff));
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'this_month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        default:
          startDate = new Date(now.setHours(0, 0, 0, 0));
      }

      const summary = await this.timeTrackingService.getSummary(
        context.organizationId,
        {
          startDate: startDate.toISOString(),
          endDate: new Date().toISOString(),
        },
      );

      return this.success(
        `Time summary for ${period}: ${summary.totalHours.toFixed(2)} hours`,
        undefined,
        'TimeSummary',
        {
          period,
          totalHours: summary.totalHours,
          billableHours: summary.billableHours,
          totalRevenue: summary.totalRevenue,
          entryCount: summary.entryCount,
        },
      );
    } catch (error) {
      this.logger.error('Failed to get time summary:', error);
      return this.error(
        'Failed to get time summary',
        error.message || 'Unknown error',
      );
    }
  }
}
