# Agent Assignments & Task Breakdown

## Agent Hierarchy (Updated)

```
ATLAS (PM) - Orchestration, Planning, No Code
├── FLUX (DevOps) - Infrastructure, Docker, CI/CD
├── FORGE (Backend) - NestJS APIs, Business Logic
├── PRISM (Frontend) - Next.js, React, UI
├── VAULT (Database) - Prisma Schemas, Migrations
├── SENTINEL (Security) - Auth, JWT, RBAC
├── ORACLE (AI/ML) - Classification, Suggestions
├── BRIDGE (Integrations) - ELSTER, External APIs
├── VERIFY (QA) - Testing, Coverage
├── CONNECT (New) - OAuth Flows, API Connections ★
├── ASSIST (New) - AI Chatbot, Suggestions Engine ★
├── NOTIFY (New) - Notifications, Alerts ★
└── CRM (New) - Client Management ★
```

---

## New Agent Definitions

### CONNECT Agent
```yaml
Name: CONNECT
Role: Integration & Connection Specialist
Level: 1 (Same as other specialists)

Responsibilities:
  - OAuth 2.0 flow implementation
  - API credential management
  - Token refresh and lifecycle
  - Connection health monitoring
  - Sync scheduling and execution
  - Error handling and reconnection

Tools:
  - GoCardless SDK
  - Google APIs Client
  - Microsoft Graph SDK
  - OAuth2 libraries

Focus Areas:
  - Banking connections (GoCardless, Tink)
  - Email connections (Gmail, Outlook)
  - Accounting software (lexoffice, sevDesk)
  - Tax authority connections (ELSTER certs)

Reports To: ATLAS
Collaborates With: FORGE, PRISM, SENTINEL, BRIDGE
```

### ASSIST Agent
```yaml
Name: ASSIST
Role: AI Chatbot & Suggestions Engine
Level: 1 (Same as other specialists)

Responsibilities:
  - Chat interface implementation
  - Natural language processing
  - Context management
  - Intent detection
  - Action execution
  - Proactive suggestion generation

Tools:
  - Claude API (Anthropic)
  - OpenAI API (fallback)
  - LangChain (optional)

Focus Areas:
  - Conversational UI
  - Business query answering
  - Report generation from chat
  - Deadline reminders
  - Anomaly explanations

Reports To: ATLAS
Collaborates With: ORACLE, FORGE, PRISM
```

### NOTIFY Agent
```yaml
Name: NOTIFY
Role: Notification & Alert Specialist
Level: 1 (Same as other specialists)

Responsibilities:
  - In-app notification system
  - Email template creation
  - Push notification delivery
  - Deadline scheduling
  - Preference management
  - Real-time WebSocket updates

Tools:
  - Firebase Cloud Messaging
  - SendGrid/SES
  - WebSocket (Socket.io)
  - Cron scheduling

Focus Areas:
  - Tax deadline reminders
  - Invoice payment alerts
  - Banking anomalies
  - AI insight delivery
  - System status updates

Reports To: ATLAS
Collaborates With: FORGE, PRISM, ASSIST
```

### CRM Agent
```yaml
Name: CRM
Role: Client Relationship Manager
Level: 1 (Same as other specialists)

Responsibilities:
  - Client database management
  - Contact tracking
  - Invoice history linking
  - Payment tracking
  - Communication logging
  - Client insights calculation

Tools:
  - Prisma ORM
  - Risk calculation algorithms
  - Email integration

Focus Areas:
  - Client profiles
  - Payment history
  - Risk assessment
  - Communication timeline
  - Invoice relationship

Reports To: ATLAS
Collaborates With: FORGE, PRISM, NOTIFY
```

---

## Phase 1: Connection Hub (Weeks 1-3)

### Week 1: Database & API Foundation

| Task | Agent | Priority | Dependencies |
|------|-------|----------|--------------|
| Create Integration schema (Prisma) | VAULT | P0 | None |
| Create IntegrationAccount schema | VAULT | P0 | Integration |
| Create OnboardingProgress schema | VAULT | P0 | None |
| Implement IntegrationsModule | FORGE | P0 | Schemas |
| Implement OnboardingModule | FORGE | P0 | Schemas |
| Create GoCardless service | CONNECT | P0 | IntegrationsModule |
| Create Gmail service | CONNECT | P0 | IntegrationsModule |
| Create Microsoft Graph service | CONNECT | P0 | IntegrationsModule |

### Week 2: OAuth Flows & UI

