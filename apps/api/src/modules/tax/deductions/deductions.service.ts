import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  DeductionEngine,
  createDeductionEngine,
  ClassifiedTransaction,
  DeductionSuggestion as AISuggestion,
} from '@operate/ai';
import {
  GenerateSuggestionsDto,
  SuggestionFiltersDto,
  DeductionSuggestionDto,
  DeductionSuggestionStatus,
} from './dto/deduction-suggestion.dto';
import { ConfirmDeductionDto, RejectDeductionDto, ModifyDeductionDto } from './dto/confirm-deduction.dto';
import { DeductionSummaryDto, DeductionCategorySummaryDto, DeductionListResponseDto } from './dto/deduction-summary.dto';
import { Prisma } from '@prisma/client';

/**
 * Deductions Service
 * Manages tax deduction suggestions and confirmations
 */
@Injectable()
export class DeductionsService {
  private deductionEngine: DeductionEngine;

  constructor(private prisma: PrismaService) {
    this.deductionEngine = createDeductionEngine();
  }

  /**
   * Generate deduction suggestions for transactions
   */
  async generateSuggestions(
    orgId: string,
    dto: GenerateSuggestionsDto,
  ): Promise<DeductionSuggestionDto[]> {
    const { countryCode, taxYear, minConfidence = 0.5, transactionIds } = dto;

    // Build transaction query
    const where: Prisma.TransactionWhereInput = {
      orgId,
      category: { not: null }, // Only classified transactions
    };

    if (transactionIds && transactionIds.length > 0) {
      where.id = { in: transactionIds };
    }

    if (taxYear) {
      const startDate = new Date(taxYear, 0, 1);
      const endDate = new Date(taxYear, 11, 31);
      where.date = {
        gte: startDate,
        lte: endDate,
      };
    }

    // Get classified transactions
    const transactions = await this.prisma.transaction.findMany({
      where,
    });

    if (transactions.length === 0) {
      return [];
    }

    // Convert to AI format
    const classifiedTransactions: ClassifiedTransaction[] = transactions.map((t) => ({
      id: t.id,
      amount: parseFloat(t.amount.toString()),
      currency: t.currency,
      description: t.description,
      date: t.date,
      category: t.category!,
      confidence: t.categoryConfidence ? parseFloat(t.categoryConfidence.toString()) : 0.5,
      metadata: t.metadata as Record<string, any> | undefined,
    }));

    // Generate suggestions
    const aiSuggestions = await this.deductionEngine.generateSuggestions(
      classifiedTransactions,
      {
        countryCode,
        taxYear,
        minConfidence,
      },
    );

    // Save to database
    const savedSuggestions: DeductionSuggestionDto[] = [];

    for (const aiSuggestion of aiSuggestions) {
      // Check if suggestion already exists
      const existing = await this.prisma.deductionSuggestion.findFirst({
        where: {
          transactionId: aiSuggestion.transactionId,
          ruleId: aiSuggestion.ruleId,
          status: { in: ['SUGGESTED', 'MODIFIED'] },
        },
      });

      if (existing) {
        // Update existing suggestion
        const updated = await this.prisma.deductionSuggestion.update({
          where: { id: existing.id },
          data: {
            deductibleAmount: aiSuggestion.deductibleAmount,
            confidence: aiSuggestion.confidence,
            reasoning: aiSuggestion.reasoning,
            requirements: aiSuggestion.requirements as unknown as Prisma.InputJsonValue,
          },
        });
        savedSuggestions.push(this.mapToDto(updated));
      } else {
        // Create new suggestion
        const created = await this.prisma.deductionSuggestion.create({
          data: {
            orgId,
            transactionId: aiSuggestion.transactionId,
            ruleId: aiSuggestion.ruleId,
            categoryCode: aiSuggestion.categoryCode,
            categoryName: aiSuggestion.categoryName,
            originalAmount: aiSuggestion.originalAmount,
            deductibleAmount: aiSuggestion.deductibleAmount,
            deductiblePercentage: aiSuggestion.deductiblePercentage,
            currency: aiSuggestion.currency,
            legalReference: aiSuggestion.legalReference,
            legalDescription: aiSuggestion.legalDescription,
            status: 'SUGGESTED',
            requirements: aiSuggestion.requirements as unknown as Prisma.InputJsonValue,
            confidence: aiSuggestion.confidence,
            reasoning: aiSuggestion.reasoning,
          },
        });
        savedSuggestions.push(this.mapToDto(created));
      }
    }

    return savedSuggestions;
  }

