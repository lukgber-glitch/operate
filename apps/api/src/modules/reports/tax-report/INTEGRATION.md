# Tax Report Module - Integration Guide

This guide explains how to integrate the Tax Report module into your application.

## Module Setup

### 1. Import the Module

Add the TaxReportModule to your ReportsModule:

```typescript
// apps/api/src/modules/reports/reports.module.ts
import { Module } from '@nestjs/common';
import { TaxReportModule } from './tax-report';
import { FinancialReportModule } from './financial-report';

@Module({
  imports: [
    TaxReportModule,
    FinancialReportModule,
    // ... other report modules
  ],
  exports: [TaxReportModule],
})
export class ReportsModule {}
```

### 2. Database Schema

Ensure your Prisma schema includes the required tables:

```prisma
// packages/database/prisma/schema.prisma

model TaxReport {
  id             String   @id @default(cuid())
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id])
  taxYear        Int
  country        String   // 'DE' or 'AT'
  reportType     String   // 'TAX_SUMMARY', 'VAT', 'INCOME_TAX'
  data           Json
  generatedAt    DateTime @default(now())
  generatedBy    String

  @@index([organizationId, taxYear])
  @@index([generatedAt])
  @@map("tax_reports")
}

model TaxExport {
  id             String   @id @default(cuid())
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id])
  taxYear        Int
  format         String   // 'ELSTER_XML', 'FINANZONLINE_XML'
  fileName       String
  content        String   @db.Text
  exportedAt     DateTime @default(now())
  exportedBy     String

  @@index([organizationId, taxYear])
  @@map("tax_exports")
}

model TaxAuditLog {
  id             String   @id @default(cuid())
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id])
  reportId       String?
  userId         String
  action         String
  field          String?
  oldValue       Json?
  newValue       Json?
  ipAddress      String?
  userAgent      String?
  timestamp      DateTime @default(now())

  @@index([organizationId, timestamp])
  @@index([reportId])
  @@map("tax_audit_logs")
}
```

Run migration:
```bash
npx prisma migrate dev --name add_tax_tables
```

## Usage Examples

### Basic Tax Summary

```typescript
import { Injectable } from '@nestjs/common';
import { TaxReportService, TaxReportCountry } from '@/modules/reports/tax-report';

@Injectable()
export class DashboardService {
  constructor(private readonly taxReportService: TaxReportService) {}

  async getOrganizationTaxSummary(orgId: string, year: number) {
    return this.taxReportService.generateTaxSummary({
      organizationId: orgId,
      taxYear: year,
      country: TaxReportCountry.GERMANY,
      includeDeductions: true,
      includeVat: true,
      includeAuditTrail: false,
    });
  }
}
```

### VAT Report for Monthly Filing

```typescript
async generateMonthlyVatReport(orgId: string, month: number, year: number) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0); // Last day of month

  return this.taxReportService.generateVatReport({
    organizationId: orgId,
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
    country: TaxReportCountry.GERMANY,
    period: 'MONTHLY',
    includeIntraEu: true,
  });
}
```

### Tax Deadline Reminders

```typescript
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class TaxReminderService {
  constructor(
    private readonly taxReportService: TaxReportService,
    private readonly notificationService: NotificationService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async checkTaxDeadlines() {
    const organizations = await this.getActiveOrganizations();

    for (const org of organizations) {
      const deadlines = this.taxReportService.trackDeadlines(
        org.country,
        new Date().getFullYear(),
      );

      // Find deadlines within 7 days
      const upcoming = deadlines.filter(
        (d) => !d.isOverdue && d.daysUntilDue <= 7 && d.daysUntilDue > 0,
      );

      if (upcoming.length > 0) {
        await this.notificationService.sendTaxDeadlineReminder(org, upcoming);
      }

      // Find overdue deadlines
      const overdue = deadlines.filter((d) => d.isOverdue);

      if (overdue.length > 0) {
        await this.notificationService.sendOverdueDeadlineAlert(org, overdue);
      }
    }
  }
}
```

### ELSTER Export for Annual Tax Return

```typescript
async exportAnnualTaxReturn(orgId: string, year: number) {
  const organization = await this.prisma.organization.findUnique({
    where: { id: orgId },
    include: { settings: true },
  });

  const elsterExport = await this.taxReportService.generateElsterExport({
    organizationId: orgId,
    taxYear: year,
    format: TaxExportFormat.ELSTER_XML,
    taxOfficeNumber: organization.settings.taxOfficeNumber,
    taxIdentifier: organization.settings.taxNumber,
  });

  // Save to file system or cloud storage
  await this.storageService.save(
    `tax-exports/${orgId}/${year}/${elsterExport.fileName}`,
    elsterExport.content,
  );

  return elsterExport;
}
```

### Deduction Analysis and Optimization

