# Operate/CoachOS - Claude Code Guide

## Quick Start

```bash
/continue   # Resume from checkpoint - starts Chat-First Frontend work
```

## Live Deployment

**Production URL:** https://operate.guru

| Component | Details |
|-----------|---------|
| **API** | https://operate.guru/api/v1 |
| **Server** | Cloudways (164.90.202.153) |
| **Database** | Neon PostgreSQL |
| **PM2 Process** | operate-api |
| **SSH** | `ssh cloudways` |

## All Integrations Complete

- Google OAuth
- Anthropic Claude AI
- TrueLayer (EU/UK Open Banking)
- Tink Banking
- Stripe Payments (with webhook)
- Plaid US Banking (sandbox)

## Current Phase: Chat-First Frontend

**Plan File**: `agents/CHAT_FIRST_FRONTEND_PLAN.md`

### Implementation Phases:
1. **Phase 1**: Onboarding Wizard
   - Business Profile
   - Bank Connection (GoCardless/Plaid)
   - Tax Setup (ELSTER/FinanzOnline)
   - Email Integration (Gmail/Outlook)
   - Data Import

2. **Phase 2**: Chat-First Main Interface
   - Full-page chat (not floating widget)
   - Suggestion cards with actions
   - Streaming message support
   - Quick action buttons

3. **Phase 3**: Action Execution
   - Execute actions from chat responses
   - Create invoices, send reminders, etc.

## Project Structure

```
operate-fresh/
├── apps/api/          # NestJS Backend (COMPLETE)
├── apps/web/          # Next.js Frontend (CURRENT FOCUS)
├── apps/workers/      # Background jobs
├── packages/database/ # Prisma
├── packages/shared/   # Shared types
└── agents/            # Build plans
```

## Tech Stack

- **Backend**: NestJS + Prisma + PostgreSQL + Redis
- **Frontend**: Next.js 14 + React + TailwindCSS
- **AI**: Anthropic Claude

## Server Commands

```bash
# Check API status
ssh cloudways "cd ~/applications/eagqdkxvzv/public_html/apps/api && npx pm2 list"

# View API logs
ssh cloudways "cd ~/applications/eagqdkxvzv/public_html/apps/api && npx pm2 logs operate-api --lines 50"

# Restart API
ssh cloudways "cd ~/applications/eagqdkxvzv/public_html/apps/api && npx pm2 restart operate-api --update-env"
```