  /**
   * Get deduction suggestions with filters
   */
  async getSuggestions(
    orgId: string,
    filters: SuggestionFiltersDto,
  ): Promise<DeductionListResponseDto> {
    const { status, categoryCode, taxYear, page = 1, pageSize = 20 } = filters;

    const where: Prisma.DeductionSuggestionWhereInput = { orgId };

    if (status) {
      where.status = status;
    }

    if (categoryCode) {
      where.categoryCode = categoryCode;
    }

    if (taxYear) {
      const startDate = new Date(taxYear, 0, 1);
      const endDate = new Date(taxYear, 11, 31);
      where.transaction = {
        date: {
          gte: startDate,
          lte: endDate,
        },
      };
    }

    const skip = (page - 1) * pageSize;

    const [suggestions, total] = await Promise.all([
      this.prisma.deductionSuggestion.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.deductionSuggestion.count({ where }),
    ]);

    return {
      data: suggestions.map((s) => this.mapToDto(s)),
      meta: {
        total,
        page,
        pageSize,
      },
    };
  }

  /**
   * Confirm a deduction suggestion
   */
  async confirmSuggestion(
    orgId: string,
    suggestionId: string,
    userId: string,
    dto?: ConfirmDeductionDto,
  ): Promise<DeductionSuggestionDto> {
    const suggestion = await this.prisma.deductionSuggestion.findFirst({
      where: { id: suggestionId, orgId },
    });

    if (!suggestion) {
      throw new NotFoundException('Suggestion not found');
    }

    if (suggestion.status === 'CONFIRMED') {
      throw new BadRequestException('Suggestion already confirmed');
    }

    const updateData: Prisma.DeductionSuggestionUpdateInput = {
      status: 'CONFIRMED',
      confirmedAt: new Date(),
      confirmer: { connect: { id: userId } },
    };

    // If amount modified
    if (dto?.deductibleAmount !== undefined) {
      updateData.deductibleAmount = dto.deductibleAmount;
      updateData.status = 'MODIFIED';
      updateData.modifiedAt = new Date();
      updateData.modifier = { connect: { id: userId } };
    }

    const updated = await this.prisma.deductionSuggestion.update({
      where: { id: suggestionId },
      data: updateData,
    });

    return this.mapToDto(updated);
  }

  /**
   * Reject a deduction suggestion
   */
  async rejectSuggestion(
    orgId: string,
    suggestionId: string,
    userId: string,
    dto: RejectDeductionDto,
  ): Promise<DeductionSuggestionDto> {
    const suggestion = await this.prisma.deductionSuggestion.findFirst({
      where: { id: suggestionId, orgId },
    });

    if (!suggestion) {
      throw new NotFoundException('Suggestion not found');
    }

    const updated = await this.prisma.deductionSuggestion.update({
      where: { id: suggestionId },
      data: {
        status: 'REJECTED',
        rejectedAt: new Date(),
        rejecter: { connect: { id: userId } },
        rejectionReason: dto.reason,
      },
    });

    return this.mapToDto(updated);
  }

  /**
   * Modify a deduction suggestion
   */
  async modifySuggestion(
    orgId: string,
    suggestionId: string,
    userId: string,
    dto: ModifyDeductionDto,
  ): Promise<DeductionSuggestionDto> {
    const suggestion = await this.prisma.deductionSuggestion.findFirst({
      where: { id: suggestionId, orgId },
    });

    if (!suggestion) {
      throw new NotFoundException('Suggestion not found');
    }

    const updateData: Prisma.DeductionSuggestionUpdateInput = {
      status: 'MODIFIED',
      modifiedAt: new Date(),
      modifier: { connect: { id: userId } },
    };

    if (dto.deductibleAmount !== undefined) {
      updateData.deductibleAmount = dto.deductibleAmount;
    }

    if (dto.categoryCode) {
      updateData.categoryCode = dto.categoryCode;
    }

    const updated = await this.prisma.deductionSuggestion.update({
      where: { id: suggestionId },
      data: updateData,
    });

    return this.mapToDto(updated);
  }

