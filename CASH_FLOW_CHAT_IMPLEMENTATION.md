# Cash Flow Chat Integration - Implementation Summary

## Task: S6-01 - Surface Cash Flow to Chat

**Status:** ✅ COMPLETED

## Overview
Added comprehensive cash flow query capabilities to the Operate chatbot, allowing users to ask about their financial situation in natural language (German and English).

## Implementation Details

### 1. New Action Types (action.types.ts)
Added 4 new action types to `ActionType` enum:
- `GET_CASH_FLOW` - General cash flow overview
- `GET_RUNWAY` - Runway analysis
- `GET_BURN_RATE` - Burn rate calculation
- `GET_CASH_FORECAST` - Detailed forecast with projections

### 2. Action Handlers Created

#### GetCashFlowHandler
**File:** `apps/api/src/modules/chatbot/actions/handlers/get-cash-flow.handler.ts`

**Purpose:** Provides comprehensive cash flow overview including:
- Current balance
- Burn rate (monthly)
- Runway (months remaining)
- 30/60/90 day projections
- Financial alerts and warnings
- Actionable recommendations

**Response Format:**
```
💰 **Aktuelle Finanzübersicht**

**Kontostand:** €45.230,00
**Burn Rate:** €12.500,00/Monat
**Runway:** 3,6 Monate
**Prognose (30 Tage):** €32.730,00

⚡ **Hinweis:** Runway unter 6 Monaten. Bitte Einnahmen und Ausgaben prüfen.

**Zusammenfassung:**
• Erwartete Einnahmen: €20.000,00
• Erwartete Ausgaben: €32.500,00
• Netto-Veränderung: -€12.500,00

**Warnungen:**
⚠️ Niedrigster Punkt: €8.200 am 15. Januar
• 3 Rechnungen überfällig (€5.500)

**Empfehlungen:**
• Überfällige Rechnungen eintreiben
• Unnötige Abos prüfen
```

#### GetRunwayHandler
**File:** `apps/api/src/modules/chatbot/actions/handlers/get-runway.handler.ts`

**Purpose:** Detailed runway analysis showing:
- Months until cash runs out
- Monthly burn rate breakdown
- Average income vs expenses
- Status (healthy/caution/critical)
- Tailored recommendations

**Response Format:**
```
📊 **Runway-Analyse**

Bei aktuellem Burn Rate von **€12.500,00/Monat**:

⚠️ **Runway:** 3,6 Monate (ca. April 2025)
**Status:** Vorsicht

**Finanzdetails:**
• Aktueller Kontostand: €45.230,00
• Durchschnittliche Einnahmen: €40.000,00/Monat
• Durchschnittliche Ausgaben: €12.500,00/Monat
• Netto pro Monat: €27.500,00/Monat

**Empfehlungen:**
• Monitor cash flow closely
• Accelerate invoice collection
• Review and reduce discretionary spending
```

#### GetBurnRateHandler
**File:** `apps/api/src/modules/chatbot/actions/handlers/get-burn-rate.handler.ts`

**Purpose:** Focused burn rate analysis:
- Monthly and daily burn rate
- Burn percentage of current balance
- Profitability status
- Cost reduction suggestions

**Response Format:**
```
🔥 **Burn Rate Analyse**

**Monatliche Burn Rate:** €12.500,00
**Tägliche Burn Rate:** €416,67

**Details:**
• Durchschnittliche Einnahmen: €40.000,00/Monat
• Durchschnittliche Ausgaben: €12.500,00/Monat
• Netto pro Monat: €27.500,00/Monat

✅ Ihre Einnahmen übersteigen die Ausgaben. Sie sind profitabel!

**Wie Sie Burn Rate reduzieren können:**
• Überprüfen Sie wiederkehrende Ausgaben
• Verhandeln Sie bessere Konditionen mit Lieferanten
• Identifizieren Sie unnötige Abonnements
• Optimieren Sie Betriebskosten
```

#### GetCashForecastHandler
**File:** `apps/api/src/modules/chatbot/actions/handlers/get-cash-forecast.handler.ts`

**Purpose:** Detailed daily projections:
- Day-by-day breakdown of major transactions
- Weekly summaries
- Upcoming events (invoices due, bills due)
- Alerts and risk factors

