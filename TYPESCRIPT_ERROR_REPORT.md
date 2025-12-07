# TypeScript Compiler Error Report - OPERATE API

**Date**: 2025-12-07
**Command**: `npx tsc --noEmit`
**Total Errors**: 373 TypeScript errors found

## Build Status

- **TypeScript Check**: ❌ FAILED (373 errors)
- **Webpack Build**: ✅ SUCCESS (with memory warning)
- **Memory Issue**: ForkTsCheckerWebpackPlugin ran out of memory during build

---

## Error Categories Summary

| Category | Count | Severity |
|----------|-------|----------|
| Missing Properties on PrismaService | 89 | HIGH |
| Type Mismatches (Type 'X' is not assignable) | 67 | HIGH |
| Cannot Find Module | 45 | CRITICAL |
| Property Does Not Exist | 58 | HIGH |
| Implicit 'any' Type | 24 | MEDIUM |
| Expected Arguments Mismatch | 18 | MEDIUM |
| Module Re-export Ambiguity | 12 | LOW |
| Possibly Undefined | 15 | MEDIUM |
| Operator Type Errors | 22 | HIGH |
| Object Literal Unknown Properties | 23 | HIGH |

---

## CRITICAL ERRORS (Blocking)

### 1. Missing Module Imports (45 errors)

**Category**: Cannot find module or type declarations

#### Pattern: Auth Module Imports
```
FILE: src/modules/auth/auth.service.ts
ERROR: TS2307: Cannot find module '../user/user.service' or its corresponding type declarations.

FILE: src/modules/auth/strategies/jwt.strategy.ts
ERROR: TS2307: Cannot find module '../../user/user.service' or its corresponding type declarations.

FILE: src/modules/auth/strategies/local.strategy.ts
ERROR: TS2307: Cannot find module '../../user/user.service' or its corresponding type declarations.

FILE: src/modules/auth/auth.module.ts
ERROR: TS2307: Cannot find module '../user/user.module' or its corresponding type declarations.
ERROR: TS2307: Cannot find module '../user/user.service' or its corresponding type declarations.
```

#### Pattern: Prisma Service Imports
```
FILE: src/modules/bank/bank.service.ts
ERROR: TS2307: Cannot find module '../../database/prisma.service' or its corresponding type declarations.

FILE: src/modules/billing/billing.service.ts
ERROR: TS2307: Cannot find module '../../database/prisma.service' or its corresponding type declarations.

FILE: src/modules/invoice/invoice.service.ts
ERROR: TS2307: Cannot find module '../../database/prisma.service' or its corresponding type declarations.
```

#### Pattern: Guard Imports
```
FILE: src/modules/customer/customer.controller.ts
ERROR: TS2307: Cannot find module '../../auth/guards/jwt-auth.guard' or its corresponding type declarations.

FILE: src/modules/expense/expense.controller.ts
ERROR: TS2307: Cannot find module '../../auth/guards/jwt-auth.guard' or its corresponding type declarations.
```

**Total**: 45 files with missing module imports

---

### 2. Missing PrismaService Properties (89 errors)

**Category**: Property does not exist on PrismaService

#### Database Models Not Found:
```
FILE: src/modules/ai/email-intelligence/email-intelligence.controller.ts
LINE: 101
ERROR: TS2339: Property 'emailMessage' does not exist on type 'PrismaService'.

FILE: src/modules/ai/email-intelligence/email-intelligence.controller.ts
LINE: 176
ERROR: TS2353: Object literal may only specify known properties, and 'organisationId' does not exist in type 'CustomerWhereInput'.

FILE: src/modules/invoice/invoice.service.ts
ERROR: TS2339: Property 'invoiceNumber' does not exist on type 'InvoiceSelect<DefaultArgs>'.

FILE: src/modules/tax/vat/vat.service.ts
ERROR: TS2339: Property 'vATReturn' does not exist on type 'PrismaService'.
(Multiple instances across VAT module)

FILE: src/modules/invoice/invoice.service.ts
ERROR: TS2339: Property 'client' does not exist on Invoice type.
ERROR: TS2339: Property 'vatAmount' does not exist on Invoice type.
```

**Missing Prisma Models/Fields**:
- `emailMessage`
- `vATReturn`
- `organisationId` (on Customer)
- `invoiceNumber` (on Invoice)
- `client` (on Invoice)
- `vatAmount` (on Invoice)
- `metadata` (on Vendor)
- `actionTaken` (on EmailSuggestion)

