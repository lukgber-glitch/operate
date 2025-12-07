#!/usr/bin/env python3
import re
import sys
from pathlib import Path

# Files to fix
FILES = [
    'apps/api/src/modules/subscription/usage/dto/usage.dto.ts',
    'apps/api/src/modules/automation/dto/automation-settings.dto.ts',
    'apps/api/src/modules/crm/dto/client.dto.ts',
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
]

def fix_file(filepath):
    path = Path(filepath)
    if not path.exists():
        print(f"SKIP: {filepath} (not found)")
        return False

    content = path.read_text(encoding='utf-8')

    # Check if file imports from Prisma
    if "from '@prisma/client'" not in content:
        print(f"SKIP: {filepath} (no Prisma imports)")
        return False

    # Find all Prisma enums being used with @IsEnum
    prisma_import_match = re.search(r"import\s*{([^}]+)}\s*from\s*'@prisma/client'", content)
    if not prisma_import_match:
        print(f"SKIP: {filepath} (no Prisma enum imports)")
        return False

    # Get enum names
    prisma_enums = [name.strip() for name in prisma_import_match.group(1).split(',')]

    # Find which enums are used with @IsEnum
    enums_to_fix = []
    for enum_name in prisma_enums:
        if f"@IsEnum({enum_name}" in content:
            enums_to_fix.append(enum_name)

    if not enums_to_fix:
        print(f"SKIP: {filepath} (no @IsEnum with Prisma enums)")
        return False

    # Step 1: Add IsIn to imports if not already there
    if not re.search(r'\bIsIn\b', content):
        # Find class-validator import
        validator_import_match = re.search(
            r"(import\s*{[^}]+})\s*from\s*'class-validator';",
            content
        )
        if validator_import_match:
            old_import = validator_import_match.group(0)
            # Add IsIn before the closing brace
            new_import = old_import.replace(
                "} from 'class-validator';",
                "  IsIn,\n} from 'class-validator';"
            )
            content = content.replace(old_import, new_import, 1)

    # Step 2: Add value constants after all imports
    # Find the end of the last import statement
    last_import_match = None
    for match in re.finditer(r"import\s+[^;]+from\s+['\"][^'\"]+['\"];", content):
        last_import_match = match

    if last_import_match:
        insert_pos = last_import_match.end()

        # Generate constants for enums that don't have them yet
        constants = "\n// Define values for validation\n"
        for enum_name in enums_to_fix:
            if f"const {enum_name}Values" not in content:
                constants += f"const {enum_name}Values = Object.values({enum_name}) as string[];\n"

        if constants.strip() != "// Define values for validation":
            content = content[:insert_pos] + constants + content[insert_pos:]

    # Step 3: Replace @IsEnum with @IsIn
    for enum_name in enums_to_fix:
        # Simple case
        content = re.sub(
            rf'@IsEnum\({enum_name}\)',
            f'@IsIn({enum_name}Values)',
            content
        )
        # Array case
        content = re.sub(
            rf'@IsEnum\({enum_name},\s*{{\s*each:\s*true\s*}}\)',
            f'@IsIn({enum_name}Values, {{ each: true }})',
            content
        )

    # Write back
    path.write_text(content, encoding='utf-8')
    print(f"FIXED: {filepath}")
    return True

def main():
    fixed = 0
    for filepath in FILES:
        if fix_file(filepath):
            fixed += 1
    print(f"\nFixed {fixed} files!")

if __name__ == '__main__':
    main()
