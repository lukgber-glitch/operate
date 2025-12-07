# Scenario Planning - Usage Examples

## Chat Interface Examples

### Example 1: Hiring Scenario

**User Question:**
```
Was wenn ich 2 Entwickler für €5.000 pro Monat einstelle?
```

**Bot Response:**
```
⚠️ Szenario-Analyse: Neue Einstellung

2 neue Mitarbeiter für €5.000/Monat

Aktuelle Situation:
• Monatliche Einnahmen: €25.000,00
• Monatliche Ausgaben: €15.000,00
• Burn Rate: €0,00/Monat
• Runway: ∞ Monate

Nach Änderung:
• Monatliche Einnahmen: €25.000,00
• Monatliche Ausgaben: €25.000,00
• Burn Rate: €0,00/Monat
• Runway: ∞ Monate

Auswirkung:
• Runway-Änderung: Bleibt profitabel
• Monatliche Änderung: -€10.000,00

Empfehlung:
VORSICHT: Diese Änderung würde das monatliche Netto von €10.000 auf €0 reduzieren.
Kein Puffer mehr für unerwartete Ausgaben.
```

### Example 2: Revenue Increase

**User Question:**
```
Was wenn der Umsatz um 30% steigt?
```

**Bot Response:**
```
✅ Szenario-Analyse: Umsatzsteigerung

Umsatz um 30% erhöhen

Aktuelle Situation:
• Monatliche Einnahmen: €20.000,00
• Monatliche Ausgaben: €18.000,00
• Burn Rate: €0,00/Monat
• Runway: ∞ Monate

Nach Änderung:
• Monatliche Einnahmen: €26.000,00
• Monatliche Ausgaben: €18.000,00
• Burn Rate: €0,00/Monat
• Runway: ∞ Monate

Auswirkung:
• Runway-Änderung: Bleibt profitabel
• Monatliche Änderung: +€6.000,00

Empfehlung:
POSITIV: Diese Änderung würde das monatliche Netto um €6.000 erhöhen.
```

### Example 3: Cost Savings

**User Question:**
```
Was wenn wir €3.000 monatlich an Kosten einsparen?
```

**Bot Response:**
```
✅ Szenario-Analyse: Kosteneinsparung

€3.000/Monat einsparen

Aktuelle Situation:
• Monatliche Einnahmen: €15.000,00
• Monatliche Ausgaben: €18.000,00
• Burn Rate: €3.000,00/Monat
• Runway: 10,0 Monate

Nach Änderung:
• Monatliche Einnahmen: €15.000,00
• Monatliche Ausgaben: €15.000,00
• Burn Rate: €0,00/Monat
• Runway: ∞ Monate

Auswirkung:
• Runway-Änderung: ∞ (profitabel!)
• Monatliche Änderung: +€3.000,00

Empfehlung:
POSITIV: Diese Änderung würde das Unternehmen profitabel machen.
```

### Example 4: Investment Scenario

**User Question:**
```
Was wenn wir eine Investition von €50.000 tätigen?
```

**Bot Response:**
```
⚡ Szenario-Analyse: Investition

Einmalige Investition von €50.000

Aktuelle Situation:
• Monatliche Einnahmen: €20.000,00
• Monatliche Ausgaben: €15.000,00
• Burn Rate: €0,00/Monat
• Runway: ∞ Monate

Nach Änderung:
• Monatliche Einnahmen: €20.000,00
• Monatliche Ausgaben: €15.000,00
• Burn Rate: €0,00/Monat
• Runway: ∞ Monate

Auswirkung:
• Runway-Änderung: Bleibt profitabel
• Monatliche Änderung: €0,00
• Cashbestand reduziert um €50.000

Empfehlung:
NEUTRAL: Einmalige Investition reduziert Cashbestand, aber monatlicher Cash Flow bleibt positiv.
```

### Example 5: Critical Scenario

**User Question:**
```
Was wenn ich 5 Entwickler für €6.000 pro Monat einstelle?
```

**Bot Response:**
```
🚨 Szenario-Analyse: Neue Einstellung

5 neue Mitarbeiter für €6.000/Monat

Aktuelle Situation:
• Monatliche Einnahmen: €25.000,00
• Monatliche Ausgaben: €15.000,00
• Burn Rate: €0,00/Monat
• Runway: ∞ Monate

Nach Änderung:
• Monatliche Einnahmen: €25.000,00
• Monatliche Ausgaben: €45.000,00
• Burn Rate: €20.000,00/Monat
• Runway: 2,5 Monate

Auswirkung:
• Runway-Änderung: Von profitabel zu 2,5 Monate
• Monatliche Änderung: -€30.000,00

Empfehlung:
KRITISCH: Diese Änderung würde zu hohem monatlichen Verlust führen.
Runway nur 2,5 Monate. Zusätzliche Einnahmen von €30.000/Monat erforderlich oder schrittweise Einstellung empfohlen.
```