```typescript
async analyzePotentialDeductions(orgId: string, year: number) {
  const analysis = await this.taxReportService.analyzeDeductions(orgId, year);

  // Identify top opportunities
  const topOpportunities = analysis.potentialDeductions
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  // Calculate total potential savings
  const totalSavings = topOpportunities.reduce(
    (sum, d) => sum + d.amount * 0.42, // Assume 42% tax rate
    0,
  );

  return {
    currentDeductions: analysis.totalDeductions,
    potentialAdditional: topOpportunities.reduce((sum, d) => sum + d.amount, 0),
    estimatedSavings: totalSavings,
    recommendations: topOpportunities.map((d) => ({
      category: d.category,
      description: d.description,
      amount: d.amount,
      actionRequired: this.getActionForCategory(d.category),
    })),
  };
}
```

### Quarterly Tax Planning

```typescript
async planQuarterlyTaxes(orgId: string) {
  const currentYear = new Date().getFullYear();

  // Get YTD tax summary
  const summary = await this.taxReportService.generateTaxSummary({
    organizationId: orgId,
    taxYear: currentYear,
    country: TaxReportCountry.GERMANY,
    includeDeductions: true,
    includeVat: true,
  });

  // Get quarterly estimates
  const estimates = await this.taxReportService.generateQuarterlyEstimates(
    summary.incomeTax.taxLiability,
    currentYear,
  );

  // Find next payment
  const nextPayment = estimates.find((e) => e.status === 'PENDING');

  return {
    ytdSummary: {
      revenue: summary.incomeTax.grossRevenue,
      deductions: summary.incomeTax.totalDeductions,
      taxableIncome: summary.incomeTax.taxableIncome,
      estimatedTax: summary.incomeTax.taxLiability,
    },
    nextPayment,
    allEstimates: estimates,
    cashFlowImpact: this.calculateCashFlowImpact(estimates),
  };
}
```

## Frontend Integration

### React Component Example

```typescript
import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export function TaxSummaryDashboard({ organizationId }: { organizationId: string }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTaxSummary();
  }, [organizationId]);

  async function loadTaxSummary() {
    try {
      const response = await api.get('/reports/tax/summary', {
        params: {
          organizationId,
          taxYear: new Date().getFullYear(),
          country: 'DE',
          includeDeductions: true,
          includeVat: true,
        },
      });
      setSummary(response.data);
    } catch (error) {
      console.error('Failed to load tax summary:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div>Loading tax summary...</div>;
  if (!summary) return <div>No tax data available</div>;

  return (
    <div className="tax-summary">
      <h2>Tax Summary {summary.taxYear}</h2>

      <div className="income-tax-section">
        <h3>Income Tax</h3>
        <div className="metric">
          <label>Gross Revenue:</label>
          <span>{formatCurrency(summary.incomeTax.grossRevenue)}</span>
        </div>
        <div className="metric">
          <label>Total Deductions:</label>
          <span>{formatCurrency(summary.incomeTax.totalDeductions)}</span>
        </div>
        <div className="metric">
          <label>Taxable Income:</label>
          <span>{formatCurrency(summary.incomeTax.taxableIncome)}</span>
        </div>
        <div className="metric highlight">
          <label>Tax Liability:</label>
          <span>{formatCurrency(summary.incomeTax.taxLiability)}</span>
        </div>
        <div className="metric">
          <label>Effective Rate:</label>
          <span>{summary.incomeTax.effectiveTaxRate.toFixed(2)}%</span>
        </div>
      </div>

      <div className="vat-section">
        <h3>VAT Summary</h3>
        <div className="metric">
          <label>VAT Collected:</label>
          <span>{formatCurrency(summary.vat.totalVatCollected)}</span>
        </div>
        <div className="metric">
          <label>VAT Paid:</label>
          <span>{formatCurrency(summary.vat.totalVatPaid)}</span>
        </div>
        <div className="metric highlight">
          <label>Net VAT Position:</label>
          <span className={summary.vat.netVatPosition > 0 ? 'owe' : 'refund'}>
            {formatCurrency(Math.abs(summary.vat.netVatPosition))}
            {summary.vat.netVatPosition > 0 ? ' owed' : ' refund'}
          </span>
        </div>
      </div>

      <div className="deadlines-section">
        <h3>Upcoming Deadlines</h3>
        {summary.upcomingDeadlines.slice(0, 3).map((deadline, idx) => (
          <div key={idx} className={`deadline ${deadline.isOverdue ? 'overdue' : ''}`}>
            <span className="description">{deadline.description}</span>
            <span className="date">{new Date(deadline.dueDate).toLocaleDateString()}</span>
            <span className="days">
              {deadline.isOverdue
                ? `${Math.abs(deadline.daysUntilDue)} days overdue`
                : `${deadline.daysUntilDue} days`}
            </span>
          </div>
        ))}
      </div>

      <div className="actions">
        <button onClick={() => downloadElsterExport()}>
          Download ELSTER Export
        </button>
        <button onClick={() => viewDeductions()}>
          View Deductions Analysis
        </button>
      </div>
    </div>
  );
}
```

## API Integration Examples

### cURL Examples

