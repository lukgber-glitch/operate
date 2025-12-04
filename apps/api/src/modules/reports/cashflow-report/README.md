# Cash Flow Report Module

Comprehensive IFRS/GAAP compliant cash flow statement generation and analysis module for Operate/CoachOS.

## Overview

This module provides enterprise-grade cash flow reporting capabilities including:

- **Cash Flow Statements** (IAS 7 / ASC 230 compliant)
- **Cash Flow Projections** with multiple forecasting methods
- **Burn Rate Analysis** and runway calculations
- **Free Cash Flow** calculations and quality metrics
- **Liquidity Risk Assessment** with actionable insights
- **Cash Conversion Cycle** analysis and optimization
- **Comprehensive Financial Ratios** for decision-making

## Features

### 1. Cash Flow Statement Generation

#### Indirect Method (Primary)
- Starts with net income
- Adjusts for non-cash items (depreciation, amortization, etc.)
- Accounts for working capital changes
- Most commonly used in financial reporting

#### Direct Method (Alternative)
- Shows actual cash receipts and payments
- More granular detail of operating activities
- Preferred by some analysts for cash management

### 2. Cash Flow Categories

**Operating Activities:**
- Net Income
- Non-cash adjustments (depreciation, amortization, stock compensation)
- Working capital changes (AR, AP, inventory, prepaid, accrued)
- Quality of earnings analysis

**Investing Activities:**
- Capital expenditures (PP&E purchases)
- Asset sales
- Investment purchases/sales
- Business acquisitions/disposals
- Loans given/collected

**Financing Activities:**
- Debt proceeds and repayments
- Equity issuance and buybacks
- Dividend payments
- Lease principal payments

### 3. Advanced Analytics

#### Cash Flow Ratios
- **Operating Cash Flow Ratio** = OCF / Current Liabilities
- **Cash Flow Margin** = OCF / Revenue
- **Cash Return on Assets** = OCF / Total Assets
- **Debt Service Coverage** = OCF / Total Debt Service
- **Interest Coverage** = OCF / Interest Paid

#### Free Cash Flow
- **FCF** = Operating Cash Flow - CapEx
- **Unlevered FCF** (before interest)
- **Levered FCF** (after debt service)
- FCF Margin and Conversion Rate
- Quality assessment and sustainability score

#### Cash Conversion Cycle
- **DSO** (Days Sales Outstanding) - collection period
- **DIO** (Days Inventory Outstanding) - holding period
- **DPO** (Days Payables Outstanding) - payment period
- **CCC** = DSO + DIO - DPO
- Optimization opportunities

#### Burn Rate & Runway
- Average monthly burn rate
- Months of runway remaining
- Burn rate trend analysis
- Growth-adjusted calculations
- Critical alerts and warnings

#### Liquidity Risk Analysis
- Current, Quick, and Cash ratios
- Working capital assessment
- Risk scoring (0-100)
- Severity-based alerts
- Mitigation recommendations

### 4. Cash Flow Projections

**Projection Methods:**
- **Linear** - Simple straight-line projection
- **Weighted Average** - Recent data weighted more heavily
- **Seasonal** - Accounts for seasonal patterns
- **Trend Analysis** - Advanced trend-based forecasting

**Projection Features:**
- Configurable forecast period (1-24 months)
- Historical analysis baseline (3-24 months)
- Confidence intervals
- Best/worst case scenarios
- Minimum/maximum cash position tracking

## API Endpoints

### Primary Endpoints

```typescript
// Generate cash flow statement
GET /reports/cashflow/:orgId
Query: GenerateCashFlowStatementDto

// Indirect method (most common)
GET /reports/cashflow/:orgId/indirect

// Direct method
GET /reports/cashflow/:orgId/direct

// Cash flow projection
POST /reports/cashflow/:orgId/projection
Body: CashFlowProjectionDto

// Burn rate analysis
GET /reports/cashflow/:orgId/runway
Query: BurnRateAnalysisDto

// Cash flow ratios
GET /reports/cashflow/:orgId/ratios
Query: CashFlowRatiosDto
```

