# AR/AP Aging Reports

Comprehensive Accounts Receivable and Accounts Payable aging reports with standard aging buckets.

## Overview

The aging reports module provides detailed analysis of outstanding invoices and bills, categorized by days overdue. This helps businesses:

- Track cash flow and payment collection
- Identify late-paying customers and overdue vendor bills
- Prioritize collection efforts and payment planning
- Monitor financial health

## Features

### AR (Accounts Receivable) Aging
- **Standard Aging Buckets**: Current, 1-30, 31-60, 61-90, 90+ days
- **Customer Breakdown**: Aging analysis by customer
- **Summary Metrics**: Total receivables, overdue amounts, percentages
- **Export Options**: CSV and PDF formats

### AP (Accounts Payable) Aging
- **Standard Aging Buckets**: Current, 1-30, 31-60, 61-90, 90+ days
- **Vendor Breakdown**: Aging analysis by vendor
- **Summary Metrics**: Total payables, overdue amounts, percentages
- **Export Options**: CSV and PDF formats

## API Endpoints

### AR Aging Endpoints

#### Get AR Aging Report
```
GET /reports/ar-aging
```

Query Parameters:
- `asOfDate` (optional): As of date (YYYY-MM-DD), defaults to today
- `customerId` (optional): Filter by specific customer ID
- `minAmount` (optional): Minimum amount to include
- `currency` (optional): Currency code (default: EUR)

Example Response:
```json
{
  "organizationId": "org_123",
  "generatedAt": "2024-12-07T00:00:00Z",
  "asOfDate": "2024-12-07T00:00:00Z",
  "currency": "EUR",
  "summary": {
    "totalReceivables": 50000.00,
    "totalOverdue": 15000.00,
    "overduePercentage": 30.0,
    "customerCount": 25,
    "invoiceCount": 47
  },
  "buckets": [
    {
      "label": "Current",
      "minDays": -Infinity,
      "maxDays": 0,
      "total": 35000.00,
      "count": 30,
      "invoices": [...]
    },
    {
      "label": "1-30 Days",
      "minDays": 1,
      "maxDays": 30,
      "total": 8000.00,
      "count": 10,
      "invoices": [...]
    },
    ...
  ],
  "byCustomer": [
    {
      "customerId": "cust_456",
      "customerName": "Acme Corp",
      "total": 12000.00,
      "current": 8000.00,
      "overdue30": 2000.00,
      "overdue60": 1000.00,
      "overdue90": 500.00,
      "overdue90Plus": 500.00
    },
    ...
  ]
}
```

#### Export AR Aging to CSV
```
GET /reports/ar-aging/export/csv
```

Returns CSV file with columns:
- Customer
- Invoice Number
- Issue Date
- Due Date
- Amount
- Amount Due
- Days Overdue
- Bucket
- Status

#### Export AR Aging to PDF
```
GET /reports/ar-aging/export/pdf
```

Returns formatted PDF report with:
- Company header
- Summary section
- Aging buckets breakdown
- Customer aging table

### AP Aging Endpoints

#### Get AP Aging Report
```
GET /reports/ap-aging
```

Query Parameters:
- `asOfDate` (optional): As of date (YYYY-MM-DD), defaults to today
- `vendorId` (optional): Filter by specific vendor ID
- `minAmount` (optional): Minimum amount to include
- `currency` (optional): Currency code (default: EUR)

Example Response:
```json
{
  "organizationId": "org_123",
  "generatedAt": "2024-12-07T00:00:00Z",
  "asOfDate": "2024-12-07T00:00:00Z",
  "currency": "EUR",
  "summary": {
    "totalPayables": 30000.00,
    "totalOverdue": 8000.00,
    "overduePercentage": 26.67,
    "vendorCount": 15,
    "billCount": 32
  },
  "buckets": [...],
  "byVendor": [...]
}
```

#### Export AP Aging to CSV
```
GET /reports/ap-aging/export/csv
```

Returns CSV file with vendor bill details.

#### Export AP Aging to PDF
```
GET /reports/ap-aging/export/pdf
```

Returns formatted PDF report with vendor aging analysis.

## File Structure

```
apps/api/src/modules/reports/
├── aging/
│   └── types/
│       └── aging-report.types.ts    # Shared types
├── ar-aging/
│   ├── ar-aging.controller.ts       # AR API endpoints
│   ├── ar-aging.service.ts          # AR business logic
│   ├── ar-aging.module.ts           # AR module definition
│   └── index.ts                     # AR exports
└── ap-aging/
    ├── ap-aging.controller.ts       # AP API endpoints
    ├── ap-aging.service.ts          # AP business logic
    ├── ap-aging.module.ts           # AP module definition
    └── index.ts                     # AP exports
```

## Implementation Details

### Aging Buckets

Both AR and AP use standard aging buckets:
1. **Current**: Not yet due (daysOverdue <= 0)
2. **1-30 Days**: 1-30 days overdue
3. **31-60 Days**: 31-60 days overdue
4. **61-90 Days**: 61-90 days overdue
5. **90+ Days**: More than 90 days overdue

### Calculation Logic

Days overdue is calculated as:
```typescript
const daysOverdue = differenceInDays(asOfDate, dueDate);
```

Amount due is calculated as:
```typescript
const amountDue = totalAmount - paidAmount;
```

### Data Sources

**AR Aging:**
- Source: `Invoice` table
- Statuses: SENT, OVERDUE, PARTIALLY_PAID
- Joins: `Customer` table for customer details

**AP Aging:**
- Source: `Bill` table
- Statuses: PENDING, APPROVED, OVERDUE
- Joins: `Vendor` table for vendor details

### PDF Generation

PDFs are generated using PDFKit with:
- Company header with logo placeholder
- Summary metrics section
- Aging buckets breakdown
- Detailed customer/vendor aging table
- Professional formatting

### CSV Export

CSV exports include all invoice/bill details with columns for easy Excel import and analysis.

## Usage Examples

### Get AR Aging for Specific Customer
```bash
curl -X GET "https://operate.guru/api/v1/reports/ar-aging?customerId=cust_123" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Export AP Aging to PDF
```bash
curl -X GET "https://operate.guru/api/v1/reports/ap-aging/export/pdf" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  --output ap-aging.pdf
```

### Get AR Aging as of Specific Date
```bash
curl -X GET "https://operate.guru/api/v1/reports/ar-aging?asOfDate=2024-11-30" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Security

All endpoints require:
- JWT authentication
- Role-based access: ADMIN, ACCOUNTANT, MANAGER, or OWNER

## Dependencies

- `date-fns`: Date calculations
- `pdfkit`: PDF generation
- `@prisma/client`: Database access
- `@nestjs/common`: NestJS framework

## Future Enhancements

Potential improvements:
- Email delivery of reports on schedule
- Trend analysis over time
- Automated collection reminders based on aging
- Integration with payment processing
- Custom aging bucket definitions
- Multi-currency support with conversion
- Excel export with formatting and charts
