# Operate/CoachOS - Comprehensive Gap Analysis Report

**Date:** 2025-11-29
**Wave:** 16 (Gap Analysis)
**Status:** Analysis Complete

---

## Executive Summary

This report identifies missing features and gaps between the original plan and current implementation. The analysis covers Backend API, Frontend UI, and Database Schema.

### Key Findings

| Category | Status | Critical Gaps |
|----------|--------|---------------|
| **Automation Mode** | NOT IMPLEMENTED | No full auto/semi-auto toggle |
| **AI Auto-Fix** | NOT IMPLEMENTED | No automatic corrections |
| **Backend API** | 70% Complete | Reports module is stub, 49 TODOs |
| **Frontend UI** | 60% Complete | 85% hardcoded data |
| **Database Schema** | 85% Complete | Missing automation & notification models |

---

## 1. MISSING: Full Automatic / Semi-Automatic Mode

### Current State
- **NO automation mode toggle exists** in the entire system
- System operates in implicit "semi-automatic" mode only
- All AI classifications require manual review (no auto-approve option)
- No configuration for automatic processing thresholds

### What's Needed

#### Database Models
```prisma
enum AutomationMode {
  FULL_AUTO      // Process without review
  SEMI_AUTO      // Suggest, require approval
  MANUAL         // User reviews everything
}

model AutomationSettings {
  id          String      @id @default(uuid())
  orgId       String
  feature     String      // deduction, expense, classification, invoice
  mode        AutomationMode
  threshold   Decimal?    // Auto-approve under this amount
  confidenceThreshold Decimal? // Auto-approve above this confidence
  enabled     Boolean     @default(true)
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt

  organisation Organisation @relation(...)
  @@unique([orgId, feature])
}

model AutomationAuditLog {
  id          String      @id @default(uuid())
  orgId       String
  feature     String
  entityId    String
  action      String      // AUTO_APPROVED, AUTO_CLASSIFIED, AUTO_FILED
  ruleApplied String?
  executedAt  DateTime    @default(now())
  reason      String?
}
```

#### API Endpoints Needed
- `GET /api/v1/settings/automation` - Get automation settings
- `PATCH /api/v1/settings/automation/:feature` - Update automation mode
- `GET /api/v1/audit/automation` - View automation decisions

#### Frontend UI Needed
- Settings page section: "Automation Preferences"
- Toggle for each feature: Classification, Expenses, Deductions, Invoices
- Mode selector: Full Auto / Semi-Auto / Manual
- Threshold configuration (amount, confidence level)
- Audit log viewer for automated decisions

### Implementation Priority: **CRITICAL**

---

## 2. MISSING: AI Auto-Fix Capabilities

### Current State
- AI classification exists but only **suggests** categories
- All classifications go to review queue if confidence < 0.7
- No automatic corrections or fixes
- No learning from user corrections

### What's Needed

#### Auto-Fix Features
1. **Transaction Auto-Classification**
   - When confidence > 0.9 AND automation mode = FULL_AUTO
   - Automatically apply category without review
   - Log decision in AutomationAuditLog

2. **Expense Auto-Categorization**
   - Match vendor names to known categories
   - Apply deduction eligibility automatically
   - Auto-fill VAT rate based on category

3. **Invoice Auto-Generation**
   - Detect recurring patterns
   - Pre-fill invoice items from history
   - Suggest payment terms based on customer

4. **Document Auto-Tagging**
   - OCR extraction from receipts
   - Auto-classify document type
   - Link to related transactions

5. **Deduction Auto-Suggestion**
   - Scan expenses for deduction eligibility
   - Auto-calculate potential savings
   - Pre-fill deduction forms

#### AI Model Improvements Needed
```prisma
model AIModel {
  id              String      @id @default(uuid())
  name            String      // "transaction_classifier_v2"
  version         String
  type            String      // classification, fraud_detection
  status          String      // ACTIVE, ARCHIVED
  accuracy        Decimal?
  deployedAt      DateTime
}

model AIAutoFixHistory {
  id              String      @id @default(uuid())
  orgId           String
  entityType      String      // transaction, expense, invoice
  entityId        String
  field           String      // category, amount, vatRate
  originalValue   String?
  correctedValue  String
  confidence      Decimal
  modelVersion    String
  wasReverted     Boolean     @default(false)
  createdAt       DateTime    @default(now())
}
```

### Implementation Priority: **HIGH**

---

## 3. Backend API Gaps

### Stub Implementations (Must Fix)

| Module | File | Issue |
|--------|------|-------|
| **Reports** | `reports.service.ts` | Returns mock data only (318 lines) |
| **Compliance** | `compliance.service.ts` | 15+ TODOs, no actual export download |
| **ELSTER** | `elster.service.ts` | XML parsing not implemented |
| **GoBD** | `gobd-builder.service.ts` | Document retrieval missing |
| **Notifications** | `leave-notification.listener.ts` | Logging only, no emails |

### Missing Modules

1. **Notification Service** - No email/push notification system
2. **Webhook Service** - No event-driven integrations
3. **Background Queue** - BullMQ referenced but not integrated
4. **OCR Service** - No document scanning capability
5. **Report Generator** - No actual PDF/Excel generation

