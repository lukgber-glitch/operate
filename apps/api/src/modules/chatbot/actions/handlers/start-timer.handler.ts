/**
 * Start Timer Action Handler
 * Starts time tracking timer via chatbot
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
export class StartTimerHandler extends BaseActionHandler {
  constructor(private timeTrackingService: TimeTrackingService) {
    super('StartTimerHandler');
  }

  get actionType(): ActionType {
    return ActionType.START_TIMER;
  }

  getRequiredParameters(): ParameterDefinition[] {
    return [
      {
        name: 'description',
        type: 'string',
        required: true,
        description: 'Description of work being tracked',
      },
      {
        name: 'projectId',
        type: 'string',
        required: false,
        description: 'Project ID (optional)',
      },
      {
        name: 'clientId',
        type: 'string',
        required: false,
        description: 'Client ID (optional)',
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
          'You do not have permission to track time',
          'PERMISSION_DENIED',
        );
      }

      const normalized = this.normalizeParams(params);

      const createDto = {
        description: normalized.description,
        projectId: normalized.projectId,
        clientId: normalized.clientId,
        billable: normalized.billable !== false,
        startTime: new Date(),
      };

      const timer = await this.timeTrackingService.startTimer(
        context.userId,
        context.organizationId,
        createDto,
      );

      this.logger.log(
        `Timer ${timer.id} started by AI assistant for user ${context.userId}`,
      );

      return this.success(
        `Timer started for "${normalized.description}"`,
        timer.id,
        'TimeEntry',
        {
          id: timer.id,
          description: timer.description,
          startTime: timer.startTime,
          billable: timer.billable,
        },
      );
    } catch (error) {
      this.logger.error('Failed to start timer:', error);
      return this.error(
        'Failed to start timer',
        error.message || 'Unknown error',
      );
    }
  }
}
