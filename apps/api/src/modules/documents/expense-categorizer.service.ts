/**
 * Expense Categorizer Service
 * AI-powered expense categorization using German SKR03/SKR04 accounting standards
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClaudeClient } from '@operate/ai';

/**
 * German SKR03/SKR04 Expense Categories
 */
export enum ExpenseCategory {
  // Personnel Costs (SKR03: 4000-4999, SKR04: 6000-6999)
  WAGES_SALARIES = 'wages_salaries', // SKR03: 4100-4199, SKR04: 6100-6199
  SOCIAL_SECURITY = 'social_security', // SKR03: 4200-4299, SKR04: 6200-6299
  EMPLOYEE_BENEFITS = 'employee_benefits', // SKR03: 4300-4399, SKR04: 6300-6399

  // Operating Expenses (SKR03: 4000-4999, SKR04: 6000-6999)
  RENT = 'rent', // SKR03: 4210, SKR04: 6210
  UTILITIES = 'utilities', // SKR03: 4240-4290, SKR04: 6240-6290
  INSURANCE = 'insurance', // SKR03: 4360-4390, SKR04: 6360-6390
  VEHICLE_COSTS = 'vehicle_costs', // SKR03: 4530-4599, SKR04: 6530-6599
  TRAVEL_EXPENSES = 'travel_expenses', // SKR03: 4660-4669, SKR04: 6660-6669
  OFFICE_SUPPLIES = 'office_supplies', // SKR03: 4910, SKR04: 6815
  POSTAGE_SHIPPING = 'postage_shipping', // SKR03: 4940, SKR04: 6845

  // IT & Software (SKR03: 4xxx, SKR04: 6xxx)
  IT_COSTS = 'it_costs', // SKR03: 4850-4869, SKR04: 6805-6820
  SOFTWARE_SUBSCRIPTIONS = 'software_subscriptions', // SKR03: 4860, SKR04: 6820
  WEBSITE_HOSTING = 'website_hosting', // SKR03: 4860, SKR04: 6820

  // Marketing & Sales (SKR03: 4600-4799, SKR04: 6600-6799)
  ADVERTISING = 'advertising', // SKR03: 4600-4649, SKR04: 6600-6649
  MARKETING = 'marketing', // SKR03: 4650, SKR04: 6650
  TRADE_SHOWS = 'trade_shows', // SKR03: 4630, SKR04: 6630
  SALES_COMMISSIONS = 'sales_commissions', // SKR03: 4730, SKR04: 6730

  // Professional Services (SKR03: 4900-4999, SKR04: 6800-6899)
  CONSULTING = 'consulting', // SKR03: 4960, SKR04: 6822
  LEGAL_FEES = 'legal_fees', // SKR03: 4945, SKR04: 6825
  ACCOUNTING_FEES = 'accounting_fees', // SKR03: 4950, SKR04: 6823
  AUDIT_FEES = 'audit_fees', // SKR03: 4955, SKR04: 6824

  // Facility Costs (SKR03: 4100-4399, SKR04: 6200-6399)
  BUILDING_MAINTENANCE = 'building_maintenance', // SKR03: 4230, SKR04: 6230
  CLEANING = 'cleaning', // SKR03: 4235, SKR04: 6235
  SECURITY = 'security', // SKR03: 4236, SKR04: 6236

  // Materials & Inventory (SKR03: 5000-5999, SKR04: 7000-7999)
  RAW_MATERIALS = 'raw_materials', // SKR03: 5000-5199, SKR04: 7000-7199
  MERCHANDISE = 'merchandise', // SKR03: 5400-5499, SKR04: 7400-7499

  // Financial Costs (SKR03: 2100-2199, SKR04: 7500-7599)
  BANK_FEES = 'bank_fees', // SKR03: 2105, SKR04: 7510
  INTEREST_EXPENSE = 'interest_expense', // SKR03: 2110, SKR04: 7520

  // Training & Development
  TRAINING_COURSES = 'training_courses', // SKR03: 4945, SKR04: 6821

  // Entertainment & Representation (SKR03: 4630-4649, SKR04: 6640-6649)
  MEALS_ENTERTAINMENT = 'meals_entertainment', // SKR03: 4630-4649, SKR04: 6640-6649
  BUSINESS_MEALS = 'business_meals', // SKR03: 4630, SKR04: 6640 (70% deductible)
  GIFTS = 'gifts', // SKR03: 4635, SKR04: 6645

