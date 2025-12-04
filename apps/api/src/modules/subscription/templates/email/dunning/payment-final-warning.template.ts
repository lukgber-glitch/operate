/**
 * Payment Final Warning Email Template
 * Sent on Day 14 of dunning process (7 days before suspension)
 */

import { baseTemplate, BaseTemplateVariables } from '../../../../notifications/templates/base.template';

export interface PaymentFinalWarningVariables extends BaseTemplateVariables {
  customerName: string;
  subscriptionPlan: string;
  amount: string;
  currency: string;
  failedDate: string;
  daysSinceFailed: number;
  suspensionDate: string;
  daysUntilSuspension: number;
  updatePaymentUrl: string;
  billingPortalUrl: string;
  supportEmail: string;
}

export const paymentFinalWarningTemplate = (
  variables: PaymentFinalWarningVariables,
): string => {
  const {
    customerName,
    subscriptionPlan,
    amount,
    currency,
    failedDate,
    daysSinceFailed,
    suspensionDate,
    daysUntilSuspension,
    updatePaymentUrl,
    billingPortalUrl,
    supportEmail = 'support@operate.com',
  } = variables;

  const content = `
    <h2>Hello ${customerName},</h2>

    <div style="background: #c62828; color: white; padding: 20px; border-radius: 6px; margin: 20px 0; text-align: center;">
      <h2 style="color: white; margin: 0 0 10px 0;">🚨 FINAL WARNING</h2>
      <p style="color: white; margin: 0; font-size: 18px;">
        Your account will be suspended in <strong>${daysUntilSuspension} days</strong>
      </p>
    </div>

    <p>
      We have been unable to process your payment for <strong>${subscriptionPlan}</strong>
      for <strong>${daysSinceFailed} days</strong>. This is your final notice before account suspension.
    </p>

    <div class="warning-box" style="background: #ffebee; border: 2px solid #c62828; padding: 20px; margin: 20px 0; border-radius: 6px;">
      <h3 style="margin: 0 0 15px 0; color: #c62828;">Payment Details</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr style="border-bottom: 1px solid #ffcdd2;">
          <th style="text-align: left; padding: 10px 0;">Subscription</th>
          <td style="padding: 10px 0; font-weight: 600;">${subscriptionPlan}</td>
        </tr>
        <tr style="border-bottom: 1px solid #ffcdd2;">
          <th style="text-align: left; padding: 10px 0;">Amount Overdue</th>
          <td style="padding: 10px 0; font-weight: 600; font-size: 18px; color: #c62828;">${amount} ${currency}</td>
        </tr>
        <tr style="border-bottom: 1px solid #ffcdd2;">
          <th style="text-align: left; padding: 10px 0;">Payment Failed Since</th>
          <td style="padding: 10px 0;">${new Date(failedDate).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}</td>
        </tr>
        <tr>
          <th style="text-align: left; padding: 10px 0;">Suspension Date</th>
          <td style="padding: 10px 0; font-weight: 600; color: #c62828;">
            ${new Date(suspensionDate).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
            <br/>
            <span style="font-size: 14px;">(${daysUntilSuspension} days from now)</span>
          </td>
        </tr>
      </table>
    </div>

    <h3 style="color: #c62828;">⚡ Immediate Action Required</h3>
    <p>
      <strong>You must update your payment method within ${daysUntilSuspension} days to avoid suspension.</strong>
      After suspension, you will lose access to all features and data until payment is resolved.
    </p>

    <center style="margin: 30px 0;">
      <a href="${updatePaymentUrl}"
         style="display: inline-block; padding: 18px 36px; background: #c62828;
                color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 700; font-size: 18px;
                box-shadow: 0 6px 12px rgba(198, 40, 40, 0.3); text-transform: uppercase;">
        Update Payment Method Immediately
      </a>
    </center>

    <div style="background: #fff3cd; border-left: 4px solid #ff9800; padding: 20px; margin: 20px 0;">
      <h4 style="margin: 0 0 10px 0; color: #f57c00;">What You'll Lose if Suspended:</h4>
      <ul style="margin: 10px 0; padding-left: 20px; color: #666;">
        <li><strong>Access to your account</strong> - You won't be able to log in</li>
        <li><strong>All premium features</strong> - Including automated tax filing, employee management</li>
        <li><strong>Historical data</strong> - Reports and analytics will be inaccessible</li>
        <li><strong>Integrations</strong> - All third-party connections will be disabled</li>
        <li><strong>Team access</strong> - Your team members will lose access</li>
        <li><strong>Support</strong> - Priority support will be unavailable</li>
      </ul>
    </div>

    <h3>How to Prevent Suspension</h3>
    <ol style="margin: 15px 0; padding-left: 25px; line-height: 2;">
      <li>Click the button above to update your payment method</li>
      <li>Ensure your card has sufficient funds</li>
      <li>Check that your billing details are correct</li>
      <li>Contact us if you need payment arrangements</li>
    </ol>

    <div style="background: #e3f2fd; border-left: 4px solid #2196f3; padding: 15px; margin: 20px 0;">
      <h4 style="margin: 0 0 10px 0; color: #1976d2;">Need Help or Payment Flexibility?</h4>
      <p style="margin: 0; color: #666;">
        We understand that circumstances change. If you're facing financial difficulty,
        please contact us at <a href="mailto:${supportEmail}">${supportEmail}</a>.
        We may be able to work out alternative payment arrangements.
      </p>
    </div>

    <h3>Additional Resources</h3>
    <ul style="margin: 15px 0; padding-left: 20px;">
      <li><a href="${updatePaymentUrl}" style="font-weight: 600;">Update Payment Method</a></li>
      <li><a href="${billingPortalUrl}">View Billing History</a></li>
      <li>Email: <a href="mailto:${supportEmail}">${supportEmail}</a></li>
    </ul>

    <p style="margin-top: 30px; font-size: 14px; color: #718096;">
      If you've already resolved this issue or updated your payment method,
      please disregard this message. Otherwise, <strong>please take action immediately</strong>
      to avoid service interruption.
    </p>
  `;

  return baseTemplate(content, variables);
};
