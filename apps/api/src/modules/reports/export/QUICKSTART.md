# Export Service Quick Start

Get started with PDF and Excel report exports in 5 minutes!

## 1. Install (30 seconds)

```bash
cd apps/api
pnpm add exceljs
```

## 2. Import Module (30 seconds)

```typescript
// In reports.module.ts
import { ExportModule } from './export/export.module';

@Module({
  imports: [ExportModule],
})
export class ReportsModule {}
```

## 3. Generate Your First PDF (2 minutes)

```typescript
import { ExportService } from './export/export.service';
import { PdfTemplate } from './export/dto';

@Injectable()
export class MyReportService {
  constructor(private exportService: ExportService) {}

  async generateReport() {
    const pdfBuffer = await this.exportService.generatePdf(
      {
        organizationInfo: {
          name: 'My Company GmbH',
          address: 'Hauptstraße 123, 10115 Berlin',
          taxId: 'DE123456789',
        },
        reportTitle: 'Monthly P&L Statement',
        dateRange: {
          from: '2024-01-01',
          to: '2024-01-31',
        },
        summary: {
          totalRevenue: 150000,
          totalExpenses: 95000,
          netProfit: 55000,
          profitMargin: 0.3667,
        },
        columns: [
          { key: 'account', header: 'Account', width: 200 },
          { key: 'amount', header: 'Amount', width: 100 },
        ],
        rows: [
          { account: 'Sales Revenue', amount: 150000 },
          { account: 'Cost of Goods Sold', amount: -60000 },
          { account: 'Operating Expenses', amount: -35000 },
        ],
        totals: {
          account: 'Net Profit',
          amount: 55000,
        },
      },
      PdfTemplate.PL_STATEMENT,
      {
        language: 'de',
        includeExecutiveSummary: true,
        styleOptions: {
          primaryColor: '#2563eb',
          showPageNumbers: true,
        },
      }
    );

    // Save to file
    await this.exportService.uploadToStorage(pdfBuffer, 'my-report.pdf');
  }
}
```

## 4. Generate Excel (2 minutes)

```typescript
import { ExcelTemplate } from './export/dto';

async generateExcel() {
  const excelBuffer = await this.exportService.generateExcel(
    {
      organizationInfo: {
        name: 'My Company GmbH',
      },
      dateRange: {
        from: '2024-01-01',
        to: '2024-01-31',
      },
      summary: {
        totalRevenue: 150000,
        totalExpenses: 95000,
        netProfit: 55000,
      },
      columns: [
        { key: 'date', header: 'Date', width: 15 },
        { key: 'description', header: 'Description', width: 40 },
        { key: 'amount', header: 'Amount', width: 15 },
      ],
      rows: [
        { date: '2024-01-15', description: 'Product Sale', amount: 50000 },
        { date: '2024-01-20', description: 'Service Revenue', amount: 100000 },
        { date: '2024-01-25', description: 'Operating Costs', amount: -95000 },
      ],
    },
    ExcelTemplate.FINANCIAL_STATEMENT,
    {
      includeSummarySheet: true,
      includeCharts: true,
      enableFormulas: true,
      styleOptions: {
        headerBackgroundColor: '#2563eb',
        alternatingRows: true,
        freezeHeader: true,
      },
      language: 'de',
      currency: 'EUR',
    }
  );

  await this.exportService.uploadToStorage(excelBuffer, 'my-report.xlsx');
}
```

## 5. Use via API (30 seconds)

```bash
# Generate PDF
curl -X POST http://localhost:3000/api/reports/export/pdf \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d @pdf-request.json

# Download file
curl http://localhost:3000/api/reports/export/download/FILENAME.pdf \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -o report.pdf
```

## Common Use Cases

### Add Watermark

```typescript
{
  watermark: {
    text: 'CONFIDENTIAL',
    opacity: 0.1,
    angle: 45,
    fontSize: 60,
  }
}
```

### Add Formulas to Excel

```typescript
{
  enableFormulas: true,
  formulas: [
    { cell: 'C10', formula: 'SUM(C2:C9)' },
    { cell: 'D10', formula: 'C10/B10*100' },
  ]
}
```

### Batch Export

```typescript
const response = await fetch('/api/reports/export/batch', {
  method: 'POST',
  body: JSON.stringify({
    reports: [
      { reportId: 'pl_2024', format: 'pdf', template: 'pl_statement' },
      { reportId: 'tax_2024', format: 'excel', template: 'tax_report' },
    ],
    combineIntoZip: true,
    zipFileName: 'reports_2024.zip',
  }),
});
```

## Templates Available

### PDF
- `pl_statement` - Profit & Loss
- `cash_flow` - Cash Flow Statement
- `tax_summary` - Tax Summary
- `balance_sheet` - Balance Sheet
- `invoice_report` - Invoice Report
- `expense_report` - Expense Report
- `executive_dashboard` - Dashboard
- `payroll_summary` - Payroll
- `custom` - Custom

### Excel
- `financial_statement` - Financial Statement
- `multi_sheet_workbook` - Multi-Sheet
- `tax_report` - Tax Report
- `payroll_report` - Payroll
- `invoice_register` - Invoice Register
- `expense_tracker` - Expense Tracker
- `cash_flow` - Cash Flow
- `custom` - Custom

## Tips & Tricks

### 1. Multi-Language Reports
```typescript
{ language: 'de' }  // German
{ language: 'en' }  // English
```

### 2. Custom Colors
```typescript
{
  styleOptions: {
    primaryColor: '#2563eb',
    secondaryColor: '#1e40af',
    headerBackgroundColor: '#1f2937',
  }
}
```

### 3. Protect Excel Sheets
```typescript
{ sheetPassword: 'secret123' }
```

### 4. Conditional Formatting
```typescript
{
  conditionalFormatting: [
    {
      column: 'amount',
      ruleType: 'colorScale',
      config: {},
    }
  ]
}
```

### 5. Data Validation
```typescript
{
  dataValidation: [
    {
      column: 'category',
      type: 'list',
      values: ['Revenue', 'Expense'],
    }
  ]
}
```

## Troubleshooting

**Q: Module not found error?**
A: Run `pnpm add exceljs` in `apps/api` directory

**Q: File not found when downloading?**
A: Files auto-delete after 24 hours. Generate a new one.

**Q: PDF/Excel looks wrong?**
A: Check your `reportData` structure matches the template requirements

**Q: Large file generation is slow?**
A: Use batch export and pagination for large datasets

## Next Steps

1. Read the full [README.md](./README.md) for detailed API docs
2. Check [INSTALLATION.md](./INSTALLATION.md) for production setup
3. Review template configurations in `templates/` directory
4. Explore utility functions in `utils/` directory

## Examples

Full working examples are in the README.md file!

## Support

Need help? Check:
- README.md - Full documentation
- Swagger UI - Interactive API docs
- Source code - Well-commented
- Tests - Usage examples

Happy exporting! 📊📄✨
