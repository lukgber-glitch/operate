# Database Improvements Report - DB-005 & DB-008

**Date:** 2025-12-08
**Agent:** VAULT
**Tasks Completed:** DB-005 (Soft Delete Pattern), DB-008 (Category Enums Audit)

---

## DB-005: Soft Delete Pattern Implementation

### Summary
Added `deletedAt DateTime?` field and corresponding indexes to models requiring compliance tracking. This enables soft deletion while preserving data for audit trails and compliance requirements.

### Models Updated

#### Already Had Soft Delete (No Changes Needed)
- ✅ **Organisation** - Already had `deletedAt DateTime?` (line 99)
- ✅ **User** - Already had `deletedAt DateTime?` (line 201)
- ✅ **Employee** - Already had `deletedAt DateTime?` (line 1075)
- ✅ **Invoice** - Already had `deletedAt DateTime? @map("deleted_at")` with index (lines 2014, 2032)
- ✅ **Bill** - Already had `deletedAt DateTime? @map("deleted_at")` (line 2197)

#### Newly Added Soft Delete
- ✅ **Transaction** - Added `deletedAt DateTime?` and `@@index([deletedAt])`
- ✅ **BankAccount** - Added `deletedAt DateTime?` and `@@index([deletedAt])`
- ✅ **Document** - Added `deletedAt DateTime?` and `@@index([deletedAt])`

### Implementation Details

All three newly updated models now include:
1. **Field:** `deletedAt DateTime?` - Optional timestamp for soft deletion
2. **Index:** `@@index([deletedAt])` - Efficient filtering for non-deleted records

### Why No Cascade Deletes?
Soft delete is about data preservation, not deletion. We intentionally:
- **DO NOT** add cascade delete rules
- **DO** preserve relationships even when records are soft-deleted
- **DO** allow queries to filter by `WHERE deletedAt IS NULL` for active records
- **DO** maintain full audit trail for compliance (GoBD, GDPR, tax regulations)

---

## DB-008: Category Enums Standardization Audit

### Category Enums Found

#### 1. TaxCategory (Line 667)
**Purpose:** VAT/tax rate classifications for invoices and tax calculations
**Values:**
- `STANDARD` - Standard rate goods/services
- `REDUCED` - Reduced rate (food, books, etc.)
- `SUPER_REDUCED` - Super-reduced rate (basic necessities)
- `ZERO` - Zero-rated (exports, intra-EU)
- `EXEMPT` - Exempt (healthcare, education)
- `PARKING` - Parking rate (specific to some countries)
- `INTERMEDIATE` - Intermediate rate (specific countries)

**Usage:** Well-defined for multi-country tax compliance

---

#### 2. ExpenseCategory (Line 1920)
**Purpose:** Expense classification for accounting and deduction tracking
**Values:**
- `TRAVEL`
- `OFFICE`
- `SOFTWARE`
- `EQUIPMENT`
- `MEALS`
- `ENTERTAINMENT`
- `UTILITIES`
- `RENT`
- `INSURANCE`
- `PROFESSIONAL_SERVICES`
- `OTHER`

**Usage:** Used by `Expense` model with strong typing

---

#### 3. CostCategory (Line 3216)
**Purpose:** Internal cost tracking for automation and API usage
**Values:**
- `AI_CLASSIFICATION`
- `AI_SUGGESTION`
- `API_CALL`
- `STORAGE`
- `EXPORT`
- `OTHER`

**Usage:** Internal operational costs, well-isolated from business categories

---

#### 4. RetentionCategory (Line 4444)
**Purpose:** Document retention policy classification for compliance
**Values:**
- `TAX_RELEVANT` - 10 years retention (invoices, receipts, tax documents)
- `BUSINESS` - 6 years retention (contracts, correspondence)
- `CORRESPONDENCE` - 6 years retention (general correspondence)
- `HR` - Varies by document type (employment contracts, payslips)
- `LEGAL` - Permanent or long-term retention
- `TEMPORARY` - Short-term retention (1 year)

**Usage:** GDPR and compliance-driven, well-defined with clear retention periods

---

### Inconsistencies Found

#### String-Based Categories (Should Consider Enums)

1. **Transaction.category** (Line 1673)
   - Type: `String?`
   - **Issue:** Inconsistent with structured expense categorization
   - **Recommendation:** Consider creating `TransactionCategory` enum or reusing `ExpenseCategory` if semantically equivalent
   - **Impact:** Medium - affects AI classification consistency

2. **BillLineItem.category** (Line 2240)
   - Type: `String?`
   - **Issue:** Inconsistent with `Expense.category` which uses `ExpenseCategory` enum
   - **Recommendation:** Use `ExpenseCategory?` enum for type safety
   - **Impact:** Medium - affects bill categorization and reporting

