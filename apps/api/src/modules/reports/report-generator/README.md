# Report Generator Module

Comprehensive financial reporting and analytics engine for Operate/CoachOS.

## Overview

The Report Generator provides enterprise-grade reporting capabilities with support for:

- **9 Report Types**: P&L, Cash Flow, Tax Summary, VAT, Balance Sheet, Expense, Revenue, AR Aging, AP Aging
- **Date Range Filtering**: Daily, Weekly, Monthly, Quarterly, Yearly, Custom
- **Comparison Periods**: Year-over-Year (YoY), Month-over-Month (MoM), Quarter-over-Quarter (QoQ)
- **Multi-Currency Support**: Automatic currency conversion with live rates
- **Performance Optimization**: Redis caching with configurable TTL
- **Drill-Down Analysis**: Navigate from summary to transaction-level detail
- **Custom Fields**: Formula builder for calculated metrics
- **Collaborative Features**: Annotations and comments on reports
- **Report Templates**: Save and reuse custom report configurations
- **Scheduled Reports**: Automated report generation with email delivery

## Architecture

```
report-generator/
├── dto/
│   ├── generate-report.dto.ts      # Request DTOs
│   ├── report-response.dto.ts      # Response DTOs
│   └── index.ts
├── interfaces/
│   ├── report.interfaces.ts        # Core types
│   └── index.ts
├── report-generator.service.ts     # Core business logic (~2,500 lines)
├── report-generator.controller.ts  # REST API endpoints
├── report-generator.module.ts      # NestJS module definition
└── README.md
```

## Report Types

### 1. Profit & Loss Statement (P&L)

Comprehensive income statement with:
- Revenue breakdown by category
- Cost of Goods Sold (COGS)
- Gross Profit and margin %
- Operating Expenses by category
- Operating Income and margin %
- Other Income/Expenses
- Net Income and profit margin %

### 2. Cash Flow Statement

Cash movement categorized by:
- **Operating Activities**: Cash from customers, operations
- **Investing Activities**: Capital expenditures, asset purchases
- **Financing Activities**: Loans, equity, dividends
- Beginning/ending cash balance

### 3. Tax Summary Report

Tax liability analysis:
- Total tax collected from sales
- Deductible expenses
- AI-suggested deductions (from classification module)
- Tax credits
- Net tax due
- Effective tax rate

### 4. VAT Report

Value-Added Tax reporting:
- VAT collected on sales
- VAT paid on purchases
- Net VAT position (payable/receivable)
- Country-specific VAT rate

### 5. Balance Sheet

Financial position snapshot:
- **Assets**: Current (AR), Fixed (equipment, property)
- **Liabilities**: Current (AP), Long-term (debt)
- **Equity**: Calculated as Assets - Liabilities
- Financial ratios: Current Ratio, Debt-to-Equity

### 6. Expense Report

Expense analysis with flexible grouping:
- By category, vendor, department, etc.
- Percentage of total
- Drill-down to individual transactions

### 7. Revenue Report

Revenue breakdown with flexible grouping:
- By client, product, channel, etc.
- Percentage of total
- Drill-down to invoices

### 8. AR Aging (Accounts Receivable)

Outstanding customer invoices by age:
- Current (0 days)
- 1-30 days
- 31-60 days
- 61-90 days
- 91-120 days
- 120+ days

### 9. AP Aging (Accounts Payable)

Pending vendor payments by age:
- Same buckets as AR Aging
- Average days outstanding
- Total overdue amount

## API Endpoints

### Generate Report

```http
POST /reports/generate
Authorization: Bearer {token}
Content-Type: application/json

{
  "reportType": "PL_STATEMENT",
  "dateRange": {
    "type": "MONTHLY",
    "startDate": "2024-01-01",
    "endDate": "2024-01-31"
  },
  "options": {
    "currency": "EUR",
    "comparison": {
      "type": "YOY",
      "startDate": "2023-01-01",
      "endDate": "2023-01-31"
    },
    "includeDetails": true,
    "cache": {
      "enabled": true,
      "ttlSeconds": 3600
    }
  }
}
```

### Quick Reports

Simplified endpoints for common reports:

```http
GET /reports/quick/profit-loss?startDate=2024-01-01&endDate=2024-01-31&currency=EUR
GET /reports/quick/cash-flow?startDate=2024-01-01&endDate=2024-01-31
GET /reports/quick/ar-aging?asOfDate=2024-01-31
GET /reports/quick/ap-aging?asOfDate=2024-01-31
```

### Report History

```http
GET /reports/history?page=1&limit=20&reportType=PL_STATEMENT
```

### Annotations

```http
POST /reports/{reportId}/annotations
{
  "sectionId": "revenue",
  "lineId": "revenue-0",
  "content": "Q1 revenue spike due to new product launch"
}
```

### Templates

```http
GET /reports/templates
POST /reports/templates
{
  "name": "Monthly P&L with Custom KPIs",
  "reportType": "PL_STATEMENT",
  "configuration": {...},
  "customFields": [
    {
      "name": "operatingCashFlowRatio",
      "formula": "operatingCashFlow / totalRevenue",
      "dependencies": ["operatingCashFlow", "totalRevenue"]
    }
  ]
}
```

