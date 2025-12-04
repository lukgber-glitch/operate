/**
 * Weekly Summary Email Template
 * Provides weekly financial summary and insights
 */

import { baseTemplate, BaseTemplateVariables } from './base.template';

export interface WeeklySummaryVariables extends BaseTemplateVariables {
  recipientName: string;
  weekStart: string;
  weekEnd: string;
  totalRevenue: string;
  totalExpenses: string;
  netProfit: string;
  currency: string;
  revenueChange?: number; // percentage
  expensesChange?: number; // percentage
  invoicesSent?: number;
  invoicesPaid?: number;
  invoicesOverdue?: number;
  documentsProcessed?: number;
  upcomingDeadlines?: Array<{
    type: string;
    date: string;
    daysRemaining: number;
  }>;
  dashboardLink: string;
  topExpenseCategories?: Array<{
    category: string;
    amount: string;
    percentage: number;
  }>;
}

export const weeklySummaryTemplate = (
  variables: WeeklySummaryVariables,
): string => {
  const {
    recipientName,
    weekStart,
    weekEnd,
    totalRevenue,
    totalExpenses,
    netProfit,
    currency,
    revenueChange,
    expensesChange,
    invoicesSent,
    invoicesPaid,
    invoicesOverdue,
    documentsProcessed,
    upcomingDeadlines,
    dashboardLink,
    topExpenseCategories,
  } = variables;

  const netProfitValue = parseFloat(netProfit.replace(/,/g, ''));
  const isProfitable = netProfitValue >= 0;

  const formatChange = (change?: number) => {
    if (change === undefined) return '';
    const sign = change >= 0 ? '+' : '';
    const color = change >= 0 ? '#48bb78' : '#c53030';
    return `<span style="color: ${color};">${sign}${change.toFixed(1)}%</span>`;
  };

  const content = `
    <h2>Hello ${recipientName},</h2>

    <p>
      Here's your weekly financial summary for the period:
      <strong>${new Date(weekStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
      - ${new Date(weekEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</strong>
    </p>

    <div class="${isProfitable ? 'success-box' : 'warning-box'}">
      <h3 style="margin-bottom: 16px; color: #1a202c; font-size: 18px;">
        Financial Overview
      </h3>

      <table>
        <tr>
          <th>Total Revenue</th>
          <td>
            <strong>${totalRevenue} ${currency}</strong>
            ${revenueChange !== undefined ? formatChange(revenueChange) : ''}
          </td>
        </tr>
        <tr>
          <th>Total Expenses</th>
          <td>
            <strong>${totalExpenses} ${currency}</strong>
            ${expensesChange !== undefined ? formatChange(expensesChange) : ''}
          </td>
        </tr>
        <tr style="border-top: 2px solid #e2e8f0;">
          <th>Net Profit</th>
          <td>
            <strong style="color: ${isProfitable ? '#48bb78' : '#c53030'};">
              ${netProfit} ${currency}
            </strong>
          </td>
        </tr>
      </table>
    </div>

    ${(invoicesSent || invoicesPaid || invoicesOverdue) ? `
      <div style="margin: 24px 0;">
        <h3 style="font-size: 16px; margin-bottom: 12px; color: #1a202c;">Invoice Activity</h3>
        <table>
          ${invoicesSent ? `
          <tr>
            <th>Invoices Sent</th>
            <td>${invoicesSent}</td>
          </tr>
          ` : ''}
          ${invoicesPaid ? `
          <tr>
            <th>Invoices Paid</th>
            <td style="color: #48bb78;"><strong>${invoicesPaid}</strong></td>
          </tr>
          ` : ''}
          ${invoicesOverdue ? `
          <tr>
            <th>Invoices Overdue</th>
            <td style="color: #c53030;"><strong>${invoicesOverdue}</strong></td>
          </tr>
          ` : ''}
        </table>
      </div>
    ` : ''}

    ${topExpenseCategories && topExpenseCategories.length > 0 ? `
      <div style="margin: 24px 0;">
        <h3 style="font-size: 16px; margin-bottom: 12px; color: #1a202c;">Top Expense Categories</h3>
        <table>
          <thead>
            <tr>
              <th>Category</th>
              <th>Amount</th>
              <th>Share</th>
            </tr>
          </thead>
          <tbody>
            ${topExpenseCategories.map(cat => `
              <tr>
                <td>${cat.category}</td>
                <td>${cat.amount} ${currency}</td>
                <td>${cat.percentage.toFixed(1)}%</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    ` : ''}

    ${documentsProcessed ? `
      <div class="info-box" style="margin: 24px 0;">
        <p style="margin: 0;">
          <strong>${documentsProcessed} documents</strong> were processed and classified this week.
        </p>
      </div>
    ` : ''}

    ${upcomingDeadlines && upcomingDeadlines.length > 0 ? `
      <div class="warning-box" style="margin: 24px 0;">
        <h3 style="font-size: 16px; margin-bottom: 12px; color: #1a202c;">
          ⚠️ Upcoming Deadlines
        </h3>
        <table>
          <thead>
            <tr>
              <th>Type</th>
              <th>Due Date</th>
              <th>Days Left</th>
            </tr>
          </thead>
          <tbody>
            ${upcomingDeadlines.slice(0, 5).map(deadline => `
              <tr>
                <td>${deadline.type}</td>
                <td>${new Date(deadline.date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric'
                })}</td>
                <td style="color: ${deadline.daysRemaining <= 7 ? '#c53030' : '#4a5568'};">
                  <strong>${deadline.daysRemaining} days</strong>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    ` : ''}

    <center>
      <a href="${dashboardLink}" class="cta-button">View Full Dashboard</a>
    </center>

    <div style="margin-top: 30px; padding: 16px; background-color: #f7fafc; border-radius: 6px;">
      <h3 style="font-size: 16px; margin-bottom: 8px; color: #1a202c;">Quick Tips</h3>
      <ul style="color: #4a5568; margin-left: 20px;">
        ${invoicesOverdue && invoicesOverdue > 0 ? `
          <li><strong>Follow up on ${invoicesOverdue} overdue invoice${invoicesOverdue > 1 ? 's' : ''}</strong> to improve cash flow</li>
        ` : ''}
        ${upcomingDeadlines && upcomingDeadlines.length > 0 ? `
          <li>Prepare for upcoming tax deadlines to avoid penalties</li>
        ` : ''}
        <li>Review expense categories to identify potential savings</li>
        <li>Keep uploading documents for automated classification</li>
      </ul>
    </div>

    <p style="margin-top: 30px; font-size: 14px; color: #718096;">
      This is an automated weekly summary. You can customize your notification preferences
      in your account settings.
    </p>
  `;

  return baseTemplate(content, variables);
};
