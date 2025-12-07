# Operate - Chat-First AI Business OS Implementation Plan

**Created**: December 7, 2024
**Phase**: UI/UX Overhaul + Pipeline Integration
**Status**: Ready to Launch

---

## Executive Summary

Transform Operate from a feature-complete backend into a polished, chat-centric AI business operating system. All 49 backend tasks are complete (BUILD_COMPLETE). This phase focuses on:

1. **Design System** - New brand colors, GSAP animations, consistent UI
2. **Pipeline Wiring** - Connect Email/Bank/HR intelligence to Chat actions
3. **Chat Landing Page** - Central interface with proactive suggestions
4. **Pricing & Subscription** - 4-tier model with 14-day trial

---

## Research Findings Summary

### Brand Colors (from Logo + Design Requirements)

| Name | Hex | Usage |
|------|-----|-------|
| Primary Teal | `#04BDA5` / `#06BF9D` | Primary buttons, links, accents |
| Secondary Mint | `#48D9BE` / `#84D9C9` | Secondary elements, hover states |
| Light Mint | `#C4F2EA` | Backgrounds, cards |
| Off-White | `#F2F2F2` / `#FCFEFE` | Page backgrounds |
| Text Dark | `#1A1A2E` | Primary text |
| Text Muted | `#6B7280` | Secondary text |

### Pricing Structure (Research-Backed)

| Tier | Monthly | Annual | AI Messages | Bank Accounts |
|------|---------|--------|-------------|---------------|
| Free | €0 | €0 | 10/month | 1 |
| Starter | €19 | €190 | 100/month | 2 |
| Pro | €39 | €390 | 500/month | 5 |
| Business | €69 | €690 | Unlimited | Unlimited |

- **Free Trial**: 14 days (all Pro features)
- **Annual Discount**: 17% (2 months free)
- **Target Distribution**: 60% Free, 15% Starter, 20% Pro, 5% Business

### Chat UI Best Practices (ChatGPT/Claude Style)

- Clean, minimal interface with focus on conversation
- Suggestions/quick actions as pills above input
- Markdown rendering for responses
- Typing indicators and streaming responses
- History accessible via dropdown/sidebar
- Voice input option
- Dark/light mode support

### Animation System (GSAP)

- MorphSVG for button → card transitions
- ScrollTrigger for scroll-based animations
- Stagger effects for list items
- Smooth page transitions with content rebuild

---

## Sprint Structure

### Sprint 8: Design System & Animation (3 days)

| ID | Task | Agent | Description |
|----|------|-------|-------------|
| S8-01 | Install GSAP + Plugins | FLUX | Add GSAP, MorphSVG, ScrollTrigger to web package |
| S8-02 | Design Token System | PRISM | CSS variables for colors, spacing, typography |
| S8-03 | Animation Library | PRISM | Reusable GSAP animations (morph, stagger, transitions) |
| S8-04 | Component Refresh | PRISM | Update Button, Card, Input with new design |
| S8-05 | Chat Components V2 | PRISM | ChatContainer, Message, Input with new design |

### Sprint 9: Pipeline Integration (4 days)

| ID | Task | Agent | Description |
|----|------|-------|-------------|
| S9-01 | Email → Chat Wiring | BRIDGE | Connect EmailSyncProcessor to InvoiceExtractor to Chat |
| S9-02 | Bank → Chat Wiring | BRIDGE | Connect BankSyncProcessor to Classifier to Chat |
| S9-03 | HR → Chat Wiring | BRIDGE | Connect HR events to Chat actions |
| S9-04 | EXECUTE_SUGGESTION Handler | FORGE | New action handler for proactive suggestions |
| S9-05 | Suggestion Delivery Channels | BRIDGE | In-app notifications, email, webhooks |
| S9-06 | Auto-Classification Trigger | ORACLE | Event-driven classification on transaction sync |
| S9-07 | Integration Tests | VERIFY | E2E tests for all pipeline connections |

