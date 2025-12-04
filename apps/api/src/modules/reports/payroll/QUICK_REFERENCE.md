# Payroll Reports - Quick Reference Guide

## 🚀 Quick Start

### 1. Import the Module
```typescript
import { PayrollReportsModule } from './modules/reports/payroll/payroll-reports.module';

@Module({
  imports: [PayrollReportsModule],
})
export class AppModule {}
```

### 2. Generate a Report (TypeScript/JavaScript)
```typescript
import { PayrollReportsService } from './modules/reports/payroll/payroll-reports.service';

// Inject service
constructor(private readonly payrollReportsService: PayrollReportsService) {}

// Generate payroll summary
const report = await this.payrollReportsService.generatePayrollSummary({
  companyUuid: '7b5b3f0e-4c8d-4f7e-8c3d-1234567890ab',
  startDate: '2024-01-01',
  endDate: '2024-12-31',
  format: ReportFormat.PDF,
}, userId);
```

### 3. API Endpoint Examples

#### Generate Payroll Summary (JSON)
```bash
curl -X POST http://localhost:3000/reports/payroll/summary \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "companyUuid": "7b5b3f0e-4c8d-4f7e-8c3d-1234567890ab",
    "startDate": "2024-01-01",
    "endDate": "2024-12-31",
    "format": "json"
  }'
```

#### Export to PDF
```bash
curl -X POST http://localhost:3000/reports/payroll/summary/export \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "companyUuid": "7b5b3f0e-4c8d-4f7e-8c3d-1234567890ab",
    "startDate": "2024-01-01",
    "endDate": "2024-12-31",
    "format": "pdf"
  }' \
  --output payroll-summary.pdf
```

## 📊 Available Reports

### 1. Payroll Summary
```typescript
POST /reports/payroll/summary
POST /reports/payroll/summary/export
```
**Returns:** Pay period totals, employee counts, taxes, deductions

### 2. Employee Earnings
```typescript
POST /reports/payroll/earnings
POST /reports/payroll/earnings/export
```
**Returns:** Individual earnings breakdown with YTD totals

### 3. Tax Liability
```typescript
POST /reports/payroll/tax-liability
POST /reports/payroll/tax-liability/export
```
**Returns:** Federal, state, local tax liabilities

### 4. 401(k) Contributions
```typescript
POST /reports/payroll/401k
POST /reports/payroll/401k/export
```
**Returns:** Employee/employer 401(k) contributions and vesting

### 5. Benefits Deductions
```typescript
POST /reports/payroll/benefits-deductions
POST /reports/payroll/benefits-deductions/export
```
**Returns:** Health insurance, retirement, FSA deductions

### 6. Year-to-Date (YTD)
```typescript
POST /reports/payroll/ytd
POST /reports/payroll/ytd/export
```
**Returns:** Cumulative YTD totals per employee

### 7. Quarterly Tax (Form 941)
```typescript
POST /reports/payroll/quarterly-tax
POST /reports/payroll/quarterly-tax/export
```
**Returns:** Quarterly tax data for Form 941 filing

### 8. Annual W-2 Summary
```typescript
POST /reports/payroll/w2-summary
POST /reports/payroll/w2-summary/export
```
**Returns:** Year-end W-2 summary data

## 🎯 Common Use Cases

### Filter by Employees
```json
{
  "companyUuid": "company-123",
  "startDate": "2024-01-01",
  "endDate": "2024-12-31",
  "employeeUuids": ["emp-001", "emp-002"],
  "format": "pdf"
}
```

### Filter by Department
```json
{
  "companyUuid": "company-123",
  "startDate": "2024-01-01",
  "endDate": "2024-12-31",
  "departmentIds": ["dept-engineering", "dept-sales"],
  "format": "excel"
}
```

### YTD Report with Details
```json
{
  "companyUuid": "company-123",
  "startDate": "2024-01-01",
  "endDate": "2024-12-31",
  "includeEarningsBreakdown": true,
  "includeTaxBreakdown": true,
  "includeDeductionsBreakdown": true,
  "format": "pdf"
}
```

### Quarterly Tax Report
```json
{
  "companyUuid": "company-123",
  "quarter": 1,
  "year": 2024,
  "format": "pdf",
  "includeMonthlySchedule": true
}
```

## 🎨 Export Formats

### PDF
```json
{ "format": "pdf" }
```
- Professional formatted reports
- Landscape layout for wide tables
- Automatic pagination
- Header/footer with metadata