### Analysis Endpoints

```typescript
// Free cash flow
GET /reports/cashflow/:orgId/free-cash-flow

// Liquidity risks
GET /reports/cashflow/:orgId/liquidity-risks

// Cash conversion cycle
GET /reports/cashflow/:orgId/conversion-cycle

// Comprehensive analysis
POST /reports/cashflow/:orgId/analysis
Body: CashFlowAnalysisDto
```

### Detail Endpoints

```typescript
// Operating activities detail
GET /reports/cashflow/:orgId/operating

// Investing activities detail
GET /reports/cashflow/:orgId/investing

// Financing activities detail
GET /reports/cashflow/:orgId/financing

// Export statement
GET /reports/cashflow/:orgId/export
```

## Usage Examples

### Generate Basic Cash Flow Statement

```typescript
// Quarterly cash flow statement
GET /reports/cashflow/org-123?periodType=QUARTERLY&method=INDIRECT

// Custom date range
GET /reports/cashflow/org-123?startDate=2024-01-01&endDate=2024-12-31

// With comparison to previous period
GET /reports/cashflow/org-123?periodType=ANNUAL&includeComparison=true
```

### Project Future Cash Position

```typescript
POST /reports/cashflow/org-123/projection
{
  "months": 12,
  "method": "WEIGHTED_AVERAGE",
  "historicalMonths": 12,
  "includeConfidenceIntervals": true,
  "includeScenarios": true
}
```

### Analyze Burn Rate

```typescript
// 6-month burn analysis
GET /reports/cashflow/org-123/runway?months=6&includeRunway=true

// With growth adjustment
GET /reports/cashflow/org-123/runway?months=6&includeGrowthAdjusted=true
```

### Calculate Cash Flow Ratios

```typescript
GET /reports/cashflow/org-123/ratios?startDate=2024-01-01&endDate=2024-12-31
```

### Comprehensive Analysis

```typescript
POST /reports/cashflow/org-123/analysis
{
  "startDate": "2024-01-01",
  "endDate": "2024-12-31",
  "includeCashConversionCycle": true,
  "includeQualityOfEarnings": true,
  "includeLiquidityRisks": true,
  "includeFreeCashFlow": true
}
```

## Response Structure

### Cash Flow Statement

```typescript
{
  "id": "CF-1234567890-abc123",
  "organisationId": "org-123",
  "period": {
    "startDate": "2024-01-01T00:00:00Z",
    "endDate": "2024-12-31T23:59:59Z",
    "label": "FY 2024",
    "daysInPeriod": 366
  },
  "method": "INDIRECT",
  "currency": "EUR",
  "generatedAt": "2024-12-04T10:30:00Z",

  "operatingActivities": {
    "netIncome": 150000,
    "adjustments": {
      "depreciation": 25000,
      "amortization": 5000,
      "totalAdjustments": 30000
    },
    "workingCapitalChanges": {
      "accountsReceivableChange": -10000,
      "accountsPayableChange": 5000,
      "totalWorkingCapitalChange": -5000
    },
    "netCashFromOperatingActivities": 175000
  },

  "investingActivities": {
    "purchaseOfPPE": -50000,
    "proceedsFromSaleOfPPE": 10000,
    "netCashFromInvestingActivities": -40000
  },

  "financingActivities": {
    "proceedsFromBorrowing": 100000,
    "repaymentOfBorrowing": -30000,
    "dividendsPaid": -20000,
    "netCashFromFinancingActivities": 50000
  },

  "summary": {
    "netIncreaseDecreaseInCash": 185000,
    "cashAtBeginningOfPeriod": 75000,
    "cashAtEndOfPeriod": 260000,
    "cashAndCashEquivalents": {
      "cash": 208000,
      "cashEquivalents": 52000,
      "total": 260000
    },
    "reconciliationCheck": true
  }
}
```

### Burn Rate Analysis