### Sprint 10: Chat Landing Page (3 days)

| ID | Task | Agent | Description |
|----|------|-------|-------------|
| S10-01 | Chat Landing Layout | PRISM | Central chat with sidebar suggestions |
| S10-02 | Proactive Suggestions UI | PRISM | AI suggestion cards with quick actions |
| S10-03 | Chat History Dropdown | PRISM | Conversation history popup/panel |
| S10-04 | Voice Input Integration | PRISM | Speech-to-text for chat input |
| S10-05 | Dashboard Link Header | PRISM | Header with dashboard, settings links |
| S10-06 | Quick Action Pills | PRISM | Contextual action suggestions above input |

### Sprint 11: Onboarding Refresh (2 days)

| ID | Task | Agent | Description |
|----|------|-------|-------------|
| S11-01 | Onboarding Animation System | PRISM | Button morph to step, content transitions |
| S11-02 | Step Progress Indicator | PRISM | Animated progress with GSAP |
| S11-03 | Welcome Animation | PRISM | Logo + greeting animation sequence |
| S11-04 | Completion Celebration | PRISM | Success animation on onboarding complete |

### Sprint 12: Pricing & Subscription (3 days)

| ID | Task | Agent | Description |
|----|------|-------|-------------|
| S12-01 | Pricing Page | PRISM | 4-tier comparison with toggle (monthly/annual) |
| S12-02 | Usage Tracking | FORGE | Track AI messages, bank connections per user |
| S12-03 | Upgrade Prompts | PRISM | Soft prompts at 80% usage limits |
| S12-04 | Trial Expiration Flow | PRISM | Email sequence + in-app countdown |
| S12-05 | Billing Settings Page | PRISM | Current plan, upgrade, payment methods |
| S12-06 | Stripe Subscription Webhooks | BRIDGE | Handle subscription lifecycle events |

---

## Technical Specifications

### GSAP Installation

```bash
cd apps/web
pnpm add gsap @gsap/react
# Note: MorphSVG is now free but requires Club GSAP account for npm
```

### Design Token System

```css
/* apps/web/src/app/globals.css */
:root {
  /* Brand Colors */
  --color-primary: #04BDA5;
  --color-primary-hover: #06BF9D;
  --color-secondary: #48D9BE;
  --color-secondary-light: #84D9C9;
  --color-accent-light: #C4F2EA;
  --color-background: #F2F2F2;
  --color-surface: #FCFEFE;

  /* Text Colors */
  --color-text-primary: #1A1A2E;
  --color-text-secondary: #6B7280;
  --color-text-muted: #9CA3AF;

  /* Spacing */
  --space-xs: 0.25rem;
  --space-sm: 0.5rem;
  --space-md: 1rem;
  --space-lg: 1.5rem;
  --space-xl: 2rem;
  --space-2xl: 3rem;

  /* Border Radius */
  --radius-sm: 0.375rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-xl: 1rem;
  --radius-full: 9999px;

  /* Typography */
  --font-sans: 'Inter', system-ui, sans-serif;
  --font-size-xs: 0.75rem;
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.125rem;
  --font-size-xl: 1.25rem;
  --font-size-2xl: 1.5rem;
  --font-size-3xl: 1.875rem;

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
  --shadow-md: 0 4px 6px rgba(0,0,0,0.1);
  --shadow-lg: 0 10px 15px rgba(0,0,0,0.1);

  /* Animation */
  --transition-fast: 150ms ease;
  --transition-base: 250ms ease;
  --transition-slow: 350ms ease;
}
```

### Pipeline Wiring Architecture