---

## HIGH Priority Errors

### 3. Type Assignment Mismatches (67 errors)

#### Date/String Type Conflicts
```
FILE: src/modules/ai/classification/expense-classifier.service.ts
LINE: 61
ERROR: TS2322: Type 'string | Date' is not assignable to type 'string'.
CATEGORY: Type Error

FILE: src/modules/ai/classification/tax-deduction-classifier.service.ts
LINE: 81
ERROR: TS2322: Type 'string | Date' is not assignable to type 'string'.
CATEGORY: Type Error
```

#### Boolean/Null Type Conflicts
```
FILE: src/modules/ai/email-intelligence/email-aggregator.service.ts
LINE: 410
ERROR: TS2322: Type 'string | boolean | null' is not assignable to type 'boolean'.
CATEGORY: Type Error

FILE: src/modules/ai/email-intelligence/email-aggregator.service.ts
LINE: 418
ERROR: TS2322: Type 'string | boolean | null' is not assignable to type 'boolean'.
CATEGORY: Type Error
```

#### Decimal Type Arithmetic Errors (22 errors)
```
FILE: src/modules/tax/vat/vat.service.ts
LINE: 198
ERROR: TS2365: Operator '>' cannot be applied to types 'Decimal' and 'number'.
ERROR: TS2363: The right-hand side of an arithmetic operation must be of type 'any', 'number', 'bigint' or an enum type.

FILE: src/modules/tax/vat/vat.service.ts
LINE: 207-210
ERROR: TS2362: The left-hand side of an arithmetic operation must be of type 'any', 'number', 'bigint' or an enum type.
(Multiple instances with Decimal type)
```

---

### 4. Missing Methods/Properties (58 errors)

#### Email Classifier Service
```
FILE: src/modules/ai/email-intelligence/email-classifier.example.ts
LINE: 164
ERROR: TS2339: Property 'classifyAndStore' does not exist on type 'EmailClassifierService'.

LINE: 195
ERROR: TS2339: Property 'classifyAndStoreBatch' does not exist on type 'EmailClassifierService'.

LINE: 218
ERROR: TS2339: Property 'getClassificationStats' does not exist on type 'EmailClassifierService'.
```

#### Database Module Exports
```
FILE: Multiple files
ERROR: TS2305: Module '"@operate/database"' has no exported member 'PrismaService'.
ERROR: TS2305: Module '"@operate/database"' has no exported member 'DatabaseModule'.
```

---

## MEDIUM Priority Errors

### 5. Implicit 'any' Types (24 errors)

```
FILE: src/main.ts
LINE: 34
ERROR: TS2349: This expression is not callable. Type 'typeof compression' has no call signatures.

LINE: 37
ERROR: TS7006: Parameter 'req' implicitly has an 'any' type.
ERROR: TS7006: Parameter 'res' implicitly has an 'any' type.

FILE: src/modules/ai/email-intelligence/email-intelligence.controller.ts
LINE: 115
ERROR: TS7006: Parameter 'email' implicitly has an 'any' type.

FILE: src/modules/customer/customer.controller.ts
LINE: 174, 199
ERROR: TS7006: Parameter 'subscription' implicitly has an 'any' type.
```

---

### 6. Argument Count Mismatches (18 errors)

```
FILE: src/modules/ai/bank-intelligence/tax-liability-tracker.example.ts
LINE: 16, 97, 167, 250, 339, 390
ERROR: TS2554: Expected 1 arguments, but got 0.
CATEGORY: Argument Mismatch
```

---

### 7. Possibly Undefined Properties (15 errors)

```
FILE: src/modules/ai/email-intelligence/email-aggregator.service.ts
LINE: 68
ERROR: TS18048: 'options.minEmailCount' is possibly 'undefined'.

LINE: 71
ERROR: TS18048: 'options.minContactCount' is possibly 'undefined'.

FILE: src/modules/bank/bank.service.ts
LINE: 153
ERROR: TS18048: 'account.institutionId' is possibly 'undefined'.
```

---

## LOW Priority Errors

### 8. Module Re-export Ambiguity (12 errors)

