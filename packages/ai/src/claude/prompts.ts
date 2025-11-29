/**
 * Claude Prompt Templates
 * Structured prompts for various AI tasks
 */

export interface TransactionPromptInput {
  description: string;
  amount: number;
  currency: string;
  date: string;
  counterparty?: string;
  mccCode?: string;
}

/**
 * System prompt for transaction classification
 */
export const TRANSACTION_CLASSIFICATION_SYSTEM = `You are a financial transaction classifier for businesses operating in German-speaking regions (Germany, Austria, Switzerland).

Your task is to analyze bank transactions and classify them into appropriate business categories for tax and accounting purposes.

You have deep knowledge of:
- DACH region business expense categories
- Tax deduction rules in Germany, Austria, and Switzerland
- Merchant Category Codes (MCC)
- Common business expenses and their proper classification

Always respond with valid JSON only. Do not include any explanatory text outside the JSON structure.`;

/**
 * Generate transaction classification prompt
 */
export function buildTransactionClassificationPrompt(
  input: TransactionPromptInput,
): string {
  const parts = [
    'Analyze this bank transaction and classify it:',
    '',
    '**Transaction Details:**',
    `- Description: ${input.description}`,
    `- Amount: ${input.amount} ${input.currency}`,
    `- Date: ${input.date}`,
  ];

  if (input.counterparty) {
    parts.push(`- Counterparty: ${input.counterparty}`);
  }

  if (input.mccCode) {
    parts.push(`- MCC Code: ${input.mccCode}`);
  }

  parts.push('');
  parts.push('**Available Categories:**');
  parts.push('- office_supplies: Office equipment, stationery, supplies');
  parts.push('- travel_business: Business travel, transportation, accommodation');
  parts.push('- meals_business: Business meals, restaurants, catering');
  parts.push('- software_subscriptions: Software licenses, SaaS, cloud services');
  parts.push('- professional_services: Legal, accounting, consulting services');
  parts.push('- marketing: Advertising, marketing campaigns, PR');
  parts.push('- utilities: Electricity, water, internet, phone');
  parts.push('- rent: Office rent, coworking space');
  parts.push('- equipment: Machinery, tools, IT equipment');
  parts.push('- insurance_business: Business insurance');
  parts.push('- vehicle_business: Vehicle expenses, fuel, maintenance');
  parts.push('- personal: Personal expenses (not business-related)');
  parts.push('- revenue_sales: Income from product sales');
  parts.push('- revenue_services: Income from services');
  parts.push('- tax_payment: Tax payments to authorities');
  parts.push('- tax_refund: Tax refunds from authorities');
  parts.push('- transfer_internal: Internal transfers between own accounts');
  parts.push('- unknown: Cannot determine category');
  parts.push('');
  parts.push('**Required JSON Response Format:**');
  parts.push('{');
  parts.push('  "category": "one of the categories above",');
  parts.push('  "confidence": 0.95, // 0.0 to 1.0');
  parts.push('  "reasoning": "Brief explanation of why this category was chosen",');
  parts.push('  "taxRelevant": true, // Is this transaction tax-relevant?');
  parts.push('  "suggestedDeductionCategory": "travel_expenses", // Optional: specific tax deduction category');
  parts.push('  "flags": ["needs_receipt", "split_required"] // Optional flags');
  parts.push('}');
  parts.push('');
  parts.push('**Confidence Guidelines:**');
  parts.push('- 0.9-1.0: Clear category, known merchant, MCC code matches');
  parts.push('- 0.7-0.89: Good match but some ambiguity');
  parts.push('- 0.5-0.69: Partial match, multiple interpretations possible');
  parts.push('- 0.0-0.49: Unclear, insufficient information');
  parts.push('');
  parts.push('**Flags (optional array):**');
  parts.push('- "needs_receipt": Receipt documentation required');
  parts.push('- "split_required": Transaction may need to be split (e.g., business + personal)');
  parts.push('- "high_value": High-value transaction needing extra review');
  parts.push('- "recurring": Appears to be a recurring transaction');
  parts.push('- "foreign_currency": Foreign currency transaction');
  parts.push('');
  parts.push('Respond with ONLY the JSON object, no additional text.');

  return parts.join('\n');
}

/**
 * Generate batch classification prompt
 */
export function buildBatchClassificationPrompt(
  transactions: TransactionPromptInput[],
): string {
  const parts = [
    'Analyze these bank transactions and classify each one:',
    '',
  ];

  transactions.forEach((tx, index) => {
    parts.push(`**Transaction ${index + 1}:**`);
    parts.push(`- Description: ${tx.description}`);
    parts.push(`- Amount: ${tx.amount} ${tx.currency}`);
    parts.push(`- Date: ${tx.date}`);
    if (tx.counterparty) parts.push(`- Counterparty: ${tx.counterparty}`);
    if (tx.mccCode) parts.push(`- MCC Code: ${tx.mccCode}`);
    parts.push('');
  });

  parts.push('Use the same classification categories and response format as before.');
  parts.push('');
  parts.push('Respond with a JSON array of classification results, one for each transaction:');
  parts.push('[');
  parts.push('  { "category": "...", "confidence": 0.95, ... },');
  parts.push('  { "category": "...", "confidence": 0.85, ... }');
  parts.push(']');

  return parts.join('\n');
}
