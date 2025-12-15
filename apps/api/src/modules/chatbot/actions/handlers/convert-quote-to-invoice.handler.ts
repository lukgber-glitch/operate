/**
 * Convert Quote to Invoice Action Handler
 * Converts accepted quotes to invoices via chatbot
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
export class ConvertQuoteToInvoiceHandler extends BaseActionHandler {
  constructor(private quotesService: QuotesService) {
    super('ConvertQuoteToInvoiceHandler');
  }

  get actionType(): ActionType {
    return ActionType.CONVERT_QUOTE_TO_INVOICE;
  }

  getRequiredParameters(): ParameterDefinition[] {
    return [
      {
        name: 'quoteId',
        type: 'string',
        required: true,
        description: 'Quote ID to convert to invoice',
      },
    ];
  }

  async execute(
    params: Record<string, any>,
    context: ActionContext,
  ): Promise<ActionResult> {
    try {
      if (!this.hasPermission(context, 'quotes:convert')) {
        return this.error(
          'You do not have permission to convert quotes',
          'PERMISSION_DENIED',
        );
      }

      const normalized = this.normalizeParams(params);

      const invoice = await this.quotesService.convertToInvoice(
        normalized.quoteId,
        context.organizationId,
      );

      this.logger.log(
        `Quote ${normalized.quoteId} converted to invoice ${invoice.id} by AI assistant for user ${context.userId}`,
      );

      return this.success(
        `Quote converted to invoice successfully`,
        invoice.id,
        'Invoice',
        {
          invoiceId: invoice.id,
          quoteId: normalized.quoteId,
          total: invoice.total,
        },
      );
    } catch (error) {
      this.logger.error('Failed to convert quote to invoice:', error);
      return this.error(
        'Failed to convert quote to invoice',
        error.message || 'Unknown error',
      );
    }
  }
}