### Example 6: English Query

**User Question:**
```
What if I hire 3 developers at €4,500 per month?
```

**Bot Response:**
```
⚠️ Szenario-Analyse: Neue Einstellung

3 neue Mitarbeiter für €4.500/Monat

Aktuelle Situation:
• Monatliche Einnahmen: €30.000,00
• Monatliche Ausgaben: €20.000,00
• Burn Rate: €0,00/Monat
• Runway: ∞ Monate

Nach Änderung:
• Monatliche Einnahmen: €30.000,00
• Monatliche Ausgaben: €33.500,00
• Burn Rate: €3.500,00/Monat
• Runway: 14,3 Monate

Auswirkung:
• Runway-Änderung: Von profitabel zu 14,3 Monate
• Monatliche Änderung: -€13.500,00

Empfehlung:
VORSICHT: Runway würde sich um erheblich verkürzen.
Zusätzliche Einnahmen oder gestaffelte Einstellung erwägen.
```

## Programmatic Examples

### Example 1: Simple Scenario Calculation

```typescript
import { ScenarioPlanningService } from '@/modules/reports/scenario';

@Injectable()
export class FinanceAnalysisService {
  constructor(private scenarioService: ScenarioPlanningService) {}

  async analyzeHiring() {
    const result = await this.scenarioService.calculateScenario('org-123', {
      name: 'Hire 2 Developers',
      description: 'Add 2 senior developers to the team',
      changes: {
        newHires: {
          count: 2,
          monthlySalary: 5000,
        },
      },
    });

    console.log(`Risk Level: ${result.riskLevel}`);
    console.log(`Runway Change: ${result.impact.runwayChange} months`);
    console.log(`Recommendation: ${result.recommendation}`);

    return result;
  }
}
```

### Example 2: Compare Multiple Scenarios

```typescript
async compareCostCutOptions(orgId: string) {
  const scenarios = [
    {
      name: '5% Cost Cut',
      changes: { expenseChangePercent: -5 },
    },
    {
      name: '10% Cost Cut',
      changes: { expenseChangePercent: -10 },
    },
    {
      name: '15% Cost Cut',
      changes: { expenseChangePercent: -15 },
    },
  ];

  const results = await this.scenarioService.compareScenarios(orgId, scenarios);

  // Find best option (highest runway increase, lowest risk)
  const best = results
    .filter(r => r.riskLevel !== 'critical')
    .sort((a, b) => b.impact.runwayChange - a.impact.runwayChange)[0];

  return {
    best: best.scenario.name,
    allResults: results,
  };
}
```

### Example 3: Complex Multi-Change Scenario

```typescript
async analyzeBigPlan(orgId: string) {
  const result = await this.scenarioService.calculateScenario(orgId, {
    name: 'Growth Plan',
    description: 'Hire 3 people, increase revenue 25%, make one-time investment',
    changes: {
      newHires: { count: 3, monthlySalary: 4500 },
      revenueChangePercent: 25,
      oneTimeExpense: 30000, // Marketing campaign
    },
  });

  return result;
}
```

### Example 4: Revenue Optimization Analysis

```typescript
async findBreakEvenRevenue(orgId: string, currentRevenue: number) {
  const increments = [5, 10, 15, 20, 25, 30, 40, 50];

  for (const percent of increments) {
    const result = await this.scenarioService.calculateScenario(orgId, {
      name: `Revenue +${percent}%`,
      changes: { revenueChangePercent: percent },
    });

    if (result.projected.monthlyNet >= 0) {
      return {
        percentNeeded: percent,
        newRevenue: currentRevenue * (1 + percent / 100),
        result,
      };
    }
  }

  return null; // No break-even found in tested range
}
```

### Example 5: Optimization Suggestions

```typescript
async getOptimizationSuggestions(orgId: string) {
  // Get pre-built optimization scenarios
  const suggestions = await this.scenarioService.suggestOptimizations(orgId);

  // Filter to only positive or neutral impact
  const viable = suggestions.filter(
    s => s.riskLevel === 'low' || s.riskLevel === 'medium'
  );

  // Sort by runway improvement
  viable.sort((a, b) => b.impact.runwayChange - a.impact.runwayChange);

  return viable;
}
```

### Example 6: Conditional Scenario Planning

