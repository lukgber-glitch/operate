/**
 * Template Service
 * Handles email template rendering and variable substitution
 */

import { Injectable, Logger } from '@nestjs/common';
import {
  invoiceReminderTemplate,
  InvoiceReminderVariables,
} from './invoice-reminder.template';
import {
  taxDeadlineTemplate,
  TaxDeadlineVariables,
} from './tax-deadline.template';
import {
  documentProcessedTemplate,
  DocumentProcessedVariables,
} from './document-processed.template';
import {
  weeklySummaryTemplate,
  WeeklySummaryVariables,
} from './weekly-summary.template';
import {
  welcomeTemplate,
  WelcomeVariables,
} from './welcome.template';

export type TemplateType =
  | 'invoice-reminder'
  | 'tax-deadline'
  | 'document-processed'
  | 'weekly-summary'
  | 'welcome';

export type TemplateVariables =
  | InvoiceReminderVariables
  | TaxDeadlineVariables
  | DocumentProcessedVariables
  | WeeklySummaryVariables
  | WelcomeVariables;

/**
 * Service for rendering email templates with variable substitution
 */
@Injectable()
export class TemplateService {
  private readonly logger = new Logger(TemplateService.name);

  /**
   * Render an email template with provided variables
   * @param templateType - The type of template to render
   * @param variables - Variables to substitute in the template
   * @returns Rendered HTML string
   */
  render(templateType: TemplateType, variables: TemplateVariables): string {
    try {
      this.logger.debug(`Rendering template: ${templateType}`);

      let html: string;

      switch (templateType) {
        case 'invoice-reminder':
          html = invoiceReminderTemplate(variables as InvoiceReminderVariables);
          break;

        case 'tax-deadline':
          html = taxDeadlineTemplate(variables as TaxDeadlineVariables);
          break;

        case 'document-processed':
          html = documentProcessedTemplate(
            variables as DocumentProcessedVariables,
          );
          break;

        case 'weekly-summary':
          html = weeklySummaryTemplate(variables as WeeklySummaryVariables);
          break;

        case 'welcome':
          html = welcomeTemplate(variables as WelcomeVariables);
          break;

        default:
          throw new Error(`Unknown template type: ${templateType}`);
      }

      this.logger.debug(`Template rendered successfully: ${templateType}`);
      return html;
    } catch (error) {
      this.logger.error(
        `Failed to render template ${templateType}:`,
        error instanceof Error ? error.stack : error,
      );
      throw error;
    }
  }

  /**
   * Validate template variables
   * @param templateType - The type of template
   * @param variables - Variables to validate
   * @returns True if valid, throws error if invalid
   */
  validateVariables(
    templateType: TemplateType,
    variables: TemplateVariables,
  ): boolean {
    const requiredFields: Record<TemplateType, string[]> = {
      'invoice-reminder': [
        'customerName',
        'invoiceNumber',
        'invoiceAmount',
        'currency',
        'dueDate',
        'invoiceLink',
      ],
      'tax-deadline': [
        'recipientName',
        'taxType',
        'period',
        'deadline',
        'daysRemaining',
        'country',
      ],
      'document-processed': [
        'recipientName',
        'documentName',
        'documentType',
        'uploadDate',
        'processedDate',
        'classification',
        'confidence',
        'documentLink',
      ],
      'weekly-summary': [
        'recipientName',
        'weekStart',
        'weekEnd',
        'totalRevenue',
        'totalExpenses',
        'netProfit',
        'currency',
        'dashboardLink',
      ],
      welcome: ['userName', 'userEmail', 'accountType', 'dashboardLink'],
    };

    const required = requiredFields[templateType];
    const varsObject = variables as unknown as Record<string, unknown>;
    const missing = required.filter(
      (field) => !(field in varsObject) || varsObject[field] === undefined,
    );

    if (missing.length > 0) {
      throw new Error(
        `Missing required fields for ${templateType}: ${missing.join(', ')}`,
      );
    }

    return true;
  }

