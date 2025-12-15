/**
 * Log Time Action Handler
 * Logs time manually via chatbot
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
export class LogTimeHandler extends BaseActionHandler {
  constructor(private timeTrackingService: TimeTrackingService) {
    super('LogTimeHandler');
  }

  get actionType(): ActionType {
    return ActionType.LOG_TIME;
  }

  getRequiredParameters(): ParameterDefinition[] {
    return [
      {
        name: 'hours',
        type: 'number',
        required: true,
        description: 'Number of hours worked',
        validation: (value) => value > 0 && value <= 24,
      },
      {
        name: 'description',
        type: 'string',
        required: true,
        description: 'Description of work performed',
      },
      {
        name: 'projectId',
        type: 'string',
        required: false,
        description: 'Project ID (optional)',
      },
      {
        name: 'date',
        type: 'string',
        required: false,
        description: 'Date of work (YYYY-MM-DD, default: today)',
      },
      {
        name: 'billable',
        type: 'boolean',
        required: false,
        description: 'Whether time is billable',
        default: true,
      },
    ];
  }

  async execute(
    params: Record<string, any>,
    context: ActionContext,
  ): Promise<ActionResult> {
    try {
      if (!this.hasPermission(context, 'time:track')) {
        return this.error(
          'You do not have permission to log time',
          'PERMISSION_DENIED',
        );
      }

      const normalized = this.normalizeParams(params);

      const date = normalized.date
        ? new Date(normalized.date)
        : new Date();

      const createDto = {
        description: normalized.description,
        projectId: normalized.projectId,
        billable: normalized.billable !== false,
        date,
        duration: normalized.hours * 3600, // Convert hours to seconds
      };

      const entry = await this.timeTrackingService.logTime(
        context.userId,
        context.organizationId,
        createDto,
      );

      this.logger.log(
        `Time entry ${entry.id} logged by AI assistant for user ${context.userId}`,
      );

      return this.success(
        `Logged ${normalized.hours} hours for "${normalized.description}"`,
        entry.id,
        'TimeEntry',
        {
          id: entry.id,
          description: entry.description,
          hours: normalized.hours,
          date: entry.date,
          billable: entry.billable,
        },
      );
    } catch (error) {
      this.logger.error('Failed to log time:', error);
      return this.error(
        'Failed to log time',
        error.message || 'Unknown error',
      );
    }
  }
}
