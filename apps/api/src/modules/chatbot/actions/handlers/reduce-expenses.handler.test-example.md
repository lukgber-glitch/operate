# Reduce Expenses Handler - Test Examples

## Handler Implementation
**File**: `C:\Users\grube\op\operate-fresh\apps\api\src\modules\chatbot\actions\handlers\reduce-expenses.handler.ts`

## Overview
AI-powered expense reduction recommendations that analyze spending patterns and provide actionable insights to reduce costs.

---

## Features Implemented

### 1. Duplicate Detection
Finds expenses that may be duplicate charges (same vendor, similar amount, close dates)

**Algorithm**:
- Same vendor or similar description (70%+ similarity)
- Similar amount (within 5% difference)
- Close dates (within 7 days)

**Example Detection**:
```
Vendor: AWS
Date 1: 2024-12-01, Amount: €100.00
Date 2: 2024-12-03, Amount: €101.00
→ Flagged as potential duplicate
```

---

### 2. Recurring Subscription Analysis
Identifies recurring charges and calculates annual costs

**Algorithm**:
- Multiple charges from same vendor
- Similar amounts (within 10% variance)
- Regular intervals (monthly ±7 days, weekly ±3 days, quarterly ±14 days)

**Example Detection**:
```
Vendor: SaaS Tool
Charges: €49.99, €49.99, €49.99, €49.99 (monthly)
→ Annual cost: €599.88
→ Recommendation: Review for alternatives or better pricing
```

---

### 3. High-Spending Categories
Flags categories that represent >20% of total expenses

**Example Detection**:
```
Total Expenses: €10,000
Software Category: €3,500 (35%)
→ Flagged as high-spending
→ Potential 10% savings: €350
```

---

### 4. Month-over-Month Increases
Detects categories with >20% spending increase from previous period

**Example Detection**:
```
Previous Period: €500
Current Period: €700
Increase: 40%
→ Flagged for investigation
```

---

### 5. Unused Services Detection
Identifies recurring subscriptions with no recent charges (60+ days inactive)

**Example Detection**:
```
Last Charge: 75 days ago
Previous Pattern: Monthly €29.99
→ Potentially inactive service
→ Annual savings: ~€360
```

---

## Test Scenarios

### Scenario 1: "Where can I cut costs?"
**Input Parameters**: `{ timeframe: "month" }`

**Expected Response**:
```
💰 **Expense Reduction Analysis** (month)

Analyzed 47 expenses
Found 6 opportunities
**Potential savings: €1,250.00**

**Top Recommendations:**

🔴 **High Spending Category: Software**
   35.2% of total expenses (€2,450.00)
   💵 Potential savings: €245.00
   📋 This category represents 35.2% of your spending. Look for optimization opportunities: negotiate better rates, find cheaper alternatives, or reduce usage.

🟡 **Recurring Subscription: Adobe Creative Cloud**
   4 recurring charges detected, averaging €52.99/month
   💵 Potential savings: €158.97
   📋 Review this subscription (€635.88/year). Consider: negotiating a better rate, finding alternatives, or canceling if unused.

🟡 **Potential Duplicate Charges**
   Found 2 similar charges for "AWS Services" (Amazon Web Services)
   💵 Potential savings: €101.00
   📋 Review these charges for potential duplicates or billing errors. Contact the vendor if necessary.

**Next Steps:**
• Review flagged expenses in detail
• Contact vendors to negotiate better rates
• Cancel or downgrade unused services
• Set up alerts for unusual spending patterns
```

---

### Scenario 2: "Find duplicate subscriptions"
**Input Parameters**: `{ timeframe: "quarter" }`

**Expected Response**:
```
💰 **Expense Reduction Analysis** (quarter)

Analyzed 142 expenses
Found 3 opportunities
**Potential savings: €450.00**

**Top Recommendations:**

🔴 **Potential Duplicate Charges**
   Found 3 similar charges for "Zoom Subscription" (Zoom Video Communications)
   💵 Potential savings: €299.97
   📋 Review these charges for potential duplicates or billing errors. Contact the vendor if necessary.

🟡 **Recurring Subscription: Dropbox Business**
   12 recurring charges detected, averaging €15.00/month
   💵 Potential savings: €45.00
   📋 Review this subscription (€180.00/year). Consider: negotiating a better rate, finding alternatives, or canceling if unused.

🟡 **Recurring Subscription: Slack**
   12 recurring charges detected, averaging €8.75/month
   💵 Potential savings: €26.25
   📋 Review this subscription (€105.00/year). Consider: negotiating a better rate, finding alternatives, or canceling if unused.
```

