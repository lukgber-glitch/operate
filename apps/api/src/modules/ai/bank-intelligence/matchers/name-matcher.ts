/**
 * Name matcher utility for fuzzy customer name matching
 * Handles variations like "Acme Corp" vs "ACME Corporation"
 */

/**
 * Normalize a company name for comparison
 */
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\b(gmbh|ag|ltd|limited|inc|corp|corporation|llc|bv|sa|srl)\b/gi, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length;
  const n = str2.length;
  const dp: number[][] = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]) + 1;
      }
    }
  }

  return dp[m][n];
}

/**
 * Calculate similarity ratio between two strings (0-1)
 */
function similarityRatio(str1: string, str2: string): number {
  const maxLen = Math.max(str1.length, str2.length);
  if (maxLen === 0) return 1;
  const distance = levenshteinDistance(str1, str2);
  return 1 - distance / maxLen;
}

/**
 * Name matching result
 */
export interface NameMatchResult {
  matches: boolean;
  similarity: number; // 0-1
  confidence: number; // 0-100
  reason: string;
  matchType: 'EXACT' | 'FUZZY' | 'PARTIAL' | 'NO_MATCH';
}

/**
 * Name matcher class
 */
export class NameMatcher {
  private threshold: number;

  constructor(threshold: number = 0.8) {
    this.threshold = threshold;
  }

  /**
   * Match two company names with fuzzy logic
   */
  matchNames(paymentName: string, customerName: string): NameMatchResult {
    if (!paymentName || !customerName) {
      return {
        matches: false,
        similarity: 0,
        confidence: 0,
        reason: 'Missing name information',
        matchType: 'NO_MATCH',
      };
    }

    const normalized1 = normalizeName(paymentName);
    const normalized2 = normalizeName(customerName);

    // Exact match after normalization
    if (normalized1 === normalized2) {
      return {
        matches: true,
        similarity: 1,
        confidence: 100,
        reason: 'Exact name match',
        matchType: 'EXACT',
      };
    }

    // Calculate similarity
    const similarity = similarityRatio(normalized1, normalized2);

    // High similarity (fuzzy match)
    if (similarity >= this.threshold) {
      return {
        matches: true,
        similarity,
        confidence: Math.round(similarity * 100),
        reason: `Fuzzy name match (${Math.round(similarity * 100)}% similar)`,
        matchType: 'FUZZY',
      };
    }

    // Check if one name contains the other (partial match)
    if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) {
      const partialConfidence = Math.max(50, Math.round(similarity * 100));
      return {
        matches: true,
        similarity,
        confidence: partialConfidence,
        reason: 'Partial name match (one contains the other)',
        matchType: 'PARTIAL',
      };
    }

    // Check for common words
    const words1 = normalized1.split(' ').filter((w) => w.length > 2);
    const words2 = normalized2.split(' ').filter((w) => w.length > 2);
    const commonWords = words1.filter((w) => words2.includes(w));

    if (commonWords.length >= 2) {
      const wordMatchConfidence = Math.round(
        (commonWords.length / Math.max(words1.length, words2.length)) * 80,
      );
      return {
        matches: true,
        similarity,
        confidence: wordMatchConfidence,
        reason: `Common words match (${commonWords.length} words)`,
        matchType: 'PARTIAL',
      };
    }

    // No match
    return {
      matches: false,
      similarity,
      confidence: Math.round(similarity * 50), // Low confidence
      reason: 'Names do not match',
      matchType: 'NO_MATCH',
    };
  }

  /**
   * Match payment name against multiple customer names
   */
  findBestMatch(
    paymentName: string,
    customerNames: string[],
  ): { index: number; result: NameMatchResult } | null {
    let bestMatch: { index: number; result: NameMatchResult } | null = null;

    customerNames.forEach((customerName, index) => {
      const result = this.matchNames(paymentName, customerName);
      if (
        result.matches &&
        (!bestMatch || result.confidence > bestMatch.result.confidence)
      ) {
        bestMatch = { index, result };
      }
    });

    return bestMatch;
  }
}

/**
 * Singleton instance
 */
export const nameMatcher = new NameMatcher();