| Task | Agent | Priority | Dependencies |
|------|-------|----------|--------------|
| Implement OAuth state management | CONNECT | P0 | Services |
| Create OAuth callback handlers | CONNECT | P0 | State mgmt |
| Token encryption service | SENTINEL | P0 | None |
| Connection card component | PRISM | P0 | None |
| Connections settings page | PRISM | P0 | API endpoints |
| Onboarding wizard layout | PRISM | P0 | None |
| Step components (company, banking, email) | PRISM | P0 | Layout |

### Week 3: Integration & Testing

| Task | Agent | Priority | Dependencies |
|------|-------|----------|--------------|
| Bank selection UI (GoCardless) | PRISM | P0 | OAuth flow |
| Email provider selection UI | PRISM | P0 | OAuth flow |
| Transaction sync service | CONNECT | P0 | Banking connected |
| Email sync service | CONNECT | P1 | Email connected |
| Integration tests | VERIFY | P0 | All services |
| E2E onboarding test | VERIFY | P0 | All UI |
| Documentation | ATLAS | P1 | All complete |

---

## Phase 2: AI Chatbot (Weeks 4-6)

### Week 4: Database & Core Service

| Task | Agent | Priority | Dependencies |
|------|-------|----------|--------------|
| Create Conversation schema | VAULT | P0 | None |
| Create Message schema | VAULT | P0 | Conversation |
| Create Suggestion schema | VAULT | P0 | None |
| Implement ChatModule | FORGE | P0 | Schemas |
| Implement SuggestionsModule | FORGE | P0 | Schemas |
| Claude chat service | ASSIST | P0 | ChatModule |
| Intent detection service | ASSIST | P0 | Claude service |

### Week 5: Context & Actions

| Task | Agent | Priority | Dependencies |
|------|-------|----------|--------------|
| Context builder service | ASSIST | P0 | Intent detection |
| Data gathering service | ASSIST | P0 | Context builder |
| Action execution service | ASSIST | P0 | None |
| Report generation action | ASSIST | P1 | Action service |
| Invoice creation action | ASSIST | P1 | Action service |
| Reminder action | ASSIST | P1 | Action service |
| Suggestion generation cron | ASSIST | P0 | None |

### Week 6: UI & Integration

| Task | Agent | Priority | Dependencies |
|------|-------|----------|--------------|
| Chat panel component | PRISM | P0 | None |
| Message bubble component | PRISM | P0 | Chat panel |
| Streaming message handler | PRISM | P0 | Chat panel |
| AI insights card | PRISM | P0 | Suggestions API |
| Chat floating button | PRISM | P0 | Chat panel |
| Action confirmation dialogs | PRISM | P1 | Actions |
| Integration tests | VERIFY | P0 | All services |

---

## Phase 3: UI Enhancement (Weeks 7-8)

### Week 7: Header & Navigation

| Task | Agent | Priority | Dependencies |
|------|-------|----------|--------------|
| Global search component | PRISM | P0 | None |
| Search API endpoint | FORGE | P0 | None |
| Cmd+K keyboard shortcut | PRISM | P1 | Search component |
| User profile dropdown | PRISM | P0 | None |
| Theme selector in dropdown | PRISM | P1 | Dropdown |
| Header redesign | PRISM | P0 | All components |
| Notification bell (enhanced) | PRISM | P0 | Notification API |

### Week 8: Dashboard & Polish

| Task | Agent | Priority | Dependencies |
|------|-------|----------|--------------|
| Dashboard overview redesign | PRISM | P0 | AI insights card |
| Metric cards component | PRISM | P0 | None |
| Recent activity card | PRISM | P1 | None |
| Upcoming deadlines card | PRISM | P1 | None |
| Quick actions card | PRISM | P1 | None |
| Mobile navigation polish | PRISM | P1 | None |
| Accessibility audit | VERIFY | P1 | All UI |
| Performance optimization | PRISM | P1 | All UI |

---

## Phase 4: CRM Module (Weeks 9-10)

### Week 9: Database & API

| Task | Agent | Priority | Dependencies |
|------|-------|----------|--------------|
| Create Client schema | VAULT | P0 | None |
| Create ClientContact schema | VAULT | P0 | Client |
| Create Payment schema | VAULT | P0 | Client |
| Create Communication schema | VAULT | P0 | Client |
| Update Invoice schema (clientId) | VAULT | P0 | Client |
| Implement ClientsModule | FORGE | P0 | Schemas |
| Client insights service | CRM | P0 | ClientsModule |
| Risk calculation service | CRM | P0 | Insights |

