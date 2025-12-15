/**
 * Stop Timer Action Handler
 * Stops currently running timer via chatbot
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
export class StopTimerHandler extends BaseActionHandler {
  constructor(private timeTrackingService: TimeTrackingService) {
    super('StopTimerHandler');
  }

  get actionType(): ActionType {
    return ActionType.STOP_TIMER;
  }

  getRequiredParameters(): ParameterDefinition[] {
    return [];
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

      const timer = await this.timeTrackingService.stopTimer(
        context.userId,
        context.organizationId,
      );

      if (!timer) {
        return this.error('No active timer found', 'NO_ACTIVE_TIMER');
      }

      const duration = timer.duration || 0;
      const hours = Math.floor(duration / 3600);
      const minutes = Math.floor((duration % 3600) / 60);

      this.logger.log(
        `Timer ${timer.id} stopped by AI assistant for user ${context.userId}`,
      );

      return this.success(
        `Timer stopped. Duration: ${hours}h ${minutes}m`,
        timer.id,
        'TimeEntry',
        {
          id: timer.id,
          description: timer.description,
          duration,
          hours: Number((duration / 3600).toFixed(2)),
        },
      );
    } catch (error) {
      this.logger.error('Failed to stop timer:', error);
      return this.error(
        'Failed to stop timer',
        error.message || 'Unknown error',
      );
    }
  }
}
