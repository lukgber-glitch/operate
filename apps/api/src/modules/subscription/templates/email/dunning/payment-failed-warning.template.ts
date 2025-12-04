/**
 * Payment Failed Warning Email Template
 * Sent on Day 3 of dunning process
 */

import { baseTemplate, BaseTemplateVariables } from '../../../../notifications/templates/base.template';

export interface PaymentFailedWarningVariables extends BaseTemplateVariables {
  customerName: string;
  subscriptionPlan: string;
  amount: string;
  currency: string;
  failedDate: string;
  nextRetryDate: string;
  updatePaymentUrl: string;
  billingPortalUrl: string;
}

export const paymentFailedWarningTemplate = (
  variables: PaymentFailedWarningVariables,
): string => {
  const {
    customerName,
    subscriptionPlan,
    amount,
    currency,
    failedDate,
    nextRetryDate,
    updatePaymentUrl,
    billingPortalUrl,
  } = variables;

  const content = `
    <h2>Hello ${customerName},</h2>

    <p>
      We wanted to let you know that we were unable to process your recent payment
      for your <strong>${subscriptionPlan}</strong> subscription.
    </p>

    <div class="info-box" style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
      <h3 style="margin: 0 0 10px 0; color: #856404;">Payment Details</h3>
      <table style="width: 100%;">
        <tr>
          <th style="text-align: left; padding: 5px 0;">Subscription</th>
          <td style="padding: 5px 0;">${subscriptionPlan}</td>
        </tr>
        <tr>
          <th style="text-align: left; padding: 5px 0;">Amount</th>
          <td style="padding: 5px 0;"><strong>${amount} ${currency}</strong></td>
        </tr>
        <tr>
          <th style="text-align: left; padding: 5px 0;">Failed On</th>
          <td style="padding: 5px 0;">${new Date(failedDate).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}</td>
        </tr>
      </table>
    </div>

    <h3>What happens next?</h3>
    <p>
      We'll automatically retry your payment on <strong>${new Date(nextRetryDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })}</strong>.
      To ensure uninterrupted service, please update your payment method as soon as possible.
    </p>

    <center style="margin: 30px 0;">
      <a href="${updatePaymentUrl}"
         style="display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
        Update Payment Method
      </a>
    </center>

    <p>
      If you're experiencing issues or have questions about this payment, you can:
    </p>

    <ul style="margin: 15px 0; padding-left: 20px;">
      <li>Update your payment method via the link above</li>
      <li>View your <a href="${billingPortalUrl}">billing history</a></li>
      <li>Contact our support team if you need assistance</li>
    </ul>

    <div style="margin-top: 30px; padding: 15px; background: #f8f9fa; border-radius: 6px;">
      <p style="margin: 0; font-size: 14px; color: #6c757d;">
        <strong>Note:</strong> If you don't update your payment method, we'll continue
        to retry automatically. However, if the payment continues to fail, your account
        may be suspended to prevent service interruption.
      </p>
    </div>

    <p style="margin-top: 30px; font-size: 14px; color: #718096;">
      If you've already updated your payment method, you can disregard this message.
      Thank you for being a valued customer!
    </p>
  `;

  return baseTemplate(content, variables);
};
