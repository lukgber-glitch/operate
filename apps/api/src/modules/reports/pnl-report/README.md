# P&L Report Module

Specialized Profit & Loss Statement Generator for Operate/CoachOS

## Overview

The P&L Report module provides comprehensive financial reporting capabilities with advanced analytics, trend analysis, and forecasting. Built on top of the Report Generator, it offers specialized features for detailed profit and loss analysis.

## Features

### Core Capabilities
- **Full P&L Statement Generation** - Complete income statement with all standard sections
- **Multi-Period Comparative Analysis** - Side-by-side comparison of up to 12 periods
- **Department-Level P&L** - Isolated financial performance by department
- **Project-Level P&L** - Track profitability of individual projects
- **Budget Variance Analysis** - Compare actual vs budgeted performance
- **Trend Analysis** - Historical trend detection with seasonality identification
- **Financial Forecasting** - Predictive analytics using linear regression
- **Break-Even Analysis** - Calculate break-even points and contribution margins

### Analysis Types
- **Standard Analysis** - Traditional P&L format
- **Vertical Analysis** - All items as percentage of revenue (common-size)
- **Horizontal Analysis** - Period-over-period changes
- **Contribution Margin** - Variable cost analysis
- **Common-Size Statements** - Standardized comparison format

### P&L Statement Sections

1. **Revenue**
   - Breakdown by category, product, client, or department
   - Transaction counts and percentages
   - Growth trends

2. **Cost of Goods Sold (COGS)**
   - Direct costs and materials
   - Direct labor
   - Manufacturing costs

3. **Gross Profit**
   - Gross profit amount
   - Gross margin percentage
   - Period-over-period changes

4. **Operating Expenses**
   - Salaries and wages
   - Rent and utilities
   - Marketing and advertising
   - Administrative expenses
   - Depreciation and amortization

5. **EBITDA**
   - Earnings before interest, taxes, depreciation, and amortization
   - EBITDA margin

6. **Operating Income (EBIT)**
   - Operating income amount
   - Operating margin percentage

7. **Other Income & Expenses**
   - Interest income
   - Interest expense
   - Other non-operating items

8. **Pre-Tax Income**
   - Income before tax provision

9. **Tax Expense**
   - Corporate income tax (calculated based on country)

10. **Net Income**
    - Bottom-line profit
    - Net profit margin percentage

## API Endpoints

### Generate P&L Statement
```http
GET /reports/pnl
```

**Query Parameters:**
- `startDate` (optional) - Start date (YYYY-MM-DD)
- `endDate` (optional) - End date (YYYY-MM-DD)
- `periodType` (optional) - Quick period selection: MONTH, QUARTER, YEAR, CUSTOM
- `currency` (optional) - Currency code (default: EUR)
- `analysisType` (optional) - STANDARD, VERTICAL, HORIZONTAL, COMMON_SIZE, CONTRIBUTION_MARGIN
- `includeMargins` (optional) - Include margin analysis (default: true)
- `includeTrends` (optional) - Include trend analysis (default: true)
- `includeForecast` (optional) - Include forecast (default: false)
- `trendPeriods` (optional) - Number of periods for trend analysis (3-36, default: 12)

**Response:**
```json
{
  "metadata": {
    "organisationId": "org_123",
    "generatedAt": "2024-12-04T10:00:00Z",
    "periodStart": "2024-01-01T00:00:00Z",
    "periodEnd": "2024-12-31T23:59:59Z",
    "currency": "EUR",
    "analysisType": "STANDARD",
    "reportVersion": "2.0"
  },
  "summary": {
    "totalRevenue": 1000000,
    "totalCogs": 400000,
    "grossProfit": 600000,
    "totalOperatingExpenses": 350000,
    "ebitda": 250000,
    "operatingIncome": 230000,
    "netIncome": 150000
  },
  "revenue": { /* Revenue section */ },
  "cogs": { /* COGS section */ },
  "grossProfit": {
    "amount": 600000,
    "formattedAmount": "€600,000.00",
    "margin": 60.0
  },
  "operatingExpenses": { /* Operating expenses section */ },
  "ebitda": {
    "amount": 250000,
    "formattedAmount": "€250,000.00",
    "margin": 25.0
  },
  "operatingIncome": {
    "amount": 230000,
    "formattedAmount": "€230,000.00",
    "margin": 23.0
  },
  "netIncome": {
    "amount": 150000,
    "formattedAmount": "€150,000.00",
    "margin": 15.0
  },
  "marginAnalysis": { /* Margin analysis */ },
  "trends": [ /* Trend analysis */ ],
  "forecast": { /* Forecast data */ },
  "breakEvenAnalysis": { /* Break-even analysis */ }
}
```

