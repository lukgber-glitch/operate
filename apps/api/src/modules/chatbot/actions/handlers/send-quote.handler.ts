/**
 * Send Quote Action Handler
 * Sends quotes to clients via chatbot
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
export class SendQuoteHandler extends BaseActionHandler {
  constructor(private quotesService: QuotesService) {
    super('SendQuoteHandler');
  }

  get actionType(): ActionType {
    return ActionType.SEND_QUOTE;
  }

  getRequiredParameters(): ParameterDefinition[] {
    return [
      {
        name: 'quoteId',
        type: 'string',
        required: true,
        description: 'Quote ID to send',
      },
    ];
  }

  async execute(
    params: Record<string, any>,
    context: ActionContext,
  ): Promise<ActionResult> {
    try {
      if (!this.hasPermission(context, 'quotes:send')) {
        return this.error(
          'You do not have permission to send quotes',
          'PERMISSION_DENIED',
        );
      }

      const normalized = this.normalizeParams(params);

      const quote = await this.quotesService.send(
        normalized.quoteId,
        context.organizationId,
      );

      this.logger.log(
        `Quote ${quote.id} sent by AI assistant for user ${context.userId}`,
      );

      return this.success(
        `Quote sent successfully to client`,
        quote.id,
        'Quote',
        {
          id: quote.id,
          status: quote.status,
          sentAt: quote.sentAt,
        },
      );
    } catch (error) {
      this.logger.error('Failed to send quote:', error);
      return this.error(
        'Failed to send quote',
        error.message || 'Unknown error',
      );
    }
  }
}
