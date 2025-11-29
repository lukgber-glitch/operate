# @operate/ai

AI/ML integrations for Operate platform, including transaction classification using Claude AI.

## Features

### Transaction Classification
- **AI-Powered Classification**: Uses Claude AI to analyze and categorize bank transactions
- **MCC Code Mapping**: Merchant Category Code integration for improved accuracy
- **Confidence Scoring**: Intelligent confidence assessment with adjustable thresholds
- **Review Queue**: Automatic flagging of low-confidence classifications for human review
- **Tax Relevance Detection**: Identifies tax-deductible transactions
- **Multi-Language Support**: Optimized for German, Austrian, and Swiss businesses

## Installation

```bash
pnpm install
```

## Configuration

Set the following environment variables:

```bash
ANTHROPIC_API_KEY=your_claude_api_key
CLASSIFICATION_CONFIDENCE_THRESHOLD=0.7  # Optional, defaults to 0.7
```

## Usage

### Basic Classification

```typescript
import { TransactionClassifier, TransactionInput } from '@operate/ai';

const classifier = new TransactionClassifier({
  claudeApiKey: process.env.ANTHROPIC_API_KEY,
  confidenceThreshold: 0.7,
});

const transaction: TransactionInput = {
  description: 'Amazon Web Services EMEA',
  amount: -125.50,
  currency: 'EUR',
  date: '2024-11-29',
  mccCode: '7372',
};

const result = await classifier.classifyTransaction(transaction);

console.log(result);
// {
//   category: 'software_subscriptions',
//   confidence: 0.95,
//   reasoning: 'Cloud service subscription from AWS',
//   taxRelevant: true,
//   suggestedDeductionCategory: 'software_and_licenses',
//   flags: ['needs_receipt', 'recurring']
// }
```

### Batch Classification

```typescript
const transactions = [
  { description: 'AWS', amount: -125, currency: 'EUR', date: '2024-11-29' },
  { description: 'Office Rent', amount: -1200, currency: 'EUR', date: '2024-11-01' },
];

const results = await classifier.classifyBatch(transactions);
```

### Review Queue

```typescript
// Check if transaction needs review
if (classifier.needsReview(result)) {
  const priority = classifier.getReviewPriority(result, transaction.amount);
  // Add to review queue...
}
```

## Transaction Categories

- **Business Expenses**: office_supplies, travel_business, meals_business, software_subscriptions, professional_services, marketing, utilities, rent, equipment, insurance_business, vehicle_business
- **Personal**: personal
- **Revenue**: revenue_sales, revenue_services
- **Tax**: tax_payment, tax_refund
- **Transfers**: transfer_internal
- **Other**: unknown

## Confidence Levels

- **High (0.8-1.0)**: Clear category, known merchant, MCC match
- **Medium (0.5-0.79)**: Likely correct but review recommended
- **Low (0.0-0.49)**: Manual review required

## MCC Codes

The package includes comprehensive Merchant Category Code (MCC) mapping for common business expenses:

- 7372: Software/SaaS
- 5812/5814: Restaurants
- 5943: Office Supplies
- 4111/4121: Transportation/Travel
- 8111/8931: Professional Services
- And many more...

## Testing

```bash
# Run tests
pnpm test

# Run tests with coverage
pnpm test -- --coverage

# Run tests in watch mode
pnpm test -- --watch
```

## Architecture

```
packages/ai/
├── src/
│   ├── claude/              # Claude AI integration
│   │   ├── client.ts        # API client
│   │   ├── prompts.ts       # Prompt templates
│   │   └── types.ts         # Type definitions
│   ├── classification/      # Transaction classification
│   │   ├── transaction-classifier.ts
│   │   ├── confidence-scorer.ts
│   │   ├── mcc-codes.ts
│   │   └── types.ts
│   └── index.ts
```

## API Integration

The package is integrated into the API via the AI module:

- `POST /api/v1/ai/classify` - Classify single transaction
- `POST /api/v1/ai/classify/batch` - Classify multiple transactions
- `GET /api/v1/ai/review-queue` - Get review queue items
- `POST /api/v1/ai/review-queue/:id/review` - Submit review decision

## License

Private - Operate/CoachOS