### Generate Comparative P&L
```http
POST /reports/pnl/comparative
```

**Request Body:**
```json
{
  "periods": [
    {
      "startDate": "2024-01-01",
      "endDate": "2024-03-31",
      "label": "Q1 2024"
    },
    {
      "startDate": "2024-04-01",
      "endDate": "2024-06-30",
      "label": "Q2 2024"
    }
  ],
  "options": {
    "analysisType": "STANDARD",
    "includeMargins": true
  }
}
```

### Generate Department P&L
```http
GET /reports/pnl/department/:departmentId
```

**Path Parameters:**
- `departmentId` - Department ID

**Query Parameters:** Same as standard P&L endpoint

### Generate Project P&L
```http
GET /reports/pnl/project/:projectId
```

**Path Parameters:**
- `projectId` - Project ID

**Query Parameters:** Same as standard P&L endpoint

### Generate Budget Variance Report
```http
POST /reports/pnl/budget-variance
```

**Request Body:**
```json
{
  "budgetId": "budget_123",
  "startDate": "2024-01-01",
  "endDate": "2024-12-31",
  "options": {
    "analysisType": "STANDARD",
    "includeMargins": true
  }
}
```

### Get Trend Analysis
```http
GET /reports/pnl/trends
```

**Query Parameters:**
- `startDate` (required) - Analysis period start
- `endDate` (required) - Analysis period end
- `periods` (optional) - Number of historical periods (default: 12)
- `currency` (optional) - Currency code

### Generate Forecast
```http
GET /reports/pnl/forecast
```

**Query Parameters:**
- `startDate` (required) - Historical data start date
- `endDate` (required) - Historical data end date
- `periods` (optional) - Number of periods to analyze (min: 6, default: 12)
- `currency` (optional) - Currency code

### Get P&L Summary
```http
GET /reports/pnl/summary
```

Lightweight endpoint that returns only key metrics without detailed line items.

### Export P&L
```http
GET /reports/pnl/export
```

**Query Parameters:**
- `format` (required) - pdf, excel, or csv
- Plus all standard P&L query parameters

## Usage Examples

### TypeScript/NestJS

```typescript
import { PnlReportService } from '@/modules/reports/pnl-report';

@Injectable()
export class FinanceService {
  constructor(private readonly pnlReportService: PnlReportService) {}

  async getMonthlyPnl(organisationId: string, month: number, year: number) {
    const filters: PnlFilterDto = {
      startDate: `${year}-${month.toString().padStart(2, '0')}-01`,
      endDate: `${year}-${month.toString().padStart(2, '0')}-31`,
      currency: 'EUR',
    };

    const options: PnlOptionsDto = {
      analysisType: PnlAnalysisType.STANDARD,
      includeMargins: true,
      includeTrends: true,
      trendPeriods: 12,
    };

    return this.pnlReportService.generateFullPnlStatement(
      organisationId,
      filters,
      options,
    );
  }

  async compareDepartments(organisationId: string, departmentIds: string[]) {
    const reports = await Promise.all(
      departmentIds.map(deptId =>
        this.pnlReportService.generateDepartmentPnl(
          organisationId,
          deptId,
          { periodType: PnlPeriodType.YEAR },
          { includeMargins: true },
        ),
      ),
    );

    // Compare departments...
    return reports;
  }
}
```

### REST API (curl)

