/**
 * AI Tax Deduction Analyzer Service
 * Uses Claude AI to analyze expenses and suggest optimal tax deductions
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClaudeClient } from '@operate/ai';
import { PrismaService } from '../../database/prisma.service';

/**
 * German Tax Category Classification
 */
export enum GermanTaxCategory {
  WERBUNGSKOSTEN = 'WERBUNGSKOSTEN', // Income-related expenses
  BETRIEBSAUSGABEN = 'BETRIEBSAUSGABEN', // Business expenses
  SONDERAUSGABEN = 'SONDERAUSGABEN', // Special expenses (insurance, donations)
  AUSSERGEWOEHNLICHE_BELASTUNGEN = 'AUSSERGEWOEHNLICHE_BELASTUNGEN', // Extraordinary burdens (medical)
  HANDWERKERLEISTUNGEN = 'HANDWERKERLEISTUNGEN', // Craftsman services (20% deductible)
  HAUSHALTSNAHE_DIENSTLEISTUNGEN = 'HAUSHALTSNAHE_DIENSTLEISTUNGEN', // Household services
}

/**
 * AI Analysis Result
 */
export interface AIDeductionAnalysis {
  expenseId: string;
  category: GermanTaxCategory;
  subcategory: string;
  confidence: number;
  deductiblePercentage: number;
  estimatedTaxSavings: number;
  explanation: string;
  legalReference: string; // EStG paragraph
  requirements: {
    documentationNeeded: string[];
    missingDocuments: string[];
    additionalInfo: string[];
  };
  warnings: string[];
}

/**
 * Expense Analysis Request
 */
export interface AnalyzeExpenseRequest {
  description: string;
  amount: number;
  currency: string;
  date: Date;
  category?: string;
  vendorName?: string;
  receiptUrl?: string;
  metadata?: Record<string, any>;
}

/**
 * Batch Analysis Result
 */
export interface BatchAnalysisResult {
  analyses: AIDeductionAnalysis[];
  summary: {
    totalExpenses: number;
    totalDeductible: number;
    estimatedTaxSavings: number;
    byCategory: Record<
      string,
      {
        count: number;
        totalAmount: number;
        deductibleAmount: number;
      }
    >;
  };
}

/**
 * Deduction Analyzer Service
 */