```bash
# Get tax summary
curl -X GET "https://api.example.com/reports/tax/summary?organizationId=org-123&taxYear=2024&country=DE" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get VAT report
curl -X GET "https://api.example.com/reports/tax/vat?organizationId=org-123&startDate=2024-01-01&endDate=2024-01-31&country=DE" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Download ELSTER export
curl -X GET "https://api.example.com/reports/tax/export/elster?organizationId=org-123&taxYear=2024" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -o elster_2024.xml

# Get tax deadlines
curl -X GET "https://api.example.com/reports/tax/deadlines?country=DE&taxYear=2024" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Python Example

```python
import requests

API_BASE = "https://api.example.com"
TOKEN = "your_auth_token"

def get_tax_summary(org_id: str, year: int):
    response = requests.get(
        f"{API_BASE}/reports/tax/summary",
        params={
            "organizationId": org_id,
            "taxYear": year,
            "country": "DE",
            "includeDeductions": True,
            "includeVat": True,
        },
        headers={"Authorization": f"Bearer {TOKEN}"}
    )
    return response.json()

def export_elster(org_id: str, year: int):
    response = requests.get(
        f"{API_BASE}/reports/tax/export/elster",
        params={
            "organizationId": org_id,
            "taxYear": year,
        },
        headers={"Authorization": f"Bearer {TOKEN}"}
    )

    export_data = response.json()

    # Save to file
    with open(f"elster_{year}.xml", "w") as f:
        f.write(export_data["content"])

    return export_data

# Usage
summary = get_tax_summary("org-123", 2024)
print(f"Tax Liability: €{summary['incomeTax']['taxLiability']:,.2f}")
print(f"Effective Rate: {summary['incomeTax']['effectiveTaxRate']:.2f}%")

export_elster("org-123", 2024)
```

## Error Handling

```typescript
import { HttpException, HttpStatus } from '@nestjs/common';

async function generateTaxReport(orgId: string, year: number) {
  try {
    const summary = await taxReportService.generateTaxSummary({
      organizationId: orgId,
      taxYear: year,
      country: TaxReportCountry.GERMANY,
      includeDeductions: true,
      includeVat: true,
    });

    return summary;
  } catch (error) {
    if (error instanceof NotFoundException) {
      throw new HttpException(
        `Organization ${orgId} not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    if (error instanceof BadRequestException) {
      throw new HttpException(
        'Invalid tax year or parameters',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Log unexpected errors
    logger.error('Tax report generation failed', {
      orgId,
      year,
      error: error.message,
      stack: error.stack,
    });

    throw new HttpException(
      'Failed to generate tax report',
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
```

## Testing

```typescript
import { Test } from '@nestjs/testing';
import { TaxReportService } from './tax-report.service';

describe('Tax Report Integration', () => {
  let service: TaxReportService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [TaxReportService, PrismaService],
    }).compile();

    service = module.get<TaxReportService>(TaxReportService);
  });

  it('should calculate tax correctly for typical SME', async () => {
    const summary = await service.generateTaxSummary({
      organizationId: 'test-org',
      taxYear: 2024,
      country: TaxReportCountry.GERMANY,
    });

    expect(summary.incomeTax.taxableIncome).toBeGreaterThan(0);
    expect(summary.incomeTax.effectiveTaxRate).toBeLessThan(50);
  });
});
```

## Performance Optimization

For large organizations with many transactions:

```typescript
// Use pagination and caching
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class OptimizedTaxReportService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly taxReportService: TaxReportService,
  ) {}

  async getCachedTaxSummary(orgId: string, year: number) {
    const cacheKey = `tax_summary:${orgId}:${year}`;

    // Check cache first
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) return cached;

    // Generate report
    const summary = await this.taxReportService.generateTaxSummary({
      organizationId: orgId,
      taxYear: year,
    });

    // Cache for 1 hour
    await this.cacheManager.set(cacheKey, summary, 3600);

    return summary;
  }
}
```

## Security Considerations

1. **Access Control**: Only OWNER, ADMIN, and ACCOUNTANT roles can access tax reports
2. **Data Encryption**: All tax data is encrypted at rest
3. **Audit Logging**: All access to tax reports is logged
4. **Rate Limiting**: API endpoints are rate-limited to prevent abuse

```typescript
import { Throttle } from '@nestjs/throttler';

@Controller('reports/tax')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TaxReportController {
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 requests per minute
  @Get('summary')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.ACCOUNTANT)
  async getTaxSummary() {
    // ... implementation
  }
}
```

## Monitoring and Alerts

```typescript
import { Logger } from '@nestjs/common';
import { PrometheusService } from '@/monitoring/prometheus.service';

@Injectable()
export class TaxReportService {
  private readonly logger = new Logger(TaxReportService.name);

  constructor(
    private readonly prometheus: PrometheusService,
  ) {}

  async generateTaxSummary(dto: GenerateTaxSummaryDto) {
    const startTime = Date.now();

    try {
      const result = await this.generateReport(dto);

      // Track metrics
      this.prometheus.recordTaxReportGeneration(
        Date.now() - startTime,
        'success',
      );

      return result;
    } catch (error) {
      this.prometheus.recordTaxReportGeneration(
        Date.now() - startTime,
        'error',
      );

      // Alert on critical errors
      if (error instanceof DatabaseError) {
        this.alertService.sendCriticalAlert('Tax report database error', error);
      }

      throw error;
    }
  }
}
```
