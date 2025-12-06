# Chat-First Frontend Redesign Plan

## Overview

Redesign the Operate/CoachOS frontend from a traditional dashboard to a **chat-first interface** where the AI assistant is the primary interaction point. Users interact through conversation, with quick access to dashboard and detailed views when needed.

---

## Research Summary

### Chat-First UI Best Practices (2025)

Based on research from [Sendbird](https://sendbird.com/blog/chatbot-ui), [WillowTree](https://www.willowtreeapps.com/insights/willowtrees-7-ux-ui-rules-for-designing-a-conversational-ai-assistant), [IntuitionLabs](https://intuitionlabs.ai/articles/conversational-ai-ui-comparison-2025):

1. **Claude/ChatGPT Layout**: Two columns - left sidebar for conversations, main area for chat
2. **Suggestion Cards**: Vibrant visuals, large text, striking cards for recommendations
3. **Quick Actions**: Buttons for common tasks instead of requiring typed responses
4. **Visual Hierarchy**: Well-separated message blocks, consistent spacing
5. **Progress Indicators**: Checklists and progress tracking (e.g., "4/5 completed")
6. **AI Identity**: Clearly identify as AI assistant, not human

### Onboarding Best Practices (2025)

Based on research from [Xero](https://www.xero.com/us/partner-toolkit/digital-onboarding/), [Plaid](https://plaid.com/resources/fintech/fintech-onboarding-process/), [ProductLed](https://productled.com/blog/5-best-practices-for-better-saas-user-onboarding):

1. **Setup Wizard**: Guide users through initial setup with intuitive wizard
2. **Data Import First**: Add data upfront to reduce time-to-first-value
3. **Bank Connection via Plaid/GoCardless**: OAuth flow with institution selection
4. **Progress Tracking**: Clear visibility of setup completion
5. **90-Day Support**: Onboarding specialists available during first 90 days

---

## Target UI Layout

```
┌────────────────────────────────────────────────────────────────┐
│ [OPERATE Logo]                    [Dashboard] [Notifications] [User Avatar] │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│   ┌──────────────────────────────────────────────────────┐    │
│   │                                                      │    │
│   │            Good morning, Max!                        │    │
│   │                                                      │    │
│   │   ┌─────────────────────────────────────────────┐   │    │
│   │   │  🔔 VAT Filing Due     │  📄 Invoice #1234  │   │    │
│   │   │  Due in 3 days         │  €2,450 overdue    │   │    │
│   │   │  [Prepare Now]         │  [Send Reminder]   │   │    │
│   │   └─────────────────────────────────────────────┘   │    │
│   │                                                      │    │
│   │   ┌─────────────────────────────────────────────┐   │    │
│   │   │  💰 New Transaction    │  📊 Cash Flow Low  │   │    │
│   │   │  -€1,200 from Supplier │  Review forecast   │   │    │
│   │   │  [Categorize]          │  [View Details]    │   │    │
│   │   └─────────────────────────────────────────────┘   │    │
│   │                                                      │    │
│   │   [Previous messages scroll here...]                 │    │
│   │                                                      │    │
│   │   User: What invoices are overdue?                   │    │
│   │                                                      │    │
│   │   ASSIST: You have 3 overdue invoices totaling      │    │
│   │   €5,230. The oldest is Invoice #1234 to ABC Corp   │    │
│   │   (45 days overdue). Would you like me to:          │    │
│   │   [Send Reminders] [View All] [Generate Report]     │    │
│   │                                                      │    │
│   ├──────────────────────────────────────────────────────┤    │
│   │ [📎] [🎤]  Ask anything about your business...  [➤] │    │
│   └──────────────────────────────────────────────────────┘    │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Onboarding Wizard Redesign

### Onboarding Steps

| Step | Name | Description | Required? |
|------|------|-------------|-----------|
| 1 | **Business Profile** | Company name, type, country, tax ID | Yes |
| 2 | **Bank Connection** | Connect via GoCardless/Plaid/TrueLayer | Recommended |
| 3 | **Tax Setup** | Connect ELSTER/FinanzOnline/HMRC based on country | Country-specific |
| 4 | **Email Integration** | Gmail or Outlook for invoice extraction | Optional |
| 5 | **Import Data** | CSV upload or connect Xero/DATEV/LexOffice | Optional |

### Integration Connections by Country

| Country | Banking | Tax Filing | e-Invoice |
|---------|---------|------------|-----------|
| 🇩🇪 Germany | GoCardless, Plaid | ELSTER | Peppol, Factur-X |
| 🇦🇹 Austria | GoCardless, Plaid | FinanzOnline | Peppol |
| 🇬🇧 UK | GoCardless, TrueLayer | HMRC MTD | Peppol |
| 🇫🇷 France | GoCardless | - | Chorus-Pro, Factur-X |
| 🇮🇹 Italy | GoCardless | - | SDI |
| 🇪🇸 Spain | GoCardless | - | SII |
| 🇺🇸 USA | Plaid | Avalara | - |
| 🇦🇺 Australia | - | ATO | - |

---

## Phase 2: Chat-First Main Interface

### Component Structure

```
apps/web/src/
├── app/
│   ├── (auth)/                    # Auth pages (login, register, etc.)
│   ├── (onboarding)/              # NEW: Onboarding wizard
│   │   ├── page.tsx               # Onboarding entry
│   │   ├── steps/
│   │   │   ├── business-profile.tsx
│   │   │   ├── bank-connection.tsx
│   │   │   ├── tax-setup.tsx
│   │   │   ├── email-integration.tsx
│   │   │   └── data-import.tsx
│   │   └── layout.tsx
│   ├── (main)/                    # NEW: Main chat-first interface
│   │   ├── page.tsx               # Chat-first home
│   │   └── layout.tsx             # Minimal header layout
│   └── (dashboard)/               # Existing dashboard (accessible via button)
│       └── ...
├── components/
│   ├── chat/                      # EXISTING - Enhance
│   │   ├── ChatInterface.tsx      # NEW: Full-page chat (not floating)
│   │   ├── ChatSuggestions.tsx    # EXISTING - Use prominently
│   │   ├── SuggestionCard.tsx     # EXISTING - Use prominently
│   │   └── ...
│   ├── onboarding/                # EXISTING - Enhance
│   │   ├── OnboardingWizard.tsx   # NEW: Full wizard flow
│   │   ├── StepIndicator.tsx
│   │   └── steps/
│   └── main/                      # NEW: Main interface components
│       ├── MinimalHeader.tsx      # Logo + Dashboard + User
│       └── ChatHome.tsx           # Main chat view
```

---

## Phase 3: Implementation Steps

### Step 1: Create Onboarding Flow
1. Create `(onboarding)` route group
2. Build step-by-step wizard with progress indicator
3. Implement country detection for relevant integrations
4. Add bank connection step (GoCardless/Plaid SDK)
5. Add tax integration step (ELSTER/FinanzOnline OAuth)
6. Add email connection step (Gmail/Outlook OAuth)
7. Add data import step (CSV or accounting software)

### Step 2: Build Chat-First Main Interface
1. Create `(main)` route group with minimal layout
2. Build `ChatInterface` as full-page component
3. Integrate existing `ChatSuggestions` prominently
4. Connect to existing chatbot API endpoints
5. Add streaming message support
6. Implement action buttons in chat responses

### Step 3: Update Routing
1. After login → Check onboarding status
2. If not onboarded → Redirect to `/onboarding`
3. If onboarded → Redirect to `/` (chat-first home)
4. Dashboard accessible via button in header

---

## Files to Create

```
apps/web/src/app/(main)/page.tsx
apps/web/src/app/(main)/layout.tsx
apps/web/src/app/(onboarding)/page.tsx
apps/web/src/app/(onboarding)/layout.tsx
apps/web/src/app/(onboarding)/steps/business-profile.tsx
apps/web/src/app/(onboarding)/steps/bank-connection.tsx
apps/web/src/app/(onboarding)/steps/tax-setup.tsx
apps/web/src/app/(onboarding)/steps/email-integration.tsx
apps/web/src/app/(onboarding)/steps/data-import.tsx
apps/web/src/components/chat/ChatInterface.tsx
apps/web/src/components/main/MinimalHeader.tsx
apps/web/src/components/onboarding/OnboardingWizard.tsx
apps/web/src/components/onboarding/StepIndicator.tsx
apps/web/src/hooks/useOnboardingStatus.ts
```

### Files to Modify
```
apps/web/src/middleware.ts - Update routing logic
apps/web/src/components/chat/ChatSuggestions.tsx - Enhance for main view
apps/web/src/components/chat/SuggestionCard.tsx - Add actions
apps/api/src/modules/onboarding/onboarding.service.ts - Enhance
apps/api/src/modules/chatbot/chatbot.service.ts - Add action execution
```

---

## Success Criteria

- [ ] Users complete onboarding with all APIs connected
- [ ] Chat interface is the default landing after login
- [ ] Suggestions appear prominently with actionable buttons
- [ ] Users can execute actions directly from chat (create invoice, send reminder, etc.)
- [ ] Dashboard accessible via header button
- [ ] Mobile responsive
- [ ] Streaming message support
- [ ] < 2 second response time for first token
