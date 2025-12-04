#!/bin/bash
# Verification script for Spanish SII Certificate Management Module

echo "==================================================="
echo "Spanish SII Certificate Management - Installation Verification"
echo "==================================================="
echo ""

# Check if we're in the right directory
if [ ! -f "spain-certificate.module.ts" ]; then
  echo "❌ Error: Run this script from the spain certificate module directory"
  exit 1
fi

echo "✓ Directory structure verified"
echo ""

# Count files
echo "Files created:"
SERVICE_COUNT=$(find . -name "*service.ts" -not -path "*/tests/*" | wc -l)
DTO_COUNT=$(find ./dto -name "*.ts" 2>/dev/null | wc -l)
INTERFACE_COUNT=$(find ./interfaces -name "*.ts" 2>/dev/null | wc -l)
TEST_COUNT=$(find ./tests -name "*.spec.ts" 2>/dev/null | wc -l)
DOC_COUNT=$(find . -name "*.md" | wc -l)

echo "  - Services: $SERVICE_COUNT (expected: 4)"
echo "  - DTOs: $DTO_COUNT (expected: 2)"
echo "  - Interfaces: $INTERFACE_COUNT (expected: 1)"
echo "  - Tests: $TEST_COUNT (expected: 1)"
echo "  - Documentation: $DOC_COUNT (expected: 3)"
echo ""

# Check critical files
echo "Critical files:"
CRITICAL_FILES=(
  "spain-certificate.service.ts"
  "certificate-storage.service.ts"
  "certificate-validator.service.ts"
  "certificate-rotation.service.ts"
  "spain-certificate.module.ts"
  "dto/upload-certificate.dto.ts"
  "dto/certificate-response.dto.ts"
  "interfaces/spain-certificate.interface.ts"
  "tests/spain-certificate.service.spec.ts"
  "README.md"
  "index.ts"
)

MISSING_FILES=0
for file in "${CRITICAL_FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "  ✓ $file"
  else
    echo "  ✗ $file (MISSING)"
    MISSING_FILES=$((MISSING_FILES + 1))
  fi
done
echo ""

# Check for TypeScript errors (basic syntax check)
echo "TypeScript syntax check:"
if command -v tsc &> /dev/null; then
  if tsc --noEmit --skipLibCheck *.ts 2>&1 | grep -q "error TS"; then
    echo "  ✗ TypeScript errors found"
  else
    echo "  ✓ No TypeScript syntax errors"
  fi
else
  echo "  ⚠ TypeScript compiler not found (skipping)"
fi
echo ""

# Check environment variable documentation
echo "Environment variables:"
if grep -q "SPAIN_SII_CERT_ENCRYPTION_KEY" README.md; then
  echo "  ✓ Encryption key documented in README"
else
  echo "  ✗ Encryption key not documented"
fi
echo ""

# Check Prisma schema
echo "Database schema:"
SCHEMA_FILE="../../../../../packages/database/prisma/schema.prisma"
if [ -f "$SCHEMA_FILE" ]; then
  if grep -q "model SpainCertificate" "$SCHEMA_FILE"; then
    echo "  ✓ SpainCertificate model found in schema"
  else
    echo "  ✗ SpainCertificate model NOT found in schema"
    MISSING_FILES=$((MISSING_FILES + 1))
  fi
  
  if grep -q "model SpainCertificateAuditLog" "$SCHEMA_FILE"; then
    echo "  ✓ SpainCertificateAuditLog model found in schema"
  else
    echo "  ✗ SpainCertificateAuditLog model NOT found in schema"
    MISSING_FILES=$((MISSING_FILES + 1))
  fi

  if grep -q "spainCertificates.*SpainCertificate" "$SCHEMA_FILE"; then
    echo "  ✓ Organisation relation found"
  else
    echo "  ✗ Organisation relation NOT found"
    MISSING_FILES=$((MISSING_FILES + 1))
  fi
else
  echo "  ✗ Prisma schema file not found at expected location"
  MISSING_FILES=$((MISSING_FILES + 1))
fi
echo ""

# Final summary
echo "==================================================="
if [ $MISSING_FILES -eq 0 ]; then
  echo "✅ Installation verification PASSED"
  echo "   All files created and configured correctly"
  echo ""
  echo "Next steps:"
  echo "  1. Set SPAIN_SII_CERT_ENCRYPTION_KEY in .env"
  echo "  2. Run: npm run prisma:generate"
  echo "  3. Run: npm run prisma:migrate:dev -- --name add-spain-certificates"
  echo "  4. Import SpainCertificateModule in your app"
else
  echo "❌ Installation verification FAILED"
  echo "   $MISSING_FILES issue(s) found"
  echo "   Please review the errors above"
fi
echo "==================================================="
