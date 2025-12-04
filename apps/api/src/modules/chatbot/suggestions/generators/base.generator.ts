/**
 * Base Suggestion Generator
 * Abstract base class for all suggestion generators
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import {
  Suggestion,
  GeneratorResult,
  SuggestionContext,
} from '../suggestion.types';

export interface SuggestionGenerator {
  /**
   * Generate suggestions for the given context
   */
  generate(context: SuggestionContext): Promise<GeneratorResult>;

  /**
   * Get the name of this generator (for logging)
   */
  getName(): string;
}

@Injectable()
export abstract class BaseSuggestionGenerator implements SuggestionGenerator {
  protected readonly logger: Logger;

  constructor(
    protected readonly prisma: PrismaService,
  ) {
    this.logger = new Logger(this.constructor.name);
  }

  /**
   * Generate suggestions (to be implemented by subclasses)
   */
  abstract generate(context: SuggestionContext): Promise<GeneratorResult>;

  /**
   * Get generator name
   */
  getName(): string {
    return this.constructor.name;
  }

  /**
   * Create a suggestion ID
   */
  protected createSuggestionId(type: string, ...parts: string[]): string {
    return `sug_${type}_${parts.join('_')}_${Date.now()}`;
  }

  /**
   * Calculate days between dates
   */
  protected getDaysBetween(date1: Date, date2: Date): number {
    const diffTime = Math.abs(date2.getTime() - date1.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Format currency
   */
  protected formatCurrency(amount: number, currency: string = 'EUR'): string {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency,
    }).format(amount);
  }

  /**
   * Calculate percentage change
   */
  protected calculatePercentageChange(
    current: number,
    previous: number,
  ): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  }

  /**
   * Empty result helper
   */
  protected emptyResult(): GeneratorResult {
    return {
      suggestions: [],
      insights: [],
      reminders: [],
      optimizations: [],
    };
  }
}
