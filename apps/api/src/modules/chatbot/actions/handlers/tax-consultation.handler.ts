/**
 * Tax Consultation Action Handler
 * Interactive tax questions and advice via chatbot
 */

import { Injectable } from '@nestjs/common';
import { BaseActionHandler } from './base.handler';
import {
  ActionType,
  ActionResult,
  ActionContext,
  ParameterDefinition,
} from '../action.types';
import { PrismaService } from '@/modules/database/prisma.service';

interface TaxAdvice {
  question: string;
  answer: string;
  confidence: 'high' | 'medium' | 'low';
  relatedTopics: string[];
  disclaimer: string;
}

@Injectable()
export class TaxConsultationHandler extends BaseActionHandler {
  constructor(private prisma: PrismaService) {
    super('TaxConsultationHandler');
  }

  get actionType(): ActionType {
    return ActionType.CONSULT_TAXES;
  }

  getRequiredParameters(): ParameterDefinition[] {
    return [
      {
        name: 'question',
        type: 'string',
        required: true,
        description: 'Tax-related question',
      },
      {
        name: 'context',
        type: 'string',
        required: false,
        description: 'Additional context (expense type, amount, etc.)',
      },
      {
        name: 'country',
        type: 'string',
        required: false,
        description: 'Country for tax rules (default: DE)',
        default: 'DE',
      },
    ];
  }

  async execute(
    params: Record<string, any>,
    context: ActionContext,
  ): Promise<ActionResult> {
    try {
      if (!this.hasPermission(context, 'tax:read')) {
        return this.error('Permission denied', 'PERMISSION_DENIED');
      }

      const normalized = this.normalizeParams(params);
      const question = normalized.question.toLowerCase();
      const country = normalized.country || 'DE';

      // Get organization tax settings
      const org = await this.prisma.organisation.findUnique({
        where: { id: context.organizationId },
        select: {
          country: true,
          vatRegistered: true,
          vatNumber: true,
          taxSettings: true,
        },
      });

      const orgCountry = org?.country || country;
      const isVatRegistered = org?.vatRegistered ?? false;

      // Analyze question type
      const advice = this.analyzeQuestion(question, normalized.context, orgCountry, isVatRegistered);

      // Get relevant tax data for context
      const year = new Date().getFullYear();
      const taxData = await this.getTaxSummary(context.organizationId, year);

      return this.success(
        advice.answer,
        undefined,
        'tax-consultation',
        {
          question: normalized.question,
          advice,
          taxSummary: taxData,
          country: orgCountry,
          vatRegistered: isVatRegistered,
        },
      );
    } catch (error) {
      this.logger.error('Tax consultation failed:', error);
      return this.error('Consultation failed', error.message);
    }
  }

  private analyzeQuestion(question: string, additionalContext: string | undefined, country: string, isVatRegistered: boolean): TaxAdvice {
    const q = question.toLowerCase();
    const ctx = additionalContext?.toLowerCase() || '';

    // Deductibility questions
    if (q.includes('deduct') || q.includes('deductible') || q.includes('write off')) {
      return this.getDeductibilityAdvice(q, ctx, country);
    }

    // VAT questions
    if (q.includes('vat') || q.includes('mehrwertsteuer') || q.includes('tax rate')) {
      return this.getVatAdvice(q, ctx, country, isVatRegistered);
    }

    // Home office / remote work
    if (q.includes('home office') || q.includes('remote') || q.includes('work from home')) {
      return this.getHomeOfficeAdvice(country);
    }

    // Business meals / entertainment
    if (q.includes('meal') || q.includes('lunch') || q.includes('dinner') || q.includes('entertainment')) {
      return this.getMealAdvice(country);
    }

    // Travel expenses
    if (q.includes('travel') || q.includes('mileage') || q.includes('trip') || q.includes('flight')) {
      return this.getTravelAdvice(country);
    }

    // Equipment / assets
    if (q.includes('equipment') || q.includes('computer') || q.includes('laptop') || q.includes('asset')) {
      return this.getEquipmentAdvice(country);
    }

    // Default response
    return {
      question,
      answer: `I can help with tax questions about deductibility, VAT rates, home office expenses, business meals, travel costs, and equipment purchases. For your specific question, I recommend consulting with a tax professional who can review your complete situation. Based on your data, you have ${country === 'DE' ? 'German' : country} tax obligations.`,
      confidence: 'low',
      relatedTopics: ['Business Deductions', 'VAT Rates', 'Home Office', 'Travel Expenses'],
      disclaimer: 'This is general information. Consult a tax professional for advice specific to your situation.',
    };
  }

  private getDeductibilityAdvice(question: string, context: string, country: string): TaxAdvice {
    const deductibleCategories = {
      DE: {
        fully: ['Office supplies', 'Professional software', 'Business insurance', 'Professional memberships', 'Bank fees'],
        partial: ['Business meals (70%)', 'Home office (proportional)', 'Company car (1% rule or logbook)', 'Phone/internet (business portion)'],
        nonDeductible: ['Personal expenses', 'Fines and penalties', 'Income tax payments'],
      },
      AT: {
        fully: ['Office supplies', 'Professional software', 'Business insurance'],
        partial: ['Business meals (50%)', 'Home office', 'Vehicle (business portion)'],
        nonDeductible: ['Personal expenses', 'Fines'],
      },
    };

    const rules = deductibleCategories[country] || deductibleCategories.DE;

    return {
      question,
      answer: `For ${country} tax purposes:\n\n✅ Fully deductible: ${rules.fully.join(', ')}\n\n⚠️ Partially deductible: ${rules.partial.join(', ')}\n\n❌ Not deductible: ${rules.nonDeductible.join(', ')}\n\nFor your specific expense, categorize it correctly and keep receipts. Business purpose must be documented.`,
      confidence: 'high',
      relatedTopics: ['Receipt Requirements', 'Business Purpose Documentation', 'Asset Depreciation'],
      disclaimer: 'Tax rules vary by business type and situation. Verify with a tax advisor.',
    };
  }

