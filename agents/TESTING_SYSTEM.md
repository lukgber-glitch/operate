# Operate App Testing & Fixing System

## Agent Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    ATLAS (Project Manager)                       │
│              Orchestrates, prioritizes, assigns                  │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│  TEST-ALPHA   │    │  TEST-BETA    │    │  TEST-GAMMA   │
│  Onboarding   │    │  Dashboard    │    │  Chat/AI      │
│  Auth flows   │    │  Finance      │    │  Integrations │
└───────────────┘    └───────────────┘    └───────────────┘
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              ▼
                    ┌───────────────┐
                    │  ISSUE QUEUE  │
                    │  (Prioritized)│
                    └───────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│   FIX-PRISM   │    │   FIX-FORGE   │    │  FIX-SENTINEL │
│   Frontend    │    │   Backend     │    │   Auth/API    │
│   UI/UX bugs  │    │   API bugs    │    │   Security    │
└───────────────┘    └───────────────┘    └───────────────┘
```

## Priority Levels

- **P0 (BLOCKER)**: Prevents testing from continuing
- **P1 (CRITICAL)**: Core functionality broken
- **P2 (HIGH)**: Important feature broken
- **P3 (MEDIUM)**: UX issues, minor bugs
- **P4 (LOW)**: Polish, nice-to-have

## Test Areas

### Area 1: Authentication & Onboarding
- [ ] Login page (email/password)
- [ ] Login page (Google OAuth)
- [ ] Login page (Microsoft OAuth)
- [ ] Registration page
- [ ] Forgot password flow
- [ ] Email verification
- [ ] MFA setup
- [ ] MFA verify
- [ ] Onboarding Step 1: Welcome
- [ ] Onboarding Step 2: Company Info
- [ ] Onboarding Step 3: Banking
- [ ] Onboarding Step 4: Email
- [ ] Onboarding Step 5: Tax Software
- [ ] Onboarding Step 6: Accounting
- [ ] Onboarding Step 7: Preferences
- [ ] Onboarding Step 8: Completion

### Area 2: Dashboard & Navigation
- [ ] Main dashboard
- [ ] Sidebar navigation
- [ ] Mobile navigation
- [ ] Header
- [ ] Notifications
- [ ] User profile/settings

### Area 3: Finance Module
- [ ] Bank accounts list
- [ ] Connect bank modal
- [ ] Bank account callback
- [ ] Transactions list
- [ ] Transaction details
- [ ] Reconciliation
- [ ] Invoices list
- [ ] Create invoice
- [ ] Invoice details
- [ ] Recurring invoices
- [ ] Expenses list
- [ ] Create expense
- [ ] Receipt scanning

### Area 4: HR Module
- [ ] Employees list
- [ ] Employee details
- [ ] Create employee
- [ ] Contracts
- [ ] Leave management
- [ ] Payroll
- [ ] Benefits

### Area 5: Tax Module
- [ ] Tax dashboard
- [ ] Germany (ELSTER)
- [ ] Austria (FinanzOnline)
- [ ] UK (HMRC)
- [ ] VAT returns
- [ ] Tax calendar

### Area 6: Chat & AI
- [ ] Chat interface
- [ ] Send message
- [ ] Receive response
- [ ] Suggestion cards
- [ ] Quick actions
- [ ] Voice input
- [ ] Conversation history

### Area 7: Settings & Integrations
- [ ] General settings
- [ ] Connections
- [ ] Email settings
- [ ] Tax settings
- [ ] Export settings
- [ ] Automation rules
- [ ] Notifications settings

### Area 8: Localization
- [ ] German (de)
- [ ] English (en)
- [ ] All UI strings translated
- [ ] Date formats
- [ ] Number formats
- [ ] Currency formats

## Issue Tracking Format

```json
{
  "id": "ISS-001",
  "priority": "P0",
  "area": "Onboarding",
  "title": "Email validation rejects valid emails",
  "description": "test@example.com shows 'Invalid email format'",
  "file": "apps/web/src/components/onboarding/OnboardingWizard.tsx",
  "line": 39,
  "status": "open|in_progress|fixed|verified",
  "assignee": "FIX-PRISM",
  "blocker_for": ["TEST-ALPHA"]
}
```

## Current Issue Queue

| ID | Priority | Area | Title | Status | Assignee |
|----|----------|------|-------|--------|----------|
| ISS-001 | P0 | Onboarding | Email validation rejects valid emails | open | - |
| ISS-002 | P1 | Auth | Password login not working | open | - |
| ISS-003 | P3 | Onboarding | Duplicate "Welcome to Operate" header | open | - |
| ISS-004 | P2 | Onboarding | React-hook-form state sync issues | open | - |
| ISS-005 | P4 | Onboarding | Progress indicator overflow | open | - |

## Workflow

1. **Test Agent** discovers issue → reports to queue
2. **PM (ATLAS)** prioritizes and assigns
3. **Fix Agent** implements fix
4. **Test Agent** verifies fix
5. **PM** marks as resolved

## Commands

- Test agents report: `ISSUE: [priority] [area] [description]`
- Fix agents report: `FIXED: [issue-id] [description of fix]`
- Verification: `VERIFIED: [issue-id]` or `REOPEN: [issue-id] [reason]`
