# AI Tax Deduction Suggestions Service

## Overview

The AI Tax Deduction Suggestions Service provides intelligent, Claude AI-powered analysis of business expenses to suggest optimal tax deductions according to German tax law (Einkommensteuergesetz - EStG).

## Architecture

### Components

```
tax/
├── tax.module.ts                      # Main tax module
└── deductions/
    ├── deductions.module.ts           # Deductions module
    ├── deductions.controller.ts       # REST API endpoints
    ├── deductions.service.ts          # Business logic & DB operations
    ├── deduction-analyzer.service.ts  # AI-powered analysis (NEW)
    ├── dto/
    │   ├── index.ts                   # DTO exports (ENHANCED)
    │   ├── deduction-suggestion.dto.ts
    │   ├── confirm-deduction.dto.ts
    │   └── deduction-summary.dto.ts
    ├── AI_EXAMPLES.md                 # AI suggestion examples
    └── README.md                      # This file
```

### Key Services

#### 1. DeductionAnalyzerService (NEW)
**File:** `deduction-analyzer.service.ts`

AI-powered expense analyzer using Claude 3.5 Sonnet:
- Analyzes expense descriptions and metadata
- Classifies into 6 German tax categories
- Calculates deductible percentages and tax savings
- Provides legal references (EStG paragraphs)
- Identifies missing documentation
- Generates confidence scores

**Key Methods:**
- `analyzeExpense()` - Analyze single expense
- `analyzeExpenses()` - Batch analysis
- `analyzeExpensesByIds()` - Analyze from database
- `getDeductionCategories()` - List all categories

#### 2. DeductionsService (EXISTING)
**File:** `deductions.service.ts`

Manages deduction suggestions and user workflows:
- Generate suggestions from classified transactions
- Track suggestion status (suggested/confirmed/rejected)
- Calculate annual summaries
- Handle user confirmations and modifications

## German Tax Categories

### 1. Werbungskosten (§ 9 EStG)
Income-related expenses for employees
- Work equipment, professional development, commute
- **100% deductible**

### 2. Betriebsausgaben (§ 4 EStG)
Business expenses for self-employed
- Office costs, travel, supplies, business meals (70%)
- **100% deductible** (except meals: 70%)

### 3. Sonderausgaben (§ 10 EStG)
Special expenses
- Insurance, pension contributions, donations
- **Varies by type, often capped**

### 4. Außergewöhnliche Belastungen (§ 33 EStG)
Extraordinary burdens
- Medical expenses, care costs
- **Amount exceeding "reasonable burden"**

### 5. Handwerkerleistungen (§ 35a Abs. 3 EStG)
Craftsman services
- Plumbing, electrical, painting, renovation
- **20% of labor costs, max €1,200/year**

### 6. Haushaltsnahe Dienstleistungen (§ 35a Abs. 2 EStG)
Household services
- Cleaning, gardening, care, snow removal
- **20% of costs, max €4,000/year**

## API Endpoints

### GET /tax/deductions/suggestions
Get AI-suggested deductions with filters

