# Scenario Planning Service

## Overview

The Scenario Planning Service enables "what-if" business analysis through the chat interface. Users can ask questions in natural language (German or English) about hypothetical business changes and receive instant analysis of their impact on cash flow, burn rate, and runway.

## Features

### 1. Natural Language Understanding
The service understands various scenario questions:

**Hiring Scenarios:**
- "Was wenn ich 2 Entwickler für €5.000/Monat einstelle?"
- "What if I hire 3 employees at €4,000 each?"

**Revenue Changes:**
- "Was wenn der Umsatz um 20% steigt?"
- "What if revenue decreases by 15%?"

**Cost Savings:**
- "Was wenn wir €3.000 monatlich an Kosten einsparen?"
- "What if we save €5,000 per month?"

**Investments:**
- "Was wenn wir eine Investition von €50.000 tätigen?"
- "What if we invest €100,000?"

**New Expenses:**
- "Was wenn wir neue Kosten von €2.000/Monat haben?"
- "What if we add a new expense of €1,500?"

### 2. Comprehensive Analysis

Each scenario provides:
- **Baseline Metrics**: Current financial state
- **Projected Metrics**: State after the proposed change
- **Impact Analysis**: Delta between baseline and projected
- **Risk Assessment**: Low, Medium, High, or Critical
- **Recommendations**: Actionable advice in German

### 3. Financial Metrics Analyzed

- Monthly Income
- Monthly Expenses
- Burn Rate
- Runway (months until cash runs out)
- Net Monthly Change
- Break-even Analysis

## Architecture

### Components

```
scenario/
├── scenario-planning.service.ts  # Core service
├── index.ts                      # Exports
└── README.md                     # This file

chatbot/
└── chat-scenario.extension.ts    # Chat integration
```

### Service: ScenarioPlanningService

**Location:** `apps/api/src/modules/reports/scenario/scenario-planning.service.ts`

**Key Methods:**
- `calculateScenario(orgId, scenario)` - Analyze single scenario
- `compareScenarios(orgId, scenarios)` - Compare multiple scenarios
- `suggestOptimizations(orgId)` - Generate optimization suggestions

**Dependencies:**
- `PrismaService` - Database access
- `CashFlowPredictorService` - Baseline metrics

### Extension: ChatScenarioExtension

**Location:** `apps/api/src/modules/chatbot/chat-scenario.extension.ts`

**Key Methods:**
- `isScenarioQuery(message)` - Detect scenario questions
- `processScenarioQuery(message, orgId)` - Parse and analyze
- `parseScenarioFromMessage(message)` - Extract scenario parameters
- `formatScenarioResult(result)` - Format German response

## Data Structures

### Scenario
```typescript
interface Scenario {
  name: string;
  description?: string;
  changes: ScenarioChanges;
}
```

### ScenarioChanges
```typescript
interface ScenarioChanges {
  // Revenue
  newMonthlyRevenue?: number;
  revenueChangePercent?: number;
  lostCustomerId?: string;
  newCustomerRevenue?: number;

  // Expenses
  newHires?: { count: number; monthlySalary: number };
  newMonthlyExpense?: { description: string; amount: number };
  removedExpense?: { description: string; amount: number };
  expenseChangePercent?: number;

  // One-time
  oneTimeIncome?: number;
  oneTimeExpense?: number;
}
```

### ScenarioResult
```typescript
interface ScenarioResult {
  scenario: Scenario;
  baseline: CashFlowMetrics;
  projected: CashFlowMetrics;
  impact: {
    burnRateChange: number;
    runwayChange: number;
    monthlyNetChange: number;
    breakEvenMonths?: number;
  };
  recommendation: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}
```

## Usage Examples

### Via Chat Interface

**User:** "Was wenn ich 2 Entwickler für €5.000 pro Monat einstelle?"

**Bot Response:**
```
⚠️ Szenario-Analyse: Neue Einstellung

2 neue Mitarbeiter für €5.000/Monat

Aktuelle Situation:
• Monatliche Einnahmen: €25.000,00
• Monatliche Ausgaben: €18.000,00
• Burn Rate: €0,00/Monat
• Runway: ∞ Monate

Nach Änderung:
• Monatliche Einnahmen: €25.000,00
• Monatliche Ausgaben: €28.000,00
• Burn Rate: €3.000,00/Monat
• Runway: 15,0 Monate

Auswirkung:
• Runway-Änderung: -∞ Monate (wird profitabel zu verlustbringend)
• Monatliche Änderung: -€10.000,00

Empfehlung:
VORSICHT: Diese Einstellung würde zu einem monatlichen Verlust führen.
Zusätzliche Einnahmen von mindestens €10.000/Monat erforderlich.
```

### Programmatic Usage

