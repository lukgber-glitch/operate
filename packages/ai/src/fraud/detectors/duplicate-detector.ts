/**
 * Duplicate Transaction Detector
 *
 * Identifies exact and near-duplicate transactions to prevent
 * double-claiming deductions.
 */

import { DuplicateCheck, Transaction } from '../types';

export class DuplicateDetector {
  /**
   * Check if a transaction is a duplicate of any in the history
   */
  public detectDuplicates(
    transaction: Transaction,
    history: Transaction[],
  ): DuplicateCheck {
    let bestMatch: DuplicateCheck | null = null;
    let highestScore = 0;

    // Check against each historical transaction
    for (const historical of history) {
      // Skip self-comparison
      if (historical.id === transaction.id) {
        continue;
      }

      const check = this.compareTransactions(transaction, historical);

      if (check.duplicateScore > highestScore) {
        highestScore = check.duplicateScore;
        bestMatch = {
          ...check,
          matchedTransactionId: historical.id,
        };
      }
    }

    // If no matches found, return clean result
    if (!bestMatch) {
      return {
        sameAmount: false,
        sameDate: false,
        sameDescription: false,
        sameCounterparty: false,
        similarAmount: false,
        proximateDate: false,
        similarDescription: false,
        duplicateScore: 0,
        isDuplicate: false,
      };
    }

    return bestMatch;
  }

  /**
   * Compare two transactions for duplicate indicators
   */
  private compareTransactions(
    t1: Transaction,
    t2: Transaction,
  ): DuplicateCheck {
    // Exact matches
    const sameAmount = t1.amount === t2.amount;
    const sameDate = this.isSameDate(t1.date, t2.date);
    const sameDescription = this.normalizeText(t1.description) ===
      this.normalizeText(t2.description);
    const sameCounterparty = t1.counterparty && t2.counterparty
      ? this.normalizeText(t1.counterparty) === this.normalizeText(t2.counterparty)
      : false;

    // Near matches
    const similarAmount = this.isSimilarAmount(t1.amount, t2.amount);
    const proximateDate = this.isProximateDate(t1.date, t2.date);
    const similarDescription = this.isSimilarText(
      t1.description,
      t2.description,
    );

    // Calculate duplicate score
    const duplicateScore = this.calculateDuplicateScore({
      sameAmount,
      sameDate,
      sameDescription,
      sameCounterparty,
      similarAmount,
      proximateDate,
      similarDescription,
    });

    const isDuplicate = duplicateScore >= 0.6; // Conservative threshold

    return {
      sameAmount,
      sameDate,
      sameDescription,
      sameCounterparty,
      similarAmount,
      proximateDate,
      similarDescription,
      duplicateScore,
      isDuplicate,
    };
  }

  /**
   * Calculate duplicate score (0-1)
   */
  private calculateDuplicateScore(checks: {
    sameAmount: boolean;
    sameDate: boolean;
    sameDescription: boolean;
    sameCounterparty: boolean;
    similarAmount: boolean;
    proximateDate: boolean;
    similarDescription: boolean;
  }): number {
    let score = 0;

    // Exact matches (weighted heavily)
    if (checks.sameAmount) score += 0.3;
    if (checks.sameDate) score += 0.25;
    if (checks.sameDescription) score += 0.25;
    if (checks.sameCounterparty) score += 0.2;

    // Near matches (weighted lightly)
    if (!checks.sameAmount && checks.similarAmount) score += 0.15;
    if (!checks.sameDate && checks.proximateDate) score += 0.1;
    if (!checks.sameDescription && checks.similarDescription) score += 0.1;

    return Math.min(score, 1.0);
  }

  /**
   * Check if two dates are the same day
   */
  private isSameDate(date1: Date, date2: Date): boolean {
    const d1 = new Date(date1);
    const d2 = new Date(date2);

    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  }

  /**
   * Check if two dates are within 7 days
   */
  private isProximateDate(date1: Date, date2: Date): boolean {
    const d1 = new Date(date1).getTime();
    const d2 = new Date(date2).getTime();
    const diffDays = Math.abs(d1 - d2) / (1000 * 60 * 60 * 24);

    return diffDays <= 7;
  }

  /**
   * Check if two amounts are within 5%
   */
  private isSimilarAmount(amount1: number, amount2: number): boolean {
    const diff = Math.abs(amount1 - amount2);
    const avg = (amount1 + amount2) / 2;
    const percentDiff = diff / avg;

    return percentDiff <= 0.05;
  }

  /**
   * Normalize text for comparison
   */
  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s]/g, '');
  }

  /**
   * Check if two texts are similar using Levenshtein distance
   */
  private isSimilarText(text1: string, text2: string): boolean {
    const normalized1 = this.normalizeText(text1);
    const normalized2 = this.normalizeText(text2);

    const distance = this.levenshteinDistance(normalized1, normalized2);

    // Similar if distance is small relative to string length
    const maxLength = Math.max(normalized1.length, normalized2.length);
    const similarity = 1 - distance / maxLength;

    return similarity >= 0.8; // 80% similar
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const len1 = str1.length;
    const len2 = str2.length;

    // Create 2D array
    const matrix: number[][] = Array.from({ length: len1 + 1 }, () =>
      Array(len2 + 1).fill(0),
    );

    // Initialize first row and column
    for (let i = 0; i <= len1; i++) {
      const row = matrix[i];
      if (row) row[0] = i;
    }
    for (let j = 0; j <= len2; j++) {
      const firstRow = matrix[0];
      if (firstRow) firstRow[j] = j;
    }

    // Fill matrix
    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;

        const prevRow = matrix[i - 1];
        const currRow = matrix[i];

        if (!prevRow || !currRow) {
          throw new Error('Matrix row is undefined');
        }

        const deletion = prevRow[j];
        const insertion = currRow[j - 1];
        const substitution = prevRow[j - 1];

        if (deletion === undefined || insertion === undefined || substitution === undefined) {
          throw new Error('Matrix cell is undefined');
        }

        currRow[j] = Math.min(
          deletion + 1, // deletion
          insertion + 1, // insertion
          substitution + cost, // substitution
        );
      }
    }

    const result = matrix[len1]?.[len2];
    if (result === undefined) {
      throw new Error('Final matrix result is undefined');
    }

    return result;
  }

  /**
   * Get explanation for duplicate check result
   */
  public getExplanation(check: DuplicateCheck): string {
    const reasons: string[] = [];

    if (check.sameAmount) reasons.push('identical amount');
    if (check.sameDate) reasons.push('same date');
    if (check.sameDescription) reasons.push('identical description');
    if (check.sameCounterparty) reasons.push('same counterparty');

    if (check.similarAmount && !check.sameAmount) {
      reasons.push('similar amount (within 5%)');
    }
    if (check.proximateDate && !check.sameDate) {
      reasons.push('nearby date (within 7 days)');
    }
    if (check.similarDescription && !check.sameDescription) {
      reasons.push('similar description');
    }

    if (reasons.length === 0) {
      return 'No duplicate indicators found';
    }

    return `Duplicate indicators: ${reasons.join(', ')}. Score: ${(check.duplicateScore * 100).toFixed(0)}%`;
  }
}