```typescript
async planConditionalStrategy(orgId: string) {
  // Get baseline
  const baseline = await this.getBaselineMetrics(orgId);

  let strategy;

  if (baseline.runwayMonths < 3) {
    // Critical: Focus on cost cutting
    strategy = await this.scenarioService.calculateScenario(orgId, {
      name: 'Emergency Cost Cut',
      changes: { expenseChangePercent: -20 },
    });
  } else if (baseline.runwayMonths < 6) {
    // Caution: Balanced approach
    strategy = await this.scenarioService.calculateScenario(orgId, {
      name: 'Balanced Growth',
      changes: {
        revenueChangePercent: 15,
        expenseChangePercent: -5,
      },
    });
  } else {
    // Healthy: Can invest in growth
    strategy = await this.scenarioService.calculateScenario(orgId, {
      name: 'Aggressive Growth',
      changes: {
        newHires: { count: 2, monthlySalary: 5000 },
        revenueChangePercent: 30,
        oneTimeExpense: 50000,
      },
    });
  }

  return strategy;
}
```

## REST API Examples

### Calculate Scenario (hypothetical endpoint)

```bash
POST /api/reports/scenarios/calculate
Authorization: Bearer {token}
Content-Type: application/json

{
  "scenario": {
    "name": "Hire 2 Developers",
    "changes": {
      "newHires": {
        "count": 2,
        "monthlySalary": 5000
      }
    }
  }
}
```

**Response:**
```json
{
  "scenario": {
    "name": "Hire 2 Developers",
    "changes": {
      "newHires": {
        "count": 2,
        "monthlySalary": 5000
      }
    }
  },
  "baseline": {
    "currentBalance": 50000,
    "monthlyIncome": 25000,
    "monthlyExpenses": 15000,
    "monthlyNet": 10000,
    "burnRate": 0,
    "runwayMonths": Infinity
  },
  "projected": {
    "currentBalance": 50000,
    "monthlyIncome": 25000,
    "monthlyExpenses": 25000,
    "monthlyNet": 0,
    "burnRate": 0,
    "runwayMonths": Infinity
  },
  "impact": {
    "burnRateChange": 0,
    "runwayChange": 0,
    "monthlyNetChange": -10000
  },
  "recommendation": "VORSICHT: Diese Änderung würde das monatliche Netto auf €0 reduzieren.",
  "riskLevel": "medium"
}
```

### Compare Scenarios (hypothetical endpoint)

```bash
POST /api/reports/scenarios/compare
Authorization: Bearer {token}
Content-Type: application/json

{
  "scenarios": [
    {
      "name": "Option A: Cost Cut",
      "changes": { "expenseChangePercent": -10 }
    },
    {
      "name": "Option B: Revenue Up",
      "changes": { "revenueChangePercent": 15 }
    },
    {
      "name": "Option C: Both",
      "changes": {
        "expenseChangePercent": -5,
        "revenueChangePercent": 10
      }
    }
  ]
}
```

## Error Handling Examples

### Invalid Scenario

```typescript
try {
  const result = await scenarioService.calculateScenario(orgId, {
    name: 'Invalid',
    changes: {}, // No changes specified
  });
} catch (error) {
  // Service will return baseline = projected
  // Impact will show all zeros
  // Recommendation: "NEUTRAL: Diese Änderung hat keinen Einfluss"
}
```

### Missing Financial Data

```typescript
try {
  const result = await scenarioService.calculateScenario('new-org-id', scenario);
} catch (error) {
  // Falls back to safe defaults (all zeros)
  // Returns user-friendly message
  console.log('No financial data available yet');
}
```

## Integration Examples

### Frontend React Component

```typescript
const ScenarioAnalyzer = () => {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState(null);

  const analyzeScenario = async () => {
    const response = await fetch('/api/chat/quick-ask', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        question: query,
      }),
    });

    const data = await response.json();
    setResult(data.answer);
  };

  return (
    <div>
      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Was wenn ich 2 Entwickler einstelle?"
      />
      <button onClick={analyzeScenario}>Analysieren</button>
      {result && <div className="result">{result}</div>}
    </div>
  );
};
```

### Dashboard Widget

```typescript
const ScenarioSuggestions = ({ orgId }) => {
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    // Get optimization suggestions
    scenarioService.suggestOptimizations(orgId).then(setSuggestions);
  }, [orgId]);

  return (
    <div className="widget">
      <h3>Optimization Opportunities</h3>
      {suggestions.map(s => (
        <div key={s.scenario.name} className={`suggestion ${s.riskLevel}`}>
          <h4>{s.scenario.name}</h4>
          <p>{s.recommendation}</p>
          <div className="metrics">
            <span>Runway: {s.impact.runwayChange > 0 ? '+' : ''}{s.impact.runwayChange.toFixed(1)}m</span>
            <span>Monthly: €{s.impact.monthlyNetChange.toFixed(0)}</span>
          </div>
        </div>
      ))}
    </div>
  );
};
```