  private getVatAdvice(question: string, context: string, country: string, isVatRegistered: boolean): TaxAdvice {
    const vatRates = {
      DE: { standard: 19, reduced: 7, zero: 0 },
      AT: { standard: 20, reduced: 10, zero: 0 },
      CH: { standard: 8.1, reduced: 2.6, zero: 0 },
      UK: { standard: 20, reduced: 5, zero: 0 },
    };

    const rates = vatRates[country] || vatRates.DE;

    return {
      question,
      answer: `VAT rates in ${country}:\n\n• Standard rate: ${rates.standard}% (most goods/services)\n• Reduced rate: ${rates.reduced}% (food, books, hotels)\n• Zero rate: ${rates.zero}% (exports, some exempt services)\n\n${isVatRegistered ? 'Your organization is VAT registered - you can reclaim input VAT on business purchases.' : 'Your organization is not VAT registered - consider registering if revenue exceeds threshold.'}`,
      confidence: 'high',
      relatedTopics: ['VAT Registration', 'Input VAT Recovery', 'VAT Returns'],
      disclaimer: 'VAT rules are complex. Verify specific cases with your tax advisor.',
    };
  }

  private getHomeOfficeAdvice(country: string): TaxAdvice {
    const rules = {
      DE: 'Germany allows home office deduction up to €1,260/year (flat rate) or actual costs if you have a dedicated room. The room must be used >90% for work.',
      AT: 'Austria allows €300/year for home office equipment and proportional rent/utilities for dedicated work space.',
      CH: 'Switzerland allows professional expense deduction for home office proportional to work use.',
    };

    return {
      question: 'home office',
      answer: rules[country] || rules.DE,
      confidence: 'high',
      relatedTopics: ['Office Equipment', 'Internet Costs', 'Utilities'],
      disclaimer: 'Requirements vary - document your setup and usage.',
    };
  }

  private getMealAdvice(country: string): TaxAdvice {
    const rules = {
      DE: 'Business meals in Germany: 70% deductible for business entertainment. Tips up to 10% included. Document attendees and business purpose.',
      AT: 'Austria: 50% of business meal costs are deductible. Keep detailed receipts.',
      CH: 'Switzerland: Business meals are deductible if business purpose is documented.',
    };

    return {
      question: 'meals',
      answer: rules[country] || rules.DE,
      confidence: 'high',
      relatedTopics: ['Entertainment Expenses', 'Receipt Requirements', 'Per Diem Rates'],
      disclaimer: 'Always document business purpose and attendees.',
    };
  }

  private getTravelAdvice(country: string): TaxAdvice {
    const rules = {
      DE: 'Germany: Business travel is fully deductible. Per diem rates apply (€14-28/day for meals). Keep all receipts and document business purpose.',
      AT: 'Austria: Business travel costs deductible with documentation. Per diem rates available.',
      CH: 'Switzerland: Travel costs deductible when business necessity is documented.',
    };

    return {
      question: 'travel',
      answer: rules[country] || rules.DE,
      confidence: 'high',
      relatedTopics: ['Per Diem Rates', 'Mileage Allowance', 'Accommodation'],
      disclaimer: 'Keep detailed records of all business travel.',
    };
  }

  private getEquipmentAdvice(country: string): TaxAdvice {
    const rules = {
      DE: 'Germany: Equipment up to €800 (net) can be fully expensed. Above that, depreciate over useful life (3 years for computers). Software is typically expensed.',
      AT: 'Austria: GWG limit €1,000. Above that, depreciate. Computers: 3-4 years.',
      CH: 'Switzerland: Business equipment deductible. Depreciation rules apply for larger assets.',
    };

    return {
      question: 'equipment',
      answer: rules[country] || rules.DE,
      confidence: 'high',
      relatedTopics: ['Depreciation', 'Asset Register', 'GWG Rules'],
      disclaimer: 'Asset classification affects tax treatment - verify thresholds.',
    };
  }

  private async getTaxSummary(orgId: string, year: number): Promise<any> {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31, 23, 59, 59);

    const [invoices, expenses] = await Promise.all([
      this.prisma.invoice.aggregate({
        where: { orgId, issueDate: { gte: startDate, lte: endDate } },
        _sum: { totalAmount: true, taxAmount: true },
        _count: true,
      }),
      this.prisma.expense.aggregate({
        where: { orgId, date: { gte: startDate, lte: endDate }, isDeductible: true },
        _sum: { amount: true, vatAmount: true },
        _count: true,
      }),
    ]);

    return {
      year,
      invoiceCount: invoices._count,
      invoiceTotal: parseFloat(invoices._sum.totalAmount?.toString() || '0'),
      outputVAT: parseFloat(invoices._sum.taxAmount?.toString() || '0'),
      expenseCount: expenses._count,
      deductibleExpenses: parseFloat(expenses._sum.amount?.toString() || '0'),
      inputVAT: parseFloat(expenses._sum.vatAmount?.toString() || '0'),
    };
  }
}
