# Operate/CoachOS - Master Implementation Plan

## Vision Statement

Transform Operate into a **world-class AI-powered business assistant** with a **Hybrid Adaptive Interface** - where the AI chatbot acts as the intelligent orchestration layer while traditional dashboard pages provide full functionality. Users can choose their preferred interaction style.

---

## Architecture: Conversational GUI (Hybrid)

```
┌─────────────────────────────────────────────────────────────────┐
│                     HYBRID ARCHITECTURE                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  LAYER 1: AI Chatbot (ASSIST) - Always Present                 │
│  ─────────────────────────────────────────────────────────────  │
│  • Floating button on every page                                │
│  • Proactive suggestions banner on dashboard                    │
│  • Context-aware (knows current page, selected items)           │
│  • Can generate UI components in chat (tables, forms, charts)   │
│  • Can navigate user to pages or execute actions                │
│                                                                 │
│  LAYER 2: Traditional Pages - Full Functionality               │
│  ─────────────────────────────────────────────────────────────  │
│  • Dashboard (overview + AI insights card)                      │
│  • Finance (invoices, expenses, banking)                        │
│  • HR (employees, leave, contracts)                             │
│  • Tax (deductions, filings, compliance)                        │
│  • CRM (clients, communications)                                │
│  • Reports (visual charts, exports)                             │
│  • Settings (connections, preferences)                          │
│                                                                 │
│  LAYER 3: Smart Linking                                         │
│  ─────────────────────────────────────────────────────────────  │
│  • Chat can open/highlight specific page sections               │
│  • Pages can trigger chat for help                              │
│  • Actions available both in chat AND in pages                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Current State Summary

### Existing Infrastructure (Production-Ready)
- **50+ API endpoints** across 14 modules
- **Authentication**: JWT, OAuth2 (Google/Microsoft), MFA with TOTP
- **RBAC**: Role-based access control (Owner, Admin, Manager, Member, Viewer)
- **Multi-country**: Germany, Austria, Switzerland support
- **AI**: Claude integration for classification
- **Tax**: ELSTER, FinanzOnline, VIES integrations (partial)
- **Finance**: Invoices, Expenses, Banking modules
- **HR**: Employees, Contracts, Leave management
- **Compliance**: GoBD, SAF-T exports

---

## Implementation Phases (Updated Priority)

### Phase 1: Connection Hub (Weeks 1-2)
**Agents**: CONNECT, PRISM, VAULT, SENTINEL
**Goal**: OAuth flows for banking, email, tax software + onboarding wizard

### Phase 2: AI Chatbot Core (Weeks 3-5) ← CENTRAL FEATURE
**Agents**: ASSIST, ORACLE, FORGE, PRISM
**Goal**: Hybrid conversational interface with:
- Chat panel on every page
- Proactive suggestions engine
- Dynamic UI generation in chat (tables, forms)
- Action execution from conversation
- Context awareness (current page, selections)

### Phase 3: Enhanced Dashboard (Week 6)
**Agents**: PRISM
**Goal**: AI insights card, global search, profile dropdown, notifications UI

### Phase 4: CRM Module (Weeks 7-8)
**Agents**: CRM, FORGE, PRISM
**Goal**: Client management integrated with chat ("Show me ABC Corp's history")

### Phase 5: Notification System (Weeks 9-10)
**Agents**: NOTIFY, FORGE, PRISM
**Goal**: Multi-channel alerts (push, email, in-app) with chat integration

---

## Agent Roster

| Agent | Role | Focus |
|-------|------|-------|
| **ATLAS** | Project Manager | Orchestrates, checkpoints, never codes |
| **FLUX** | DevOps | Infrastructure, Docker, CI/CD |
| **FORGE** | Backend | NestJS APIs, business logic |
| **PRISM** | Frontend | Next.js, React, UI components |
| **VAULT** | Database | Prisma schemas, migrations |
| **SENTINEL** | Security | Auth, JWT, RBAC, encryption |
| **ORACLE** | AI/ML | Classification, NLP, suggestions |
| **BRIDGE** | Integrations | ELSTER, external APIs |
| **VERIFY** | QA | Testing, coverage |
| **CONNECT** | Connections | OAuth flows, API connections |
| **ASSIST** | Chatbot | Conversational UI, actions |
| **NOTIFY** | Notifications | Push, email, in-app alerts |
| **CRM** | Clients | Customer relationship management |

---

## Checkpoint System

### How Checkpoints Work

Every agent MUST update `STATE.json` before context refresh:

```json
{
  "lastUpdated": "2025-12-01T15:30:00Z",
  "currentPhase": 1,
  "currentWeek": 1,
  "activeAgent": "CONNECT",
  "completedTasks": [...],
  "inProgressTask": {...},
  "blockers": [...],
  "nextTasks": [...]
}
```

### Checkpoint Triggers
1. Before ending any session
2. After completing a task
3. When switching agents
4. Every 30 minutes of work

### Resume Protocol
```bash
# To resume work:
1. Read agents/STATE.json
2. Read agents/implementation-plan/00-MASTER-PLAN.md
3. Check git log for recent commits
4. Continue from inProgressTask or next in nextTasks
```

---

## API Keys Required

### Phase 1 (Connection Hub)
```env
GOCARDLESS_SECRET_ID=
GOCARDLESS_SECRET_KEY=
GOOGLE_GMAIL_CLIENT_ID=
GOOGLE_GMAIL_CLIENT_SECRET=
MICROSOFT_GRAPH_CLIENT_ID=
MICROSOFT_GRAPH_CLIENT_SECRET=
```

### Phase 2 (Chatbot) - Already configured
```env
ANTHROPIC_API_KEY=  # Existing
OPENAI_API_KEY=     # Existing
```

### Phase 5 (Notifications)
```env
FIREBASE_PROJECT_ID=
FIREBASE_PRIVATE_KEY=
FIREBASE_CLIENT_EMAIL=
```

---

## Success Metrics

| Metric | Target |
|--------|--------|
| First-time setup | < 5 minutes |
| Chatbot response (first token) | < 1 second |
| Action execution from chat | < 2 seconds |
| API response time | < 200ms |
| User activation (complete setup) | > 80% |
| Chat usage rate | > 60% of sessions |
| Feature discoverability | 3x improvement |

---

## Files in This Plan

1. `00-MASTER-PLAN.md` - This overview (updated for hybrid architecture)
2. `01-EXISTING-FEATURES.md` - Complete list of current functionality
3. `02-TARGET-FEATURES.md` - All features for world-class app
4. `03-GAP-ANALYSIS.md` - Comparison: existing vs target
5. `04-API-INTEGRATION-GUIDE.md` - All external APIs and auth methods
6. `05-CONNECTION-HUB-SPEC.md` - Phase 1 detailed specification
7. `06-CHATBOT-SPEC.md` - Phase 2 detailed specification (CENTRAL)
8. `07-UI-ENHANCEMENT-SPEC.md` - Phase 3 detailed specification
9. `08-CRM-SPEC.md` - Phase 4 detailed specification
10. `09-NOTIFICATION-SPEC.md` - Phase 5 detailed specification
11. `10-AGENT-ASSIGNMENTS.md` - Tasks assigned to each agent
12. `STATE.json` - Current progress checkpoint

---

## Quick Resume Commands

```bash
# Resume from checkpoint
/continue

# Or manually:
cat agents/STATE.json
# Then follow currentPhase → inProgressTask
```
