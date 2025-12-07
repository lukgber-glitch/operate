/**
 * Vendor matcher utility for fuzzy vendor name matching
 * Handles variations like "AWS" vs "Amazon Web Services"
 * Extends the name-matcher logic with vendor-specific patterns
 */

/**
 * Common vendor name variations and aliases
 * Map canonical names to common variations
 */
const VENDOR_ALIASES: Record<string, string[]> = {
  'amazon web services': ['aws', 'amazon', 'amzn'],
  'google cloud': ['google', 'gcp', 'google cloud platform'],
  'microsoft': ['msft', 'microsoft corp', 'microsoft corporation', 'ms'],
  'digitalocean': ['digital ocean', 'do'],
  'github': ['github inc', 'gh'],
  'stripe': ['stripe inc', 'stripe payments'],
  'paypal': ['paypal inc', 'paypal holdings'],
  'atlassian': ['jira', 'confluence', 'bitbucket'],
  'salesforce': ['salesforce com', 'sfdc'],
  'adobe': ['adobe inc', 'adobe systems'],
  'oracle': ['oracle corp', 'oracle corporation'],
  'sap': ['sap se', 'sap ag'],
  'ibm': ['international business machines', 'ibm corp'],
  'slack': ['slack technologies'],
  'zoom': ['zoom video', 'zoom communications'],
  'dropbox': ['dropbox inc'],
  'mailchimp': ['mailchimp marketing', 'intuit mailchimp'],
  'quickbooks': ['qb', 'intuit quickbooks'],
  'xero': ['xero limited'],
  'freshbooks': ['freshbooks inc'],
};

/**
 * Normalize a vendor name for comparison
 */
function normalizeVendorName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\b(gmbh|ag|ltd|limited|inc|corp|corporation|llc|bv|sa|srl|se|plc|kg|ug|ohg|gbr|ev)\b/gi, '')
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
 * Check if one vendor name is an alias of another
 */
function checkVendorAlias(name1: string, name2: string): boolean {
  const normalized1 = normalizeVendorName(name1);
  const normalized2 = normalizeVendorName(name2);

  // Check if they're the same after normalization
  if (normalized1 === normalized2) return true;

  // Check against known aliases
  for (const [canonical, aliases] of Object.entries(VENDOR_ALIASES)) {
    const allVariants = [canonical, ...aliases].map(normalizeVendorName);

    const has1 = allVariants.includes(normalized1);
    const has2 = allVariants.includes(normalized2);

    if (has1 && has2) {
      return true;
    }
  }

  return false;
}

/**
 * Vendor matching result
 */
export interface VendorMatchResult {
  matches: boolean;
  similarity: number; // 0-1
  confidence: number; // 0-100
  reason: string;
  matchType: 'EXACT' | 'ALIAS' | 'FUZZY' | 'PARTIAL' | 'NO_MATCH';
}

/**
 * Vendor matcher class
 */
export class VendorMatcher {
  private threshold: number;

  constructor(threshold: number = 0.8) {
    this.threshold = threshold;
  }

  /**
   * Match two vendor names with fuzzy logic and alias detection
   */
  matchVendors(paymentVendor: string, billVendor: string): VendorMatchResult {
    if (!paymentVendor || !billVendor) {
      return {
        matches: false,
        similarity: 0,
        confidence: 0,
        reason: 'Missing vendor information',
        matchType: 'NO_MATCH',
      };
    }

    const normalized1 = normalizeVendorName(paymentVendor);
    const normalized2 = normalizeVendorName(billVendor);

    // Exact match after normalization
    if (normalized1 === normalized2) {
      return {
        matches: true,
        similarity: 1,
        confidence: 100,
        reason: 'Exact vendor match',
        matchType: 'EXACT',
      };
    }

    // Check for known aliases (AWS vs Amazon Web Services)
    if (checkVendorAlias(paymentVendor, billVendor)) {
      return {
        matches: true,
        similarity: 1,
        confidence: 100,
        reason: 'Vendor alias match (known variation)',
        matchType: 'ALIAS',
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
        reason: `Fuzzy vendor match (${Math.round(similarity * 100)}% similar)`,
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
        reason: 'Partial vendor match (one contains the other)',
        matchType: 'PARTIAL',
      };
    }

    // Check for common words (for multi-word vendors)
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

    // Check for acronym match (e.g., AWS vs Amazon Web Services)
    const acronym1 = words1.map((w) => w[0]).join('');
    const acronym2 = words2.map((w) => w[0]).join('');

    if (
      (normalized1 === acronym2 || normalized2 === acronym1) &&
      acronym1.length >= 2 &&
      acronym2.length >= 2
    ) {
      return {
        matches: true,
        similarity: 0.9,
        confidence: 90,
        reason: 'Acronym match detected',
        matchType: 'ALIAS',
      };
    }

    // No match
    return {
      matches: false,
      similarity,
      confidence: Math.round(similarity * 50), // Low confidence
      reason: 'Vendor names do not match',
      matchType: 'NO_MATCH',
    };
  }

  /**
   * Match payment vendor against multiple bill vendors
   * Returns the best match
   */
  findBestVendorMatch(
    paymentVendor: string,
    billVendors: Array<{ id: string; name: string }>,
  ): { vendorId: string; result: VendorMatchResult } | null {
    let bestMatch: { vendorId: string; result: VendorMatchResult } | null = null;

    billVendors.forEach((vendor) => {
      const result = this.matchVendors(paymentVendor, vendor.name);
      if (
        result.matches &&
        (!bestMatch || result.confidence > bestMatch.result.confidence)
      ) {
        bestMatch = { vendorId: vendor.id, result };
      }
    });

    return bestMatch;
  }

  /**
   * Add a custom vendor alias mapping
   */
  static addVendorAlias(canonical: string, aliases: string[]): void {
    const normalizedCanonical = normalizeVendorName(canonical);
    if (!VENDOR_ALIASES[normalizedCanonical]) {
      VENDOR_ALIASES[normalizedCanonical] = [];
    }
    VENDOR_ALIASES[normalizedCanonical].push(...aliases.map(normalizeVendorName));
  }
}

/**
 * Singleton instance
 */
export const vendorMatcher = new VendorMatcher();
