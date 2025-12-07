# OPERATE SETTINGS - COMPLETE STRUCTURE MAP

## Visual Settings Tree

```
📱 OPERATE.GURU
│
├─ 🏠 / (Dashboard - requires auth + onboarding)
│
├─ 🔐 Authentication Routes
│  ├─ /login (public)
│  ├─ /register (public)
│  ├─ /forgot-password (public)
│  ├─ /reset-password (public)
│  ├─ /verify-email (public)
│  ├─ /mfa-setup (auth required)
│  ├─ /mfa-verify (auth required)
│  └─ /onboarding (auth required)
│
└─ ⚙️ SETTINGS (Protected - requires auth + onboarding)
   │
   ├─ 📋 /settings (Main Settings Page - Tabbed Interface)
   │  │
   │  ├─ 🏢 Tab 1: Organization ✅
   │  │  ├─ Organization Name
   │  │  ├─ Legal Name
   │  │  ├─ Email / Phone / Website
   │  │  ├─ Address / City / Postal Code
   │  │  ├─ Country Selector
   │  │  └─ Save Changes
   │  │
   │  ├─ 🧾 Tab 2: Tax ✅
   │  │  ├─ VAT ID
   │  │  ├─ Tax Number
   │  │  ├─ Fiscal Year (Start/End)
   │  │  ├─ Tax Regime
   │  │  ├─ Default VAT Rate
   │  │  └─ Save Changes
   │  │
   │  ├─ 📄 Tab 3: Invoices ✅
   │  │  ├─ Invoice Prefix
   │  │  ├─ Next Invoice Number
   │  │  ├─ Payment Terms
   │  │  ├─ Default Currency
   │  │  ├─ Invoice Footer
   │  │  ├─ Bank Details
   │  │  │  ├─ Bank Name
   │  │  │  ├─ IBAN
   │  │  │  └─ BIC/SWIFT
   │  │  └─ Save Changes
   │  │
   │  ├─ 🔔 Tab 4: Notifications ✅
   │  │  ├─ Email Notifications (toggle)
   │  │  ├─ Invoice Reminders (toggle)
   │  │  ├─ Expense Approvals (toggle)
   │  │  ├─ Leave Requests (toggle)
   │  │  ├─ Payroll Reminders (toggle)
   │  │  ├─ Tax Deadlines (toggle)
   │  │  ├─ Weekly Digest (toggle)
   │  │  └─ Save Changes
   │  │
   │  ├─ ✨ Tab 5: Automation ✅
   │  │  │
   │  │  ├─ ℹ️ Info Banner (Automation Modes Explained)
   │  │  │
   │  │  ├─ 1️⃣ Transaction Classification
   │  │  │  ├─ Enable/Disable Toggle
   │  │  │  ├─ Mode: FULL_AUTO | SEMI_AUTO | MANUAL
   │  │  │  ├─ Confidence Threshold Slider (50-100%)
   │  │  │  ├─ Amount Threshold (EUR)
   │  │  │  └─ Status Badge
   │  │  │
   │  │  ├─ 2️⃣ Expense Approval
   │  │  │  ├─ Enable/Disable Toggle
   │  │  │  ├─ Mode: FULL_AUTO | SEMI_AUTO | MANUAL
   │  │  │  ├─ Confidence Threshold Slider
   │  │  │  ├─ Amount Threshold (EUR)
   │  │  │  └─ Status Badge
   │  │  │
   │  │  ├─ 3️⃣ Deduction Suggestions
   │  │  │  ├─ Enable/Disable Toggle
   │  │  │  ├─ Mode: FULL_AUTO | SEMI_AUTO | MANUAL
   │  │  │  ├─ Confidence Threshold Slider
   │  │  │  ├─ Amount Threshold (EUR)
   │  │  │  └─ Status Badge
   │  │  │
   │  │  ├─ 4️⃣ Invoice Generation
   │  │  │  ├─ Enable/Disable Toggle
   │  │  │  ├─ Mode: FULL_AUTO | SEMI_AUTO | MANUAL
   │  │  │  ├─ Confidence Threshold Slider
   │  │  │  ├─ Amount Threshold (EUR)
   │  │  │  └─ Status Badge
   │  │  │
   │  │  └─ Save Automation Settings
   │  │
   │  └─ 🔗 Tab 6: Integrations ✅
   │     │
   │     ├─ Available Integrations
   │     │  ├─ ELSTER (Connected ✓)
   │     │  │  ├─ German tax authority
   │     │  │  ├─ Last Sync: 2024-11-28
   │     │  │  └─ [Disconnect] button
   │     │  │
   │     │  ├─ DATEV (Disconnected)
   │     │  │  ├─ Accounting software
   │     │  │  └─ [Connect] button
   │     │  │
   │     │  ├─ Stripe (Connected ✓)
   │     │  │  ├─ Payment processing
   │     │  │  ├─ Last Sync: 2024-11-29
   │     │  │  └─ [Disconnect] button
   │     │  │
   │     │  └─ QuickBooks (Disconnected)
   │     │     ├─ Financial management
   │     │     └─ [Connect] button
   │     │
   │     └─ Team Management
   │        └─ [Manage Team] button
   │
   ├─ 💳 /settings/billing ✅
   │  ├─ Current Plan Card
   │  │  ├─ Plan Tier Display
   │  │  ├─ Usage Statistics
   │  │  └─ [Change Plan] button
   │  │
   │  ├─ Usage Overview
   │  │  └─ Usage Metrics Display
   │  │
   │  ├─ Payment Methods
   │  │  ├─ Payment Methods List
   │  │  ├─ [Add Payment Method]
   │  │  ├─ [Remove] buttons
   │  │  └─ [Set Default] buttons
   │  │
   │  ├─ Billing History
   │  │  └─ Invoice List
   │  │
   │  ├─ Subscription Actions
   │  │  ├─ 🔄 Switch Billing Cycle
   │  │  │  ├─ Monthly ↔ Annual
   │  │  │  ├─ Savings Display (17% for annual)
   │  │  │  └─ [Switch to X] button
   │  │  │
   │  │  ├─ ✅ Resume Subscription (if canceled)
   │  │  │  ├─ Green success card
   │  │  │  └─ [Resume] button
   │  │  │
   │  │  └─ ⚠️ Cancel Subscription
   │  │     ├─ Red warning card
   │  │     └─ [Cancel Subscription] button
   │  │
   │  ├─ 🪟 Plan Comparison Dialog (Modal)
   │  │  ├─ All Plans Display
   │  │  ├─ Billing Cycle Toggle
   │  │  ├─ Feature Comparison
   │  │  ├─ [Select Plan] buttons
   │  │  └─ [Close] button
   │  │
   │  └─ 🚫 Cancel Subscription Modal
   │     ├─ Current Subscription Details
   │     ├─ Cancellation Consequences
   │     ├─ [Confirm Cancel] button
   │     └─ [Keep Subscription] button
   │
   ├─ 📧 /settings/email ✅
   │  └─ Email Settings (file exists)
   │
   ├─ 🏦 /settings/connections ✅
   │  ├─ Banking Connections List
   │  └─ /settings/connections/[id] ✅
   │     └─ Connection Detail Page
   │
   ├─ 📤 /settings/exports ✅
   │  ├─ Export Wizard Component
   │  │  ├─ Format Selection
   │  │  │  ├─ BMD Format
   │  │  │  ├─ DATEV Format
   │  │  │  └─ SAF-T Format
   │  │  │
   │  │  ├─ Format-Specific Options
   │  │  │  ├─ BMD Options Component
   │  │  │  ├─ DATEV Options Component
   │  │  │  └─ SAF-T Options Component
   │  │  │
   │  │  └─ Export History Component
   │  │     └─ Previous Exports List
   │
   ├─ 📋 /settings/automation ✅
   │  └─ Automation Settings (separate page, also in main tabs)
   │
   ├─ 🔔 /settings/notifications ✅
   │  └─ Notification Settings (separate page, also in main tabs)
   │
   ├─ 🧾 /settings/tax ✅
   │  ├─ Main Tax Settings
   │  ├─ /settings/tax/nexus ✅
   │  │  └─ Tax Nexus Configuration
   │  └─ /settings/tax/exemptions ✅
   │     └─ Tax Exemption Management
   │
   └─ ✅ /settings/verification ✅
      ├─ Verification Overview
      ├─ /settings/verification/start ✅
      │  └─ Start Verification Process
      ├─ /settings/verification/documents ✅
      │  └─ Document Upload Interface
      └─ /settings/verification/review ✅
         └─ Review Verification Status


❌ MISSING USER SETTINGS (Need Implementation)
│
├─ 👤 /settings/profile ❌ MISSING
│  ├─ Profile Picture Upload
│  ├─ Display Name
│  ├─ First Name / Last Name
│  ├─ Email (with verification)
│  ├─ Phone Number
│  └─ Save Changes
│
├─ 🔑 /settings/password ❌ MISSING
│  ├─ Current Password
│  ├─ New Password
│  ├─ Confirm New Password
│  ├─ Password Requirements Display
│  └─ Change Password Button
│
├─ 🔒 /settings/security ❌ MISSING
│  ├─ MFA/2FA Settings
│  │  ├─ Enable MFA
│  │  ├─ Disable MFA
│  │  └─ Recovery Codes
│  ├─ Session Management
│  │  ├─ Active Sessions List
│  │  └─ Logout All Devices
│  └─ Login History
│
└─ 🔐 /settings/privacy ❌ MISSING
   ├─ Data Export
   │  ├─ Request User Data Export (GDPR)
   │  └─ Download Data Archive
   ├─ Account Deletion
   │  ├─ Delete Account Request
   │  └─ Confirmation Flow
   └─ Privacy Preferences
      ├─ Data Collection Settings
      └─ Marketing Preferences
```