**Response Format:**
```
📈 **Cash Flow Prognose (30 Tage)**

**Ausgangslage:**
• Aktueller Stand: €45.230,00
• Prognostizierter Stand: €32.730,00
• Veränderung: -€12.500,00
• Konfidenz: 78%

**Wichtige Events:**

**15.01.2025 (Montag)**
  💰 Einnahmen: €5.000,00
  💸 Ausgaben: €2.500,00
  📊 Saldo: €47.730,00
     • Invoice INV-2024-123 - Acme Corp (€5.000,00)
     • Bill BILL-456 - AWS (€2.500,00)

**Wöchentliche Übersicht:**
✅ **Woche 1:** €2.500,00 (Einnahmen: €15.000,00, Ausgaben: €12.500,00)
⚠️ **Woche 2:** -€5.000,00 (Einnahmen: €5.000,00, Ausgaben: €10.000,00)
```

### 3. Action Executor Service Updates

**File:** `apps/api/src/modules/chatbot/actions/action-executor.service.ts`

**Changes:**
- Imported all 4 new handlers
- Registered handlers in constructor
- Added handlers to `registerHandlers()` method
- Added action definitions to `getAvailableActions()` with:
  - Required permissions: `reports:generate`
  - Risk level: `low`
  - No confirmation required
  - Example usage patterns

### 4. System Prompt Updates

**File:** `apps/api/src/modules/chatbot/prompts/system-prompt.ts`

**Changes:**
- Added "Cash Flow & Financial Planning" to capabilities list
- Added 4 new action examples with syntax
- Documented action parameters and usage patterns

**New Capabilities Listed:**
```
7. **Cash Flow & Financial Planning**
   - Provide current cash flow overview
   - Calculate runway (how long until cash runs out)
   - Show burn rate analysis
   - Generate detailed cash flow forecasts
   - Alert on low balance warnings
   - Provide financial recommendations
```

### 5. Module Configuration

**File:** `apps/api/src/modules/chatbot/chatbot.module.ts`

**Changes:**
- Imported all 4 handler classes
- Added `BankIntelligenceModule` to imports (was already present)
- Registered all 4 handlers in providers array

## Natural Language Support

### German Queries Supported:
- "Wie ist mein Cash Flow?"
- "Wie lange reicht mein Geld noch?"
- "Was ist meine Burn Rate?"
- "Wann geht mir das Geld aus?"
- "Zeig mir meine Finanzübersicht"
- "Wie ist mein Kontostand?"
- "Was sind meine monatlichen Ausgaben?"
- "Zeig mir die Prognose für 90 Tage"

### English Queries Supported:
- "How's my cash flow?"
- "What's my runway?"
- "When will I run out of cash?"
- "Show me my burn rate"
- "What's my current balance?"
- "Give me a 90-day forecast"

## Data Sources

The handlers utilize the existing `CashFlowPredictorService` which analyzes:
1. **Current bank balances** from connected accounts
2. **Pending invoices** (expected income with payment probability)
3. **Pending bills** (expected expenses)
4. **Recurring payments** detected from historical patterns
5. **Historical transaction patterns** for predictions
6. **Customer payment behaviors** for accuracy

## Response Features

### Formatting:
- ✅ German locale currency formatting (€ 1.234,56)
- ✅ Status emojis for quick visual feedback
- ✅ Color-coded alerts (🔴 critical, ⚠️ warning, ℹ️ info)
- ✅ Structured markdown for readability

### Intelligence:
- Dynamic recommendations based on financial status
- Risk factor identification
- Confidence scoring on predictions
- Actionable next steps

### Multilingual:
- Primary: German
- Secondary: English
- Auto-detection from AI context

## Integration Points

### Permissions Required:
- `reports:generate` - Standard financial reporting permission
- Respects existing RBAC (Role-Based Access Control)

### Available to Roles:
- ADMIN ✅
- ACCOUNTANT ✅
- EMPLOYEE ❌ (no reports:generate permission)
- VIEWER ❌ (no reports:generate permission)

## Testing Recommendations

### Manual Test Scenarios:

1. **Basic Cash Flow Query**
   ```
   User: "Wie ist mein Cash Flow?"
   Expected: Full overview with balance, burn rate, runway
   ```

2. **Runway Analysis**
   ```
   User: "Wie lange reicht mein Geld?"
   Expected: Runway calculation with recommendations
   ```

3. **Burn Rate Query**
   ```
   User: "Was ist meine Burn Rate?"
   Expected: Monthly/daily burn rate with profitability status
   ```