**Query Parameters:**
- `status`: Filter by status (SUGGESTED, CONFIRMED, REJECTED)
- `categoryCode`: Filter by category
- `taxYear`: Filter by tax year
- `page`, `pageSize`: Pagination

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "category": "WERBUNGSKOSTEN",
      "deductibleAmount": 499.00,
      "confidence": 0.92,
      ...
    }
  ],
  "meta": {
    "total": 45,
    "page": 1,
    "pageSize": 20
  }
}
```

---

### GET /tax/deductions/categories
List all German tax deduction categories

**Response:**
```json
[
  {
    "code": "WERBUNGSKOSTEN",
    "name": "Werbungskosten",
    "description": "Income-related expenses...",
    "legalReference": "§ 9 EStG"
  },
  ...
]
```

---

### POST /tax/deductions/analyze
Analyze expenses for deductions using Claude AI

**Request Body:**
```json
{
  "expenseIds": ["uuid-1", "uuid-2", "uuid-3"],
  "taxBracket": 42
}
```

**Response:**
```json
{
  "analyses": [
    {
      "expenseId": "uuid-1",
      "category": "WERBUNGSKOSTEN",
      "subcategory": "Office Equipment",
      "confidence": 0.92,
      "deductiblePercentage": 100,
      "estimatedTaxSavings": 209.58,
      "explanation": "An ergonomic office chair qualifies as...",
      "legalReference": "§ 9 Abs. 1 Satz 3 Nr. 6 EStG",
      "requirements": {
        "documentationNeeded": ["Receipt", "Proof of business use"],
        "missingDocuments": [],
        "additionalInfo": [...]
      },
      "warnings": []
    }
  ],
  "summary": {
    "totalExpenses": 1234.56,
    "totalDeductible": 987.65,
    "estimatedTaxSavings": 414.81,
    "byCategory": {
      "WERBUNGSKOSTEN": {
        "count": 3,
        "totalAmount": 800.00,
        "deductibleAmount": 800.00
      }
    }
  }
}
```

---

### GET /tax/deductions/summary/:year
Get deduction summary for a tax year

**Path Parameters:**
- `year`: Tax year (e.g., 2024)

**Query Parameters:**
- `countryCode`: Country code (default: DE)

**Response:**
```json
{
  "year": 2024,
  "countryCode": "DE",
  "currency": "EUR",
  "totalOriginalAmount": 5000.00,
  "totalDeductibleAmount": 4650.00,
  "estimatedTaxSavings": 1953.00,
  "suggestedCount": 12,
  "confirmedCount": 8,
  "rejectedCount": 2,
  "categories": [
    {
      "categoryCode": "WERBUNGSKOSTEN",
      "categoryName": "Werbungskosten",
      "count": 5,
      "totalOriginalAmount": 2500.00,
      "totalDeductibleAmount": 2500.00
    }
  ]
}
```

---

### POST /tax/deductions/:id/apply
Apply/confirm a suggested deduction

**Request Body:**
```json
{
  "deductibleAmount": 499.00,
  "notes": "Confirmed as 100% business use"
}
```

**Response:** DeductionSuggestionDto

---

### POST /tax/deductions/:id/dismiss
Dismiss/reject a suggested deduction

**Request Body:**
```json
{
  "reason": "Personal expense, not business-related"
}
```

**Response:** DeductionSuggestionDto

---

### POST /tax/deductions/suggest
Generate deduction suggestions (rule-based)

**Request Body:**
```json
{
  "countryCode": "DE",
  "taxYear": 2024,
  "minConfidence": 0.75,
  "transactionIds": ["uuid-1", "uuid-2"]
}
```

**Response:** Array of DeductionSuggestionDto

## Configuration

### Environment Variables

```bash
# Required for AI analysis
ANTHROPIC_API_KEY=sk-ant-...

# Database
DATABASE_URL=postgresql://...

