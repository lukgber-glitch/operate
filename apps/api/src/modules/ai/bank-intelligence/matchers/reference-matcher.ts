/**
 * Reference matcher utility for extracting and matching invoice references
 * Handles patterns like: #123, INV-123, RE-2024-001, Invoice 123
 */

/**
 * Reference extraction result
 */
export interface ReferenceExtractionResult {
  found: boolean;
  references: string[];
  confidence: number;
  patterns: string[];
}

/**
 * Common invoice reference patterns
 */
const REFERENCE_PATTERNS = [
  // Hash number: #123, #2024-001
  /#+\s*(\d{1,10})/gi,
  // Invoice prefix: INV-123, INVOICE-2024-001, Inv 123
  /inv(?:oice)?[\s-]*(\d{1,10}(?:[-\/]\d{1,10})*)/gi,
  // RE prefix (common in EU): RE-123, RE 2024-001
  /re[\s-]*(\d{1,10}(?:[-\/]\d{1,10})*)/gi,
  // Bill prefix: BILL-123, Bill 123
  /bill[\s-]*(\d{1,10}(?:[-\/]\d{1,10})*)/gi,
  // Rechnung (German for invoice): RG-123, Rechnung 123
  /r(?:echnung|g)[\s-]*(\d{1,10}(?:[-\/]\d{1,10})*)/gi,
  // Facture (French for invoice): FAC-123
  /fac(?:ture)?[\s-]*(\d{1,10}(?:[-\/]\d{1,10})*)/gi,
  // Pure numbers after common keywords: Invoice: 123, Reference: 2024-001
  /(?:invoice|bill|ref|reference|rechnung|facture)[\s:]*(\d{1,10}(?:[-\/]\d{1,10})*)/gi,
  // Year-based patterns: 2024-001, 2024/001
  /(20\d{2}[-\/]\d{3,6})/g,
  // Sequential numbers in specific format: 0001, 00001
  /\b(\d{4,6})\b/g,
];

/**
 * Reference matcher class
 */
export class ReferenceMatcher {
  /**
   * Extract potential invoice references from payment description
   */
  extractReferences(description: string): ReferenceExtractionResult {
    if (!description) {
      return {
        found: false,
        references: [],
        confidence: 0,
        patterns: [],
      };
    }

    const references = new Set<string>();
    const foundPatterns = new Set<string>();

    REFERENCE_PATTERNS.forEach((pattern, index) => {
      const matches = description.matchAll(pattern);
      for (const match of matches) {
        if (match[1]) {
          references.add(match[1].trim());
          foundPatterns.add(`pattern_${index}`);
        }
      }
    });

    const refsArray = Array.from(references);
    const confidence = refsArray.length > 0 ? Math.min(50 + refsArray.length * 20, 100) : 0;

    return {
      found: refsArray.length > 0,
      references: refsArray,
      confidence,
      patterns: Array.from(foundPatterns),
    };
  }

  /**
   * Check if invoice number matches extracted references
   */
  matchInvoiceNumber(invoiceNumber: string, description: string): {
    matches: boolean;
    confidence: number;
    reason: string;
  } {
    if (!invoiceNumber || !description) {
      return {
        matches: false,
        confidence: 0,
        reason: 'Missing invoice number or description',
      };
    }

    const extraction = this.extractReferences(description);

    if (!extraction.found) {
      return {
        matches: false,
        confidence: 0,
        reason: 'No invoice reference found in description',
      };
    }

    // Normalize invoice number for comparison
    const normalizedInvoice = this.normalizeReference(invoiceNumber);

    // Check each extracted reference
    for (const ref of extraction.references) {
      const normalizedRef = this.normalizeReference(ref);

      // Exact match
      if (normalizedInvoice === normalizedRef) {
        return {
          matches: true,
          confidence: 100,
          reason: `Invoice number found in description: ${ref}`,
        };
      }

      // Contains match (e.g., "INV-123" contains "123")
      if (normalizedInvoice.includes(normalizedRef) || normalizedRef.includes(normalizedInvoice)) {
        return {
          matches: true,
          confidence: 85,
          reason: `Invoice number partially matches reference: ${ref}`,
        };
      }
    }

    return {
      matches: false,
      confidence: 20,
      reason: 'Invoice number not found in extracted references',
    };
  }

  /**
   * Normalize reference for comparison (remove common prefixes, special chars)
   */
  private normalizeReference(ref: string): string {
    return ref
      .toLowerCase()
      .replace(/^(inv|invoice|re|bill|rg|rechnung|fac|facture)[-\s]*/i, '')
      .replace(/[^\d]/g, '');
  }

  /**
   * Match against multiple invoice numbers
   */
  findMatchingInvoices(
    invoiceNumbers: string[],
    description: string,
  ): {
    matches: string[];
    confidence: number;
  } {
    const matches: string[] = [];
    const extraction = this.extractReferences(description);

    if (!extraction.found) {
      return { matches: [], confidence: 0 };
    }

    invoiceNumbers.forEach((invNum) => {
      const result = this.matchInvoiceNumber(invNum, description);
      if (result.matches) {
        matches.push(invNum);
      }
    });

    const confidence = matches.length > 0 ? Math.min(80 + matches.length * 10, 100) : 0;

    return { matches, confidence };
  }

  /**
   * Extract IBAN from description (for matching counterparty)
   */
  extractIBAN(description: string): string | null {
    // IBAN pattern: 2 letters, 2 digits, up to 30 alphanumeric
    const ibanPattern = /\b([A-Z]{2}\d{2}[A-Z0-9]{1,30})\b/gi;
    const match = description.match(ibanPattern);
    return match ? match[0] : null;
  }
}

/**
 * Singleton instance
 */
export const referenceMatcher = new ReferenceMatcher();
