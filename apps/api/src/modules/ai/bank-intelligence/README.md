# Bank Intelligence Module - Enhanced Transaction Classifier

## Overview

The Enhanced Transaction Classifier is a tax-aware AI service that automatically classifies bank transactions according to German EÜR (Einnahmen-Überschuss-Rechnung) tax form requirements.

## Features

### 1. German Tax-Aware Classification
- Maps transactions to EÜR form lines (12-32 for expenses, 11 for income)
- Calculates deductible amounts (including special cases like 70% for Bewirtung)
- Identifies VAT rates (7%, 19%, or tax-exempt)
- Flags transactions requiring special documentation

### 2. Intelligent Pattern Recognition
- Recognizes 50+ common vendors (AWS, Google Cloud, Adobe, etc.)
- Identifies recurring transactions and their frequency
- Normalizes vendor names for consistency
- Suggests business/private split percentages

### 3. Automated Tax Rules
- **Bewirtung (Business Meals)**: 70% deductible, requires guest names
- **Telefon/Internet**: Often 50% business use for mixed-use
- **Kfz-Kosten**: Vehicle expenses with mileage tracking requirements
- **Reisekosten**: Travel expenses with proper documentation

### 4. Confidence Scoring
- AI confidence threshold: 0.85 (configurable)
- Flags low-confidence transactions for manual review
- Provides alternative category suggestions

## Files Created

### Types
```
types/tax-categories.types.ts (6.3 KB)
```
- `TaxCategory` enum: All German EÜR categories
- `EnhancedTransactionClassification`: Full classification result
- `TransactionForClassification`: Input structure
- `BatchClassificationResult`: Batch processing results

### Rules
```
rules/eur-line-mapping.ts (9.9 KB)
```
- Complete mapping of TaxCategory → EÜR form lines
- German descriptions and deduction percentages
- Documentation requirements and special notes
- Helper functions for tax calculations

```
rules/vendor-patterns.ts (9.3 KB)
```
- 50+ pre-configured vendor patterns
- Auto-categorization for common services:
  - Cloud: AWS, Google Cloud, Azure, DigitalOcean
  - Software: Adobe, Microsoft 365, Slack, GitHub
  - Telecom: Telekom, Vodafone, O2, 1&1
  - Accounting: LexOffice, SevDesk, DATEV
  - Travel: Deutsche Bahn, Booking.com, Airbnb
- Recurring pattern detection

### Prompts
```
prompts/classification-prompt.ts (8.5 KB)
```
- Expert system prompt for Claude AI
- German tax law knowledge embedded
- Classification rules and guidelines
- Response format specification

### Service
```
transaction-classifier.service.ts (13 KB)
```
- Main classification service
- Single and batch classification
- Tax category suggestion
- Vendor pattern enhancement
- Validation and enrichment

### Module
```
bank-intelligence.module.ts (updated)
```
- NestJS module configuration
- Exports `EnhancedTransactionClassifierService`
- Integrates with existing `InvoiceMatcherService`

### Examples
```
transaction-classifier.example.ts (8.7 KB)
```
- Complete usage examples
- Single and batch classification demos
- Special cases (Bewirtung, Telefon, etc.)
- Common expense types

### Exports
```
index.ts
```
- Centralized exports for easy imports

## Usage

### Single Transaction Classification

```typescript
import { EnhancedTransactionClassifierService } from '@/modules/ai/bank-intelligence';

// Inject the service
constructor(
  private readonly classifier: EnhancedTransactionClassifierService
) {}

// Classify a transaction
const result = await this.classifier.classifyTransaction({
  description: 'AWS Amazon Web Services',
  amount: -15000, // 150.00 EUR in cents
  type: 'DEBIT',
  counterparty: 'Amazon Web Services',
  date: new Date(),
});

console.log(result.tax.taxCategory); // FREMDLEISTUNGEN
console.log(result.tax.eurLineNumber); // 13
console.log(result.tax.deductibleAmount); // 15000 (100% deductible)
console.log(result.confidence); // 0.95
```

### Batch Classification

```typescript
const transactions = [
  { description: 'Adobe Creative Cloud', amount: -5999, type: 'DEBIT' },
  { description: 'Shell Tankstelle', amount: -7500, type: 'DEBIT' },
  { description: 'Kunde Schmidt Invoice', amount: 119000, type: 'CREDIT' },
];

const batchResult = await this.classifier.classifyBatch(transactions);

console.log(batchResult.total); // 3
console.log(batchResult.classified); // 3
console.log(batchResult.averageConfidence); // 0.92
```