  /**
   * Get annual deduction summary
   */
  async getAnnualSummary(
    orgId: string,
    year: number,
    countryCode: string = 'DE',
  ): Promise<DeductionSummaryDto> {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);

    const suggestions = await this.prisma.deductionSuggestion.findMany({
      where: {
        orgId,
        transaction: {
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
      },
      include: {
        transaction: true,
      },
    });

    // Group by category
    const categoryMap = new Map<string, any[]>();
    for (const suggestion of suggestions) {
      const code = suggestion.categoryCode;
      if (!categoryMap.has(code)) {
        categoryMap.set(code, []);
      }
      categoryMap.get(code)!.push(suggestion);
    }

    // Build category summaries
    const categories: DeductionCategorySummaryDto[] = [];
    for (const [code, categorySuggestions] of categoryMap.entries()) {
      const first = categorySuggestions[0];
      categories.push({
        categoryCode: code,
        categoryName: first.categoryName,
        legalReference: first.legalReference,
        count: categorySuggestions.length,
        totalOriginalAmount: categorySuggestions.reduce(
          (sum, s) => sum + parseFloat(s.originalAmount.toString()),
          0,
        ),
        totalDeductibleAmount: categorySuggestions.reduce(
          (sum, s) => sum + parseFloat(s.deductibleAmount.toString()),
          0,
        ),
        suggestions: categorySuggestions.map((s) => this.mapToDto(s)),
      });
    }

    // Calculate totals
    const totalOriginalAmount = suggestions.reduce(
      (sum, s) => sum + parseFloat(s.originalAmount.toString()),
      0,
    );
    const totalDeductibleAmount = suggestions.reduce(
      (sum, s) => sum + parseFloat(s.deductibleAmount.toString()),
      0,
    );

    const currency = suggestions[0]?.currency || 'EUR';

    return {
      year,
      countryCode,
      currency,
      totalOriginalAmount,
      totalDeductibleAmount,
      suggestedCount: suggestions.filter((s) => s.status === 'SUGGESTED').length,
      confirmedCount: suggestions.filter((s) => s.status === 'CONFIRMED' || s.status === 'MODIFIED').length,
      rejectedCount: suggestions.filter((s) => s.status === 'REJECTED').length,
      categories,
    };
  }

  /**
   * Map database model to DTO
   */
  private mapToDto(suggestion: any): DeductionSuggestionDto {
    return {
      id: suggestion.id,
      transactionId: suggestion.transactionId,
      orgId: suggestion.orgId,
      ruleId: suggestion.ruleId,
      categoryCode: suggestion.categoryCode,
      categoryName: suggestion.categoryName,
      originalAmount: parseFloat(suggestion.originalAmount.toString()),
      deductibleAmount: parseFloat(suggestion.deductibleAmount.toString()),
      deductiblePercentage: suggestion.deductiblePercentage,
      currency: suggestion.currency,
      legalReference: suggestion.legalReference,
      legalDescription: suggestion.legalDescription,
      status: suggestion.status as DeductionSuggestionStatus,
      requirements: suggestion.requirements as unknown as Prisma.InputJsonValue,
      confidence: parseFloat(suggestion.confidence.toString()),
      reasoning: suggestion.reasoning,
      createdAt: suggestion.createdAt,
      confirmedAt: suggestion.confirmedAt,
      confirmedBy: suggestion.confirmedBy,
      rejectedAt: suggestion.rejectedAt,
      rejectedBy: suggestion.rejectedBy,
      rejectionReason: suggestion.rejectionReason,
      modifiedAt: suggestion.modifiedAt,
      modifiedBy: suggestion.modifiedBy,
    };
  }
}