3. **BankTransaction.category** (Line 2402)
   - Type: `String?`
   - **Issue:** No type constraint for bank transaction categorization
   - **Recommendation:** Consider `BankTransactionCategory` enum (INCOME, EXPENSE, TRANSFER, FEE, etc.)
   - **Impact:** Low - currently used for manual/AI categorization flexibility

#### CategoryId Pattern (External References)

Several models use `categoryId String?` to reference external category systems:
- Bill.categoryId (Line 2176) - "Expense category"
- BankAccountNew.categoryId (Line 2670)
- DocumentVersion.categoryId (Line 4999)

**Assessment:** These are acceptable as they reference flexible external category systems. No changes needed.

---

### Naming Convention Analysis

**Current Pattern:**
- Enum names use PascalCase with "Category" suffix: `ExpenseCategory`, `TaxCategory`, `CostCategory`, `RetentionCategory`
- Values use SCREAMING_SNAKE_CASE: `PROFESSIONAL_SERVICES`, `SUPER_REDUCED`

**Consistency:** ✅ **EXCELLENT** - All category enums follow the same naming convention

---

### Recommendations

#### High Priority
None - existing enums are well-structured

#### Medium Priority
1. **BillLineItem.category:** Change from `String?` to `ExpenseCategory?` for consistency with Expense model
2. **Transaction.category:** Evaluate if AI classification can use `ExpenseCategory` enum or needs custom `TransactionCategory` enum

#### Low Priority
1. **BankTransaction.category:** Consider enum for better type safety, but current String approach allows flexibility for AI classification

#### No Action Needed
- **CategoryId fields:** Correctly reference external/flexible category systems
- **TaxCategory:** Well-defined for multi-country compliance
- **CostCategory:** Properly isolated for internal cost tracking
- **RetentionCategory:** Compliance-driven with clear retention rules

---

## Database Changes Summary

### Schema Changes
- **3 models updated** with soft delete fields
- **3 new indexes** added for efficient soft delete filtering
- **0 breaking changes** - all additions are optional fields

### Migration Required
Yes - these schema changes will require a database migration:

```bash
cd packages/database
npx prisma migrate dev --name add_soft_delete_pattern
```

### Prisma Client Generation
✅ **Completed** - Prisma Client regenerated successfully

---

## Testing Recommendations

### Soft Delete Testing
1. Test soft delete on Transaction, BankAccount, Document models
2. Verify indexes improve query performance for `WHERE deletedAt IS NULL`
3. Ensure existing queries still work (backward compatible)
4. Test restore functionality (setting `deletedAt` back to null)

### Category Enum Testing
1. Validate existing category values against enum constraints
2. Test BillLineItem and Transaction categorization logic
3. Ensure AI classification maps to appropriate enum values

---

## Compliance Impact

### Positive Impacts
- ✅ **GoBD Compliance:** Enhanced audit trail with soft delete preservation
- ✅ **GDPR Compliance:** Better data retention tracking with `deletedAt` timestamps
- ✅ **Tax Compliance:** Preserves transaction history even when "deleted" by users

### No Negative Impacts
- All changes are additive (optional fields)
- No data loss risk
- Backward compatible with existing queries

---

## Files Modified

1. **C:\Users\grube\op\operate-fresh\packages\database\prisma\schema.prisma**
   - Added `deletedAt DateTime?` to Transaction model (line 1686)
   - Added `@@index([deletedAt])` to Transaction model (line 1694)
   - Added `deletedAt DateTime?` to BankAccount model (line 2375)
   - Added `@@index([deletedAt])` to BankAccount model (line 2384)
   - Added `deletedAt DateTime?` to Document model (line 2754)
   - Added `@@index([deletedAt])` to Document model (line 2764)

---

## Next Steps

1. **Create Migration:**
   ```bash
   cd packages/database
   npx prisma migrate dev --name add_soft_delete_to_transaction_bankaccount_document
   ```

2. **Update Service Layer:**
   - Add soft delete methods to Transaction service
   - Add soft delete methods to BankAccount service
   - Add soft delete methods to Document service
   - Update queries to filter `WHERE deletedAt IS NULL` by default

3. **Update API Endpoints:**
   - Add DELETE endpoints that soft delete instead of hard delete
   - Add restore endpoints (PATCH to set deletedAt = null)
   - Update list endpoints to exclude soft-deleted records by default

4. **Consider Category Enum Improvements** (Optional):
   - Evaluate BillLineItem.category → ExpenseCategory? migration
   - Assess Transaction.category enum standardization needs

---

**Status:** ✅ **COMPLETE**
**Verification:** Prisma format ✅ | Prisma generate ✅