---

## Settings by Category

### ✅ Business Settings (Complete)
1. Organization Profile
2. Tax Configuration
3. Invoice Settings
4. Automation Rules
5. Integrations
6. Exports

### ✅ Financial Settings (Complete)
1. Billing & Subscription
2. Payment Methods
3. Banking Connections
4. Invoice Configuration

### ✅ Operational Settings (Complete)
1. Notifications
2. Email Settings
3. Verification
4. Tax Nexus & Exemptions

### ❌ User Settings (Missing)
1. Profile Management
2. Password Settings
3. Security Dashboard
4. Privacy Controls

---

## Component Architecture

### Main Settings Page Structure
```
settings/page.tsx (1310 lines)
│
├─ Tabs Component
│  ├─ TabsList (6 tabs)
│  └─ TabsContent (6 panels)
│
├─ Organization Tab
│  └─ Card → CardHeader + CardContent + Form + Button
│
├─ Tax Tab
│  └─ Card → Form fields + Button
│
├─ Invoices Tab
│  └─ Card → Form + Bank Details + Button
│
├─ Notifications Tab
│  └─ Card → 7 Switch components + Button
│
├─ Automation Tab
│  ├─ Info Banner
│  ├─ 4 Cards (Classification, Expense, Deduction, Invoice)
│  │  └─ Each: Toggle + Mode + Slider + Threshold + Badge
│  └─ Save Button
│
└─ Integrations Tab
   ├─ Integrations Card
   │  └─ 4 Integration Items (Connect/Disconnect)
   └─ Team Management Card
```