```bash
# Get current month P&L
curl -X GET "https://api.operate.com/reports/pnl?periodType=MONTH&includeMargins=true" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get comparative quarterly P&L
curl -X POST "https://api.operate.com/reports/pnl/comparative" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "periods": [
      { "startDate": "2024-01-01", "endDate": "2024-03-31", "label": "Q1" },
      { "startDate": "2024-04-01", "endDate": "2024-06-30", "label": "Q2" },
      { "startDate": "2024-07-01", "endDate": "2024-09-30", "label": "Q3" }
    ]
  }'

# Get department P&L
curl -X GET "https://api.operate.com/reports/pnl/department/dept_123?startDate=2024-01-01&endDate=2024-12-31" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get forecast
curl -X GET "https://api.operate.com/reports/pnl/forecast?startDate=2023-01-01&endDate=2024-12-31&periods=24" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Advanced Features

### Margin Analysis

The margin analysis feature provides:
- Gross margin %
- Operating margin %
- EBITDA margin %
- Net profit margin %
- Contribution margin %
- Period-over-period margin changes

### Trend Analysis

Identifies patterns in:
- Revenue growth
- Expense trends
- Margin expansion/contraction
- Seasonality detection
- Anomaly identification

**Seasonality Detection:** Uses autocorrelation at 12-month lag to detect yearly patterns.

### Financial Forecasting

Uses linear regression with historical ratios to forecast:
- Revenue
- COGS
- Gross profit
- Operating expenses
- Net income

**Confidence Score:** Based on data consistency (coefficient of variation)

### Break-Even Analysis

Calculates:
- Break-even revenue point
- Revenue above/below break-even
- Fixed vs variable cost ratio
- Contribution margin ratio

## Filters and Options

### Available Filters
- Date range (start/end dates or period type)
- Department
- Project
- Location
- Category inclusion/exclusion
- Currency

### Grouping Options
- By category (default)
- By department
- By project
- By product
- By client
- By location

### Analysis Options
- Include detailed line items
- Include margin analysis
- Include trend indicators
- Include forecasting
- Include budget variance
- Number of trend periods
- Currency conversion
- Show/hide zero values
- Round values

## Performance & Caching

### Caching Strategy
- Reports cached for 30 minutes by default
- Cache key includes: org ID, filters, options
- Redis-based caching for fast retrieval

### Performance Tips
1. Use `includeDetails: false` for summary-only requests
2. Limit trend periods to necessary range (default: 12)
3. Avoid excessive comparative periods (max: 12)
4. Use period type shortcuts (MONTH, QUARTER, YEAR) when possible

## Security & Permissions

### Required Roles
- `ADMIN` - Full access to all reports
- `ACCOUNTANT` - Full access to all reports
- `MANAGER` - Access to department/project reports
- `OWNER` - Full access to all reports
- `USER` - Limited access (summary only)

### Data Isolation
- All queries scoped to organisation
- Department and project filters enforced
- Role-based access control applied

## Integration with Report Generator

The P&L Report module extends the base Report Generator:
- Inherits caching mechanisms
- Uses common date range parsing
- Leverages currency formatting utilities
- Shares Prisma database service

## Database Schema Requirements

### Invoice Table
- `orgId` - Organisation ID
- `status` - Payment status (PAID, SENT, OVERDUE)
- `paidDate` - Payment date
- `totalAmount` - Total amount
- `taxAmount` - Tax amount
- `category` - Revenue category
- `clientName` - Client identifier
- `departmentId` (optional) - Department
- `projectId` (optional) - Project

### Expense Table
- `orgId` - Organisation ID
- `status` - Approval status (APPROVED, PENDING, SUBMITTED)
- `amount` - Expense amount
- `category` - Expense category
- `date` - Expense date
- `vendor` - Vendor name
- `departmentId` (optional) - Department
- `projectId` (optional) - Project
- `isDeductible` (optional) - Tax deductible flag

### Organisation Table
- `id` - Organisation ID
- `country` - Country code (for tax rates)

## Error Handling

### Common Errors
- `400 Bad Request` - Invalid parameters or date ranges
- `404 Not Found` - Department/project/budget not found
- `401 Unauthorized` - Missing or invalid auth token
- `403 Forbidden` - Insufficient permissions
- `500 Internal Server Error` - Server-side processing error

### Error Response Format
```json
{
  "statusCode": 400,
  "message": "Invalid date range: startDate must be before endDate",
  "error": "Bad Request"
}
```

## Testing

### Unit Tests
```bash
npm run test -- pnl-report.service.spec.ts
```

### Integration Tests
```bash
npm run test:e2e -- pnl-report.e2e-spec.ts
```

### Test Coverage
- Service methods: 95%+
- Controller endpoints: 90%+
- Edge cases: Comprehensive

## Changelog

### v2.0 (Current)
- Initial release of specialized P&L module
- Full P&L statement generation
- Comparative analysis
- Department and project-level P&L
- Budget variance analysis
- Trend analysis with seasonality
- Financial forecasting
- Break-even analysis
- Multiple analysis types

## Roadmap

### Planned Features
- Custom P&L templates
- Multi-currency consolidation
- Advanced cost allocation
- Segment reporting
- Industry benchmarking
- Automated insights and recommendations
- Machine learning-based forecasting
- Scenario planning and what-if analysis
- Real-time P&L updates

## Support

For issues or feature requests:
- GitHub Issues: [operate/issues](https://github.com/operate/operate)
- Email: support@operate.com
- Documentation: [docs.operate.com/reports/pnl](https://docs.operate.com/reports/pnl)

## License

Copyright © 2024 Operate/CoachOS. All rights reserved.