  // Depreciation (SKR03: 4800-4899, SKR04: 6200-6299)
  DEPRECIATION = 'depreciation', // SKR03: 4800-4899, SKR04: 6200-6299

  // Taxes & Fees (SKR03: 4900-4999, SKR04: 6800-6899)
  PROPERTY_TAX = 'property_tax', // SKR03: 4900, SKR04: 6800
  TRADE_TAX = 'trade_tax', // SKR03: 4905, SKR04: 6805

  // Other
  MISCELLANEOUS = 'miscellaneous', // SKR03: 4990, SKR04: 6890
  UNCATEGORIZED = 'uncategorized',
}

export interface ExpenseCategorizationResult {
  category: ExpenseCategory;
  confidence: number;
  suggestedAccountCodeSKR03?: string;
  suggestedAccountCodeSKR04?: string;
  reasoning: string;
  vatRate?: number; // 0, 7, 19 for Germany
  partiallyDeductible?: boolean;
  deductiblePercentage?: number; // e.g., 70% for business meals
  flags?: ExpenseFlag[];
}

export enum ExpenseFlag {
  REQUIRES_RECEIPT = 'requires_receipt',
  REQUIRES_INVOICE = 'requires_invoice',
  HIGH_VALUE = 'high_value', // > 150 EUR
  CASH_PAYMENT = 'cash_payment', // > 250 EUR requires special documentation
  FOREIGN_CURRENCY = 'foreign_currency',
  SPLIT_PRIVATE_BUSINESS = 'split_private_business',
  PARTIALLY_DEDUCTIBLE = 'partially_deductible',
  VAT_DEDUCTIBLE = 'vat_deductible',
  REQUIRES_APPROVAL = 'requires_approval',
}

export interface ExpenseInput {
  description: string;
  amount: number;
  currency: string;
  date: Date | string;
  vendor?: string;
  paymentMethod?: string;
  receiptText?: string; // OCR-extracted text from receipt
  invoiceNumber?: string;
  existingCategory?: ExpenseCategory; // For learning from corrections
}

export interface BulkCategorizationResult {
  results: Array<ExpenseCategorizationResult & { originalIndex: number }>;
  processingTime: number;
  totalProcessed: number;
  successCount: number;
  failureCount: number;
}

export interface UserCorrection {
  originalCategory: ExpenseCategory;
  correctedCategory: ExpenseCategory;
  description: string;
  vendor?: string;
  reasoning?: string;
}

/**
 * Expense Categorizer Service
 * Uses Claude AI to categorize expenses into German SKR03/SKR04 accounts
 */
@Injectable()
export class ExpenseCategorizerService {
  private readonly logger = new Logger(ExpenseCategorizerService.name);
  private claudeClient: ClaudeClient;
  private userCorrections: UserCorrection[] = []; // Simple in-memory learning

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('ANTHROPIC_API_KEY');

    if (!apiKey) {
      this.logger.warn('ANTHROPIC_API_KEY not configured - expense categorization will fail');
    }