### Billing Page Structure
```
settings/billing/page.tsx (321 lines)
│
├─ useSubscription Hook (API integration ready)
│
├─ GSAP Animations (6 refs)
│
├─ Current Plan Card Component
├─ Usage Overview Component
├─ Payment Methods Component
├─ Billing History Component
│
├─ Subscription Actions
│  ├─ Switch Billing Cycle Card
│  ├─ Resume Subscription Card (conditional)
│  └─ Cancel Subscription Card (conditional)
│
├─ Plan Comparison Dialog (Modal)
│  └─ PlanComparison Component
│
└─ Cancel Subscription Modal
   └─ CancelSubscriptionModal Component
```

---

## UI Component Usage Map

### shadcn/ui Components Used
```
✅ Card, CardContent, CardDescription, CardHeader, CardTitle
✅ Button (variants: default, outline, destructive)
✅ Input (types: text, email, tel, url, number, range)
✅ Label
✅ Select, SelectContent, SelectItem, SelectTrigger, SelectValue
✅ Switch
✅ Tabs, TabsContent, TabsList, TabsTrigger
✅ Textarea
✅ Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
✅ Badge (variants: default, secondary)
✅ Toast (via use-toast hook)
```

### Custom Components
```
✅ CurrencyPicker - Currency selection component
✅ CurrentPlanCard - Billing plan display
✅ UsageOverview - Usage metrics
✅ PlanComparison - Plan comparison modal content
✅ PaymentMethods - Payment methods management
✅ BillingHistory - Invoice history table
✅ CancelSubscriptionModal - Cancel confirmation
✅ export-wizard - Export process wizard
✅ export-format-selector - Export format picker
✅ export-history - Export history log
✅ bmd-options - BMD export settings
✅ datev-options - DATEV export settings
✅ saft-options - SAF-T export settings
```

