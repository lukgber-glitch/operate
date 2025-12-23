/**
 * EXAMPLE: Create Payment Link Action Handler
 * THIS IS AN EXAMPLE - NOT YET INTEGRATED
 *
 * Shows how to use StripePaymentsService in chatbot action handlers
 *
 * To activate:
 * 1. Add CREATE_PAYMENT_LINK to ActionType enum in action.types.ts
 * 2. Add this handler to providers in chatbot.module.ts
 * 3. Register in ActionExecutorService
 */

import { Injectable } from '@nestjs/common';
import { BaseActionHandler } from './base.handler';
import {
  ActionType,
  ActionResult,
  ActionContext,
  ParameterDefinition,
} from '../action.types';
import { InvoicesService } from '../../../finance/invoices/invoices.service';
import { StripePaymentsService } from '../../../integrations/stripe/services/stripe-payments.service';

@Injectable()
export class CreatePaymentLinkHandler extends BaseActionHandler {
  constructor(
    private invoicesService: InvoicesService,
    private stripePaymentsService: StripePaymentsService,
  ) {
    super('CreatePaymentLinkHandler');
  }

  get actionType(): ActionType {
    // This would need to be added to ActionType enum
    return 'create_payment_link' as ActionType;
  }

  getRequiredParameters(): ParameterDefinition[] {
    return [
      {
        name: 'invoiceId',
        type: 'string',
        required: true,
        description: 'Invoice ID to create payment link for',
      },
      {
        name: 'sendEmail',
        type: 'boolean',
        required: false,
        description: 'Whether to send payment link via email',
        default: false,
      },
    ];
  }

  async execute(
    params: Record<string, any>,
    context: ActionContext,
  ): Promise<ActionResult> {
    try {
      // Check permission
      if (!this.hasPermission(context, 'invoices:update')) {
        return this.error(
          'You do not have permission to create payment links',
          'PERMISSION_DENIED',
        );
      }

      // Normalize parameters
      const normalized = this.normalizeParams(params);

      // Get invoice
      const invoice = await this.invoicesService.findById(
        normalized.invoiceId,
      );

      if (!invoice) {
        return this.error('Invoice not found', 'NOT_FOUND');
      }

      // Note: stripePaymentIntentId field doesn't exist on Invoice model
      // This is example code - you would need to add this field to the schema
      // For now, commenting out this check
      // if (invoice.stripePaymentIntentId) {
      //   this.logger.log(
      //     `Payment link already exists for invoice ${invoice.id}`,
      //   );
      //   return this.success(
      //     `Payment link already exists for invoice ${invoice.number}`,
      //     invoice.id,
      //     'Invoice',
      //     {
      //       invoiceNumber: invoice.number,
      //       paymentUrl: `https://checkout.stripe.com/pay/${invoice.stripePaymentIntentId}`,
      //       amount: invoice.total,
      //       currency: invoice.currency,
      //     },
      //   );
      // }

      // Create Stripe payment intent
      const paymentIntent = await this.stripePaymentsService.createPaymentIntent(
        {
          userId: context.userId,
          amount: Math.round(Number(invoice.total) * 100), // Convert to cents
          currency: invoice.currency.toLowerCase(),
          description: `Payment for Invoice ${invoice.number}`,
          metadata: {
            invoiceId: invoice.id,
            invoiceNumber: invoice.number,
            organizationId: context.organizationId,
            customerId: invoice.customerId,
          },
        },
      );

      // Update invoice with payment intent ID
      // Note: stripePaymentIntentId field doesn't exist on Invoice model
      // This is example code - you would need to add this field to the schema
      // await this.invoicesService.update(normalized.invoiceId, {
      //   stripePaymentIntentId: paymentIntent.id,
      // });

      const paymentUrl = `https://checkout.stripe.com/pay/${paymentIntent.clientSecret}`;

      this.logger.log(
        `Payment link created for invoice ${invoice.id} by AI assistant`,
      );

      // Optionally send email
      if (normalized.sendEmail && invoice.customerEmail) {
        // This would require NotificationsService
        // await this.notificationsService.sendEmail({
        //   to: invoice.customerEmail,
        //   subject: `Payment Link for Invoice ${invoice.number}`,
        //   body: `Please use this link to pay: ${paymentUrl}`,
        // });
      }

      return this.success(
        `Payment link created successfully for invoice ${invoice.number}`,
        invoice.id,
        'Invoice',
        {
          invoiceNumber: invoice.number,
          paymentUrl,
          amount: invoice.total,
          currency: invoice.currency,
          stripePaymentIntentId: paymentIntent.id,
        },
      );
    } catch (error) {
      this.logger.error('Failed to create payment link:', error);
      return this.error(
        'Failed to create payment link',
        error.message || 'Unknown error',
      );
    }
  }
}
