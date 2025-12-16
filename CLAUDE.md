# Operate - Full Automation Build Guide

## Quick Start

```bash
/continue   # Resume from checkpoint - reads STATE.json and continues
```

## Current Phase: Full Automation Build

**Status**: Planning Complete - Sprint 1 Ready to Launch
**Role**: ATLAS (Project Manager) - Coordinate agents, do NOT write code directly

### State Files (READ THESE FIRST)
1. `agents/STATE.json` - Current progress checkpoint
2. `agents/FULL_AUTOMATION_PLAN.md` - Master plan (49 tasks, 7 sprints)
3. `agents/AGENT_INDEX.md` - Agent assignments and launch guide
4. `agents/tasks/SPRINT1_TASK_ASSIGNMENTS.md` - Current sprint details

## Build Goal

**User Request**: "Fully automatic chat app where user can focus on working and app does everything else"

### Automation Features (49 Tasks)
- Email → Invoice extraction (automatic)
- Bank → Transaction classification (automatic)
- Proactive daily suggestions (automatic)
- Chat actions with confirmation (semi-automatic)
- Bills/AP management (automatic)
- Tax filing assistance (one-click)
- Cash flow predictions (proactive alerts)
- Document search (natural language)

## Sprint Overview

| Sprint | Focus | Tasks | Status |
|--------|-------|-------|--------|
| 1 | Foundation Pipelines | 6 | READY_TO_LAUNCH |
| 2 | Bills & Vendors | 7 | PLANNED |
| 3 | Auto-Reconciliation | 7 | PLANNED |
| 4 | Document Intelligence | 7 | PLANNED |
| 5 | Tax Filing | 7 | PLANNED |
| 6 | Cash Flow | 7 | PLANNED |
| 7 | Production Hardening | 8 | PLANNED |

## Agent Roles

| Agent | Specialty | Note |
|-------|-----------|------|
| **ATLAS** | Project Manager | Coordinates, NEVER writes code |
| **BRIDGE** | Integrations | Pipelines, APIs, storage |
| **ORACLE** | AI/ML | Classification, search, proactive |
| **FORGE** | Backend | CRUD, services, reports |
| **PRISM** | Frontend | UI, wizards, dashboard |
| **VAULT** | Database | Schemas, migrations |
| **FLUX** | DevOps | Monitoring, performance |
| **VERIFY** | QA | Testing |
| **SENTINEL** | Security | Audit |

## Live Deployment

- **App**: https://operate.guru
- **API**: https://operate.guru/api/v1
- **Server**: Cloudways (164.90.202.153)
- **SSH**: `ssh cloudways`
- **PM2 Process**: operate-api

## All Integrations Complete

- Google OAuth
- Anthropic Claude AI
- TrueLayer (EU/UK Open Banking)
- Tink Banking
- Stripe Payments (with webhook)
- Plaid US Banking (sandbox)

## Project Structure

```
operate-fresh/
├── apps/api/          # NestJS Backend
├── apps/web/          # Next.js Frontend
├── apps/workers/      # Background jobs
├── packages/database/ # Prisma
├── packages/shared/   # Shared types
└── agents/            # Build plans & state
    ├── STATE.json           # Progress checkpoint
    ├── FULL_AUTOMATION_PLAN.md
    ├── AGENT_INDEX.md
    └── tasks/
        ├── SPRINT1_TASK_ASSIGNMENTS.md
        ├── SPRINT2_TASK_ASSIGNMENTS.md
        ├── SPRINT3_TASK_ASSIGNMENTS.md
        ├── SPRINT4_TASK_ASSIGNMENTS.md
        └── SPRINT5_TO_7_TASK_ASSIGNMENTS.md
```

## Server Commands

```bash
# Check API status
ssh cloudways "cd ~/applications/eagqdkxvzv/public_html/apps/api && npx pm2 list"

# View API logs
ssh cloudways "cd ~/applications/eagqdkxvzv/public_html/apps/api && npx pm2 logs operate-api --lines 50"

# Restart API
ssh cloudways "cd ~/applications/eagqdkxvzv/public_html/apps/api && npx pm2 restart operate-api --update-env"
```

## Key Rules

1. **ATLAS coordinates, doesn't code** - Launch agents for implementation
2. **Update STATE.json** - After each task/phase completion
3. **Parallel agents** - Launch independent tasks simultaneously
4. **Dependencies** - Respect task dependencies in sprint files
5. **Checkpoints** - Save state when context runs low

## CRITICAL: Safety Rules

1. **ATLAS never edits/writes code** - Only assign tasks to agents, never use Edit/Write tools directly
2. **100% certainty before assigning** - Only launch agents when you're completely sure what needs to be done
3. **ASK when unsure** - If something seems missing, unclear, or you're not 100% sure - ASK the user first
4. **Don't assume** - Investigate actual errors and logs, never assume the cause without evidence
5. **Don't break existing tools** - Be careful not to destroy or corrupt existing functionality
6. **Verify before acting** - Check actual state, read files, confirm the problem before proposing solutions
