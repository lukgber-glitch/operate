# Operate/CoachOS Implementation Plan

## Quick Navigation

| Document | Description |
|----------|-------------|
| [00-MASTER-PLAN.md](./00-MASTER-PLAN.md) | Executive overview, phases, success metrics |
| [01-EXISTING-FEATURES.md](./01-EXISTING-FEATURES.md) | Complete inventory of current functionality |
| [02-TARGET-FEATURES.md](./02-TARGET-FEATURES.md) | All features for world-class app (106 items) |
| [03-GAP-ANALYSIS.md](./03-GAP-ANALYSIS.md) | Comparison: existing vs target (48 missing) |
| [04-API-INTEGRATION-GUIDE.md](./04-API-INTEGRATION-GUIDE.md) | All external APIs and auth methods |
| [05-CONNECTION-HUB-SPEC.md](./05-CONNECTION-HUB-SPEC.md) | Phase 1: OAuth flows, onboarding wizard |
| [06-CHATBOT-SPEC.md](./06-CHATBOT-SPEC.md) | Phase 2: AI chatbot, suggestions engine |
| [07-UI-ENHANCEMENT-SPEC.md](./07-UI-ENHANCEMENT-SPEC.md) | Phase 3: Search, profile dropdown, dashboard |
| [08-CRM-SPEC.md](./08-CRM-SPEC.md) | Phase 4: Client management module |
| [09-NOTIFICATION-SPEC.md](./09-NOTIFICATION-SPEC.md) | Phase 5: Multi-channel notifications |
| [10-AGENT-ASSIGNMENTS.md](./10-AGENT-ASSIGNMENTS.md) | Task breakdown by agent and week |

---

## Resume Work

```bash
# From Claude Code
/continue

# Manual approach
1. Open 10-AGENT-ASSIGNMENTS.md
2. Find current phase/week
3. Pick next uncompleted task
4. Follow specification in corresponding SPEC file
```

---

## API Keys Checklist

Add these to your `.env` files:

### Required for Phase 1 (Connection Hub)
- [ ] `GOCARDLESS_SECRET_ID` - Free EU banking
- [ ] `GOCARDLESS_SECRET_KEY`
- [ ] `GOOGLE_GMAIL_CLIENT_ID` - Gmail OAuth
- [ ] `GOOGLE_GMAIL_CLIENT_SECRET`
- [ ] `MICROSOFT_GRAPH_CLIENT_ID` - Outlook OAuth
- [ ] `MICROSOFT_GRAPH_CLIENT_SECRET`

### Required for Phase 2 (Chatbot)
- [x] `ANTHROPIC_API_KEY` - Already configured
- [x] `OPENAI_API_KEY` - Already configured

### Required for Phase 5 (Notifications)
- [ ] `FIREBASE_PROJECT_ID` - Push notifications
- [ ] `FIREBASE_PRIVATE_KEY`
- [ ] `FIREBASE_CLIENT_EMAIL`

### Optional (Enhanced Features)
- [ ] `TINK_CLIENT_ID` - Premium banking
- [ ] `LEXOFFICE_API_KEY` - Accounting integration
- [ ] `MINDEE_API_KEY` - Document OCR

---

## New Agents

| Agent | Role | Primary Phase |
|-------|------|---------------|
| **CONNECT** | OAuth flows, API connections | Phase 1 |
| **ASSIST** | AI chatbot, suggestions | Phase 2 |
| **CRM** | Client management | Phase 4 |
| **NOTIFY** | Notifications, alerts | Phase 5 |

---

## Timeline Overview

```
Week 1-3:   Phase 1 - Connection Hub
Week 4-6:   Phase 2 - AI Chatbot
Week 7-8:   Phase 3 - UI Enhancement
Week 9-10:  Phase 4 - CRM Module
Week 11-12: Phase 5 - Notifications

Total: 12 weeks to world-class app
```

---

## Success Metrics

| Metric | Target |
|--------|--------|
| First-time setup | < 5 minutes |
| Chatbot response | < 2 seconds |
| API response time | < 200ms |
| User activation | > 80% |
| Daily return rate | > 50% |

---

## Next Steps

1. **Add API keys** to `.env` files
2. **Run `/continue`** to start Phase 1
3. **Follow agent assignments** in `10-AGENT-ASSIGNMENTS.md`
4. **Reference specs** for implementation details

---

*Created: 2025-12-01*
*Last Updated: 2025-12-01*
