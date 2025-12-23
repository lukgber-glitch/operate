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

      const startTime = normalized.date
        ? new Date(normalized.date)
        : new Date();

      const endTime = new Date(startTime);
      endTime.setHours(endTime.getHours() + normalized.hours);

      const createDto = {
        description: normalized.description,
        projectId: normalized.projectId,
        billable: normalized.billable !== false,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        duration: normalized.hours * 60, // Convert hours to minutes
      };

      const entry = await this.timeTrackingService.createTimeEntry(
        context.organizationId,
        context.userId,
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
          startTime: entry.startTime,
          endTime: entry.endTime,
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