### Icons Used (Lucide React)
```
Building2, Receipt, Bell, Link2, Users, Save, Sparkles
Info, CreditCard, AlertTriangle, CheckCircle
```

---

## State Management Pattern

### Current Implementation
```javascript
// Local state with mock data
const [orgData, setOrgData] = useState(initialOrgData)
const [taxData, setTaxData] = useState(initialTaxData)
const [invoiceData, setInvoiceData] = useState(initialInvoiceData)
const [notificationData, setNotificationData] = useState(initialNotificationData)
const [automationSettings, setAutomationSettings] = useState(initialAutomationData)

// Save handlers (currently toast-only)
const handleSave = () => {
  toast({ title: 'Settings saved', description: '...' })
}
```

### Recommended Production Pattern
```javascript
// API integration pattern
const { data, isLoading, error, mutate } = useSWR('/api/settings/organization')

const handleSave = async () => {
  try {
    setIsLoading(true)
    await updateSettings(orgData)
    mutate() // Revalidate
    toast({ title: 'Settings saved' })
  } catch (error) {
    toast({ title: 'Error', description: error.message, variant: 'destructive' })
  } finally {
    setIsLoading(false)
  }
}
```

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        USER BROWSER                          │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │           Settings Page Component (Client)              │ │
│  │                                                          │ │
│  │  ┌──────────────┐      ┌──────────────┐                │ │
│  │  │ Form Inputs  │ ───▶ │ Local State  │                │ │
│  │  └──────────────┘      └──────────────┘                │ │
│  │                              │                           │ │
│  │                              │ onChange                  │ │
│  │                              ▼                           │ │
│  │                        ┌──────────────┐                 │ │
│  │                        │ Validation   │                 │ │
│  │                        └──────────────┘                 │ │
│  │                              │                           │ │
│  │                              │ onSave (currently mock)   │ │
│  │                              ▼                           │ │
│  │                        ┌──────────────┐                 │ │
│  │                        │ Toast Only   │ ⚠️ No API yet   │ │
│  │                        └──────────────┘                 │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                                 │
                                 │ (Future API integration)
                                 ▼
┌─────────────────────────────────────────────────────────────┐
│                      OPERATE API (NestJS)                    │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │            Settings Controller (To Be Created)          │ │
│  │                                                          │ │
│  │  POST   /api/settings/organization                      │ │
│  │  POST   /api/settings/tax                               │ │
│  │  POST   /api/settings/invoice                           │ │
│  │  POST   /api/settings/notifications                     │ │
│  │  POST   /api/settings/automation                        │ │
│  │  POST   /api/settings/integrations/:id/connect          │ │
│  │  DELETE /api/settings/integrations/:id/disconnect       │ │
│  │                                                          │ │
│  │  GET    /api/settings  (load all settings)              │ │
│  └────────────────────────────────────────────────────────┘ │
│                                 │                             │
│                                 ▼                             │
│                          ┌──────────────┐                     │
│                          │   Database   │                     │
│                          │   (Prisma)   │                     │
│                          └──────────────┘                     │
└─────────────────────────────────────────────────────────────┘
```

---

## Authentication Flow

```
User visits /settings
       │
       ▼
Middleware checks op_auth cookie
       │
       ├─ No cookie? ──▶ Redirect to /login?from=/settings
       │
       ├─ Cookie exists but not onboarded? ──▶ Redirect to /onboarding
       │
       └─ Cookie exists + onboarded ──▶ Allow access to /settings
                                              │
                                              ▼
                                    Settings page loads with tabs
                                              │
                                              ▼
                                    Load mock data (currently)
                                              │
                                              ▼
                                    User edits form
                                              │
                                              ▼
                                    Click "Save Changes"
                                              │
                                              ▼
                                    Show toast notification (currently)
                                              │
                                              ▼
                                    (Future: API call + revalidate)
