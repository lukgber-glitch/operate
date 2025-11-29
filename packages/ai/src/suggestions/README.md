# Deduction Suggestion Engine

AI-powered tax deduction suggestion engine for Operate/CoachOS.

## Overview

The Deduction Suggestion Engine analyzes classified transactions and suggests valid tax deductions based on country-specific tax laws. It supports Germany (DE), Austria (AT), and Switzerland (CH).

## Features

- **Rule-Based Matching**: Matches transactions to deduction rules based on category and conditions
- **Country-Specific Rules**: Comprehensive rules for DE, AT, and CH tax laws
- **Legal Basis**: Each suggestion includes legal references (e.g., §9 EStG)
- **Amount Validation**: Validates amounts against legal limits and thresholds
- **Requirement Tracking**: Tracks documentation requirements (receipts, business purpose, etc.)
- **User Confirmation Workflow**: Users can confirm, reject, or modify suggestions

## Usage

### Basic Example

```typescript
import { createDeductionEngine } from '@operate/ai';

const engine = createDeductionEngine();

// Generate suggestions for transactions
const suggestions = await engine.generateSuggestions(
  classifiedTransactions,
  {
    countryCode: 'DE',
    taxYear: 2024,
    minConfidence: 0.7,
  }
);
```

### API Endpoints

```
POST   /api/v1/tax/deductions/suggest          - Generate suggestions
GET    /api/v1/tax/deductions/suggestions      - List suggestions
POST   /api/v1/tax/deductions/suggestions/:id/confirm - Confirm suggestion
POST   /api/v1/tax/deductions/suggestions/:id/reject  - Reject suggestion
PATCH  /api/v1/tax/deductions/suggestions/:id  - Modify suggestion
GET    /api/v1/tax/deductions/summary/:year    - Get annual summary
```

## Deduction Rules

### Germany (DE)

Based on German tax law (EStG - Einkommensteuergesetz):

- **Work Equipment** (§9 Abs. 1 Nr. 6 EStG): 100% deductible up to €800
- **Business Meals** (§4 Abs. 5 Nr. 2 EStG): 70% deductible
- **Home Office** (§4 Abs. 5 Nr. 6b EStG): Up to €1,260/year
- **Commute** (§9 Abs. 1 Nr. 4 EStG): €0.30/km (€0.38/km from 21km)
- **Professional Development** (§9 Abs. 1 Nr. 7 EStG): 100% deductible

### Austria (AT)

Based on Austrian tax law:

- **Work Equipment** (§16 Abs. 1 Z 6 EStG): 100% deductible up to €800
- **Business Meals** (§20 Abs. 1 Z 3 EStG): 50% deductible
- **Home Office** (§16 Abs. 1 Z 6 lit. d EStG): €3/day, max 100 days
- **Commute** (§16 Abs. 1 Z 6 lit. a EStG): Pendlerpauschale (varies)
- **Travel Expenses** (§16 Abs. 1 Z 9 EStG): €0.42/km

### Switzerland (CH)

Based on Swiss federal tax law (DBG):

- **Work Equipment** (Art. 26 Abs. 1 lit. a DBG): 100% deductible up to CHF 2,000
- **Commute** (Art. 26 Abs. 1 lit. b DBG): Actual costs or CHF 0.70/km
- **Professional Development** (Art. 26 Abs. 1 lit. d DBG): Up to CHF 12,800/year
- **Business Meals** (Art. 27 Abs. 2 lit. a DBG): 100% deductible with documentation

## Transaction Categories

