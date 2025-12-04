# Report Export Service

Comprehensive PDF and Excel export service for generating professional reports with customizable templates, styling, and features.

## Features

### PDF Export
- ✅ Professional templates (P&L, Cash Flow, Tax Summary, Balance Sheet, etc.)
- ✅ Customizable styling (colors, fonts, layout)
- ✅ Watermark support
- ✅ Digital signature (placeholder for future implementation)
- ✅ Table of contents generation
- ✅ Executive summary sections
- ✅ Multi-language support (German, English)
- ✅ PDF/A compliance option
- ✅ Page numbering and headers/footers
- ✅ Data tables with totals
- ✅ Chart embedding (placeholder)

### Excel Export
- ✅ Multiple sheet workbooks
- ✅ Formula-enabled templates
- ✅ Conditional formatting
- ✅ Data validation
- ✅ Pivot tables (placeholder)
- ✅ Chart sheets
- ✅ Sheet protection
- ✅ Auto-fit columns
- ✅ Frozen header rows
- ✅ Alternating row colors
- ✅ Custom styling

### File Management
- ✅ Cloud storage upload
- ✅ Signed download URLs
- ✅ Automatic file cleanup (TTL-based)
- ✅ Batch export to ZIP
- ✅ Progress tracking
- ✅ Email delivery (placeholder)
- ✅ File size validation
- ✅ Checksum generation

## Installation

The service uses the following dependencies:

```bash
pnpm add exceljs @types/pdfkit
```

Existing dependencies:
- `pdfkit` - PDF generation
- `archiver` - ZIP file creation

## API Endpoints

### Generate PDF Report
```http
POST /api/reports/export/pdf
Authorization: Bearer {token}
Content-Type: application/json

{
  "reportData": {
    "organizationInfo": {
      "name": "Company Name",
      "address": "Street 123, City",
      "taxId": "DE123456789"
    },
    "reportTitle": "Monthly P&L Statement",
    "dateRange": {
      "from": "2024-01-01",
      "to": "2024-01-31"
    },
    "summary": {
      "totalRevenue": 150000,
      "totalExpenses": 95000,
      "netProfit": 55000,
      "profitMargin": 0.3667
    },
    "columns": [
      { "key": "account", "header": "Account", "width": 200 },
      { "key": "amount", "header": "Amount", "width": 100 }
    ],
    "rows": [
      { "account": "Sales Revenue", "amount": 150000 },
      { "account": "Operating Expenses", "amount": -95000 }
    ],
    "totals": {
      "amount": 55000
    }
  },
  "template": "pl_statement",
  "pageSize": "A4",
  "orientation": "portrait",
  "language": "de",
  "includeExecutiveSummary": true,
  "includeToc": false,
  "styleOptions": {
    "primaryColor": "#2563eb",
    "showPageNumbers": true
  }
}
```

Response:
```json
{
  "id": "pl_statement_2024-01-31_abc123.pdf",
  "fileName": "pl_statement_2024-01-31_abc123.pdf",
  "format": "pdf",
  "fileSizeBytes": 245678,
  "downloadUrl": "/api/reports/export/download/pl_statement_2024-01-31_abc123.pdf",
  "expiresAt": "2024-12-05T12:00:00Z",
  "deleteAt": "2024-12-05T12:00:00Z",
  "createdAt": "2024-12-04T12:00:00Z",
  "mimeType": "application/pdf",
  "checksum": "sha256hash..."
}
```

### Generate Excel Report
```http
POST /api/reports/export/excel
Authorization: Bearer {token}
Content-Type: application/json

{
  "reportData": {
    "organizationInfo": {
      "name": "Company Name"
    },
    "dateRange": {
      "from": "2024-01-01",
      "to": "2024-01-31"
    },
    "summary": {
      "totalRevenue": 150000,
      "totalExpenses": 95000,
      "netProfit": 55000
    },
    "columns": [
      { "key": "date", "header": "Date", "width": 15 },
      { "key": "description", "header": "Description", "width": 40 },
      { "key": "amount", "header": "Amount", "width": 15 }
    ],
    "rows": [
      { "date": "2024-01-15", "description": "Product Sale", "amount": 50000 },
      { "date": "2024-01-20", "description": "Service Revenue", "amount": 100000 }
    ]
  },
  "template": "financial_statement",
  "workbookName": "Financial Report January 2024",
  "includeSummarySheet": true,
  "includeCharts": true,
  "enableFormulas": true,
  "styleOptions": {
    "headerBackgroundColor": "#2563eb",
    "alternatingRows": true,
    "freezeHeader": true
  },
  "language": "de",
  "currency": "EUR"
}
```

### Batch Export
```http
POST /api/reports/export/batch
Authorization: Bearer {token}
Content-Type: application/json

{
  "reports": [
    {
      "reportId": "pl_2024_01",
      "format": "pdf",
      "template": "pl_statement",
      "options": { "reportData": {...} }
    },
    {
      "reportId": "cash_flow_2024_01",
      "format": "excel",
      "template": "cash_flow",
      "options": { "reportData": {...} }
    }
  ],
  "combineIntoZip": true,
  "zipFileName": "monthly_reports_2024_01.zip",
  "sendEmail": false
}
```

### Download File
```http
GET /api/reports/export/download/{fileId}
Authorization: Bearer {token}
```

Returns file stream with appropriate headers.

### List Templates
```http
GET /api/reports/export/templates
Authorization: Bearer {token}
```

Returns available PDF and Excel templates.