# Optional: AI model configuration
AI_MODEL=claude-3-5-sonnet-20241022  # Default
AI_TEMPERATURE=0.3                    # Default
AI_MAX_TOKENS=2048                    # Default
```

### Prisma Models

The service uses the following Prisma models:

**Expense:**
- id, orgId, description, amount, currency, date
- category, subcategory
- vendorName, vendorVatId
- receiptUrl, receiptNumber
- metadata (JSON)

**DeductionSuggestion:**
- id, orgId, transactionId
- ruleId, categoryCode, categoryName
- originalAmount, deductibleAmount, deductiblePercentage
- legalReference, legalDescription
- status (SUGGESTED, CONFIRMED, REJECTED, MODIFIED)
- requirements (JSON)
- confidence, reasoning
- confirmedBy, rejectedBy, modifiedBy
- confirmedAt, rejectedAt, modifiedAt

**TaxDeductionSummary:**
- id, orgId, year, countryCode
- totalOriginalAmount, totalDeductibleAmount
- suggestedCount, confirmedCount, rejectedCount
- categories (JSON)

## AI Analysis Process

### 1. Input Processing
```typescript
const expense = {
  description: "Ergonomic office chair from IKEA",
  amount: 499.00,
  currency: "EUR",
  date: "2024-11-15",
  vendorName: "IKEA Deutschland",
  receiptUrl: "https://..."
};
```

### 2. AI Prompt Generation
The analyzer creates a structured prompt including:
- Expense details
- Receipt status
- Category hints
- Metadata

### 3. Claude AI Analysis
- Uses Claude 3.5 Sonnet
- Temperature: 0.3 (conservative)
- System prompt: German tax expert persona
- Response format: Structured JSON

### 4. Response Parsing
```typescript
{
  category: "WERBUNGSKOSTEN",
  subcategory: "Office Equipment",
  deductiblePercentage: 100,
  legalReference: "§ 9 Abs. 1 Satz 3 Nr. 6 EStG",
  explanation: "...",
  confidence: 0.92,
  requirements: {...},
  warnings: [...]
}
```

### 5. Tax Savings Calculation
```typescript
const deductibleAmount = amount * (deductiblePercentage / 100);
const taxSavings = deductibleAmount * (taxBracket / 100);
// Example: €499 × 100% × 42% = €209.58 savings
```

## Confidence Scoring

**Threshold:** 0.75 (configurable)

| Score | Interpretation | Action |
|-------|----------------|--------|
| 0.9-1.0 | Very confident | Auto-suggest |
| 0.75-0.89 | Confident | Suggest with note |
| 0.5-0.74 | Moderate | Review required |
| 0.0-0.49 | Low | Manual categorization |

## Error Handling

### Fallback Analysis
If Claude AI is unavailable:
- Falls back to rule-based analysis
- Confidence set to 0.5
- Warning added to result
- Basic categorization based on keywords

### Common Errors
1. **Missing API Key:** Service logs warning, uses fallback
2. **AI Parse Error:** Returns fallback analysis
3. **Rate Limiting:** Implements retry with exponential backoff
4. **Invalid Expense:** Returns validation error

## Testing

### Unit Tests
```bash
cd apps/api
npm test -- deductions
```

### Integration Tests
```bash
npm test -- deductions.e2e
```

### Manual Testing
See `AI_EXAMPLES.md` for example requests and responses.

## Performance

### Batch Processing
- Concurrency limit: 5 parallel requests
- Prevents Claude API rate limiting
- Progress tracking for large batches

### Caching
- Response caching: 24 hours
- Category list caching: Indefinite
- Reduces API calls for repeated analyses

### Optimization
- Lazy loading of AI client
- Request batching
- Parallel processing where safe

## Legal Compliance

### GoBD (Grundsätze zur ordnungsmäßigen Führung und Aufbewahrung von Büchern)
- All receipts stored for 10 years
- Immutable audit trail
- Timestamped modifications
- User attribution for all actions

### Data Privacy (DSGVO)
- No expense data sent to Claude API without consent
- Anonymization options available
- Opt-out from AI analysis supported

### Tax Advisory Disclaimer
The AI provides suggestions based on tax law but is **not** a substitute for:
- Professional tax advice
- Individual tax assessment
- Legal tax representation

Always consult a qualified **Steuerberater** for complex situations.

## Usage Example

```typescript
import { DeductionAnalyzerService } from './deduction-analyzer.service';

// Inject service
constructor(private analyzer: DeductionAnalyzerService) {}

// Analyze single expense
const expense = {
  description: "AWS Cloud Architect Course",
  amount: 89.99,
  currency: "EUR",
  date: new Date("2024-10-20"),
  category: "TRAINING"
};

const analysis = await this.analyzer.analyzeExpense(expense, 42);

console.log(`Category: ${analysis.category}`);
console.log(`Deductible: ${analysis.deductiblePercentage}%`);
console.log(`Tax Savings: €${analysis.estimatedTaxSavings.toFixed(2)}`);
console.log(`Confidence: ${(analysis.confidence * 100).toFixed(0)}%`);

// Analyze multiple expenses
const expenseIds = ["uuid-1", "uuid-2", "uuid-3"];
const result = await this.analyzer.analyzeExpensesByIds(
  orgId,
  expenseIds,
  42 // tax bracket
);

console.log(`Total Savings: €${result.summary.estimatedTaxSavings}`);
```

## Future Enhancements

1. **Learning from User Feedback**
   - Track applied vs dismissed suggestions
   - Fine-tune confidence scoring
   - Improve categorization accuracy

2. **Multi-Country Support**
   - Austria (§ 16 EStG)
   - Switzerland (DBG)
   - UK, US tax systems

3. **Receipt OCR Integration**
   - Extract data from receipt images
   - Auto-populate expense fields
   - Verify receipt authenticity

4. **Tax Optimization Advisor**
   - Suggest expense timing strategies
   - Identify missing deductions
   - Year-end tax planning

5. **Integration with ELSTER**
   - Direct export to tax forms
   - Pre-fill Anlage N, EÜR
   - Submit to Finanzamt

## Support

For questions or issues:
1. Check `AI_EXAMPLES.md` for examples
2. Review API documentation
3. Contact ORACLE agent team
4. File issue in project tracker

## License

Copyright © 2024 Operate/CoachOS. All rights reserved.