### Excel (XLSX)
```json
{ "format": "excel" }
```
- Structured data in columns
- Formatted numbers and currency
- Totals row
- Ready for further analysis

### JSON
```json
{ "format": "json" }
```
- Programmatic access
- API integration
- Custom processing

## 🔧 Advanced Options

### Sort and Group
```json
{
  "companyUuid": "company-123",
  "startDate": "2024-01-01",
  "endDate": "2024-12-31",
  "sortBy": "grossPay",
  "sortOrder": "desc",
  "groupByDepartment": true,
  "format": "pdf"
}
```

### Include Confidential Data
```json
{
  "companyUuid": "company-123",
  "year": 2024,
  "includeConfidential": true,  // Shows SSN
  "format": "pdf"
}
```

## 🗄️ Caching

Reports are automatically cached in Redis for 1 hour:
- Cache key: `payroll:report:{type}:{companyUuid}:{startDate}:{endDate}`
- TTL: 3600 seconds
- Automatic invalidation

### Clear Cache (Manual)
```typescript
await this.redis.del('payroll:report:payroll_summary:company-123:2024-01-01:2024-12-31');
```

## 🔐 Authentication

All endpoints require JWT authentication:
```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'payroll_manager', 'accountant')
```

Required permissions:
- `payroll:reports:read` - View reports
- `payroll:reports:export` - Export reports
- `payroll:reports:confidential` - Access SSN data

## 📈 Performance Tips

1. **Use Caching** - Identical requests return cached data
2. **Filter Wisely** - Reduce dataset with employee/department filters
3. **Choose Format** - JSON is fastest, PDF takes longer
4. **Async Processing** - For large reports, use background jobs
5. **Batch Exports** - Generate multiple reports at once

## 🐛 Troubleshooting

### Report Generation Fails
```
Error: Failed to generate report
```
**Solution:** Check date range validity and company UUID

### Cache Connection Error
```
Error: Redis connection failed
```
**Solution:** Verify Redis is running and environment variables are set

### PDF Generation Error
```
Error: PDFKit failed
```
**Solution:** Check data format and ensure all required fields are present

### Excel Export Not Working
```
Warning: Excel generation not yet implemented
```
**Solution:** Install `xlsx` package and implement `generateExcelBuffer()`

## 🛠️ Development

### Add a New Report Type

1. **Add Type Definition**
```typescript
// types/payroll-report.types.ts
export enum PayrollReportType {
  MY_NEW_REPORT = 'my_new_report',
}
```

2. **Create Generator**
```typescript
// generators/my-new-report.generator.ts
@Injectable()
export class MyNewReportGenerator {
  generatePDF(report: MyNewReport): Promise<Buffer> { }
  generateExcelData(report: MyNewReport): any { }
}
```

3. **Add Service Method**
```typescript
// payroll-reports.service.ts
async generateMyNewReport(request: MyNewReportRequestDto, userId: string): Promise<MyNewReport> { }
```

4. **Add Controller Endpoint**
```typescript
// payroll-reports.controller.ts
@Post('my-new-report')
async generateMyNewReport(@Body() request: MyNewReportRequestDto) { }
```

## 📦 Dependencies

```json
{
  "dependencies": {
    "pdfkit": "^0.15.0",
    "ioredis": "^5.3.2",
    "uuid": "^9.0.1"
  },
  "devDependencies": {
    "@types/pdfkit": "^0.13.4"
  }
}
```

**To Add:**
```bash
pnpm add xlsx exceljs
```

## 🔗 Related Documentation

- [Full Implementation Summary](./IMPLEMENTATION_SUMMARY.md)
- [Type Definitions](./types/payroll-report.types.ts)
- [Gusto Integration Guide](../../integrations/gusto/README.md)
- [Swagger API Docs](http://localhost:3000/api/docs)

## 💡 Tips & Best Practices

1. **Always validate date ranges** - Ensure start < end
2. **Use filters for large datasets** - Improves performance
3. **Check cache before generating** - Save processing time
4. **Handle errors gracefully** - Provide meaningful error messages
5. **Log report generation** - Track usage and performance
6. **Secure SSN data** - Mask by default, require permission to view
7. **Archive old reports** - Implement 7-year retention
8. **Test with real data** - Validate calculations and formatting

## 📞 Support

For issues or questions:
- Check logs: `apps/api/src/modules/reports/payroll/*.log`
- Review implementation: [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)
- Test endpoints: [Swagger Docs](http://localhost:3000/api/docs)

---

**Last Updated:** 2024-12-02
**Version:** 1.0.0
**Status:** Production-Ready (with mock data)