```
EMAIL PIPELINE:
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ EmailSyncQueue  │───►│ EmailProcessor   │───►│ EmailClassifier │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                                        │
                                                        ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ ChatAction:     │◄───│ InvoiceCreator   │◄───│ InvoiceExtractor│
│ CREATE_INVOICE  │    └──────────────────┘    └─────────────────┘
└─────────────────┘

BANK PIPELINE:
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ BankSyncQueue   │───►│ TransactionSync  │───►│ TxClassifier    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                                        │
                                                        ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ ChatAction:     │◄───│ AutoReconciler   │◄───│ InvoiceMatcher  │
│ RECONCILE_TX    │    └──────────────────┘    └─────────────────┘
└─────────────────┘

PROACTIVE SUGGESTIONS:
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ Daily Scheduler │───►│ SuggestionGen    │───►│ DeliveryService │
│ (8 AM Berlin)   │    └──────────────────┘    └─────────────────┘
                                                        │
                        ┌───────────────────────────────┼───────────────────┐
                        ▼                               ▼                   ▼
               ┌─────────────┐               ┌─────────────┐      ┌─────────────┐
               │ In-App      │               │ Email       │      │ Webhook     │
               │ Notification│               │ Delivery    │      │ Delivery    │
               └─────────────┘               └─────────────┘      └─────────────┘
```

### Chat Landing Page Layout

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ [Logo]                                    [Dashboard] [Settings] [User ▼]  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │                                                                    │    │
│  │                     Welcome back, [Name]!                          │    │
│  │                                                                    │    │
│  │  ┌─────────────────────────────────────────────────────────────┐  │    │
│  │  │                                                             │  │    │
│  │  │                    [Chat Messages Area]                     │  │    │
│  │  │                                                             │  │    │
│  │  │                                                             │  │    │
│  │  └─────────────────────────────────────────────────────────────┘  │    │
│  │                                                                    │    │
│  │  ┌─────────────────────────────────────────────────────────────┐  │    │
│  │  │ 💡 Invoice #123 is overdue │ 📊 Q4 tax preview │ 🏦 3 new   │  │    │
│  │  └─────────────────────────────────────────────────────────────┘  │    │
│  │                                                                    │    │
│  │  ┌─────────────────────────────────────────────────────────────┐  │    │
│  │  │ [🎤]  Ask anything about your business...        [History ▼]│  │    │
│  │  └─────────────────────────────────────────────────────────────┘  │    │
│  │                                                                    │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│  ┌─────────────────────┐  ┌─────────────────────┐  ┌────────────────────┐  │
│  │ 📧 Email Insights   │  │ 🏦 Bank Summary      │  │ 📅 Upcoming        │  │
│  │ 3 invoices to       │  │ €12,450 balance     │  │ - Tax filing (5d)  │  │
│  │ review              │  │ +€3,200 this week   │  │ - Invoice #456     │  │
│  └─────────────────────┘  └─────────────────────┘  └────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Agent Assignments

### PRISM (Frontend - 15 tasks)
- S8-02: Design Token System
- S8-03: Animation Library
- S8-04: Component Refresh
- S8-05: Chat Components V2
- S10-01 to S10-06: Chat Landing Page
- S11-01 to S11-04: Onboarding Refresh
- S12-01, S12-03, S12-04, S12-05: Pricing UI

### BRIDGE (Integrations - 5 tasks)
- S9-01: Email → Chat Wiring
- S9-02: Bank → Chat Wiring
- S9-03: HR → Chat Wiring
- S9-05: Suggestion Delivery Channels
- S12-06: Stripe Subscription Webhooks

### FORGE (Backend - 2 tasks)
- S9-04: EXECUTE_SUGGESTION Handler
- S12-02: Usage Tracking

### ORACLE (AI/ML - 1 task)
- S9-06: Auto-Classification Trigger

### FLUX (DevOps - 1 task)
- S8-01: Install GSAP + Plugins

### VERIFY (QA - 1 task)
- S9-07: Integration Tests

---

## Success Metrics

### Technical
- [ ] All pipelines connected to Chat (Email, Bank, HR)
- [ ] GSAP animations working on onboarding + page transitions
- [ ] Chat landing page loads < 2s
- [ ] Proactive suggestions delivered daily at 8 AM Berlin

