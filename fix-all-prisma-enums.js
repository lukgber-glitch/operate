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
    file: 'apps/api/src/modules/finance/invoices/reminders/dto/payment-reminder.dto.ts',
    enums: ['ReminderType', 'ReminderStatus'],
  },
  {
    file: 'apps/api/src/modules/avalara/dto/nexus.dto.ts',
    enums: ['NexusStatus'],
  },
  {
    file: 'apps/api/src/modules/avalara/dto/tax-exemption.dto.ts',
    enums: ['ExemptionType', 'ExemptionStatus'],
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

  // Step 1: Add IsIn to imports if not present
  if (!/import\s*{[^}]*\bIsIn\b[^}]*}\s*from\s*'class-validator'/.test(content)) {
    const importRegex = /import\s*{([^}]+)}\s*from\s*'class-validator';/;
    const match = content.match(importRegex);

    if (match) {
      const fullImport = match[0];
      // Add IsIn before the closing brace
      const newImport = fullImport.replace(
        /}\s*from\s*'class-validator';/,
        '  IsIn,\n} from \'class-validator\';'
      );
      content = content.replace(fullImport, newImport);
    }
  }

  // Step 2: Add value constants after imports
  const afterImportsMatch = content.match(/(import.*from\s*'[^']+';[\s\n]*)+/);
  if (afterImportsMatch) {
    const afterImports = afterImportsMatch[0];
    const insertPoint = afterImports.length;

    // Check if constants already exist
    let constantsToAdd = '';
    for (const enumName of enumNames) {
      if (content.includes(`@IsEnum(${enumName}`) && !content.includes(`const ${enumName}Values`)) {
        if (!constantsToAdd) {
          constantsToAdd = '\n// Define values for validation\n';
        }
        constantsToAdd += `const ${enumName}Values = Object.values(${enumName}) as string[];\n`;
      }
    }

    if (constantsToAdd) {
      content = content.slice(0, insertPoint) + constantsToAdd + content.slice(insertPoint);
    }
  }

  // Step 3: Replace @IsEnum with @IsIn
  for (const enumName of enumNames) {
    // Simple case: @IsEnum(EnumName)
    content = content.replace(
      new RegExp(`@IsEnum\\(${enumName}\\)`, 'g'),
      `@IsIn(${enumName}Values)`
    );
    // Array case: @IsEnum(EnumName, { each: true })
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
