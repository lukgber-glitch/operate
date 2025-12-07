/**
 * Classification Prompts for Enhanced Transaction Classifier
 * German tax-aware transaction classification
 */

import { TransactionForClassification } from '../types/tax-categories.types';

export const CLASSIFICATION_SYSTEM_PROMPT = `You are an expert German tax accountant and transaction classifier specializing in EÜR (Einnahmen-Überschuss-Rechnung) for small businesses and freelancers.

Your task is to classify bank transactions into German tax categories according to the EÜR form (Anlage EÜR).

## Key Principles

1. **German Tax Law**: Follow German tax regulations (EStG, UStG)
2. **EÜR Categories**: Map to correct EÜR form lines (12-32 for expenses, line 11 for income)
3. **Deductibility**: Consider deduction percentages (e.g., Bewirtung = 70%)
4. **VAT Awareness**: Identify VAT rates (7%, 19%, or exempt)
5. **Documentation**: Flag transactions requiring special documentation

## Tax Categories (TaxCategory enum)

### EXPENSES:
- WAREN_MATERIAL (Line 12): Raw materials, goods
- FREMDLEISTUNGEN (Line 13): External services, contractors
- PERSONAL (Line 14): Wages, salaries
- MIETE_PACHT (Line 18): Rent, lease
- SONSTIGE_KOSTEN (Line 20): Other business expenses
- ABSCHREIBUNGEN (Line 22): Depreciation
- KFZKOSTEN (Line 24): Vehicle costs (fuel, parking, repairs)
- REISEKOSTEN (Line 25): Travel costs (hotels, transport)
- BEWIRTUNG (Line 26): Business meals - 70% deductible
- TELEFON_INTERNET (Line 27): Phone, internet, postage
- BUEROKOSTEN (Line 28): Office supplies, books
- VERSICHERUNGEN (Line 29): Business insurance
- WERBUNG (Line 30): Advertising, marketing
- RECHTSBERATUNG (Line 31): Legal, tax advisory
- ZINSEN (Line 32): Interest on business loans

### INCOME:
- EINNAHMEN_19: Income with 19% VAT (standard rate)
- EINNAHMEN_7: Income with 7% VAT (reduced rate)
- EINNAHMEN_STEUERFREI: Tax-exempt income
- EINNAHMEN_KLEINUNTERNEHMER: Small business (§19 UStG) - no VAT

### SPECIAL:
- PRIVATE_ENTNAHME: Private withdrawal (not deductible)
- PRIVATE_EINLAGE: Private deposit (not taxable)
- KEINE_STEUERRELEVANZ: No tax relevance (e.g., account transfers)

## Special Rules

### Bewirtung (Business Meals):
- Only 70% deductible
- Requires: guest names, business purpose, receipt
- Must be primarily business-related

### Telefon/Internet:
- Often mixed use (business + private)
- Typically 50% business if no detailed usage log
- 100% if dedicated business line

### Kfz-Kosten:
- Requires Fahrtenbuch (mileage log) or 1% rule
- Fuel, repairs, insurance, tax
- Exclude: purchase price (that's AfA)

### Reisekosten:
- Business purpose required
- Verpflegungspauschale (meal allowances) apply
- Overnight stays: invoice required

## VAT (Umsatzsteuer):
- Standard rate: 19%
- Reduced rate: 7% (books, food, some services)
- Vorsteuer (input VAT) is reclaimable if you're VAT-registered

## Response Format

Return JSON with this structure:
{
  "category": "string (human-readable category)",
  "subcategory": "string (optional)",
  "confidence": number (0.0-1.0),
  "tax": {
    "deductible": boolean,
    "deductionPercentage": number (0-100),
    "deductibleAmount": number (in cents),
    "vatReclaimable": boolean,
    "vatAmount": number (in cents, if identifiable),
    "vatRate": number (0, 7, or 19),
    "taxCategory": "TaxCategory enum value",
    "eurLineNumber": number (EÜR form line),
    "eurDescription": "string (German description)"
  },
  "business": {
    "isBusinessExpense": boolean,
    "businessPercentage": number (0-100),
    "requiresDocumentation": boolean,
    "documentationType": "RECEIPT" | "INVOICE" | "CONTRACT" | "PROOF_OF_PAYMENT",
    "specialRequirements": ["string"] (optional)
  },
  "pattern": {
    "isRecurring": boolean,
    "frequency": "MONTHLY" | "YEARLY" | etc. (optional),
    "vendor": "string (recognized vendor)",
    "vendorNormalized": "string",
    "vendorCategory": "string"
  },
  "reasoning": "string (explain your classification)",
  "flags": {
    "needsReview": boolean,
    "unusualAmount": boolean,
    "newVendor": boolean,
    "requiresSplit": boolean,
    "possiblyPrivate": boolean
  },
  "suggestedActions": ["string"],
  "alternativeCategories": [
    {
      "category": "string",
      "taxCategory": "TaxCategory",
      "confidence": number
    }
  ]
}

## Common Vendors

### Cloud/Software:
- AWS, Google Cloud, Azure → FREMDLEISTUNGEN
- Adobe, Microsoft 365, Slack → SONSTIGE_KOSTEN
- GitHub, Notion, Figma → SONSTIGE_KOSTEN

### Communications:
- Telekom, Vodafone, O2 → TELEFON_INTERNET (often 50% business)

### Accounting:
- LexOffice, SevDesk, DATEV → RECHTSBERATUNG

### Transportation:
- Shell, Aral (fuel) → KFZKOSTEN
- Deutsche Bahn, Uber → REISEKOSTEN
- Booking.com, Airbnb → REISEKOSTEN

### Office:
- Amazon (check context) → BUEROKOSTEN or private
- Staples → BUEROKOSTEN

Be conservative: When in doubt, flag for review rather than misclassify.`;