### Business
- [ ] 25-35% trial → paid conversion rate
- [ ] < 7% monthly churn on paid plans
- [ ] 60%+ users choose Pro tier

### UX
- [ ] Chat is primary interface (80%+ of user actions)
- [ ] Time to first value < 5 minutes
- [ ] User satisfaction score > 4.5/5

---

## File Structure Changes

```
apps/web/src/
├── app/
│   ├── (dashboard)/
│   │   ├── chat/              # Chat landing page (S10)
│   │   │   └── page.tsx
│   │   ├── pricing/           # Pricing page (S12-01)
│   │   │   └── page.tsx
│   │   └── settings/
│   │       └── billing/       # Billing settings (S12-05)
│   │           └── page.tsx
│   └── globals.css            # Updated with design tokens (S8-02)
├── components/
│   ├── animations/            # GSAP animation components (S8-03)
│   │   ├── MorphButton.tsx
│   │   ├── PageTransition.tsx
│   │   └── StaggerList.tsx
│   ├── chat/                  # Updated chat components (S8-05)
│   │   ├── ChatContainer.tsx
│   │   ├── ChatMessage.tsx
│   │   ├── ChatInput.tsx
│   │   ├── ChatHistory.tsx    # History dropdown (S10-03)
│   │   ├── VoiceInput.tsx     # Voice input (S10-04)
│   │   └── QuickActions.tsx   # Action pills (S10-06)
│   ├── onboarding/            # Updated with animations (S11)
│   └── pricing/               # Pricing components (S12)
│       ├── PricingTable.tsx
│       ├── UpgradePrompt.tsx
│       └── UsageBar.tsx
└── lib/
    └── gsap/                  # GSAP utilities (S8-01)
        ├── index.ts
        └── animations.ts

apps/api/src/modules/
├── chatbot/
│   └── actions/
│       └── execute-suggestion.action.ts  # S9-04
├── ai/
│   └── auto-classification.trigger.ts    # S9-06
├── notifications/
│   └── suggestion-delivery.service.ts    # S9-05
└── subscription/
    ├── usage-tracking.service.ts         # S12-02
    └── stripe-webhook.handler.ts         # S12-06
```

---

## Launch Sequence

### Phase 1: Foundation (Sprints 8-9) - 7 days
1. Install GSAP and create animation library
2. Update design tokens and core components
3. Wire all pipelines to Chat actions
4. Add EXECUTE_SUGGESTION handler

### Phase 2: UI Overhaul (Sprints 10-11) - 5 days
1. Build new chat landing page
2. Add proactive suggestions UI
3. Update onboarding with animations
4. Add voice input and chat history

### Phase 3: Monetization (Sprint 12) - 3 days
1. Build pricing page
2. Add usage tracking and upgrade prompts
3. Implement trial expiration flow
4. Connect Stripe subscription webhooks

### Total: 25 tasks across 5 sprints (~15 days)

---

## Next Steps

1. **Create Design System Specification** - Detailed component designs
2. **Create GSAP Animation Specification** - Animation timing and sequences
3. **Launch Sprint 8 Agents** - Start with foundation work
4. **Update STATE.json** - Track new sprint progress

---

## Appendix: Research Sources

### Pricing
- QuickBooks, FreshBooks, Xero, Lexoffice, sevDesk pricing pages
- ChatGPT, Claude, Jasper AI pricing
- German SaaS pricing reports from Valueships

### UI/UX
- ChatGPT web interface patterns
- Claude.ai conversation design
- Intercom, Drift chat widget patterns
- Slack, Discord message formatting

### Conversion
- Userpilot pricing page best practices
- AppCues freemium upgrade research
- Encharge trial email templates
- SaaS conversion rate benchmarks

### Animations
- GSAP MorphSVG documentation
- Framer Motion + GSAP integration patterns
- Awwwards SaaS animation examples