```typescript
TransactionCategories = {
  // Office & Equipment
  OFFICE_SUPPLIES: 'office_supplies',
  EQUIPMENT: 'equipment',
  SOFTWARE_SUBSCRIPTIONS: 'software_subscriptions',
  COMPUTER_HARDWARE: 'computer_hardware',

  // Travel & Transport
  TRAVEL_BUSINESS: 'travel_business',
  VEHICLE_BUSINESS: 'vehicle_business',
  FUEL: 'fuel',
  PARKING: 'parking',
  PUBLIC_TRANSPORT: 'public_transport',
  ACCOMMODATION: 'accommodation',

  // Meals & Entertainment
  MEALS_BUSINESS: 'meals_business',
  CLIENT_ENTERTAINMENT: 'client_entertainment',

  // Office Space
  RENT: 'rent',
  UTILITIES: 'utilities',
  INTERNET: 'internet',
  PHONE: 'phone',

  // Professional Services
  LEGAL_FEES: 'legal_fees',
  ACCOUNTING_FEES: 'accounting_fees',
  CONSULTING: 'consulting',
  TRAINING: 'training',

  // Marketing & Advertising
  ADVERTISING: 'advertising',
  MARKETING: 'marketing',
  WEBSITE: 'website',
}
```

## Deduction Categories

```typescript
DeductionCategoryCodes = {
  WORK_EQUIPMENT: 'WORK_EQUIPMENT',
  WORK_CLOTHING: 'WORK_CLOTHING',
  COMMUTE: 'COMMUTE',
  PROFESSIONAL_DEVELOPMENT: 'PROFESSIONAL_DEVELOPMENT',
  OFFICE_COSTS: 'OFFICE_COSTS',
  TRAVEL_EXPENSES: 'TRAVEL_EXPENSES',
  VEHICLE_EXPENSES: 'VEHICLE_EXPENSES',
  BUSINESS_MEALS: 'BUSINESS_MEALS',
  MARKETING_COSTS: 'MARKETING_COSTS',
  PROFESSIONAL_SERVICES: 'PROFESSIONAL_SERVICES',
  HOME_OFFICE: 'HOME_OFFICE',
  INSURANCE: 'INSURANCE',
  DEPRECIATION: 'DEPRECIATION',
}
```

## Data Flow

1. **Transaction Classification** (OP-040): Transactions are classified into categories
2. **Suggestion Generation**: Engine analyzes classified transactions
3. **Rule Matching**: Finds applicable deduction rules
4. **Amount Calculation**: Calculates deductible amount with legal limits
5. **Requirement Check**: Validates documentation requirements
6. **User Review**: User confirms, rejects, or modifies suggestions
7. **Tax Reports**: Confirmed deductions feed into tax reports

## Database Schema

```prisma
model Transaction {
  id                  String    @id @default(uuid())
  amount              Decimal
  currency            String
  description         String
  date                DateTime
  category            String?
  categoryConfidence  Decimal?
  metadata            Json?
  deductionSuggestions DeductionSuggestion[]
}

model DeductionSuggestion {
  id                  String    @id @default(uuid())
  transactionId       String
  ruleId              String
  categoryCode        String
  deductibleAmount    Decimal
  deductiblePercentage Int
  legalReference      String
  legalDescription    String
  status              DeductionSuggestionStatus
  requirements        Json
  confidence          Decimal
  reasoning           String
}
```

## Testing

```bash
# Run AI package tests
cd packages/ai
npm test

# Run API deductions tests
cd apps/api
npm test -- deductions
```

## Legal Disclaimer

This engine provides suggestions based on current tax laws. Users should:
- Consult with tax professionals for complex cases
- Verify deductions against current tax regulations
- Maintain proper documentation for all deductions
- Be aware that tax laws change regularly

## Contributing

When adding new rules:

1. Research the legal basis thoroughly
2. Include proper legal references
3. Document requirements clearly
4. Add tests for the new rules
5. Update this README

## References

- Germany: [Einkommensteuergesetz (EStG)](https://www.gesetze-im-internet.de/estg/)
- Austria: [Einkommensteuergesetz (EStG)](https://www.ris.bka.gv.at/)
- Switzerland: [Bundesgesetz über die direkte Bundessteuer (DBG)](https://www.fedlex.admin.ch/)
