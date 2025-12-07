const fs = require('fs');
const path = require('path');

// Files to fix with their Prisma enum names
const filesToFix = [
  {
    file: 'apps/api/src/modules/subscription/usage/dto/usage.dto.ts',
    enums: ['UsageFeature'],
  },
  {
    file: 'apps/api/src/modules/automation/dto/automation-settings.dto.ts',
    enums: ['AutomationMode'],
  },
  {
    file: 'apps/api/src/modules/automation/dto/update-automation.dto.ts',
    enums: ['AutomationMode'],
  },
  {
    file: 'apps/api/src/modules/crm/dto/client.dto.ts',
    enums: ['ClientStatus', 'ClientType', 'RiskLevel', 'AddressType'],
  },
  {
    file: 'apps/api/src/modules/finance/bills/dto/create-bill.dto.ts',
    enums: ['BillStatus', 'PaymentStatus', 'BillSourceType'],
  },
  {
    file: 'apps/api/src/modules/finance/bills/dto/update-bill.dto.ts',
    enums: ['BillStatus', 'PaymentStatus'],
  },
  {
    file: 'apps/api/src/modules/finance/invoices/dto/create-invoice.dto.ts',
    enums: ['InvoiceType'],
  },
  {
    file: 'apps/api/src/modules/finance/invoices/dto/invoice-query.dto.ts',
    enums: ['InvoiceStatus', 'InvoiceType'],
  },
  {
    file: 'apps/api/src/modules/hr/leave/dto/create-leave-request.dto.ts',
    enums: ['LeaveType'],
  },
  {
    file: 'apps/api/src/modules/hr/leave/dto/leave-query.dto.ts',
    enums: ['LeaveType', 'LeaveRequestStatus'],
  },
  {
    file: 'apps/api/src/modules/documents/dto/create-document.dto.ts',
    enums: ['DocumentType'],
  },
  {
    file: 'apps/api/src/modules/documents/dto/update-document.dto.ts',
    enums: ['DocumentType'],
  },
  {
    file: 'apps/api/src/modules/onboarding/dto/update-progress.dto.ts',
    enums: ['OnboardingStepStatus'],
  },
  {
    file: 'apps/api/src/modules/onboarding/dto/analysis.dto.ts',
    enums: ['AnalysisStatus'],
  },
  {
    file: 'apps/api/src/modules/tax-deadline/dto/create-tax-deadline.dto.ts',
    enums: ['TaxTypeEnum'],
  },
  {
    file: 'apps/api/src/modules/tax-deadline/dto/query-tax-deadline.dto.ts',
    enums: ['TaxTypeEnum', 'TaxDeadlineStatusEnum'],
  },
  {
    file: 'apps/api/src/modules/tax-deadline/dto/update-tax-deadline.dto.ts',
    enums: ['TaxDeadlineStatusEnum'],
  },
  {
    file: 'apps/api/src/modules/gdpr/dto/data-subject-request.dto.ts',
    enums: ['DataSubjectRequestType', 'DataSubjectRequestStatus'],
  },
  {
    file: 'apps/api/src/modules/gdpr/dto/data-export.dto.ts',
    enums: ['DataExportFormat'],
  },
  {
    file: 'apps/api/src/modules/gdpr/dto/consent.dto.ts',
    enums: ['ConsentPurpose', 'ConsentSource'],
  },
  {
    file: 'apps/api/src/modules/compliance/exports/gobd/dto/create-gobd-export.dto.ts',
    enums: ['DocumentType', 'ExportFormat'],
  },
  {
    file: 'apps/api/src/modules/export-scheduler/dto/create-scheduled-export.dto.ts',
    enums: ['ExportType'],
  },
  {
    file: 'apps/api/src/modules/compliance/dto/schedule-export.dto.ts',
    enums: ['ExportFrequency'],
  },
  {
    file: 'apps/api/src/modules/hr/documents/dto/document-upload.dto.ts',
    enums: ['EmployeeDocumentType'],
  },
  {
    file: 'apps/api/src/modules/reports/tax-report/dto/tax-report.dto.ts',
    enums: ['TaxReportCountry', 'TaxReportPeriod', 'TaxExportFormat'],
  },
  {
    file: 'apps/api/src/modules/migrations/xero/xero-migration.dto.ts',
    enums: ['XeroEntityType', 'ConflictStrategy'],
  },
  {
    file: 'apps/api/src/modules/migrations/quickbooks/quickbooks-migration.dto.ts',
    enums: ['MigrationEntityType', 'ConflictResolutionStrategy', 'MigrationStatus'],
  },
  {
    file: 'apps/api/src/modules/migrations/lexoffice/dto/upload-migration.dto.ts',
    enums: ['LexofficeMigrationType'],
  },
  {
    file: 'apps/api/src/modules/migrations/lexoffice/dto/preview-migration.dto.ts',
    enums: ['LexofficeMigrationType'],
  },
  {
    file: 'apps/api/src/modules/migrations/lexoffice/dto/execute-migration.dto.ts',
    enums: ['LexofficeMigrationType'],
  },
  {
    file: 'apps/api/src/modules/finance/invoices/recurring/dto/recurring-invoice.dto.ts',
    enums: ['RecurringFrequency'],
  },
  {
    file: 'apps/api/src/modules/finance/invoices/reminders/dto/payment-reminder.dto.ts',
    enums: ['ReminderType', 'ReminderStatus'],
  },
  {
    file: 'apps/api/src/modules/search/dto/search-query.dto.ts',
    enums: ['SearchableEntityType'],
  },
  {
    file: 'apps/api/src/modules/chatbot/dto/suggestions.dto.ts',
    enums: ['SuggestionPriority'],
  },
  {
    file: 'apps/api/src/modules/ai/learning/dto/learning.dto.ts',
    enums: ['EntityType', 'CorrectionField', 'PatternType'],
  },
  {
    file: 'apps/api/src/modules/integrations/zatca/dto/submit-invoice.dto.ts',
    enums: ['ZatcaInvoiceType'],
  },
  {
    file: 'apps/api/src/modules/integrations/zatca/dto/sign-invoice.dto.ts',
    enums: ['InvoiceTypeDto'],
  },
  {
    file: 'apps/api/src/modules/avalara/dto/calculate-tax.dto.ts',
    enums: ['ProductTaxability'],
  },
  {
    file: 'apps/api/src/modules/avalara/dto/nexus.dto.ts',
    enums: ['NexusStatus'],
  },
  {
    file: 'apps/api/src/modules/avalara/dto/void-transaction.dto.ts',
    enums: ['VoidReasonCode'],
  },
  {
    file: 'apps/api/src/modules/avalara/dto/validate-address.dto.ts',
    enums: ['TextCase'],
  },
  {
    file: 'apps/api/src/modules/avalara/dto/tax-exemption.dto.ts',
    enums: ['ExemptionType', 'ExemptionStatus'],
  },
  {
    file: 'apps/api/src/modules/crm/dto/client-insights.dto.ts',
    enums: ['TimeRange', 'ChurnRiskLevel'],
  },
];