@Injectable()
export class DeductionAnalyzerService {
  private readonly logger = new Logger(DeductionAnalyzerService.name);
  private claudeClient: ClaudeClient;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    const apiKey = this.configService.get<string>('ANTHROPIC_API_KEY');
    if (!apiKey) {
      this.logger.warn('ANTHROPIC_API_KEY not configured. AI analysis will be unavailable.');
    }
    this.claudeClient = new ClaudeClient({
      apiKey: apiKey || '',
      defaultModel: 'claude-3-5-sonnet-20241022',
      temperature: 0.3,
      maxTokens: 2048,
    });
  }

  /**
   * Analyze a single expense for tax deductions
   */
  async analyzeExpense(
    expense: AnalyzeExpenseRequest,
    taxBracket: number = 42, // Default German tax bracket (42%)
  ): Promise<AIDeductionAnalysis> {
    this.logger.debug(`Analyzing expense: ${expense.description}`);

    const prompt = this.buildAnalysisPrompt(expense);
    const systemPrompt = this.getSystemPrompt();

    try {
      const response = await this.claudeClient.prompt(prompt, {
        system: systemPrompt,
        temperature: 0.3,
        maxTokens: 2048,
      });

      const analysis = this.parseAIResponse(response, expense, taxBracket);
      this.logger.debug(`Analysis complete: ${analysis.category} (${analysis.confidence})`);

      return analysis;
    } catch (error) {
      this.logger.error('Error analyzing expense with Claude AI', error);
      // Fallback to rule-based analysis
      return this.fallbackAnalysis(expense, taxBracket);
    }
  }

  /**
   * Analyze multiple expenses in batch
   */
  async analyzeExpenses(
    expenses: AnalyzeExpenseRequest[],
    taxBracket: number = 42,
  ): Promise<BatchAnalysisResult> {
    this.logger.debug(`Analyzing ${expenses.length} expenses`);

    const analyses: AIDeductionAnalysis[] = [];

    // Process in parallel with concurrency limit
    const batchSize = 5;
    for (let i = 0; i < expenses.length; i += batchSize) {
      const batch = expenses.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map((expense) => this.analyzeExpense(expense, taxBracket)),
      );
      analyses.push(...batchResults);
    }

    // Calculate summary
    const summary = this.calculateSummary(analyses);

    return {
      analyses,
      summary,
    };
  }

  /**
   * Analyze existing expense records by IDs
   */
  async analyzeExpensesByIds(
    orgId: string,
    expenseIds: string[],
    taxBracket: number = 42,
  ): Promise<BatchAnalysisResult> {
    const expenses = await this.prisma.expense.findMany({
      where: {
        id: { in: expenseIds },
        orgId,
      },
    });

    const expenseRequests: AnalyzeExpenseRequest[] = expenses.map((e) => ({
      description: e.description,
      amount: parseFloat(e.amount.toString()),
      currency: e.currency,
      date: e.date,
      category: e.category,
      vendorName: e.vendorName || undefined,
      receiptUrl: e.receiptUrl || undefined,
      metadata: e.metadata as Record<string, any> | undefined,
    }));

    return this.analyzeExpenses(expenseRequests, taxBracket);
  }

  /**
   * Get tax deduction categories for dropdown/selection
   */
  getDeductionCategories(): Array<{
    code: GermanTaxCategory;
    name: string;
    description: string;
    legalReference: string;
  }> {
    return [
      {
        code: GermanTaxCategory.WERBUNGSKOSTEN,
        name: 'Werbungskosten',
        description:
          'Income-related expenses (work equipment, professional development, commute)',
        legalReference: '§ 9 EStG',
      },
      {
        code: GermanTaxCategory.BETRIEBSAUSGABEN,
        name: 'Betriebsausgaben',
        description:
          'Business expenses for self-employed (office, travel, supplies)',
        legalReference: '§ 4 EStG',
      },
      {
        code: GermanTaxCategory.SONDERAUSGABEN,
        name: 'Sonderausgaben',
        description:
          'Special expenses (insurance, pension contributions, donations)',
        legalReference: '§ 10 EStG',
      },
      {
        code: GermanTaxCategory.AUSSERGEWOEHNLICHE_BELASTUNGEN,
        name: 'Außergewöhnliche Belastungen',
        description: 'Extraordinary burdens (medical expenses, care costs)',
        legalReference: '§ 33 EStG',
      },
      {
        code: GermanTaxCategory.HANDWERKERLEISTUNGEN,
        name: 'Handwerkerleistungen',
        description: 'Craftsman services (20% of labor costs deductible)',
        legalReference: '§ 35a Abs. 3 EStG',
      },
      {
        code: GermanTaxCategory.HAUSHALTSNAHE_DIENSTLEISTUNGEN,
        name: 'Haushaltsnahe Dienstleistungen',
        description: 'Household services (cleaning, gardening, care)',
        legalReference: '§ 35a Abs. 2 EStG',
      },
    ];
  }

  /**
   * Build analysis prompt for Claude
   */
  private buildAnalysisPrompt(expense: AnalyzeExpenseRequest): string {
    const hasReceipt = expense.receiptUrl ? 'Yes' : 'No';
    const metadata = expense.metadata
      ? JSON.stringify(expense.metadata, null, 2)
      : 'None';

    return `Analyze this expense for German tax deduction purposes:

Expense Details:
- Description: ${expense.description}
- Amount: ${expense.amount} ${expense.currency}
- Date: ${expense.date.toISOString().split('T')[0]}
- Vendor: ${expense.vendorName || 'Unknown'}
- Receipt Available: ${hasReceipt}
- Category: ${expense.category || 'Not classified'}
- Additional Info: ${metadata}

Please provide a detailed tax deduction analysis with the following information:

1. Tax Category: Which German tax category does this fit (Werbungskosten, Betriebsausgaben, Sonderausgaben, Außergewöhnliche Belastungen, Handwerkerleistungen, Haushaltsnahe Dienstleistungen)

2. Subcategory: Specific subcategory (e.g., "Office Equipment", "Travel", "Insurance")

3. Deductible Percentage: What percentage is deductible (0-100%)

4. Legal Reference: Specific EStG paragraph (e.g., "§ 9 Abs. 1 Satz 1 EStG")

5. Explanation: Clear explanation of why this is deductible and any limitations

6. Documentation Requirements: What documentation is needed, what's missing

7. Confidence Score: 0.0 to 1.0 indicating how confident you are in this classification

8. Warnings: Any warnings or special considerations

Format your response as JSON:
{
  "category": "CATEGORY_CODE",
  "subcategory": "Specific subcategory",
  "deductiblePercentage": 100,
  "legalReference": "§ X EStG",
  "explanation": "Detailed explanation",
  "documentationNeeded": ["Receipt", "Business purpose"],
  "missingDocuments": ["Business purpose statement"],
  "additionalInfo": ["Note about limitations"],
  "confidence": 0.85,
  "warnings": ["Warning if any"]
}`;
  }

  /**
   * Get system prompt for Claude
   */
  private getSystemPrompt(): string {
    return `You are an expert German tax advisor specializing in tax deductions (Steuerabzüge).

Your expertise includes:
- German Income Tax Law (Einkommensteuergesetz - EStG)
- Tax deduction categories (Werbungskosten, Betriebsausgaben, Sonderausgaben)
- Documentation requirements for the Finanzamt
- Common deduction limits and special rules

Key principles:
- Be conservative: Only suggest deductions you're confident about
- Cite specific EStG paragraphs for legal references
- Consider documentation requirements
- Warn about potential issues or limitations
- Distinguish between personal and business expenses

Respond ONLY with valid JSON. No markdown, no code blocks, just pure JSON.`;
  }

  /**
   * Parse AI response into structured analysis
   */
  private parseAIResponse(
    response: string,
    expense: AnalyzeExpenseRequest,
    taxBracket: number,
  ): AIDeductionAnalysis {
    try {
      // Clean response (remove markdown if present)
      let cleaned = response.trim();
      if (cleaned.startsWith('```json')) {
        cleaned = cleaned.replace(/```json\n?/, '').replace(/\n?```$/, '');
      } else if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/```\n?/, '').replace(/\n?```$/, '');
      }

      const parsed = JSON.parse(cleaned);

      // Calculate tax savings
      const deductibleAmount =
        expense.amount * (parsed.deductiblePercentage / 100);
      const estimatedTaxSavings = deductibleAmount * (taxBracket / 100);

      return {
        expenseId: '', // Will be set by caller if needed
        category: parsed.category as GermanTaxCategory,
        subcategory: parsed.subcategory,
        confidence: parsed.confidence,
        deductiblePercentage: parsed.deductiblePercentage,
        estimatedTaxSavings,
        explanation: parsed.explanation,
        legalReference: parsed.legalReference,
        requirements: {
          documentationNeeded: parsed.documentationNeeded || [],
          missingDocuments: parsed.missingDocuments || [],
          additionalInfo: parsed.additionalInfo || [],
        },
        warnings: parsed.warnings || [],
      };
    } catch (error) {
      this.logger.error('Error parsing AI response', error);
      throw new Error('Failed to parse AI analysis response');
    }
  }

  /**
   * Fallback analysis when AI is unavailable
   */
  private fallbackAnalysis(
    expense: AnalyzeExpenseRequest,
    taxBracket: number,
  ): AIDeductionAnalysis {
    // Simple rule-based fallback
    let category = GermanTaxCategory.BETRIEBSAUSGABEN;
    let subcategory = 'General Business Expense';
    let deductiblePercentage = 100;
    let legalReference = '§ 4 Abs. 4 EStG';

    const description = expense.description.toLowerCase();

    // Simple pattern matching
    if (description.includes('office') || description.includes('equipment')) {
      subcategory = 'Office Equipment';
      legalReference = '§ 9 Abs. 1 Satz 1 EStG';
    } else if (description.includes('travel') || description.includes('hotel')) {
      subcategory = 'Travel Expenses';
      category = GermanTaxCategory.WERBUNGSKOSTEN;
    } else if (description.includes('insurance')) {
      category = GermanTaxCategory.SONDERAUSGABEN;
      subcategory = 'Insurance';
      legalReference = '§ 10 Abs. 1 Nr. 2 EStG';
    }

    const deductibleAmount = expense.amount * (deductiblePercentage / 100);
    const estimatedTaxSavings = deductibleAmount * (taxBracket / 100);

    return {
      expenseId: '',
      category,
      subcategory,
      confidence: 0.5, // Low confidence for fallback
      deductiblePercentage,
      estimatedTaxSavings,
      explanation:
        'Fallback analysis (AI unavailable). This is a basic categorization and should be reviewed.',
      legalReference,
      requirements: {
        documentationNeeded: ['Receipt', 'Invoice'],
        missingDocuments: expense.receiptUrl ? [] : ['Receipt'],
        additionalInfo: ['Please verify this categorization manually'],
      },
      warnings: ['This analysis was generated using fallback rules, not AI'],
    };
  }

  /**
   * Calculate summary statistics
   */
  private calculateSummary(analyses: AIDeductionAnalysis[]): {
    totalExpenses: number;
    totalDeductible: number;
    estimatedTaxSavings: number;
    byCategory: Record<
      string,
      { count: number; totalAmount: number; deductibleAmount: number }
    >;
  } {
    const byCategory: Record<
      string,
      { count: number; totalAmount: number; deductibleAmount: number }
    > = {};

    let totalExpenses = 0;
    let totalDeductible = 0;
    let estimatedTaxSavings = 0;

    for (const analysis of analyses) {
      // Initialize category if needed
      if (!byCategory[analysis.category]) {
        byCategory[analysis.category] = {
          count: 0,
          totalAmount: 0,
          deductibleAmount: 0,
        };
      }

      // Calculate amounts (note: we'd need original expense amount)
      // For now, we'll use estimated savings to back-calculate
      const deductibleAmount =
        analysis.estimatedTaxSavings / 0.42; // Assuming 42% tax rate

      byCategory[analysis.category].count++;
      byCategory[analysis.category].totalAmount += deductibleAmount / (analysis.deductiblePercentage / 100);
      byCategory[analysis.category].deductibleAmount += deductibleAmount;

      totalExpenses += deductibleAmount / (analysis.deductiblePercentage / 100);
      totalDeductible += deductibleAmount;
      estimatedTaxSavings += analysis.estimatedTaxSavings;
    }

    return {
      totalExpenses,
      totalDeductible,
      estimatedTaxSavings,
      byCategory,
    };
  }
}
