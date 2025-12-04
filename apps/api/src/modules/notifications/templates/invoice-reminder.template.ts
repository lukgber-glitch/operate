/**
 * Invoice Reminder Email Template
 * For due and overdue invoice notifications
 */

import { baseTemplate, BaseTemplateVariables } from './base.template';

export interface InvoiceReminderVariables extends BaseTemplateVariables {
  customerName: string;
  invoiceNumber: string;
  invoiceAmount: string;
  currency: string;
  dueDate: string;
  daysOverdue?: number;
  paymentLink?: string;
  invoiceLink: string;
}

export const invoiceReminderTemplate = (
  variables: InvoiceReminderVariables,
): string => {
  const {
    customerName,
    invoiceNumber,
    invoiceAmount,
    currency,
    dueDate,
    daysOverdue,
    paymentLink,
    invoiceLink,
  } = variables;

  const isOverdue = daysOverdue && daysOverdue > 0;
  const title = isOverdue ? 'Invoice Overdue' : 'Invoice Due Soon';
  const urgencyClass = isOverdue ? 'warning-box' : 'info-box';

  const content = `
    <h2>Hello ${customerName},</h2>

    <p>
      ${isOverdue
        ? `This is a reminder that invoice <strong>${invoiceNumber}</strong> is now <strong>${daysOverdue} days overdue</strong>.`
        : `This is a friendly reminder that invoice <strong>${invoiceNumber}</strong> is due soon.`
      }
    </p>

    <div class="${urgencyClass}">
      <table>
        <tr>
          <th>Invoice Number</th>
          <td>${invoiceNumber}</td>
        </tr>
        <tr>
          <th>Amount Due</th>
          <td><strong>${invoiceAmount} ${currency}</strong></td>
        </tr>
        <tr>
          <th>Due Date</th>
          <td>${new Date(dueDate).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}</td>
        </tr>
        ${isOverdue ? `
        <tr>
          <th>Days Overdue</th>
          <td style="color: #c53030;"><strong>${daysOverdue} days</strong></td>
        </tr>
        ` : ''}
      </table>
    </div>

    <p>
      ${isOverdue
        ? 'Please process this payment as soon as possible to avoid any late fees or service interruptions.'
        : 'Please ensure payment is made by the due date to avoid any late fees.'
      }
    </p>

    ${paymentLink ? `
      <center>
        <a href="${paymentLink}" class="cta-button">Pay Now</a>
      </center>
    ` : ''}

    <p style="margin-top: 20px;">
      <a href="${invoiceLink}">View Invoice Details</a>
    </p>

    <p style="margin-top: 30px; font-size: 14px; color: #718096;">
      If you have already made this payment, please disregard this reminder.
      If you have any questions or concerns, please don't hesitate to contact us.
    </p>
  `;

  return baseTemplate(content, variables);
};
