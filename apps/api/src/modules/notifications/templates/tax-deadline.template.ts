/**
 * Tax Deadline Email Template
 * For VAT and tax filing deadline alerts
 */

import { baseTemplate, BaseTemplateVariables } from './base.template';

export interface TaxDeadlineVariables extends BaseTemplateVariables {
  recipientName: string;
  taxType: 'VAT' | 'Income Tax' | 'Corporate Tax' | 'Payroll Tax' | string;
  period: string;
  deadline: string;
  daysRemaining: number;
  estimatedAmount?: string;
  currency?: string;
  filingLink?: string;
  country: string;
}

export const taxDeadlineTemplate = (
  variables: TaxDeadlineVariables,
): string => {
  const {
    recipientName,
    taxType,
    period,
    deadline,
    daysRemaining,
    estimatedAmount,
    currency,
    filingLink,
    country,
  } = variables;

  const isUrgent = daysRemaining <= 7;
  const urgencyClass = isUrgent ? 'warning-box' : 'info-box';
  const urgencyText = isUrgent ? 'Urgent' : 'Upcoming';

  const content = `
    <h2>Hello ${recipientName},</h2>

    <p>
      ${isUrgent
        ? `<strong style="color: #c53030;">URGENT:</strong> Your ${taxType} filing deadline is approaching soon.`
        : `This is a reminder about your upcoming ${taxType} filing deadline.`
      }
    </p>

    <div class="${urgencyClass}">
      <h3 style="margin-bottom: 12px; color: #1a202c; font-size: 18px;">
        ${urgencyText}: ${taxType} Filing Required
      </h3>

      <table>
        <tr>
          <th>Tax Type</th>
          <td>${taxType}</td>
        </tr>
        <tr>
          <th>Period</th>
          <td>${period}</td>
        </tr>
        <tr>
          <th>Country</th>
          <td>${country}</td>
        </tr>
        <tr>
          <th>Deadline</th>
          <td><strong>${new Date(deadline).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}</strong></td>
        </tr>
        <tr>
          <th>Days Remaining</th>
          <td style="color: ${isUrgent ? '#c53030' : '#48bb78'};">
            <strong>${daysRemaining} days</strong>
          </td>
        </tr>
        ${estimatedAmount && currency ? `
        <tr>
          <th>Estimated Amount</th>
          <td><strong>${estimatedAmount} ${currency}</strong></td>
        </tr>
        ` : ''}
      </table>
    </div>

    <p>
      Please ensure all required documentation is prepared and submitted before the deadline
      to avoid penalties and interest charges.
    </p>

    ${isUrgent ? `
      <div class="warning-box" style="margin: 24px 0;">
        <strong>⚠️ Action Required</strong>
        <p style="margin-top: 8px; margin-bottom: 0;">
          With only ${daysRemaining} days remaining, we recommend completing your filing as soon as possible.
          Late filings may result in penalties and interest charges.
        </p>
      </div>
    ` : ''}

    ${filingLink ? `
      <center>
        <a href="${filingLink}" class="cta-button">Start Filing Process</a>
      </center>
    ` : ''}

    <div style="margin-top: 30px; padding: 16px; background-color: #f7fafc; border-radius: 6px;">
      <h3 style="font-size: 16px; margin-bottom: 8px; color: #1a202c;">What you need to prepare:</h3>
      <ul style="color: #4a5568; margin-left: 20px;">
        <li>All income and expense records for the period</li>
        <li>Receipts and supporting documentation</li>
        <li>Previous filing reference numbers (if applicable)</li>
        <li>Bank account details for payments or refunds</li>
      </ul>
    </div>

    <p style="margin-top: 30px; font-size: 14px; color: #718096;">
      If you have already filed or have questions about this deadline, please contact your tax advisor
      or our support team for assistance.
    </p>
  `;

  return baseTemplate(content, variables);
};