```typescript
{
  "analysisDate": "2024-12-04T10:30:00Z",
  "periodMonths": 6,
  "averageMonthlyBurn": -25000,
  "netBurnRate": -25000,
  "grossBurnRate": 25000,
  "currentCash": 260000,
  "monthsOfRunway": 10.4,
  "runwayEndDate": "2025-10-15T00:00:00Z",
  "burnRateTrend": "STABLE",
  "monthlyBurnHistory": [
    {
      "month": "2024-06",
      "operatingCF": -22000,
      "burnRate": -22000,
      "endingCash": 238000
    },
    // ... more months
  ],
  "alerts": [
    {
      "severity": "INFO",
      "type": "RUNWAY_HEALTHY",
      "message": "10.4 months of runway - above recommended minimum",
      "recommendedAction": null
    }
  ]
}
```

### Cash Flow Ratios

```typescript
{
  "operatingCashFlowRatio": 3.5,
  "cashFlowMargin": 35.2,
  "cashReturnOnAssets": 25.8,
  "debtServiceCoverageRatio": 5.8,
  "interestCoverageRatio": 12.5,
  "cashConversionCycle": 45.2,
  "daysSalesOutstanding": 35,
  "daysPayablesOutstanding": 25,
  "qualityOfEarnings": 1.17,
  "accrualRatio": -0.05,
  "freeCashFlow": 125000
}
```

## Standards Compliance

### IFRS (IAS 7)
- Classification of cash flows (operating, investing, financing)
- Indirect and direct methods supported
- Cash and cash equivalents definition
- Non-cash transactions disclosure

### US GAAP (ASC 230)
- Statement of cash flows presentation
- Operating activities methods
- Restricted cash reconciliation
- Supplemental disclosures

## Integration

### With Other Modules

```typescript
// Integration with P&L for net income
import { PnLReportService } from '../pnl-report';

// Integration with Balance Sheet for working capital
import { BalanceSheetService } from '../balance-sheet';

// Integration with Tax for tax payments
import { TaxService } from '../../tax';
```

### Database Models Required

- `Transaction` - All financial transactions
- `Invoice` - Revenue recognition and AR
- `Organisation` - Company settings
- Financial accounts (cash, AP, AR, etc.)

## Quality Metrics

### Data Quality Assessment
- **Completeness** - Percentage of period with data
- **Accuracy** - Validation of calculations
- **Warnings** - Missing or estimated values
- **Reconciliation** - Cash balance validation

### Statement Quality
- Cash reconciliation check (must balance)
- Quality of earnings ratio (OCF/Net Income)
- Accrual ratio for earnings quality
- Free cash flow sustainability score

## Best Practices

### For Startups
1. Monitor burn rate monthly
2. Maintain 6+ months runway
3. Track free cash flow trends
4. Focus on cash conversion cycle

### For Growth Companies
1. Use weighted average projections
2. Monitor growth-adjusted burn
3. Optimize working capital
4. Track operating cash flow margin

### For Established Companies
1. Use indirect method for consistency
2. Compare to industry benchmarks
3. Focus on debt service coverage
4. Maintain strong current ratio (>1.5)

## Error Handling

All endpoints include comprehensive error handling:

- **404** - Organisation not found
- **400** - Invalid date range or parameters
- **400** - Insufficient historical data
- **500** - Calculation or database errors

## Performance Considerations

- Caching recommended for frequent queries
- Large date ranges may take longer to process
- Projections calculated on-demand (not cached)
- Transaction aggregations optimized with indexes

## Future Enhancements

- [ ] Multi-currency consolidation
- [ ] Segment-level cash flow analysis
- [ ] Machine learning for projections
- [ ] Automated anomaly detection
- [ ] Integration with bank feeds
- [ ] Real-time cash dashboards
- [ ] PDF/Excel export formatting
- [ ] Industry benchmark comparisons

## Support

For issues or questions:
- Review this documentation
- Check API response error messages
- Verify data completeness
- Ensure proper date formats (ISO 8601)

## License

Part of Operate/CoachOS - Enterprise SaaS Platform