```

---

## File Locations

### Settings Pages
```
apps/web/src/app/(dashboard)/settings/
├─ page.tsx                           (Main settings - 1310 lines)
├─ billing/
│  └─ page.tsx                        (Billing page - 321 lines)
├─ automation/
│  └─ page.tsx
├─ connections/
│  ├─ page.tsx
│  └─ [id]/page.tsx
├─ email/
│  └─ page.tsx
├─ exports/
│  ├─ page.tsx
│  └─ components/
│     ├─ export-wizard.tsx
│     ├─ export-format-selector.tsx
│     ├─ export-history.tsx
│     ├─ bmd-options.tsx
│     ├─ datev-options.tsx
│     └─ saft-options.tsx
├─ notifications/
│  └─ page.tsx
├─ tax/
│  ├─ page.tsx
│  ├─ nexus/page.tsx
│  └─ exemptions/page.tsx
└─ verification/
   ├─ page.tsx
   ├─ start/page.tsx
   ├─ documents/page.tsx
   └─ review/page.tsx
```

### Billing Components
```
apps/web/src/components/billing/
├─ CurrentPlanCard.tsx
├─ UsageOverview.tsx
├─ PlanComparison.tsx
├─ PaymentMethods.tsx
├─ BillingHistory.tsx
└─ CancelSubscriptionModal.tsx
```

### Middleware
```
apps/web/src/middleware.ts             (257 lines - auth protection)
```

---

## API Endpoints Needed (Future)

### Settings API (To Be Implemented)
```
GET    /api/settings                    - Get all settings
POST   /api/settings/organization       - Update organization
POST   /api/settings/tax                - Update tax config
POST   /api/settings/invoice            - Update invoice settings
POST   /api/settings/notifications      - Update notifications
POST   /api/settings/automation         - Update automation rules

GET    /api/settings/integrations       - List integrations
POST   /api/settings/integrations/:id/connect
DELETE /api/settings/integrations/:id/disconnect

GET    /api/settings/subscription       - Get subscription details
POST   /api/settings/subscription/plan  - Change plan
POST   /api/settings/subscription/cycle - Switch billing cycle
DELETE /api/settings/subscription       - Cancel subscription
POST   /api/settings/subscription/resume - Resume subscription

GET    /api/settings/payment-methods    - List payment methods
POST   /api/settings/payment-methods    - Add payment method
DELETE /api/settings/payment-methods/:id - Remove payment method
PATCH  /api/settings/payment-methods/:id/default - Set default

GET    /api/settings/invoices           - Billing history
```

### User Settings API (To Be Created)
```
GET    /api/user/profile                - Get user profile
PATCH  /api/user/profile                - Update profile
POST   /api/user/profile/picture        - Upload picture
PATCH  /api/user/email                  - Change email (with verification)
POST   /api/user/email/verify           - Verify email change

POST   /api/user/password               - Change password
POST   /api/user/password/reset         - Reset password

GET    /api/user/security/mfa           - Get MFA status
POST   /api/user/security/mfa/enable    - Enable MFA
POST   /api/user/security/mfa/disable   - Disable MFA
GET    /api/user/security/sessions      - List active sessions
DELETE /api/user/security/sessions/:id  - Logout session
DELETE /api/user/security/sessions      - Logout all devices

GET    /api/user/data/export            - Request data export
GET    /api/user/data/export/:id        - Download export
DELETE /api/user                         - Delete account
```

---

## Testing Checklist

### ✅ Implemented & Ready to Test
- [ ] Organization settings form
- [ ] Tax configuration form
- [ ] Invoice settings form
- [ ] Notification preferences toggles
- [ ] Automation settings (all 4 categories)
- [ ] Integration connect/disconnect
- [ ] Billing plan display
- [ ] Plan comparison modal
- [ ] Payment methods management
- [ ] Billing history display
- [ ] Billing cycle switching
- [ ] Cancel subscription flow
- [ ] Resume subscription flow
- [ ] Export wizard
- [ ] Tax nexus configuration
- [ ] Verification process

### ❌ Not Implemented - Cannot Test
- [ ] User profile editor
- [ ] Password change
- [ ] MFA settings UI
- [ ] Session management
- [ ] Data export (user data)
- [ ] Account deletion
- [ ] Privacy preferences

---

**Document Version**: 1.0
**Last Updated**: December 7, 2025
**Author**: PRISM Agent
**App Version**: operate-fresh (master)
