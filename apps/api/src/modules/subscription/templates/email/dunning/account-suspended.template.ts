/**
 * Account Suspended Email Template
 * Sent on Day 21 when account is suspended due to payment failure
 */

import { baseTemplate, BaseTemplateVariables } from '../../../../notifications/templates/base.template';

export interface AccountSuspendedVariables extends BaseTemplateVariables {
  customerName: string;
  subscriptionPlan: string;
  amount: string;
  currency: string;
  failedDate: string;
  suspensionDate: string;
  updatePaymentUrl: string;
  billingPortalUrl: string;
  supportEmail: string;
}

export const accountSuspendedTemplate = (
  variables: AccountSuspendedVariables,
): string => {
  const {
    customerName,
    subscriptionPlan,
    amount,
    currency,
    failedDate,
    suspensionDate,
    updatePaymentUrl,
    billingPortalUrl,
    supportEmail = 'support@operate.com',
  } = variables;

  const content = `
    <div style="background: #d32f2f; color: white; padding: 30px; border-radius: 6px; margin: 20px 0; text-align: center;">
      <h1 style="color: white; margin: 0 0 10px 0; font-size: 28px;">🔒 Account Suspended</h1>
      <p style="color: white; margin: 0; font-size: 16px;">
        Your access has been temporarily suspended due to payment failure
      </p>
    </div>

    <h2>Hello ${customerName},</h2>

    <p>
      We regret to inform you that your account has been <strong>suspended</strong> as of
      <strong>${new Date(suspensionDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })}</strong> due to an outstanding payment issue.
    </p>

    <div style="background: #ffebee; border: 2px solid #d32f2f; padding: 20px; margin: 20px 0; border-radius: 6px;">
      <h3 style="margin: 0 0 15px 0; color: #d32f2f;">Account Status</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr style="border-bottom: 1px solid #ffcdd2;">
          <th style="text-align: left; padding: 10px 0;">Status</th>
          <td style="padding: 10px 0; font-weight: 600; color: #d32f2f;">SUSPENDED</td>
        </tr>
        <tr style="border-bottom: 1px solid #ffcdd2;">
          <th style="text-align: left; padding: 10px 0;">Subscription</th>
          <td style="padding: 10px 0;">${subscriptionPlan}</td>
        </tr>
        <tr style="border-bottom: 1px solid #ffcdd2;">
          <th style="text-align: left; padding: 10px 0;">Amount Outstanding</th>
          <td style="padding: 10px 0; font-weight: 600; font-size: 18px;">${amount} ${currency}</td>
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
          <th style="text-align: left; padding: 10px 0;">Suspended On</th>
          <td style="padding: 10px 0;">${new Date(suspensionDate).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}</td>
        </tr>
      </table>
    </div>

    <h3>What This Means</h3>
    <p>While your account is suspended, you will not be able to:</p>
    <ul style="margin: 15px 0; padding-left: 20px; line-height: 1.8;">
      <li>Access your account or dashboard</li>
      <li>Use any premium features</li>
      <li>View historical data, reports, or analytics</li>
      <li>Access integrations with third-party services</li>
      <li>Allow team members to access the account</li>
      <li>Receive support services</li>
    </ul>

    <h3 style="color: #2e7d32;">✓ How to Restore Your Account</h3>
    <p>
      You can restore your account immediately by updating your payment method.
      Once payment is successful, your account will be reactivated within minutes.
    </p>

    <center style="margin: 30px 0;">
      <a href="${updatePaymentUrl}"
         style="display: inline-block; padding: 18px 36px; background: linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%);
                color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 700; font-size: 18px;
                box-shadow: 0 6px 12px rgba(46, 125, 50, 0.3);">
        Restore My Account
      </a>
    </center>

    <div style="background: #e3f2fd; border-left: 4px solid #2196f3; padding: 20px; margin: 20px 0;">
      <h4 style="margin: 0 0 10px 0; color: #1976d2;">Steps to Reactivation:</h4>
      <ol style="margin: 10px 0; padding-left: 20px; line-height: 2;">
        <li>Click the "Restore My Account" button above</li>
        <li>Update your payment method with valid card details</li>
        <li>Confirm the payment of <strong>${amount} ${currency}</strong></li>
        <li>Your account will be automatically reactivated</li>
        <li>All your data and features will be restored</li>
      </ol>
    </div>

    <h3>Your Data is Safe</h3>
    <p>
      Don't worry - all your data is securely stored and will remain intact. Once you
      resolve the payment issue, you'll have immediate access to everything again.
    </p>

    <div style="background: #fff3cd; border-left: 4px solid #ff9800; padding: 15px; margin: 20px 0;">
      <h4 style="margin: 0 0 10px 0; color: #f57c00;">⚠️ Important Information</h4>
      <p style="margin: 0; color: #666;">
        If payment is not received within <strong>30 days</strong> from the suspension date,
        your account and all associated data may be permanently deleted. Please act soon
        to avoid losing your information.
      </p>
    </div>

    <h3>Need Assistance?</h3>
    <p>
      If you have questions, need payment arrangements, or require technical assistance,
      our team is here to help:
    </p>

    <ul style="margin: 15px 0; padding-left: 20px;">
      <li><strong>Email:</strong> <a href="mailto:${supportEmail}">${supportEmail}</a></li>
      <li><a href="${billingPortalUrl}">View Billing Portal</a></li>
      <li><a href="${updatePaymentUrl}">Update Payment Method</a></li>
    </ul>

    <p style="margin-top: 30px; font-size: 14px; color: #718096;">
      We value your business and hope to have you back soon. If you've already
      updated your payment method, your account should be restored shortly.
    </p>

    <p style="margin-top: 20px; font-size: 14px; color: #718096;">
      Thank you,<br/>
      The Operate Team
    </p>
  `;

  return baseTemplate(content, variables);
};