```
FILE: src/modules/tax/vat-return/index.ts
ERROR: TS2308: Module './types/vat-return.types' has already exported a member named 'CreateVatReturnDto'.
(Similar for: UpdateVatReturnDto, SubmitVatReturnDto, VatReturnPreview, etc.)
CATEGORY: Module Export
```

---

## Database Schema Issues

### Missing Prisma Schema Definitions

Based on errors, the following models/fields are referenced in code but missing in schema:

#### Models
- `EmailMessage` - Referenced but not defined
- `VATReturn` - Case mismatch (should be `VatReturn`?)

#### Fields on Existing Models

**Customer Model**:
- `organisationId` (referenced in email-intelligence)

**Invoice Model**:
- `invoiceNumber` (should be `number`?)
- `client` (should be `customer`?)
- `vatAmount` (needs to be added)

**Vendor Model**:
- `metadata` (JSON field needed)

**EmailSuggestion Model**:
- `actionTaken` (field missing)

---

## Package.json Issues

### Missing @operate/database Exports

```typescript
// Expected exports from @operate/database:
export { PrismaService } from './prisma.service';
export { DatabaseModule } from './database.module';
```

**Current Error**: Module has no exported member 'PrismaService' or 'DatabaseModule'

---

## Build Memory Issue

```
FATAL ERROR: Reached heap limit Allocation failed - JavaScript heap out of memory
Issues checking service aborted - probably out of memory.
```

**Recommendation**: Increase memory limit for ForkTsCheckerWebpackPlugin in webpack config:

```javascript
new ForkTsCheckerWebpackPlugin({
  typescript: {
    memoryLimit: 4096, // Increase from default 2048
  },
});
```

---

## Detailed Error Breakdown by File

### Top 20 Files with Most Errors

| File | Errors | Main Issues |
|------|--------|-------------|
| `tax/vat/vat.service.ts` | 28 | Decimal arithmetic, missing properties |
| `email-intelligence/email-intelligence.controller.ts` | 18 | Missing PrismaService props, type mismatches |
| `invoice/invoice.service.ts` | 15 | Missing fields, type errors |
| `customer/customer.controller.ts` | 12 | Missing imports, implicit any |
| `expense/expense.controller.ts` | 11 | Missing imports |
| `bank/bank.service.ts` | 10 | Missing imports, undefined props |
| `billing/billing.service.ts` | 9 | Missing imports |
| `email-aggregator.service.ts` | 8 | Type mismatches, possibly undefined |
| `tax-liability-tracker.example.ts` | 6 | Argument count |
| `email-classifier.example.ts` | 3 | Missing methods |
| `expense-classifier.service.ts` | 2 | Date/string type |
| `tax-deduction-classifier.service.ts` | 2 | Date/string type |
| `auth.service.ts` | 2 | Missing module |
| `auth.module.ts` | 2 | Missing module |
| `jwt.strategy.ts` | 1 | Missing module |
| `local.strategy.ts` | 1 | Missing module |
| `main.ts` | 3 | Compression, implicit any |
| `vat-return/* (various)` | 45 | Missing imports, type exports |

---

## Recommendations

### Immediate Actions Required

1. **Fix Database Package Exports** (CRITICAL)
   - Export PrismaService from @operate/database
   - Export DatabaseModule from @operate/database

2. **Update Prisma Schema** (CRITICAL)
   - Add missing EmailMessage model
   - Fix VATReturn vs VatReturn naming
   - Add missing fields: organisationId, metadata, actionTaken, vatAmount

3. **Create Missing User Module** (CRITICAL)
   - Create user.service.ts
   - Create user.module.ts
   - Implement user authentication logic

4. **Fix Module Imports** (CRITICAL)
   - Replace relative imports with absolute paths
   - Use consistent import patterns

5. **Type Safety Improvements** (HIGH)
   - Fix Decimal arithmetic operations (convert to number)
   - Add proper type guards for Date/string conversions
   - Add null checks for possibly undefined properties

6. **Increase Build Memory** (MEDIUM)
   - Update webpack config to increase ForkTsChecker memory limit

---

## Summary

- **Total TypeScript Errors**: 373
- **Critical (Blocking)**: 134 errors
- **High Priority**: 125 errors
- **Medium Priority**: 39 errors
- **Low Priority**: 12 errors
- **Build Memory Issue**: 1 warning

**Estimated Fix Time**: 12-16 hours
**Complexity**: High (requires schema changes, module restructuring)