4. **Extended Forecast**
   ```
   User: "Zeig mir die Prognose für 90 Tage"
   Expected: 90-day forecast with weekly summaries
   ```

5. **English Query**
   ```
   User: "What's my runway?"
   Expected: Same data in appropriate format
   ```

### Edge Cases to Test:
- ✅ No bank accounts connected
- ✅ No transactions (new org)
- ✅ Negative runway (losing money)
- ✅ Profitable business (positive cash flow)
- ✅ Permission denied scenarios

## Files Modified/Created

### Created (4 new handlers):
1. `apps/api/src/modules/chatbot/actions/handlers/get-cash-flow.handler.ts`
2. `apps/api/src/modules/chatbot/actions/handlers/get-runway.handler.ts`
3. `apps/api/src/modules/chatbot/actions/handlers/get-burn-rate.handler.ts`
4. `apps/api/src/modules/chatbot/actions/handlers/get-cash-forecast.handler.ts`

### Modified (4 existing files):
1. `apps/api/src/modules/chatbot/actions/action.types.ts` - Added action types
2. `apps/api/src/modules/chatbot/actions/action-executor.service.ts` - Registered handlers
3. `apps/api/src/modules/chatbot/chatbot.module.ts` - Added providers
4. `apps/api/src/modules/chatbot/prompts/system-prompt.ts` - Updated capabilities

## Dependencies

### Existing Services Used:
- `CashFlowPredictorService` - Core prediction engine
- `PrismaService` - Database access
- `ActionExecutorService` - Action orchestration
- `ClaudeService` - AI processing

### External Libraries:
- `date-fns` - Date manipulation and formatting
- `date-fns/locale/de` - German date localization

## Performance Considerations

- ✅ Caching opportunities: Cash flow predictions can be cached for 5-10 minutes
- ✅ Async operations: All database queries are async
- ✅ Rate limiting: Existing chatbot rate limits apply (50 msg/hour)
- ✅ Data volume: Forecasts limited to max 90 days to control query size

## Security

- ✅ Permission-based access control
- ✅ Organization isolation (can only see own data)
- ✅ No sensitive data exposure in responses
- ✅ Input validation on all parameters
- ✅ Rate limiting to prevent abuse

## Future Enhancements

### Potential Additions:
1. **Scenario Planning Integration**
   - "What if I get a €50k invoice paid?"
   - "What if I delay payment on bill X?"

2. **Alert Subscriptions**
   - Daily/weekly cash flow summaries
   - Proactive low-balance warnings

3. **Visualization Data**
   - Return chart data for frontend rendering
   - Graph of daily projections

4. **Compare Periods**
   - "Compare this month to last month"
   - "Show year-over-year runway changes"

5. **Export Options**
   - PDF reports
   - CSV data export
   - Email scheduled reports

## Deployment Notes

### Pre-deployment Checklist:
- ✅ TypeScript compilation successful
- ✅ All handlers registered
- ✅ Module imports configured
- ✅ System prompts updated
- ⏳ Integration testing
- ⏳ Permission verification
- ⏳ Load testing

### Migration Required:
- ❌ No database migrations needed
- ✅ Uses existing schema

### Environment Variables:
- ❌ No new environment variables required

## Monitoring

### Metrics to Track:
- Usage frequency per action type
- Average response time
- Error rates
- Permission denial rates
- User satisfaction (if feedback collected)

### Logging:
- All handlers log execution start/end
- Errors logged with full context
- User/org IDs included for audit trail

## Documentation

### User-Facing Docs Needed:
1. Help article: "Understanding Cash Flow Queries"
2. Video tutorial: "Ask About Your Finances"
3. FAQ: Common cash flow questions

### Developer Docs:
- This implementation summary
- Handler architecture guide
- Action system documentation

## Success Criteria

✅ **Completed:**
- [x] 4 action types implemented
- [x] Natural language query support (German/English)
- [x] Formatted, readable responses
- [x] Permission-based access control
- [x] Integration with existing cash flow prediction service
- [x] System prompt documentation
- [x] Module configuration

⏳ **Pending:**
- [ ] End-to-end testing with real data
- [ ] User acceptance testing
- [ ] Performance benchmarking
- [ ] Production deployment

## Contact

**Implemented by:** ORACLE Agent
**Task:** S6-01 - Surface Cash Flow to Chat
**Date:** 2025-12-07
**Sprint:** 6 (Cash Flow Intelligence)