### Week 10: UI & Integration

| Task | Agent | Priority | Dependencies |
|------|-------|----------|--------------|
| Client list page | PRISM | P0 | API |
| Client card component | PRISM | P0 | None |
| Client profile page | PRISM | P0 | API |
| Client tabs (invoices, payments, etc) | PRISM | P0 | Profile |
| Communication timeline | PRISM | P1 | Communications API |
| Contact management UI | PRISM | P1 | Contacts API |
| Invoice link from client | PRISM | P0 | Invoice update |
| Integration tests | VERIFY | P0 | All services |

---

## Phase 5: Notification System (Weeks 11-12)

### Week 11: Backend Services

| Task | Agent | Priority | Dependencies |
|------|-------|----------|--------------|
| Create Notification schema | VAULT | P0 | None |
| Create NotificationPreference schema | VAULT | P0 | None |
| Create PushSubscription schema | VAULT | P0 | None |
| Create ScheduledNotification schema | VAULT | P0 | None |
| Implement NotificationsModule | FORGE | P0 | Schemas |
| Notification service | NOTIFY | P0 | Module |
| Email delivery service | NOTIFY | P0 | None |
| Push delivery service (Firebase) | NOTIFY | P0 | Firebase setup |
| WebSocket gateway | NOTIFY | P0 | Module |
| Deadline reminder service | NOTIFY | P0 | Notification service |

### Week 12: UI & Testing

| Task | Agent | Priority | Dependencies |
|------|-------|----------|--------------|
| Notification preferences page | PRISM | P0 | Preferences API |
| Real-time notification hook | PRISM | P0 | WebSocket |
| Toast notifications | PRISM | P0 | Hook |
| Push notification permission UI | PRISM | P1 | Push API |
| Email templates (Deadline, Invoice) | NOTIFY | P0 | Email service |
| Cron job testing | VERIFY | P0 | Deadline service |
| E2E notification flow | VERIFY | P0 | All services |
| Documentation | ATLAS | P1 | All complete |

---

## Sprint Summary

| Phase | Duration | Primary Agents | Key Deliverables |
|-------|----------|----------------|------------------|
| 1. Connection Hub | 3 weeks | CONNECT, PRISM, VAULT | OAuth flows, Onboarding wizard |
| 2. AI Chatbot | 3 weeks | ASSIST, PRISM, ORACLE | Chat interface, Suggestions |
| 3. UI Enhancement | 2 weeks | PRISM | Global search, Profile dropdown |
| 4. CRM Module | 2 weeks | CRM, PRISM, VAULT | Client profiles, Insights |
| 5. Notifications | 2 weeks | NOTIFY, PRISM | Multi-channel alerts |

**Total Duration**: 12 weeks

---

## Definition of Done

### For Each Task
- [ ] Code complete and passes linting
- [ ] Unit tests written and passing (>80% coverage)
- [ ] Integration tests passing
- [ ] No TypeScript errors
- [ ] PR reviewed and approved
- [ ] Documentation updated
- [ ] Deployed to staging
- [ ] QA sign-off

### For Each Phase
- [ ] All tasks completed
- [ ] E2E tests passing
- [ ] Performance benchmarks met
- [ ] Security review complete
- [ ] Product demo to stakeholders
- [ ] Deployed to production
- [ ] Monitoring alerts configured

---

## Risk Mitigation

| Risk | Mitigation | Owner |
|------|------------|-------|
| Banking API rate limits | Implement caching, request queuing | CONNECT |
| OAuth token expiration | Proactive refresh, reconnect flow | CONNECT |
| AI response latency | Streaming, optimistic UI | ASSIST |
| Email deliverability | SPF/DKIM setup, monitoring | NOTIFY |
| WebSocket scalability | Redis pub/sub for multi-instance | NOTIFY |
| Database performance | Indexing, query optimization | VAULT |

---

## Communication Protocol

### Daily Standups
- Each agent reports: Done, Doing, Blocked
- ATLAS consolidates and resolves blockers

### Handoffs
- VAULT → FORGE: Schema migrations complete
- FORGE → PRISM: API endpoints documented
- CONNECT → PRISM: OAuth flows tested
- ASSIST → PRISM: Response formats defined

### Escalation Path
1. Agent attempts resolution
2. Escalate to collaborating agent
3. Escalate to ATLAS
4. Technical decision required → Document in ADR