    this.claudeClient = new ClaudeClient({
      apiKey: apiKey || '',
      defaultModel: 'claude-3-5-sonnet-20241022',
      maxTokens: 2048,
      temperature: 0.1, // Low temperature for consistent categorization
    });
  }

  /**
   * Categorize a single expense
   */
  async categorizeExpense(input: ExpenseInput): Promise<ExpenseCategorizationResult> {
    this.logger.log(`Categorizing expense: ${input.description} (${input.amount} ${input.currency})`);

    try {
      const systemPrompt = this.buildSystemPrompt();
      const userPrompt = this.buildExpensePrompt(input);

      const responseText = await this.claudeClient.prompt(userPrompt, {
        system: systemPrompt,
        temperature: 0.1,
        maxTokens: 2048,
      });

      const result = this.parseCategorizationResponse(responseText, input);

      // Apply learning from user corrections
      this.applyLearning(result, input);

      return result;
    } catch (error) {
      this.logger.error(`Categorization failed for ${input.description}:`, error);

      // Fallback to rule-based categorization
      return this.fallbackCategorization(input);
    }
  }

  /**
   * Categorize multiple expenses in bulk
   */
  async categorizeBulk(inputs: ExpenseInput[]): Promise<BulkCategorizationResult> {
    this.logger.log(`Bulk categorizing ${inputs.length} expenses`);
    const startTime = Date.now();

    const results: Array<ExpenseCategorizationResult & { originalIndex: number }> = [];
    let successCount = 0;
    let failureCount = 0;

    // Process in batches of 10 to avoid rate limits
    const batchSize = 10;
    for (let i = 0; i < inputs.length; i += batchSize) {
      const batch = inputs.slice(i, i + batchSize);

      const batchPromises = batch.map(async (input, batchIndex) => {
        try {
          const result = await this.categorizeExpense(input);
          successCount++;
          return { ...result, originalIndex: i + batchIndex };
        } catch (error) {
          this.logger.error(`Failed to categorize expense at index ${i + batchIndex}:`, error);
          failureCount++;
          const fallback = this.fallbackCategorization(input);
          return { ...fallback, originalIndex: i + batchIndex };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    const processingTime = Date.now() - startTime;

    return {
      results,
      processingTime,
      totalProcessed: inputs.length,
      successCount,
      failureCount,
    };
  }

  /**
   * Learn from user correction
   */
  learnFromCorrection(correction: UserCorrection): void {
    this.logger.log(
      `Learning: ${correction.description} corrected from ${correction.originalCategory} to ${correction.correctedCategory}`,
    );

    // Store correction for future reference
    this.userCorrections.push(correction);

    // TODO: In production, persist corrections to database
    // TODO: Implement more sophisticated learning (fine-tuning, vector embeddings, etc.)
  }

  /**
   * Build system prompt for categorization
   */
  private buildSystemPrompt(): string {
    return `You are an expert German accountant specializing in expense categorization using SKR03 and SKR04 accounting standards.

Your task is to analyze expense descriptions and categorize them into the appropriate German expense category with the corresponding SKR03 and SKR04 account codes.

Respond ONLY with valid JSON in this exact format:
{
  "category": "CATEGORY_NAME",
  "confidence": 0.95,
  "suggestedAccountCodeSKR03": "4xxx",
  "suggestedAccountCodeSKR04": "6xxx",
  "reasoning": "Brief explanation of categorization",
  "vatRate": 19,
  "partiallyDeductible": false,
  "deductiblePercentage": 100,
  "flags": ["flag1", "flag2"]
}

Available categories and their typical account codes:
- WAGES_SALARIES: SKR03 4100-4199, SKR04 6100-6199
- RENT: SKR03 4210, SKR04 6210
- UTILITIES: SKR03 4240-4290, SKR04 6240-6290
- INSURANCE: SKR03 4360-4390, SKR04 6360-6390
- VEHICLE_COSTS: SKR03 4530-4599, SKR04 6530-6599
- TRAVEL_EXPENSES: SKR03 4660-4669, SKR04 6660-6669
- OFFICE_SUPPLIES: SKR03 4910, SKR04 6815
- IT_COSTS: SKR03 4850-4869, SKR04 6805-6820
- SOFTWARE_SUBSCRIPTIONS: SKR03 4860, SKR04 6820
- ADVERTISING: SKR03 4600-4649, SKR04 6600-6649
- MARKETING: SKR03 4650, SKR04 6650
- CONSULTING: SKR03 4960, SKR04 6822
- LEGAL_FEES: SKR03 4945, SKR04 6825
- ACCOUNTING_FEES: SKR03 4950, SKR04 6823
- BUSINESS_MEALS: SKR03 4630, SKR04 6640 (70% deductible)
- BANK_FEES: SKR03 2105, SKR04 7510
- MISCELLANEOUS: SKR03 4990, SKR04 6890

VAT rates in Germany: 19% (standard), 7% (reduced), 0% (exempt)

Flags to include based on conditions:
- REQUIRES_RECEIPT: Always for business expenses
- REQUIRES_INVOICE: For services > 250 EUR
- HIGH_VALUE: Amount > 150 EUR
- CASH_PAYMENT: If payment method is cash and > 250 EUR
- PARTIALLY_DEDUCTIBLE: e.g., business meals (70%), mixed-use items
- VAT_DEDUCTIBLE: If VAT can be reclaimed

Be conservative with confidence scores. Use < 0.8 if uncertain.`;
  }

  /**
   * Build expense-specific prompt
   */
  private buildExpensePrompt(input: ExpenseInput): string {
    let prompt = `Categorize this expense:\n\n`;
    prompt += `Description: ${input.description}\n`;
    prompt += `Amount: ${input.amount} ${input.currency}\n`;
    prompt += `Date: ${input.date}\n`;

    if (input.vendor) {
      prompt += `Vendor: ${input.vendor}\n`;
    }

    if (input.paymentMethod) {
      prompt += `Payment Method: ${input.paymentMethod}\n`;
    }

    if (input.invoiceNumber) {
      prompt += `Invoice Number: ${input.invoiceNumber}\n`;
    }

    if (input.receiptText) {
      prompt += `\nReceipt Text (OCR):\n${input.receiptText}\n`;
    }

    // Add learning context from previous corrections
    if (this.userCorrections.length > 0) {
      const relevantCorrections = this.findRelevantCorrections(input);
      if (relevantCorrections.length > 0) {
        prompt += `\nLearning from previous corrections:\n`;
        relevantCorrections.forEach((correction) => {
          prompt += `- "${correction.description}" was corrected to ${correction.correctedCategory}\n`;
        });
      }
    }

    prompt += `\nProvide the categorization in JSON format.`;

    return prompt;
  }

  /**
   * Parse Claude's categorization response
   */
  private parseCategorizationResponse(
    responseText: string,
    input: ExpenseInput,
  ): ExpenseCategorizationResult {
    try {
      // Extract JSON from response
      const jsonMatch =
        responseText.match(/```json\s*([\s\S]*?)\s*```/) ||
        responseText.match(/```\s*([\s\S]*?)\s*```/) ||
        [null, responseText];

      const jsonText = jsonMatch[1] || responseText;
      const parsed = JSON.parse(jsonText.trim());

      // Validate required fields
      if (!parsed.category || typeof parsed.confidence !== 'number') {
        throw new Error('Invalid response structure');
      }

      return {
        category: parsed.category as ExpenseCategory,
        confidence: Math.max(0, Math.min(1, parsed.confidence)),
        suggestedAccountCodeSKR03: parsed.suggestedAccountCodeSKR03,
        suggestedAccountCodeSKR04: parsed.suggestedAccountCodeSKR04,
        reasoning: parsed.reasoning || 'No reasoning provided',
        vatRate: parsed.vatRate,
        partiallyDeductible: parsed.partiallyDeductible || false,
        deductiblePercentage: parsed.deductiblePercentage || 100,
        flags: parsed.flags || [],
      };
    } catch (error) {
      this.logger.error(`Failed to parse categorization response:`, error);
      return this.fallbackCategorization(input);
    }
  }

  /**
   * Fallback categorization using rule-based approach
   */
  private fallbackCategorization(input: ExpenseInput): ExpenseCategorizationResult {
    const description = input.description.toLowerCase();
    const amount = input.amount;

    // Simple keyword-based categorization
    let category = ExpenseCategory.UNCATEGORIZED;
    let skr03 = '4990';
    let skr04 = '6890';

    if (description.includes('rent') || description.includes('miete')) {
      category = ExpenseCategory.RENT;
      skr03 = '4210';
      skr04 = '6210';
    } else if (description.includes('software') || description.includes('saas')) {
      category = ExpenseCategory.SOFTWARE_SUBSCRIPTIONS;
      skr03 = '4860';
      skr04 = '6820';
    } else if (description.includes('office') || description.includes('büro')) {
      category = ExpenseCategory.OFFICE_SUPPLIES;
      skr03 = '4910';
      skr04 = '6815';
    } else if (description.includes('travel') || description.includes('reise')) {
      category = ExpenseCategory.TRAVEL_EXPENSES;
      skr03 = '4660';
      skr04 = '6660';
    } else if (description.includes('advertising') || description.includes('werbung')) {
      category = ExpenseCategory.ADVERTISING;
      skr03 = '4600';
      skr04 = '6600';
    } else if (description.includes('consulting') || description.includes('beratung')) {
      category = ExpenseCategory.CONSULTING;
      skr03 = '4960';
      skr04 = '6822';
    } else if (description.includes('insurance') || description.includes('versicherung')) {
      category = ExpenseCategory.INSURANCE;
      skr03 = '4360';
      skr04 = '6360';
    }

    const flags: ExpenseFlag[] = [ExpenseFlag.REQUIRES_RECEIPT];
    if (amount > 150) {
      flags.push(ExpenseFlag.HIGH_VALUE);
    }
    if (amount > 250 && input.paymentMethod?.toLowerCase() === 'cash') {
      flags.push(ExpenseFlag.CASH_PAYMENT);
    }

    return {
      category,
      confidence: 0.5,
      suggestedAccountCodeSKR03: skr03,
      suggestedAccountCodeSKR04: skr04,
      reasoning: 'Fallback rule-based categorization',
      vatRate: 19,
      partiallyDeductible: false,
      deductiblePercentage: 100,
      flags,
    };
  }

  /**
   * Apply learning from user corrections
   */
  private applyLearning(result: ExpenseCategorizationResult, input: ExpenseInput): void {
    const relevantCorrections = this.findRelevantCorrections(input);

    if (relevantCorrections.length > 0) {
      // If we find a very similar correction, boost confidence or override category
      const exactMatch = relevantCorrections.find(
        (c) =>
          c.description.toLowerCase() === input.description.toLowerCase() ||
          (c.vendor && input.vendor && c.vendor.toLowerCase() === input.vendor.toLowerCase()),
      );

      if (exactMatch && result.category === exactMatch.originalCategory) {
        this.logger.log(
          `Applying learned correction: ${result.category} -> ${exactMatch.correctedCategory}`,
        );
        result.category = exactMatch.correctedCategory;
        result.confidence = Math.min(0.95, result.confidence + 0.2);
        result.reasoning += ` (Learned from user correction)`;
      }
    }
  }

  /**
   * Find relevant corrections based on similarity
   */
  private findRelevantCorrections(input: ExpenseInput): UserCorrection[] {
    return this.userCorrections.filter((correction) => {
      // Check for exact vendor match
      if (
        correction.vendor &&
        input.vendor &&
        correction.vendor.toLowerCase() === input.vendor.toLowerCase()
      ) {
        return true;
      }

      // Check for description similarity (simple word matching)
      const correctionWords = correction.description.toLowerCase().split(/\s+/);
      const inputWords = input.description.toLowerCase().split(/\s+/);

      const matchingWords = correctionWords.filter((word) =>
        inputWords.some((inputWord) => inputWord.includes(word) || word.includes(inputWord)),
      );

      // Return true if > 50% words match
      return matchingWords.length / correctionWords.length > 0.5;
    });
  }

  /**
   * Get account code suggestions for a category
   */
  getAccountCodes(
    category: ExpenseCategory,
  ): { skr03: string; skr04: string; description: string } {
    const accountMap: Record<
      ExpenseCategory,
      { skr03: string; skr04: string; description: string }
    > = {
      [ExpenseCategory.WAGES_SALARIES]: {
        skr03: '4100',
        skr04: '6100',
        description: 'Löhne und Gehälter',
      },
      [ExpenseCategory.SOCIAL_SECURITY]: {
        skr03: '4200',
        skr04: '6200',
        description: 'Soziale Abgaben',
      },
      [ExpenseCategory.EMPLOYEE_BENEFITS]: {
        skr03: '4300',
        skr04: '6300',
        description: 'Personalnebenkosten',
      },
      [ExpenseCategory.RENT]: { skr03: '4210', skr04: '6210', description: 'Miete Räume' },
      [ExpenseCategory.UTILITIES]: {
        skr03: '4240',
        skr04: '6240',
        description: 'Strom, Gas, Wasser',
      },
      [ExpenseCategory.INSURANCE]: { skr03: '4360', skr04: '6360', description: 'Versicherungen' },
      [ExpenseCategory.VEHICLE_COSTS]: {
        skr03: '4530',
        skr04: '6530',
        description: 'Fahrzeugkosten',
      },
      [ExpenseCategory.TRAVEL_EXPENSES]: {
        skr03: '4660',
        skr04: '6660',
        description: 'Reisekosten',
      },
      [ExpenseCategory.OFFICE_SUPPLIES]: {
        skr03: '4910',
        skr04: '6815',
        description: 'Bürobedarf',
      },
      [ExpenseCategory.POSTAGE_SHIPPING]: {
        skr03: '4940',
        skr04: '6845',
        description: 'Porto',
      },
      [ExpenseCategory.IT_COSTS]: { skr03: '4850', skr04: '6805', description: 'EDV-Kosten' },
      [ExpenseCategory.SOFTWARE_SUBSCRIPTIONS]: {
        skr03: '4860',
        skr04: '6820',
        description: 'Software',
      },
      [ExpenseCategory.WEBSITE_HOSTING]: {
        skr03: '4860',
        skr04: '6820',
        description: 'Webhosting',
      },
      [ExpenseCategory.ADVERTISING]: { skr03: '4600', skr04: '6600', description: 'Werbung' },
      [ExpenseCategory.MARKETING]: { skr03: '4650', skr04: '6650', description: 'Marketing' },
      [ExpenseCategory.TRADE_SHOWS]: { skr03: '4630', skr04: '6630', description: 'Messen' },
      [ExpenseCategory.SALES_COMMISSIONS]: {
        skr03: '4730',
        skr04: '6730',
        description: 'Provisionen',
      },
      [ExpenseCategory.CONSULTING]: { skr03: '4960', skr04: '6822', description: 'Beratung' },
      [ExpenseCategory.LEGAL_FEES]: {
        skr03: '4945',
        skr04: '6825',
        description: 'Rechtsberatung',
      },
      [ExpenseCategory.ACCOUNTING_FEES]: {
        skr03: '4950',
        skr04: '6823',
        description: 'Buchhaltung',
      },
      [ExpenseCategory.AUDIT_FEES]: {
        skr03: '4955',
        skr04: '6824',
        description: 'Wirtschaftsprüfung',
      },
      [ExpenseCategory.BUILDING_MAINTENANCE]: {
        skr03: '4230',
        skr04: '6230',
        description: 'Instandhaltung',
      },
      [ExpenseCategory.CLEANING]: { skr03: '4235', skr04: '6235', description: 'Reinigung' },
      [ExpenseCategory.SECURITY]: {
        skr03: '4236',
        skr04: '6236',
        description: 'Sicherheitsdienst',
      },
      [ExpenseCategory.RAW_MATERIALS]: {
        skr03: '5000',
        skr04: '7000',
        description: 'Rohstoffe',
      },
      [ExpenseCategory.MERCHANDISE]: {
        skr03: '5400',
        skr04: '7400',
        description: 'Wareneingang',
      },
      [ExpenseCategory.BANK_FEES]: { skr03: '2105', skr04: '7510', description: 'Bankgebühren' },
      [ExpenseCategory.INTEREST_EXPENSE]: { skr03: '2110', skr04: '7520', description: 'Zinsen' },
      [ExpenseCategory.TRAINING_COURSES]: {
        skr03: '4945',
        skr04: '6821',
        description: 'Fortbildung',
      },
      [ExpenseCategory.MEALS_ENTERTAINMENT]: {
        skr03: '4630',
        skr04: '6640',
        description: 'Bewirtung',
      },
      [ExpenseCategory.BUSINESS_MEALS]: {
        skr03: '4630',
        skr04: '6640',
        description: 'Geschäftsessen (70% abzugsfähig)',
      },
      [ExpenseCategory.GIFTS]: { skr03: '4635', skr04: '6645', description: 'Geschenke' },
      [ExpenseCategory.DEPRECIATION]: {
        skr03: '4800',
        skr04: '6200',
        description: 'Abschreibungen',
      },
      [ExpenseCategory.PROPERTY_TAX]: {
        skr03: '4900',
        skr04: '6800',
        description: 'Grundsteuer',
      },
      [ExpenseCategory.TRADE_TAX]: {
        skr03: '4905',
        skr04: '6805',
        description: 'Gewerbesteuer',
      },
      [ExpenseCategory.MISCELLANEOUS]: {
        skr03: '4990',
        skr04: '6890',
        description: 'Sonstige Kosten',
      },
      [ExpenseCategory.UNCATEGORIZED]: {
        skr03: '4990',
        skr04: '6890',
        description: 'Nicht kategorisiert',
      },
    };

    return (
      accountMap[category] || {
        skr03: '4990',
        skr04: '6890',
        description: 'Sonstige Kosten',
      }
    );
  }
}
