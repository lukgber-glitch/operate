/**
 * Payment Action Required Email Template
 * Sent on Day 7 of dunning process
 */

import { baseTemplate, BaseTemplateVariables } from '../../../../notifications/templates/base.template';

export interface PaymentActionRequiredVariables extends BaseTemplateVariables {
  customerName: string;
  subscriptionPlan: string;
  amount: string;
  currency: string;
  failedDate: string;
  daysSinceFailed: number;
  nextRetryDate: string;
  suspensionDate: string;
  updatePaymentUrl: string;
  billingPortalUrl: string;
}

export const paymentActionRequiredTemplate = (
  variables: PaymentActionRequiredVariables,
): string => {
  const {
    customerName,
    subscriptionPlan,
    amount,
    currency,
    failedDate,
    daysSinceFailed,
    nextRetryDate,
    suspensionDate,
    updatePaymentUrl,
    billingPortalUrl,
  } = variables;

  const content = `
    <h2>Hello ${customerName},</h2>

    <p>
      <strong>Action Required:</strong> We've been unable to process your payment for
      <strong>${subscriptionPlan}</strong> for the past ${daysSinceFailed} days.
    </p>

    <div class="warning-box" style="background: #fff3cd; border-left: 4px solid #ff9800; padding: 15px; margin: 20px 0;">
      <h3 style="margin: 0 0 10px 0; color: #f57c00;">⚠️ Urgent: Payment Issue</h3>
      <table style="width: 100%;">
        <tr>
          <th style="text-align: left; padding: 5px 0;">Subscription</th>
          <td style="padding: 5px 0;">${subscriptionPlan}</td>
        </tr>
        <tr>
          <th style="text-align: left; padding: 5px 0;">Amount Due</th>
          <td style="padding: 5px 0;"><strong>${amount} ${currency}</strong></td>
        </tr>
        <tr>
          <th style="text-align: left; padding: 5px 0;">Failed Since</th>
          <td style="padding: 5px 0;">${new Date(failedDate).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })} (${daysSinceFailed} days ago)</td>
        </tr>
        <tr>
          <th style="text-align: left; padding: 5px 0;">Account Suspension</th>
          <td style="padding: 5px 0; color: #d32f2f;"><strong>${new Date(suspensionDate).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}</strong></td>
        </tr>
      </table>
    </div>

    <h3 style="color: #d32f2f;">⏰ Time-Sensitive Action Required</h3>
    <p>
      To maintain uninterrupted access to your account, please update your payment method
      immediately. We will attempt to process your payment again on
      <strong>${new Date(nextRetryDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })}</strong>.
    </p>

    <center style="margin: 30px 0;">
      <a href="${updatePaymentUrl}"
         style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #f57c00 0%, #d32f2f 100%);
                color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 18px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        Update Payment Method Now
      </a>
    </center>

    <div style="background: #ffebee; border-left: 4px solid #d32f2f; padding: 15px; margin: 20px 0;">
      <h4 style="margin: 0 0 10px 0; color: #c62828;">What happens if I don't update my payment method?</h4>
      <p style="margin: 5px 0; color: #666;">
        If payment is not received by <strong>${new Date(suspensionDate).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })}</strong>, your account will be automatically suspended, and you'll lose access to:
      </p>
      <ul style="margin: 10px 0; padding-left: 20px; color: #666;">
        <li>All premium features</li>
        <li>Historical data and reports</li>
        <li>Team collaboration tools</li>
        <li>Automated workflows</li>
      </ul>
    </div>

    <h3>Need Help?</h3>
    <p>
      If you're experiencing financial difficulty or need to discuss payment options,
      we're here to help. Our support team is available to work with you.
    </p>

    <ul style="margin: 15px 0; padding-left: 20px;">
      <li><a href="${updatePaymentUrl}">Update your payment method</a></li>
      <li><a href="${billingPortalUrl}">Review your billing history</a></li>
      <li>Contact support at support@operate.com</li>
    </ul>

    <p style="margin-top: 30px; font-size: 14px; color: #718096;">
      If you've already updated your payment method or made arrangements with our team,
      please disregard this message.
    </p>
  `;

  return baseTemplate(content, variables);
};