---

### Scenario 3: "What's my highest expense category?"
**Input Parameters**: `{ timeframe: "year" }`

**Expected Response**:
```
💰 **Expense Reduction Analysis** (year)

Analyzed 538 expenses
Found 8 opportunities
**Potential savings: €4,320.00**

**Top Recommendations:**

🔴 **High Spending Category: Office Rent**
   42.1% of total expenses (€25,260.00)
   💵 Potential savings: €2,526.00
   📋 This category represents 42.1% of your spending. Look for optimization opportunities: negotiate better rates, find cheaper alternatives, or reduce usage.

🔴 **High Spending Category: Software**
   28.3% of total expenses (€16,980.00)
   💵 Potential savings: €1,698.00
   📋 This category represents 28.3% of your spending. Look for optimization opportunities: negotiate better rates, find cheaper alternatives, or reduce usage.

🟡 **Spending Increase: Marketing**
   45.2% increase from previous period (€1,800.00)
   💵 Potential savings: €900.00
   📋 Spending in Marketing increased by 45.2%. Investigate the cause: price increases, higher usage, or one-time expenses?
```

---

## Response Data Structure

```typescript
{
  success: true,
  message: "...", // Formatted message (shown above)
  entityType: "ExpenseAnalysis",
  data: {
    insights: [
      {
        type: "duplicate" | "subscription" | "high_category" | "increase" | "unused",
        title: "Potential Duplicate Charges",
        description: "Found 2 similar charges for...",
        potentialSavings: 101.00,
        severity: "high" | "medium" | "low",
        recommendation: "Review these charges..."
      }
      // ... more insights
    ],
    totalPotentialSavings: 1250.00,
    expensesAnalyzed: 47,
    timeframe: "month"
  }
}
```

---

## Insight Types Generated

1. **Duplicate Detection**
   - Type: `duplicate`
   - Severity: Based on amount (>€100 = high, else medium)
   - Savings: Sum of duplicate amounts

2. **Subscription Analysis**
   - Type: `subscription`
   - Severity: Based on monthly cost (>€50 = medium, else low)
   - Savings: 3 months of subscription (optimization potential)

3. **High Category Spending**
   - Type: `high_category`
   - Severity: Based on percentage (>40% = high, else medium)
   - Savings: 10% of category total

4. **Spending Increases**
   - Type: `increase`
   - Severity: Based on increase % (>50% = high, else medium)
   - Savings: 50% of the increase amount

5. **Unused Services**
   - Type: `unused`
   - Severity: Always low (needs verification)
   - Savings: 3 periods of subscription cost

---

## Integration Points

### 1. Registered in ChatbotModule
✅ Added to providers in `chatbot.module.ts`

### 2. Registered in ActionExecutorService
✅ Added to handler map with ActionType.REDUCE_EXPENSES

### 3. ActionType Enum
✅ Added `REDUCE_EXPENSES = 'reduce_expenses'` to action.types.ts

### 4. Permissions Required
- `reports:generate` - User must have reporting permissions

---

## Natural Language Triggers

The AI can trigger this action with queries like:
- "Where can I reduce spending?"
- "Where can I cut costs?"
- "Find duplicate subscriptions"
- "What's my highest expense category?"
- "Show me expense optimization opportunities"
- "How can I save money on expenses?"
- "Find wasteful spending"

---

## Performance Considerations

1. **Database Queries**: Single query fetches all expenses for period
2. **Analysis Algorithms**: All run in-memory after fetch
3. **Time Complexity**: O(n²) for duplicate detection, O(n) for others
4. **Recommended Limits**: Works efficiently up to ~1000 expenses per period

---

## Future Enhancements

1. **ML-Based Predictions**: Use AI to predict future spending patterns
2. **Vendor Benchmarking**: Compare prices against market averages
3. **Automated Negotiation**: Generate vendor negotiation emails
4. **Budget Alerts**: Proactive alerts when approaching spending limits
5. **Seasonal Analysis**: Detect seasonal spending patterns
6. **ROI Tracking**: Track return on investment for subscriptions
