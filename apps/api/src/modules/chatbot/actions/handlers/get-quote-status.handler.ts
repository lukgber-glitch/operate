/**
 * Get Quote Status Action Handler
 * Retrieves quote status via chatbot
 */

import { Injectable } from '@nestjs/common';
import { BaseActionHandler } from './base.handler';
import {
  ActionType,
  ActionResult,
  ActionContext,
  ParameterDefinition,
} from '../action.types';
import { QuotesService } from '../../../quotes/quotes.service';

@Injectable()
export class GetQuoteStatusHandler extends BaseActionHandler {
  constructor(private quotesService: QuotesService) {
    super('GetQuoteStatusHandler');
  }

  get actionType(): ActionType {
    return ActionType.GET_QUOTE_STATUS;
  }

  getRequiredParameters(): ParameterDefinition[] {
    return [
      {
        name: 'quoteId',
        type: 'string',
        required: true,
        description: 'Quote ID to check status',
      },
    ];
  }

  async execute(
    params: Record<string, any>,
    context: ActionContext,
  ): Promise<ActionResult> {
    try {
      if (!this.hasPermission(context, 'quotes:view')) {
        return this.error(
          'You do not have permission to view quotes',
          'PERMISSION_DENIED',
        );
      }

      const normalized = this.normalizeParams(params);

      const quote = await this.quotesService.findOne(
        normalized.quoteId,
        context.organizationId,
      );

      return this.success(
        `Quote status: ${quote.status}`,
        quote.id,
        'Quote',
        {
          id: quote.id,
          title: quote.title,
          status: quote.status,
          total: quote.total,
          validUntil: quote.validUntil,
          clientId: quote.clientId,
        },
      );
    } catch (error) {
      this.logger.error('Failed to get quote status:', error);
      return this.error(
        'Failed to get quote status',
        error.message || 'Unknown error',
      );
    }
  }
}