/**
 * Build user prompt for transaction classification
 */
export function buildClassificationPrompt(
  transaction: TransactionForClassification,
): string {
  const parts: string[] = [
    '## Transaction to Classify',
    '',
    `**Description**: ${transaction.description}`,
    `**Amount**: ${transaction.amount} cents (${(transaction.amount / 100).toFixed(2)} EUR)`,
    `**Type**: ${transaction.type}`,
  ];

  if (transaction.counterparty) {
    parts.push(`**Counterparty**: ${transaction.counterparty}`);
  }

  if (transaction.date) {
    parts.push(`**Date**: ${transaction.date.toISOString().split('T')[0]}`);
  }

  if (transaction.category) {
    parts.push(`**Previous Category**: ${transaction.category}`);
  }

  if (transaction.mccCode) {
    parts.push(`**MCC Code**: ${transaction.mccCode}`);
  }

  parts.push('', '## Instructions');
  parts.push('');
  parts.push(
    'Classify this transaction according to German EÜR tax categories.',
  );
  parts.push('Consider:');
  parts.push('1. Is it a business expense or income?');
  parts.push('2. Which EÜR line does it belong to?');
  parts.push('3. What percentage is deductible?');
  parts.push('4. Is VAT reclaimable?');
  parts.push('5. What documentation is required?');
  parts.push('6. Is it recurring?');
  parts.push('');
  parts.push(
    'Be specific in your reasoning. If uncertain, flag for review.',
  );

  return parts.join('\n');
}

/**
 * Build batch classification prompt
 */
export function buildBatchClassificationPrompt(
  transactions: TransactionForClassification[],
): string {
  const parts: string[] = [
    '## Batch Transaction Classification',
    '',
    `Classify the following ${transactions.length} transactions:`,
    '',
  ];

  transactions.forEach((tx, idx) => {
    parts.push(`### Transaction ${idx + 1}`);
    parts.push(`- Description: ${tx.description}`);
    parts.push(`- Amount: ${(tx.amount / 100).toFixed(2)} EUR`);
    parts.push(`- Type: ${tx.type}`);
    if (tx.counterparty) parts.push(`- Counterparty: ${tx.counterparty}`);
    parts.push('');
  });

  parts.push('## Instructions');
  parts.push('');
  parts.push('Return an array of classification results, one per transaction.');
  parts.push('Maintain the same order as the input.');
  parts.push(
    'Look for patterns across transactions (recurring vendors, similar categories).',
  );

  return parts.join('\n');
}

/**
 * Build category suggestion prompt
 */
export function buildCategorySuggestionPrompt(
  category: string,
  description: string,
): string {
  return `Given a transaction category "${category}" and description "${description}", suggest the most appropriate German EÜR tax category (TaxCategory enum).

Consider:
- What type of expense/income is this?
- Which EÜR form line does it map to?
- Is it fully or partially deductible?

Return just the TaxCategory enum value (e.g., "FREMDLEISTUNGEN", "BUEROKOSTEN", etc.)`;
}

/**
 * Validation prompt for uncertain classifications
 */
export function buildValidationPrompt(
  transaction: TransactionForClassification,
  suggestedCategory: string,
): string {
  return `Review this classification:

Transaction: ${transaction.description}
Amount: ${(transaction.amount / 100).toFixed(2)} EUR
Suggested Category: ${suggestedCategory}

Questions:
1. Is this the most accurate German tax category?
2. Should it be flagged for manual review?
3. Are there alternative categories to consider?
4. Is the business/private split correct?

Provide validation feedback.`;
}
