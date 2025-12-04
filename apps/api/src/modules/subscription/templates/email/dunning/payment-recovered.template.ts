/**
 * Payment Recovered Email Template
 * Sent when payment is successfully recovered after dunning process
 */

import { baseTemplate, BaseTemplateVariables } from '../../../../notifications/templates/base.template';

export interface PaymentRecoveredVariables extends BaseTemplateVariables {
  customerName: string;
  subscriptionPlan: string;
  amount: string;
  currency: string;
  paymentDate: string;
  nextBillingDate: string;
  invoiceUrl?: string;
  billingPortalUrl: string;
}

export const paymentRecoveredTemplate = (
  variables: PaymentRecoveredVariables,
): string => {
  const {
    customerName,
    subscriptionPlan,
    amount,
    currency,
    paymentDate,
    nextBillingDate,
    invoiceUrl,
    billingPortalUrl,
  } = variables;

  const content = `
    <div style="background: linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%); color: white; padding: 30px; border-radius: 6px; margin: 20px 0; text-align: center;">
      <h1 style="color: white; margin: 0 0 10px 0; font-size: 28px;">✓ Payment Successful!</h1>
      <p style="color: white; margin: 0; font-size: 16px;">
        Your account is now active and all features have been restored
      </p>
    </div>

    <h2>Hello ${customerName},</h2>

    <p>
      Great news! We've successfully processed your payment for <strong>${subscriptionPlan}</strong>.
      Your account is now fully active and all features have been restored.
    </p>

    <div style="background: #e8f5e9; border-left: 4px solid #2e7d32; padding: 20px; margin: 20px 0; border-radius: 6px;">
      <h3 style="margin: 0 0 15px 0; color: #2e7d32;">Payment Details</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr style="border-bottom: 1px solid #c8e6c9;">
          <th style="text-align: left; padding: 10px 0;">Subscription</th>
          <td style="padding: 10px 0;">${subscriptionPlan}</td>
        </tr>
        <tr style="border-bottom: 1px solid #c8e6c9;">
          <th style="text-align: left; padding: 10px 0;">Amount Paid</th>
          <td style="padding: 10px 0; font-weight: 600; font-size: 18px; color: #2e7d32;">${amount} ${currency}</td>
        </tr>
        <tr style="border-bottom: 1px solid #c8e6c9;">
          <th style="text-align: left; padding: 10px 0;">Payment Date</th>
          <td style="padding: 10px 0;">${new Date(paymentDate).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}</td>
        </tr>
        <tr>
          <th style="text-align: left; padding: 10px 0;">Next Billing Date</th>
          <td style="padding: 10px 0;">${new Date(nextBillingDate).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}</td>
        </tr>
      </table>
    </div>

    <h3 style="color: #2e7d32;">✓ What's Been Restored</h3>
    <p>You now have full access to:</p>
    <ul style="margin: 15px 0; padding-left: 20px; line-height: 1.8;">
      <li>Your complete account dashboard</li>
      <li>All premium features and tools</li>
      <li>Historical data, reports, and analytics</li>
      <li>All active integrations</li>
      <li>Team member access</li>
      <li>Priority customer support</li>
    </ul>

    ${invoiceUrl ? `
      <center style="margin: 30px 0;">
        <a href="${invoiceUrl}"
           style="display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                  color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
          View Invoice
        </a>
      </center>
    ` : ''}

    <div style="background: #e3f2fd; border-left: 4px solid #2196f3; padding: 15px; margin: 20px 0;">
      <h4 style="margin: 0 0 10px 0; color: #1976d2;">💡 Helpful Tip</h4>
      <p style="margin: 0; color: #666;">
        To avoid future payment issues, make sure your payment method is up to date
        and has sufficient funds before your next billing date on
        <strong>${new Date(nextBillingDate).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })}</strong>.
      </p>
    </div>

    <h3>Manage Your Subscription</h3>
    <p>
      You can manage your subscription, update payment methods, and view billing
      history anytime through your billing portal:
    </p>

    <center style="margin: 20px 0;">
      <a href="${billingPortalUrl}"
         style="display: inline-block; padding: 12px 24px; background: #ffffff;
                color: #667eea; text-decoration: none; border-radius: 6px; font-weight: 600;
                border: 2px solid #667eea;">
        Go to Billing Portal
      </a>
    </center>

    <h3>Thank You!</h3>
    <p>
      We appreciate your continued business and apologize for any inconvenience
      caused by the payment issue. If you have any questions or need assistance,
      our support team is always here to help.
    </p>

    <p style="margin-top: 30px; font-size: 14px; color: #718096;">
      Thank you for being a valued customer. We're excited to continue supporting
      your business success!
    </p>

    <p style="margin-top: 20px; font-size: 14px; color: #718096;">
      Best regards,<br/>
      The Operate Team
    </p>
  `;

  return baseTemplate(content, variables);
};