```typescript
import { ScenarioPlanningService } from '@/modules/reports/scenario';

// Inject service
constructor(private scenarioService: ScenarioPlanningService) {}

// Analyze hiring scenario
const result = await this.scenarioService.calculateScenario(orgId, {
  name: 'Hire 2 Developers',
  changes: {
    newHires: {
      count: 2,
      monthlySalary: 5000,
    },
  },
});

console.log(result.recommendation);
console.log(result.riskLevel);

// Compare multiple scenarios
const results = await this.scenarioService.compareScenarios(orgId, [
  {
    name: 'Cost Cut 10%',
    changes: { expenseChangePercent: -10 },
  },
  {
    name: 'Revenue Up 20%',
    changes: { revenueChangePercent: 20 },
  },
  {
    name: 'Both',
    changes: {
      expenseChangePercent: -10,
      revenueChangePercent: 20,
    },
  },
]);

results.forEach(r => {
  console.log(`${r.scenario.name}: ${r.riskLevel} - ${r.recommendation}`);
});

// Get optimization suggestions
const suggestions = await this.scenarioService.suggestOptimizations(orgId);
```

## Integration Points

### 1. Chat Service
`ChatService` checks for scenario queries before processing normal messages:

```typescript
if (this.scenarioExtension.isScenarioQuery(sanitizedContent)) {
  const scenarioResponse = await this.scenarioExtension.processScenarioQuery(
    sanitizedContent,
    orgId,
  );
  // Create assistant message with scenario result
}
```

### 2. Reports Module
`ReportsModule` exports `ScenarioPlanningService` for use by other modules.

### 3. Chatbot Module
`ChatbotModule` provides `ChatScenarioExtension` to detect and process scenario queries.

## Risk Assessment Logic

```typescript
if (runwayMonths < 1) return 'critical';    // Less than 1 month
if (runwayMonths < 3) return 'high';        // 1-3 months
if (runwayMonths < 6) return 'medium';      // 3-6 months
return 'low';                                // 6+ months or profitable
```

## Recommendations

The service generates context-aware German recommendations:

- **KRITISCH**: Immediate liquidity crisis
- **WARNUNG**: Runway below 3 months
- **POSITIV**: Improvement to runway
- **NEUTRAL**: Minimal impact
- **VORSICHT**: Runway reduction

## Pattern Matching

The system uses regex patterns to detect scenario queries in both German and English:

```typescript
const SCENARIO_PATTERNS = [
  // Hiring
  /was.*wenn.*(\d+).*(?:entwickler|mitarbeiter).*(\d+(?:[.,]\d+)?)/i,

  // Revenue changes
  /was.*wenn.*umsatz.*(\d+)\s*%.*(?:steig|sink)/i,

  // Cost savings
  /was.*wenn.*kosten.*(\d+(?:[.,]\d+)?).*(?:spar|reduzier)/i,

  // Investments
  /was.*wenn.*investition.*(\d+(?:[.,]\d+)?)/i,
];
```

## Future Enhancements

1. **Customer Loss Analysis**: Implement actual revenue lookup for `lostCustomerId`
2. **Multi-Scenario Comparison UI**: Visual comparison charts
3. **Scenario History**: Save and track scenario analyses
4. **AI-Generated Scenarios**: Proactive "have you considered..." suggestions
5. **Monte Carlo Simulations**: Probability distributions for outcomes
6. **Seasonality**: Factor in seasonal revenue patterns
7. **Market Conditions**: External factors (economy, industry trends)

## Testing

### Unit Tests
```bash
npm test scenario-planning.service.spec.ts
```

### Integration Tests
```bash
# Test via chat interface
curl -X POST http://localhost:3000/api/chat/conversations/:id/messages \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"content": "Was wenn ich 2 Entwickler für €5000 einstelle?"}'
```

## Performance

- **Pattern Matching**: O(n) where n = number of patterns
- **Scenario Calculation**: O(1) - simple arithmetic
- **Database Queries**: 2-3 queries for baseline metrics
- **Response Time**: < 500ms for most scenarios

## Error Handling

```typescript
try {
  const result = await scenarioService.calculateScenario(orgId, scenario);
} catch (error) {
  // Falls back to default metrics if cash flow service unavailable
  // Returns user-friendly error message in German
}
```

## Localization

Currently supports:
- German (primary)
- English (pattern matching)

Recommendations and responses are in German.

## Dependencies

- `@nestjs/common` - Framework
- `PrismaService` - Database
- `CashFlowPredictorService` - Baseline metrics
- `date-fns` - Date calculations (inherited)

## Configuration

No configuration required. Uses existing cash flow thresholds from `cash-flow.types.ts`:

```typescript
CASH_FLOW_THRESHOLDS = {
  runwayWarningMonths: 3,
  runwayCriticalMonths: 1,
  minBalanceForHealthy: 10000,
}
```

## Monitoring

Log messages include:
- `Calculating scenario "${name}" for org ${orgId}`
- `Comparing ${count} scenarios for org ${orgId}`
- `Processing scenario query: ${message}...`
- `Detected scenario planning query, processing...`

## Security

- All queries scoped to organization ID
- Uses existing authentication/authorization
- Input sanitization via `ClaudeService`
- No user-controllable SQL queries

## Known Limitations

1. **Customer Loss**: `lostCustomerId` parameter not yet implemented
2. **Historical Patterns**: Doesn't factor in seasonality
3. **External Factors**: No market/economic conditions
4. **Probability**: Single-point estimates, no distributions
5. **Currency**: Assumes EUR throughout

## Support

For issues or questions:
- Check logs for error messages
- Verify cash flow data exists for organization
- Ensure BankIntelligenceModule is properly configured
- Review pattern matching if queries not detected