### TODO Count by Module
- Compliance: 15 TODOs
- ELSTER Integration: 5 TODOs
- HR Leave: 4 TODOs
- Country Context: 3 TODOs
- GoBD Builder: 2 TODOs
- Authentication: 1 TODO
- **Total: 49 TODOs**

---

## 4. Frontend UI Gaps

### Hardcoded Data (Must Replace)

| Page | Mock Data |
|------|-----------|
| Dashboard | 156 employees, 2,847 documents, €45,231 revenue |
| Invoices | 8 sample invoices, €1,450-€7,890 amounts |
| Expenses | 8 sample expenses, €189-€2,500 amounts |
| Banking | 4 accounts, €248,730.50 total balance |
| Tax | €18,450 estimated liability |
| Documents | 8 files, 7 folders |
| Reports | All trend data, all breakdown charts |

### Missing Pages

1. **User Profile** - No profile management page
2. **Team Management** - No user/permission management
3. **Payroll** - Referenced but not implemented
4. **Audit Logs** - No compliance audit viewer
5. **Bank Connect** - `/finance/banking/connect` returns 404
6. **Custom Reports** - No report builder

### Missing UI Features

1. **Automation Mode Toggle** - Not in Settings
2. **AI Suggestions Panel** - No smart suggestions UI
3. **Bulk Import** - No CSV/Excel upload
4. **Real-time Notifications** - No notification bell
5. **Export Functions** - All show alert() placeholder
6. **OCR Upload** - No receipt scanning UI

---

## 5. Database Schema Gaps

### Missing Models

| Model | Purpose | Priority |
|-------|---------|----------|
| `AutomationSettings` | Store automation mode per feature | CRITICAL |
| `AutomationAuditLog` | Track automated decisions | CRITICAL |
| `Notification` | User notifications/alerts | HIGH |
| `AIModel` | Track ML model versions | HIGH |
| `AIAutoFixHistory` | Track AI corrections | HIGH |
| `Webhook` | Integration events | MEDIUM |
| `DataImport` | Bulk import tracking | MEDIUM |
| `Reconciliation` | Bank matching history | MEDIUM |

### Relationship Fixes Needed

- `Expense.approvedBy` - Should be FK to User, not string
- `TimeEntry.approvedBy` - Should be FK to User, not string
- `Document.uploadedBy` - Should be FK to User, not string
- `Invoice.customerId` - Should be FK to Customer model

---

## 6. Implementation Plan

### Wave 17: Automation Foundation
**Priority: CRITICAL**

1. Add `AutomationSettings` model to Prisma schema
2. Add `AutomationAuditLog` model to Prisma schema
3. Create Automation API module (`/api/v1/settings/automation`)
4. Add automation settings to Settings UI page
5. Implement auto-approve logic in classification service

### Wave 18: AI Auto-Fix
**Priority: HIGH**

1. Add `AIModel` and `AIAutoFixHistory` models
2. Implement auto-classification for high-confidence transactions
3. Add auto-categorization for known vendors
4. Create AI suggestions panel in UI
5. Implement feedback loop for model improvement

### Wave 19: Data Integration
**Priority: HIGH**

1. Replace all mock data in frontend with API calls
2. Implement Reports service with real database queries
3. Add Notification model and service
4. Complete ELSTER XML parsing
5. Implement export download functionality

### Wave 20: Polish & Complete
**Priority: MEDIUM**

1. Add missing pages (Profile, Team, Audit Logs)
2. Implement OCR for receipt scanning
3. Add bulk import functionality
4. Complete webhook integrations
5. Add real-time notifications

---

## 7. Quick Wins (Can Do Immediately)

1. **Add automation mode enum to Organisation settings JSON** - No schema change needed
2. **Add automation toggle to Settings UI** - Simple state management
3. **Implement auto-approve for confidence > 0.95** - Logic change in service
4. **Connect HR Employees page to API** - Already has hook, just needs data
5. **Replace Reports mock with database aggregates** - Service change only

---

## 8. Summary Statistics

| Metric | Value |
|--------|-------|
| Total Backend Modules | 16 |
| Complete Modules | 10 |
| Stub Modules | 4 |
| Total Frontend Pages | 32 |
| API-Integrated Pages | 1 (HR/Employees) |
| Mock Data Pages | 31 |
| Database Models | 45 |
| Missing Models | 8 |
| Total TODOs | 49 |
| Automation Features | 0 |
| AI Auto-Fix Features | 0 |

---

## 9. Files Reference

### Critical Files Needing Work
- `apps/api/src/modules/reports/reports.service.ts` - All mock data
- `apps/api/src/modules/compliance/compliance.service.ts` - 15+ TODOs
- `apps/api/src/modules/ai/classification/classification.service.ts` - Add auto-approve
- `apps/web/src/app/(dashboard)/settings/page.tsx` - Add automation section
- `packages/database/prisma/schema.prisma` - Add automation models

### New Files to Create
- `apps/api/src/modules/automation/` - New module
- `apps/api/src/modules/notifications/` - New module
- `apps/web/src/app/(dashboard)/settings/automation/page.tsx` - New page
- `apps/web/src/app/(dashboard)/profile/page.tsx` - New page

---

**Report Generated By:** Gap Analysis Agent System
**Checkpoint:** Wave 16 - STATE.json updated