### Delete File
```http
DELETE /api/reports/export/{fileId}
Authorization: Bearer {token}
```

## Templates

### PDF Templates
- `pl_statement` - Profit & Loss Statement
- `cash_flow` - Cash Flow Statement
- `tax_summary` - Tax Summary Report
- `balance_sheet` - Balance Sheet
- `invoice_report` - Invoice Report
- `expense_report` - Expense Report
- `executive_dashboard` - Executive Dashboard
- `payroll_summary` - Payroll Summary
- `custom` - Custom Report

### Excel Templates
- `financial_statement` - Comprehensive Financial Statement
- `multi_sheet_workbook` - Multi-Sheet Workbook
- `tax_report` - Tax Report
- `payroll_report` - Payroll Report
- `invoice_register` - Invoice Register
- `expense_tracker` - Expense Tracker
- `cash_flow` - Cash Flow Analysis
- `custom` - Custom Template

## Usage Examples

### Basic PDF Export
```typescript
import { ExportService } from './export/export.service';

const reportData = {
  organizationInfo: { name: 'My Company' },
  reportTitle: 'Monthly Report',
  dateRange: { from: new Date('2024-01-01'), to: new Date('2024-01-31') },
  summary: {
    totalRevenue: 100000,
    totalExpenses: 60000,
    netProfit: 40000,
    profitMargin: 0.4
  },
  columns: [
    { key: 'item', header: 'Item', width: 200 },
    { key: 'amount', header: 'Amount', width: 100 }
  ],
  rows: [
    { item: 'Revenue', amount: 100000 },
    { item: 'Expenses', amount: -60000 }
  ],
  totals: { amount: 40000 }
};

const pdfBuffer = await exportService.generatePdf(
  reportData,
  PdfTemplate.PL_STATEMENT,
  {
    language: 'de',
    includeExecutiveSummary: true,
    styleOptions: {
      primaryColor: '#2563eb',
      showPageNumbers: true
    }
  }
);
```

### Excel with Formulas
```typescript
const excelBuffer = await exportService.generateExcel(
  reportData,
  ExcelTemplate.FINANCIAL_STATEMENT,
  {
    enableFormulas: true,
    formulas: [
      { cell: 'C10', formula: 'SUM(C2:C9)' },
      { cell: 'D10', formula: 'C10/B10' }
    ],
    conditionalFormatting: [
      {
        column: 'amount',
        ruleType: 'colorScale',
        config: {}
      }
    ],
    dataValidation: [
      {
        column: 'category',
        type: 'list',
        values: ['Revenue', 'Expense', 'Asset', 'Liability']
      }
    ]
  }
);
```

### Watermark
```typescript
const pdfBuffer = await exportService.generatePdf(
  reportData,
  PdfTemplate.EXECUTIVE_DASHBOARD,
  {
    watermark: {
      text: 'CONFIDENTIAL',
      opacity: 0.1,
      angle: 45,
      fontSize: 60
    }
  }
);
```

## Configuration

### Environment Variables
```env
UPLOADS_DIR=./uploads/exports
MAX_FILE_SIZE_MB=100
DEFAULT_FILE_TTL_SECONDS=86400
```

### Default Settings
- File TTL: 24 hours (86400 seconds)
- Max file size: 100 MB
- Default language: German (de)
- Default currency: EUR
- Default timezone: Europe/Berlin

## Utilities

### Format Utils
```typescript
import { FormatUtils } from './utils/format.utils';

FormatUtils.formatCurrency(1234.56, 'EUR', 'de-DE'); // "1.234,56 €"
FormatUtils.formatPercentage(0.3667, 2); // "36.67%"
FormatUtils.formatDate(new Date(), 'de-DE', 'Europe/Berlin'); // "04.12.2024"
FormatUtils.formatBytes(1234567); // "1.18 MB"
```

### Validation Utils
```typescript
import { ValidationUtils } from './utils/validation.utils';

ValidationUtils.validateReportData(reportData); // { valid: true, errors: [] }
ValidationUtils.isValidHexColor('#2563eb'); // true
ValidationUtils.isValidEmail('user@example.com'); // true
ValidationUtils.isValidCurrencyCode('EUR'); // true
```

## Future Enhancements

- [ ] Implement chart embedding in PDFs
- [ ] Add digital signature support using pdf-lib
- [ ] Implement PDF merging functionality
- [ ] Add email delivery service
- [ ] Implement pivot tables in Excel
- [ ] Add more chart types for Excel
- [ ] Support for custom fonts in PDFs
- [ ] Add QR code generation
- [ ] Implement barcode generation
- [ ] Add OCR for scanned documents
- [ ] Support for multi-page tables in PDF
- [ ] Add CSV export option
- [ ] Implement report scheduling
- [ ] Add report templates management UI

## Dependencies

### Required
- `pdfkit` - PDF generation
- `@types/pdfkit` - TypeScript types for PDFKit
- `exceljs` - Excel generation
- `archiver` - ZIP file creation
- `@types/archiver` - TypeScript types for archiver

### Optional (for future features)
- `pdf-lib` - PDF manipulation and digital signatures
- `node-signpdf` - Digital signature support
- `chart.js` - Chart generation
- `qrcode` - QR code generation
- `nodemailer` - Email delivery

## Testing

```bash
# Unit tests
npm test export.service.spec.ts

# E2E tests
npm run test:e2e export.e2e-spec.ts
```

## License

Proprietary - Operate/CoachOS