### Compare Reports

```http
POST /reports/compare
{
  "reportIdA": "report-jan-2024",
  "reportIdB": "report-jan-2023",
  "includeDetails": true
}
```

### Scheduled Reports

```http
GET /reports/scheduled
POST /reports/scheduled
{
  "reportType": "PL_STATEMENT",
  "schedule": "0 9 1 * *",  // 9 AM on 1st of every month
  "recipients": ["cfo@company.com", "finance@company.com"],
  "options": {...}
}
```

## Usage Examples

### TypeScript/NestJS

```typescript
import { ReportGeneratorService } from './modules/reports/report-generator';
import { ReportType, DateRangeType } from './modules/reports/report-generator/interfaces';

// Inject the service
constructor(private readonly reportGenerator: ReportGeneratorService) {}

// Generate a P&L report
async generateMonthlyPL(orgId: string, userId: string) {
  const report = await this.reportGenerator.generateReport(
    orgId,
    userId,
    {
      reportType: ReportType.PL_STATEMENT,
      dateRange: {
        type: DateRangeType.MONTHLY,
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      },
      options: {
        currency: 'EUR',
        comparison: {
          type: 'YOY',
        },
        includeDetails: true,
      },
    },
  );

  console.log('Net Income:', report.summary.netIncome);
  console.log('Profit Margin:', report.summary.netProfitMargin + '%');
}
```

### cURL Examples

```bash
# Generate Profit & Loss
curl -X POST https://api.operate.com/reports/generate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reportType": "PL_STATEMENT",
    "dateRange": {
      "type": "QUARTERLY",
      "startDate": "2024-01-01",
      "endDate": "2024-03-31"
    }
  }'

# Quick AR Aging
curl https://api.operate.com/reports/quick/ar-aging?asOfDate=2024-01-31 \
  -H "Authorization: Bearer $TOKEN"

# Compare two periods
curl -X POST https://api.operate.com/reports/compare \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reportIdA": "q1-2024",
    "reportIdB": "q1-2023"
  }'
```

## Custom Formulas

Build calculated fields using simple formulas:

```typescript
{
  customFields: [
    {
      name: 'quickRatio',
      formula: '(currentAssets - inventory) / currentLiabilities',
      dependencies: ['currentAssets', 'inventory', 'currentLiabilities']
    },
    {
      name: 'revenuePerEmployee',
      formula: 'totalRevenue / employeeCount',
      dependencies: ['totalRevenue', 'employeeCount']
    }
  ]
}
```

## Performance Optimization

### Caching Strategy

Reports are automatically cached in Redis with configurable TTL:

```typescript
options: {
  cache: {
    enabled: true,
    ttlSeconds: 3600,  // 1 hour
    tags: ['financial', 'monthly']
  }
}
```

Cache keys are generated from:
- Organisation ID
- Report type
- Date range
- Currency
- Filters

### Pre-computation

For large datasets, enable background pre-computation:

```typescript
// Schedule daily pre-computation at 2 AM
{
  reportType: 'PL_STATEMENT',
  schedule: '0 2 * * *',
  options: {
    cache: {
      enabled: true,
      ttlSeconds: 86400  // 24 hours
    }
  }
}
```

## Data Sources

Reports pull data from:

- **Invoices**: Revenue, AR, tax collected
- **Expenses**: COGS, operating expenses, AP
- **Transactions**: General ledger entries
- **Bank Transactions**: Cash flow analysis
- **Deduction Suggestions**: AI-powered tax optimization

## Security & Permissions

Role-based access control (RBAC):

- **OWNER, ADMIN**: Full access to all reports
- **MANAGER**: Generate and view all reports
- **MEMBER**: Generate and view reports (no scheduling)
- **VIEWER**: View reports only (no generation)

## Monitoring & Logging

Performance metrics tracked for each report:

```typescript
{
  queryTimeMs: 145,
  processingTimeMs: 67,
  totalTimeMs: 212,
  recordsProcessed: 1523,
  cacheHit: false,
  memoryUsedMb: 45.2
}
```

Logged with correlation IDs for tracing:

```
[report-123e4567-e89b-12d3-a456-426614174000] Generating PL_STATEMENT for org abc123
[report-123e4567-e89b-12d3-a456-426614174000] Report generated successfully in 212ms
```

## Future Enhancements

Planned features:

- [ ] Export to PDF, Excel, CSV
- [ ] Interactive charts and visualizations
- [ ] Consolidated multi-entity reports
- [ ] Budget vs Actual analysis
- [ ] Forecast/projection capabilities
- [ ] Real-time WebSocket updates
- [ ] Mobile-optimized report views
- [ ] AI-powered insights and anomaly detection

## Support

For issues or questions:
- GitHub Issues: https://github.com/operate/coachos
- Documentation: https://docs.operate.com/reports
- Email: support@operate.com

## License

Proprietary - Operate/CoachOS Enterprise SaaS Platform
