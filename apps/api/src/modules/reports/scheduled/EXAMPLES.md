# Scheduled Reports - Configuration Examples

Real-world examples for common scheduling scenarios.

## Table of Contents

1. [Financial Reports](#financial-reports)
2. [Tax Reports](#tax-reports)
3. [Management Reports](#management-reports)
4. [Advanced Scheduling](#advanced-scheduling)
5. [Delivery Patterns](#delivery-patterns)
6. [Multi-Format Reports](#multi-format-reports)

---

## Financial Reports

### Monthly P&L Statement

Sent on the 1st of each month at 9 AM with previous month's data.

```json
{
  "orgId": "org_finance_001",
  "name": "Monthly P&L Statement",
  "description": "Profit & Loss statement for previous month",
  "schedule": {
    "frequency": "monthly",
    "timeOfDay": "09:00",
    "timezone": "Europe/Berlin",
    "dayOfMonth": 1
  },
  "reportParams": {
    "reportType": "profit_loss",
    "dateRange": {
      "type": "last_month"
    },
    "format": "pdf",
    "includeCharts": true,
    "includeDetails": true,
    "includeComparison": true,
    "filters": {
      "currency": "EUR"
    }
  },
  "deliveryConfig": {
    "method": "email",
    "email": {
      "recipients": [
        "cfo@company.com",
        "finance-team@company.com"
      ],
      "cc": ["board@company.com"],
      "subject": "Monthly P&L Statement - {{period}}",
      "body": "Dear Team,\n\nPlease find attached the P&L statement for {{period}}.\n\nThis report was automatically generated on {{generatedAt}}.\n\nBest regards,\nFinance System"
    }
  }
}
```

### Weekly Cash Flow Report

Every Monday at 8 AM with previous week's data.

```json
{
  "orgId": "org_finance_001",
  "name": "Weekly Cash Flow",
  "schedule": {
    "frequency": "weekly",
    "timeOfDay": "08:00",
    "timezone": "America/New_York",
    "dayOfWeek": 1
  },
  "reportParams": {
    "reportType": "cash_flow",
    "dateRange": {
      "type": "last_week"
    },
    "format": "excel",
    "includeCharts": true,
    "filters": {
      "accountIds": ["checking_001", "savings_001"],
      "reconciledOnly": true
    }
  },
  "deliveryConfig": {
    "method": "email",
    "email": {
      "recipients": ["treasury@company.com"],
      "subject": "Weekly Cash Flow Report - {{period}}",
      "body": "Attached is the cash flow report for the week ending {{period}}."
    }
  }
}
```

### Quarterly Balance Sheet

15 days after quarter end at 10 AM.

```json
{
  "orgId": "org_finance_001",
  "name": "Quarterly Balance Sheet",
  "schedule": {
    "frequency": "quarterly",
    "timeOfDay": "10:00",
    "timezone": "Europe/London",
    "dayOfMonth": 15
  },
  "reportParams": {
    "reportType": "balance_sheet",
    "dateRange": {
      "type": "last_quarter"
    },
    "format": "both",
    "includeDetails": true,
    "includeComparison": true
  },
  "deliveryConfig": {
    "method": "both",
    "email": {
      "recipients": [
        "cfo@company.com",
        "external-auditor@audit-firm.com"
      ],
      "subject": "Q{{quarter}} Balance Sheet - {{period}}",
      "body": "Quarterly balance sheet attached for your review."
    },
    "webhook": {
      "url": "https://api.accounting-system.com/webhooks/quarterly-reports",
      "method": "POST",
      "headers": {
        "X-API-Key": "your-api-key",
        "X-Report-Type": "balance_sheet"
      }
    }
  }
}
```

---

## Tax Reports

### Monthly VAT Report

Last day of month for EU VAT compliance.

```json
{
  "orgId": "org_tax_001",
  "name": "Monthly VAT Report (Germany)",
  "schedule": {
    "frequency": "monthly",
    "timeOfDay": "18:00",
    "timezone": "Europe/Berlin",
    "dayOfMonth": 31
  },
  "reportParams": {
    "reportType": "vat_report",
    "dateRange": {
      "type": "last_month"
    },
    "format": "both",
    "filters": {
      "countryCode": "DE"
    }
  },
  "deliveryConfig": {
    "method": "email",
    "email": {
      "recipients": ["tax-advisor@tax-firm.de"],
      "cc": ["accounting@company.com"],
      "subject": "VAT Report {{period}} - Germany",
      "body": "Attached is the monthly VAT report for {{period}}.\n\nPlease review and submit to Finanzamt."
    }
  }
}
```

### Quarterly Tax Summary

45 days after quarter end for tax filing.

```json
{
  "orgId": "org_tax_001",
  "name": "Quarterly Tax Summary",
  "schedule": {
    "frequency": "quarterly",
    "timeOfDay": "09:00",
    "timezone": "America/New_York",
    "dayOfMonth": 15
  },
  "reportParams": {
    "reportType": "tax_summary",
    "dateRange": {
      "type": "last_quarter"
    },
    "format": "pdf",
    "includeDetails": true
  },
  "deliveryConfig": {
    "method": "email",
    "email": {
      "recipients": ["tax@company.com"],
      "subject": "Q{{quarter}} Tax Summary - {{period}}",
      "body": "Quarterly tax summary for review before filing."
    }
  }
}
```

### Annual Tax Report

January 15th for previous year.

```json
{
  "orgId": "org_tax_001",
  "name": "Annual Tax Report",
  "schedule": {
    "frequency": "yearly",
    "timeOfDay": "09:00",
    "timezone": "Europe/Berlin",
    "dayOfMonth": 15
  },
  "reportParams": {
    "reportType": "tax_summary",
    "dateRange": {
      "type": "last_year"
    },
    "format": "both",
    "includeDetails": true,
    "includeComparison": true
  },
  "deliveryConfig": {
    "method": "both",
    "email": {
      "recipients": [
        "cfo@company.com",
        "tax-advisor@tax-firm.com"
      ],
      "subject": "Annual Tax Report {{period}}",
      "body": "Annual tax report for fiscal year {{period}}."
    },
    "webhook": {
      "url": "https://api.tax-software.com/annual-import",
      "headers": {
        "Authorization": "Bearer tax-software-token"
      }
    }
  }
}
```

---

## Management Reports

### Daily Revenue Dashboard

Every day at 6 PM with same-day data.

```json
{
  "orgId": "org_mgmt_001",
  "name": "Daily Revenue Dashboard",
  "schedule": {
    "frequency": "daily",
    "timeOfDay": "18:00",
    "timezone": "UTC"
  },
  "reportParams": {
    "reportType": "revenue",
    "dateRange": {
      "type": "today"
    },
    "format": "excel",
    "includeCharts": true,
    "filters": {
      "departmentIds": ["sales", "marketing"]
    }
  },
  "deliveryConfig": {
    "method": "webhook",
    "webhook": {
      "url": "https://api.dashboard.com/daily-metrics",
      "method": "POST",
      "includeFile": false
    }
  }
}
```

### Weekly Team Performance

Every Friday at 5 PM.

```json
{
  "orgId": "org_mgmt_001",
  "name": "Weekly Team Performance",
  "schedule": {
    "frequency": "weekly",
    "timeOfDay": "17:00",
    "timezone": "America/Los_Angeles",
    "dayOfWeek": 5
  },
  "reportParams": {
    "reportType": "custom",
    "dateRange": {
      "type": "last_week"
    },
    "format": "pdf",
    "templateId": "team_performance_v1",
    "customParams": {
      "metrics": ["revenue", "expenses", "profit_margin"],
      "groupBy": "department"
    }
  },
  "deliveryConfig": {
    "method": "email",
    "email": {
      "recipients": ["managers@company.com"],
      "subject": "Weekly Team Performance - Week of {{period}}",
      "body": "Weekly performance summary attached."
    }
  }
}
```

### Month-to-Date Progress

Every Monday at 9 AM.

```json
{
  "orgId": "org_mgmt_001",
  "name": "Month-to-Date Progress",
  "schedule": {
    "frequency": "weekly",
    "timeOfDay": "09:00",
    "timezone": "Europe/Berlin",
    "dayOfWeek": 1
  },
  "reportParams": {
    "reportType": "revenue",
    "dateRange": {
      "type": "month_to_date"
    },
    "format": "excel",
    "includeComparison": true
  },
  "deliveryConfig": {
    "method": "email",
    "email": {
      "recipients": ["sales-team@company.com"],
      "subject": "MTD Progress - {{period}}",
      "body": "Current month progress vs. target."
    }
  }
}
```

---

## Advanced Scheduling

### Business Days Only (Mon-Fri)

Using custom cron expression.

```json
{
  "orgId": "org_advanced_001",
  "name": "Business Days Revenue",
  "schedule": {
    "frequency": "custom",
    "timezone": "America/New_York",
    "cronExpression": "0 17 * * 1-5"
  },
  "reportParams": {
    "reportType": "revenue",
    "dateRange": {
      "type": "today"
    },
    "format": "pdf"
  },
  "deliveryConfig": {
    "method": "email",
    "email": {
      "recipients": ["daily-reports@company.com"],
      "subject": "Daily Revenue - {{period}}"
    }
  }
}
```

### First Business Day of Month

Using cron with day range.

```json
{
  "orgId": "org_advanced_001",
  "name": "First Business Day Report",
  "schedule": {
    "frequency": "custom",
    "timezone": "Europe/Berlin",
    "cronExpression": "0 9 1-7 * 1"
  },
  "reportParams": {
    "reportType": "profit_loss",
    "dateRange": {
      "type": "last_month"
    },
    "format": "pdf"
  },
  "deliveryConfig": {
    "method": "email",
    "email": {
      "recipients": ["finance@company.com"],
      "subject": "Monthly P&L - {{period}}"
    }
  }
}
```

### Bi-Weekly Reports

Every other Monday.

```json
{
  "orgId": "org_advanced_001",
  "name": "Bi-Weekly Payroll Report",
  "schedule": {
    "frequency": "custom",
    "timezone": "America/Chicago",
    "cronExpression": "0 10 * * 1"
  },
  "reportParams": {
    "reportType": "payroll",
    "dateRange": {
      "type": "custom",
      "startDate": "{{twoWeeksAgo}}",
      "endDate": "{{yesterday}}"
    },
    "format": "excel"
  },
  "deliveryConfig": {
    "method": "email",
    "email": {
      "recipients": ["hr@company.com"],
      "subject": "Bi-Weekly Payroll - {{period}}"
    }
  }
}
```

---

## Delivery Patterns

### Multiple Distribution Lists

```json
{
  "deliveryConfig": {
    "method": "email",
    "email": {
      "recipients": [
        "finance-team@company.com",
        "executives@company.com"
      ],
      "cc": [
        "accounting@company.com",
        "controllers@company.com"
      ],
      "bcc": ["archive@company.com"],
      "subject": "Monthly Financial Report - {{period}}",
      "replyTo": "finance-support@company.com"
    }
  }
}
```

### Webhook with Authentication

```json
{
  "deliveryConfig": {
    "method": "webhook",
    "webhook": {
      "url": "https://api.erp-system.com/financial-reports",
      "method": "POST",
      "headers": {
        "Authorization": "Bearer eyJhbGciOiJIUzI1NiIs...",
        "X-API-Key": "secret-api-key",
        "X-Tenant-ID": "company_001",
        "Content-Type": "application/json"
      },
      "includeFile": true
    }
  }
}
```

### Dual Delivery with Retry

```json
{
  "deliveryConfig": {
    "method": "both",
    "email": {
      "recipients": ["finance@company.com"],
      "subject": "Monthly Report - {{period}}"
    },
    "webhook": {
      "url": "https://api.backup-system.com/reports",
      "method": "POST"
    },
    "retryConfig": {
      "maxAttempts": 5,
      "backoffMs": 10000
    },
    "maxFileSizeMb": 50
  }
}
```

---

## Multi-Format Reports

### PDF and Excel

Both formats attached to email.

```json
{
  "reportParams": {
    "reportType": "profit_loss",
    "dateRange": {
      "type": "last_month"
    },
    "format": "both",
    "includeCharts": true
  },
  "deliveryConfig": {
    "method": "email",
    "email": {
      "recipients": ["team@company.com"],
      "subject": "P&L Report - {{period}} (PDF + Excel)",
      "body": "Both PDF (for viewing) and Excel (for analysis) formats attached."
    }
  }
}
```

### Format-Specific Delivery

PDF via email, Excel via webhook.

```json
{
  "reportParams": {
    "reportType": "revenue",
    "dateRange": {
      "type": "last_month"
    },
    "format": "both"
  },
  "deliveryConfig": {
    "method": "both",
    "email": {
      "recipients": ["management@company.com"],
      "subject": "Revenue Report (PDF) - {{period}}"
    },
    "webhook": {
      "url": "https://api.bi-tool.com/import-excel",
      "includeFile": true
    }
  }
}
```

---

## Template Variables Examples

### Rich Email Template

```json
{
  "deliveryConfig": {
    "method": "email",
    "email": {
      "recipients": ["team@company.com"],
      "subject": "[{{organizationName}}] {{reportType}} Report - {{period}}",
      "body": "Hello Team,\n\nYour automated {{reportType}} report for {{period}} is ready.\n\nReport Details:\n- Type: {{reportType}}\n- Period: {{period}}\n- Generated: {{generatedAt}}\n- Schedule: {{scheduleName}}\n\nPlease review the attached file(s).\n\nIf you have any questions, please contact the finance team.\n\nBest regards,\n{{organizationName}} Automated Reporting System"
    }
  }
}
```

### Localized Templates

German:
```json
{
  "email": {
    "subject": "Monatsbericht {{reportType}} - {{period}}",
    "body": "Guten Tag,\n\nIm Anhang finden Sie den automatisch generierten {{reportType}} Bericht für {{period}}.\n\nErstellt am: {{generatedAt}}\n\nMit freundlichen Grüßen,\n{{organizationName}}"
  }
}
```

Spanish:
```json
{
  "email": {
    "subject": "Informe {{reportType}} - {{period}}",
    "body": "Estimado equipo,\n\nAdjunto encontrará el informe de {{reportType}} para {{period}}.\n\nGenerado: {{generatedAt}}\n\nSaludos,\n{{organizationName}}"
  }
}
```

---

## Complete Production Example

Enterprise-grade configuration with all features:

```json
{
  "orgId": "enterprise_corp_001",
  "name": "Comprehensive Monthly Financial Package",
  "description": "Complete monthly financial reporting package for executive team and board",
  "schedule": {
    "frequency": "monthly",
    "timeOfDay": "06:00",
    "timezone": "America/New_York",
    "dayOfMonth": 2,
    "catchUpMissed": true
  },
  "reportParams": {
    "reportType": "profit_loss",
    "dateRange": {
      "type": "last_month"
    },
    "format": "both",
    "includeCharts": true,
    "includeDetails": true,
    "includeComparison": true,
    "filters": {
      "accountIds": ["1000", "2000", "3000"],
      "categoryIds": ["revenue", "cogs", "opex"],
      "departmentIds": ["sales", "marketing", "operations"],
      "currency": "USD",
      "reconciledOnly": true
    },
    "templateId": "executive_monthly_v2",
    "customParams": {
      "includeKPIs": true,
      "includeVarianceAnalysis": true,
      "includeForecast": true,
      "comparisonPeriods": ["lastMonth", "lastYear", "budget"]
    }
  },
  "deliveryConfig": {
    "method": "both",
    "email": {
      "recipients": [
        "cfo@enterprise-corp.com",
        "ceo@enterprise-corp.com",
        "finance-team@enterprise-corp.com"
      ],
      "cc": [
        "board@enterprise-corp.com",
        "controllers@enterprise-corp.com"
      ],
      "bcc": ["compliance@enterprise-corp.com"],
      "subject": "[{{organizationName}}] Monthly Financial Package - {{period}}",
      "body": "Dear Executive Team,\n\nPlease find attached the comprehensive monthly financial package for {{period}}.\n\nThis package includes:\n- Profit & Loss Statement (PDF & Excel)\n- Detailed variance analysis\n- KPI dashboard\n- Year-over-year comparison\n- Budget variance report\n\nGenerated: {{generatedAt}}\nSchedule: {{scheduleName}}\n\nFor questions or clarifications, please contact the Finance team.\n\nBest regards,\nFinance Department\n{{organizationName}}",
      "replyTo": "finance-team@enterprise-corp.com"
    },
    "webhook": {
      "url": "https://api.enterprise-erp.com/v2/financial-reports",
      "method": "POST",
      "headers": {
        "Authorization": "Bearer {{ERP_API_TOKEN}}",
        "X-API-Key": "{{ERP_API_KEY}}",
        "X-Tenant-ID": "enterprise_corp_001",
        "X-Report-Type": "monthly_financial",
        "Content-Type": "application/json"
      },
      "includeFile": false
    },
    "maxFileSizeMb": 50,
    "retryConfig": {
      "maxAttempts": 5,
      "backoffMs": 15000
    }
  },
  "startImmediately": false
}
```

---

## Notes

- All timezone values use IANA timezone database names
- Template variables are case-sensitive
- Cron expressions follow standard cron syntax
- File size limits apply to individual attachments
- Retry backoff uses exponential strategy (delay × 2^attempt)
