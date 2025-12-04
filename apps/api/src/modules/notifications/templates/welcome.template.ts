/**
 * Welcome Email Template
 * Onboarding welcome email for new users
 */

import { baseTemplate, BaseTemplateVariables } from './base.template';

export interface WelcomeVariables extends BaseTemplateVariables {
  userName: string;
  userEmail: string;
  accountType: 'INDIVIDUAL' | 'BUSINESS' | 'ENTERPRISE' | string;
  activationLink?: string;
  dashboardLink: string;
  supportEmail?: string;
  gettingStartedLink?: string;
  documentationLink?: string;
  features?: Array<{
    title: string;
    description: string;
    icon?: string;
  }>;
}

export const welcomeTemplate = (variables: WelcomeVariables): string => {
  const {
    userName,
    userEmail,
    accountType,
    activationLink,
    dashboardLink,
    supportEmail = 'support@operate.com',
    gettingStartedLink,
    documentationLink,
    features,
  } = variables;

  const defaultFeatures = features || [
    {
      title: 'Document Management',
      description: 'Upload and automatically classify invoices, receipts, and financial documents with AI',
      icon: '📄',
    },
    {
      title: 'Tax Automation',
      description: 'Automate VAT calculations, tax filings, and stay compliant across multiple countries',
      icon: '📊',
    },
    {
      title: 'HR Management',
      description: 'Manage employees, contracts, leave requests, and payroll in one place',
      icon: '👥',
    },
    {
      title: 'Financial Insights',
      description: 'Get real-time financial reports, analytics, and business insights',
      icon: '💰',
    },
  ];

  const content = `
    <h2>Welcome to Operate, ${userName}! 🎉</h2>

    <p>
      Thank you for choosing Operate to streamline your business operations.
      We're excited to help you manage your finances, taxes, and HR more efficiently.
    </p>

    ${activationLink ? `
      <div class="info-box" style="margin: 24px 0;">
        <p style="margin: 0;">
          <strong>Important:</strong> Please activate your account to get started.
        </p>
      </div>

      <center>
        <a href="${activationLink}" class="cta-button">Activate Your Account</a>
      </center>
    ` : `
      <div class="success-box" style="margin: 24px 0;">
        <p style="margin: 0;">
          <strong>✓ Your account is active!</strong> You can start using Operate right away.
        </p>
      </div>

      <center>
        <a href="${dashboardLink}" class="cta-button">Go to Dashboard</a>
      </center>
    `}

    <div style="margin: 32px 0;">
      <h3 style="font-size: 18px; margin-bottom: 16px; color: #1a202c; text-align: center;">
        Account Details
      </h3>

      <table>
        <tr>
          <th>Email</th>
          <td>${userEmail}</td>
        </tr>
        <tr>
          <th>Account Type</th>
          <td><strong>${accountType}</strong></td>
        </tr>
      </table>
    </div>

    <div style="margin: 32px 0;">
      <h3 style="font-size: 18px; margin-bottom: 16px; color: #1a202c;">
        What you can do with Operate
      </h3>

      ${defaultFeatures.map(feature => `
        <div style="margin: 20px 0; padding: 16px; background-color: #f7fafc; border-radius: 6px; border-left: 4px solid #667eea;">
          <h4 style="font-size: 16px; margin-bottom: 8px; color: #1a202c;">
            ${feature.icon ? `${feature.icon} ` : ''}${feature.title}
          </h4>
          <p style="margin: 0; color: #4a5568; font-size: 14px;">
            ${feature.description}
          </p>
        </div>
      `).join('')}
    </div>

    <div style="margin: 32px 0;">
      <h3 style="font-size: 18px; margin-bottom: 16px; color: #1a202c;">
        Get Started in 3 Easy Steps
      </h3>

      <div style="padding: 16px; background-color: #f7fafc; border-radius: 6px;">
        <ol style="color: #4a5568; margin-left: 20px; line-height: 1.8;">
          <li>
            <strong>Complete your profile</strong> - Add your business information and preferences
          </li>
          <li>
            <strong>Upload your first document</strong> - Try our AI-powered document classification
          </li>
          <li>
            <strong>Set up integrations</strong> - Connect your bank accounts and tax authorities
          </li>
        </ol>
      </div>
    </div>

    ${gettingStartedLink || documentationLink ? `
      <div style="margin: 32px 0; text-align: center;">
        <h3 style="font-size: 16px; margin-bottom: 12px; color: #1a202c;">
          Helpful Resources
        </h3>
        <p>
          ${gettingStartedLink ? `<a href="${gettingStartedLink}" style="color: #667eea; text-decoration: none; margin: 0 8px;">Getting Started Guide</a>` : ''}
          ${gettingStartedLink && documentationLink ? '•' : ''}
          ${documentationLink ? `<a href="${documentationLink}" style="color: #667eea; text-decoration: none; margin: 0 8px;">Documentation</a>` : ''}
        </p>
      </div>
    ` : ''}

    <div class="info-box" style="margin: 32px 0;">
      <h3 style="font-size: 16px; margin-bottom: 8px; color: #1a202c;">
        Need Help?
      </h3>
      <p style="margin: 0; color: #4a5568;">
        Our support team is here to help you succeed. If you have any questions or need assistance,
        don't hesitate to reach out to us at <a href="mailto:${supportEmail}" style="color: #667eea;">${supportEmail}</a>.
      </p>
    </div>

    <div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid #e2e8f0;">
      <p style="text-align: center; color: #718096; font-size: 14px; margin-bottom: 8px;">
        We're committed to making your business operations seamless and efficient.
      </p>
      <p style="text-align: center; color: #718096; font-size: 14px;">
        <strong>Welcome aboard!</strong>
      </p>
    </div>
  `;

  return baseTemplate(content, variables);
};