### Tax Category Suggestion

```typescript
const taxCategory = await this.classifier.suggestTaxCategory(
  'Software Subscription',
  'Monthly project management tool'
);

console.log(taxCategory); // SONSTIGE_KOSTEN
```

## Tax Categories (TaxCategory Enum)

### Expenses (EÜR Lines)

| Category | Line | Description | Deductible |
|----------|------|-------------|------------|
| WAREN_MATERIAL | 12 | Raw materials, goods | 100% |
| FREMDLEISTUNGEN | 13 | External services | 100% |
| PERSONAL | 14 | Wages, salaries | 100% |
| MIETE_PACHT | 18 | Rent, lease | 100% |
| SONSTIGE_KOSTEN | 20 | Other expenses | 100% |
| ABSCHREIBUNGEN | 22 | Depreciation | 100% |
| KFZKOSTEN | 24 | Vehicle costs | 100% |
| REISEKOSTEN | 25 | Travel costs | 100% |
| BEWIRTUNG | 26 | Business meals | **70%** |
| TELEFON_INTERNET | 27 | Phone, internet | 100% * |
| BUEROKOSTEN | 28 | Office supplies | 100% |
| VERSICHERUNGEN | 29 | Insurance | 100% |
| WERBUNG | 30 | Advertising | 100% |
| RECHTSBERATUNG | 31 | Legal/tax advice | 100% |
| ZINSEN | 32 | Interest | 100% |

\* Often 50% for mixed business/private use

### Income (EÜR Line 11)

| Category | VAT Rate |
|----------|----------|
| EINNAHMEN_19 | 19% (standard) |
| EINNAHMEN_7 | 7% (reduced) |
| EINNAHMEN_STEUERFREI | 0% (exempt) |
| EINNAHMEN_KLEINUNTERNEHMER | 0% (§19 UStG) |

### Special

| Category | Purpose |
|----------|---------|
| PRIVATE_ENTNAHME | Private withdrawal (not deductible) |
| PRIVATE_EINLAGE | Private deposit (not taxable) |
| KEINE_STEUERRELEVANZ | No tax relevance |

## Special Rules Embedded

### Bewirtung (Business Meals)
```typescript
result.tax.deductionPercentage // 70
result.business.specialRequirements // ['Guest names required', 'Business purpose documentation']
```

### Telefon/Internet (Mixed Use)
```typescript
result.business.businessPercentage // 50 (typical for mixed use)
result.flags.possiblyPrivate // true
```

### Reisekosten (Travel)
```typescript
result.business.requiresDocumentation // true
result.business.documentationType // 'INVOICE'
```

## Configuration

Set in environment variables:

```env
ANTHROPIC_API_KEY=your_api_key_here
CLASSIFICATION_CONFIDENCE_THRESHOLD=0.85
```

## Integration

The module is already registered in `BankIntelligenceModule` and can be imported:

```typescript
import { BankIntelligenceModule } from '@/modules/ai/bank-intelligence';

@Module({
  imports: [BankIntelligenceModule],
})
export class YourModule {}
```

## Technical Details

- **AI Model**: Claude 3.5 Sonnet (claude-3-5-sonnet-20241022)
- **Temperature**: 0.1 (low for consistent classification)
- **Max Tokens**: 2048-4096
- **Batch Size**: 10 transactions per API call
- **Retry Logic**: 3 attempts with exponential backoff

## Testing

Run the examples:

```bash
# Uncomment the last line in transaction-classifier.example.ts
node -r ts-node/register src/modules/ai/bank-intelligence/transaction-classifier.example.ts
```

## Next Steps

1. **Integration with Banking Module**: Connect to actual bank transactions
2. **User Feedback Loop**: Learn from corrections
3. **Custom Categories**: Allow users to define custom mappings
4. **Multi-Country Support**: Extend beyond German EÜR
5. **Dashboard**: Visualize tax deductions by category

## German Tax Compliance

This classifier follows current German tax regulations:
- EÜR form structure (Anlage EÜR)
- Deduction rules (§4 EStG)
- VAT rates (UStG)
- Documentation requirements (AO, UStDV)

**Note**: Always consult a tax advisor (Steuerberater) for final tax decisions.

## Created By

ORACLE (AI/ML Specialist)
Task: S4-01 Enhanced Transaction Classifier
Sprint: 4 - Bank Intelligence
Date: December 6, 2024