  /**
   * Get a preview of a template with sample data
   * @param templateType - The type of template to preview
   * @returns Rendered HTML with sample data
   */
  getPreview(templateType: TemplateType): string {
    const sampleData = this.getSampleData(templateType);
    return this.render(templateType, sampleData);
  }

  /**
   * Get sample data for a template type
   * @param templateType - The type of template
   * @returns Sample variables for the template
   */
  private getSampleData(templateType: TemplateType): TemplateVariables {
    const baseVariables = {
      companyName: 'Operate',
      companyLogo: 'https://example.com/logo.png',
      companyAddress: '123 Business Street, City, Country',
      year: new Date().getFullYear(),
      unsubscribeLink: 'https://example.com/unsubscribe',
    };

    switch (templateType) {
      case 'invoice-reminder':
        return {
          ...baseVariables,
          customerName: 'John Doe',
          invoiceNumber: 'INV-2024-001',
          invoiceAmount: '1,250.00',
          currency: 'EUR',
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          daysOverdue: 0,
          paymentLink: 'https://example.com/pay/INV-2024-001',
          invoiceLink: 'https://example.com/invoices/INV-2024-001',
        } as InvoiceReminderVariables;

      case 'tax-deadline':
        return {
          ...baseVariables,
          recipientName: 'Jane Smith',
          taxType: 'VAT',
          period: 'Q4 2024',
          deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          daysRemaining: 14,
          estimatedAmount: '5,400.00',
          currency: 'EUR',
          filingLink: 'https://example.com/tax/file',
          country: 'Germany',
        } as TaxDeadlineVariables;

      case 'document-processed':
        return {
          ...baseVariables,
          recipientName: 'John Doe',
          documentName: 'Invoice_2024_001.pdf',
          documentType: 'PDF',
          uploadDate: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          processedDate: new Date().toISOString(),
          classification: 'Purchase Invoice',
          confidence: 0.95,
          extractedFields: [
            { label: 'Invoice Number', value: 'INV-2024-001' },
            { label: 'Total Amount', value: '1,250.00 EUR' },
            { label: 'Invoice Date', value: '2024-11-15' },
            { label: 'Vendor', value: 'ACME Corporation' },
          ],
          documentLink: 'https://example.com/documents/123',
          requiresReview: false,
        } as DocumentProcessedVariables;

      case 'weekly-summary':
        return {
          ...baseVariables,
          recipientName: 'Jane Smith',
          weekStart: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          weekEnd: new Date().toISOString(),
          totalRevenue: '12,500.00',
          totalExpenses: '8,300.00',
          netProfit: '4,200.00',
          currency: 'EUR',
          revenueChange: 15.5,
          expensesChange: -5.2,
          invoicesSent: 12,
          invoicesPaid: 8,
          invoicesOverdue: 2,
          documentsProcessed: 45,
          upcomingDeadlines: [
            {
              type: 'VAT Filing',
              date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
              daysRemaining: 5,
            },
            {
              type: 'Payroll Submission',
              date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
              daysRemaining: 10,
            },
          ],
          dashboardLink: 'https://example.com/dashboard',
          topExpenseCategories: [
            { category: 'Office Supplies', amount: '2,100.00', percentage: 25.3 },
            { category: 'Software', amount: '1,800.00', percentage: 21.7 },
            { category: 'Travel', amount: '1,200.00', percentage: 14.5 },
          ],
        } as WeeklySummaryVariables;

      case 'welcome':
        return {
          ...baseVariables,
          userName: 'John Doe',
          userEmail: 'john.doe@example.com',
          accountType: 'BUSINESS',
          activationLink: 'https://example.com/activate/abc123',
          dashboardLink: 'https://example.com/dashboard',
          supportEmail: 'support@operate.com',
          gettingStartedLink: 'https://example.com/getting-started',
          documentationLink: 'https://example.com/docs',
        } as WelcomeVariables;

      default:
        throw new Error(`Unknown template type: ${templateType}`);
    }
  }

  /**
   * Get list of available template types
   * @returns Array of template type names
   */
  getAvailableTemplates(): TemplateType[] {
    return [
      'invoice-reminder',
      'tax-deadline',
      'document-processed',
      'weekly-summary',
      'welcome',
    ];
  }
}
