const fs = require('fs');
const path = require('path');

const filesToFix = [
  'apps/api/src/modules/subscription/usage/dto/usage.dto.ts',
  'apps/api/src/modules/automation/dto/automation-settings.dto.ts',
  'apps/api/src/modules/crm/dto/client.dto.ts',
  'apps/api/src/modules/finance/bills/dto/create-bill.dto.ts',
  'apps/api/src/modules/finance/bills/dto/update-bill.dto.ts',
  'apps/api/src/modules/finance/invoices/dto/create-invoice.dto.ts',
  'apps/api/src/modules/finance/invoices/dto/invoice-query.dto.ts',
  'apps/api/src/modules/hr/leave/dto/create-leave-request.dto.ts',
  'apps/api/src/modules/hr/leave/dto/leave-query.dto.ts',
  'apps/api/src/modules/documents/dto/create-document.dto.ts',
  'apps/api/src/modules/documents/dto/update-document.dto.ts',
  'apps/api/src/modules/onboarding/dto/update-progress.dto.ts',
  'apps/api/src/modules/finance/invoices/reminders/dto/payment-reminder.dto.ts',
  'apps/api/src/modules/avalara/dto/nexus.dto.ts',
  'apps/api/src/modules/avalara/dto/tax-exemption.dto.ts',
];

function addIsInImport(filePath) {
  const fullPath = path.join(__dirname, filePath);

  if (!fs.existsSync(fullPath)) {
    console.log(`SKIP: ${filePath} (not found)`);
    return;
  }

  let content = fs.readFileSync(fullPath, 'utf8');

  // Check if @IsIn is used
  if (!content.includes('@IsIn(')) {
    console.log(`SKIP: ${filePath} (no @IsIn usage)`);
    return;
  }

  // Check if IsIn is already imported
  if (content.includes('IsIn')) {
    console.log(`SKIP: ${filePath} (IsIn already imported)`);
    return;
  }

  // Find the class-validator import and add IsIn
  const importRegex = /import\s*{([^}]+)}\s*from\s*'class-validator';/;
  const match = content.match(importRegex);

  if (match) {
    const fullImport = match[0];
    const imports = match[1];

    // Add IsIn to the end of the import list
    const newImport = fullImport.replace(
      /}\s*from\s*'class-validator';/,
      ',\n  IsIn,\n} from \'class-validator\';'
    );

    content = content.replace(fullImport, newImport);
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`FIXED: ${filePath}`);
  } else {
    console.log(`SKIP: ${filePath} (no class-validator import found)`);
  }
}

// Process all files
for (const file of filesToFix) {
  addIsInImport(file);
}

console.log('\nDone!');