function fixFile(filePath, enumNames) {
  const fullPath = path.join(__dirname, filePath);

  if (!fs.existsSync(fullPath)) {
    console.log(`SKIP: ${filePath} (not found)`);
    return;
  }

  let content = fs.readFileSync(fullPath, 'utf8');

  // Check if file imports from @prisma/client
  if (!content.includes("from '@prisma/client'")) {
    console.log(`SKIP: ${filePath} (no Prisma imports)`);
    return;
  }

  // Check if file has @IsEnum with any of the specified enums
  let hasIsEnum = false;
  for (const enumName of enumNames) {
    if (content.includes(`@IsEnum(${enumName}`)) {
      hasIsEnum = true;
      break;
    }
  }

  if (!hasIsEnum) {
    console.log(`SKIP: ${filePath} (no @IsEnum with Prisma enums)`);
    return;
  }

  // Add IsIn to imports if not present
  if (!content.includes('IsIn')) {
    content = content.replace(
      /from 'class-validator';/,
      (match) => {
        const importMatch = content.match(/import\s*{([^}]+)}\s*from\s*'class-validator';/);
        if (importMatch) {
          const imports = importMatch[1].trim();
          return `import {\n  ${imports.split(',').map(s => s.trim()).join(',\n  ')},\n  IsIn,\n} from 'class-validator';`;
        }
        return match;
      }
    );
  }

  // Add value constants after imports
  const importBlockEnd = content.lastIndexOf("from 'class-transformer';") + "from 'class-transformer';".length;
  const afterImports = importBlockEnd > 0 ? importBlockEnd : content.indexOf('\n/**');

  let constantsToAdd = '\n// Define values for validation\n';
  for (const enumName of enumNames) {
    if (content.includes(`@IsEnum(${enumName}`)) {
      constantsToAdd += `const ${enumName}Values = Object.values(${enumName}) as string[];\n`;
    }
  }

  content = content.slice(0, afterImports) + constantsToAdd + content.slice(afterImports);

  // Replace @IsEnum with @IsIn
  for (const enumName of enumNames) {
    content = content.replace(
      new RegExp(`@IsEnum\\(${enumName}\\)`, 'g'),
      `@IsIn(${enumName}Values)`
    );
    content = content.replace(
      new RegExp(`@IsEnum\\(${enumName},\\s*{\\s*each:\\s*true\\s*}\\)`, 'g'),
      `@IsIn(${enumName}Values, { each: true })`
    );
  }

  fs.writeFileSync(fullPath, content, 'utf8');
  console.log(`FIXED: ${filePath}`);
}

// Process all files
for (const item of filesToFix) {
  fixFile(item.file, item.enums);
}

console.log('\nDone!');
