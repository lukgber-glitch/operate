# Roadmap: Operate Cleanup & Redeploy

## Overview

This roadmap covers the safe takedown of the live site, comprehensive code cleanup with security audit, and redeployment of the clean codebase. Each phase is atomic and can be paused/resumed safely.

## Phases

- [x] **Phase 1: Backup & Takedown** - Preserve configs, stop live site via Cloudways API
- [x] **Phase 2: Local Preparation** - Create duplicate for cleanup, organize structure
- [x] **Phase 3: Security Audit** - Scan for secrets, vulnerabilities, exposed endpoints
- [x] **Phase 4: Code Cleanup** - Remove debug code, format, lint, type-check
- [ ] **Phase 5: Git & GitHub** - Clean history, push to remote
- [ ] **Phase 6: Redeploy** - Deploy clean codebase to Cloudways, verify

## Phase Details

### Phase 1: Backup & Takedown
**Goal**: Safely preserve all critical files and stop the live site
**Depends on**: Nothing (first phase)
**Plans**: 2 plans

Plans:
- [x] 01-01: Backup critical files (.env, configs, secrets inventory)
- [x] 01-02: Stop/disable live site via Cloudways API

### Phase 2: Local Preparation
**Goal**: Create clean working copy and organize project structure
**Depends on**: Phase 1
**Plans**: 2 plans

Plans:
- [x] 02-01: Create duplicate directory for cleanup work
- [x] 02-02: Organize project structure (remove junk files, screenshots, test files)

### Phase 3: Security Audit
**Goal**: Ensure no secrets exposed, no vulnerabilities, proper security practices
**Depends on**: Phase 2
**Plans**: 3 plans

Plans:
- [x] 03-01: Scan for hardcoded secrets and credentials
- [x] 03-02: Audit .gitignore and ensure sensitive files excluded
- [x] 03-03: Review API endpoints for security (auth, validation, rate limiting)

### Phase 4: Code Cleanup
**Goal**: Clean, formatted, linted, type-safe codebase
**Depends on**: Phase 3
**Plans**: 3 plans

Plans:
- [x] 04-01: Remove debug code, console.logs, unused imports
- [x] 04-02: Run linter and fix all issues
- [x] 04-03: Run TypeScript strict checks, fix type errors

### Phase 5: Git & GitHub
**Goal**: Clean commit history, updated remote repository
**Depends on**: Phase 4
**Plans**: 2 plans

Plans:
- [ ] 05-01: Create clean commit with all changes
- [ ] 05-02: Push to GitHub (origin/master)

### Phase 6: Redeploy
**Goal**: Live site serving clean codebase at https://operate.guru/
**Depends on**: Phase 5
**Plans**: 3 plans

Plans:
- [ ] 06-01: Deploy to Cloudways (git pull, build, restart PM2)
- [ ] 06-02: Restore .env files on server
- [ ] 06-03: Verify deployment (all routes, API, auth working)

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Backup & Takedown | 2/2 | **COMPLETE** | 2025-12-08 |
| 2. Local Preparation | 2/2 | **COMPLETE** | 2025-12-08 |
| 3. Security Audit | 3/3 | **COMPLETE** | 2025-12-08 |
| 4. Code Cleanup | 3/3 | **COMPLETE** | 2025-12-08 |
| 5. Git & GitHub | 0/2 | Not started | - |
| 6. Redeploy | 0/3 | Not started | - |

## Plan Files

### Phase 1: Backup & Takedown
- `.planning/phases/01-backup-takedown/01-01-PLAN.md` - Backup critical files
- `.planning/phases/01-backup-takedown/01-02-PLAN.md` - Stop live site via Cloudways API

### Phase 2: Local Preparation
- `.planning/phases/02-local-preparation/02-01-PLAN.md` - Create clean working state
- `.planning/phases/02-local-preparation/02-02-PLAN.md` - Organize project structure

### Phase 3: Security Audit
- `.planning/phases/03-security-audit/03-01-PLAN.md` - Scan for hardcoded secrets
- `.planning/phases/03-security-audit/03-02-PLAN.md` - Audit .gitignore
- `.planning/phases/03-security-audit/03-03-PLAN.md` - Review API security

## Key Information

**Cloudways Details** (from CLAUDE.md):
- Server ID: 1557440
- App ID: 6037420
- Server IP: 164.90.202.153
- SSH: `ssh cloudways` (master_ayxzcfhxfe@164.90.202.153)
- API Key: EY4kemtTFi42JcnNNIwojcoCJW9Mjd
- Email: luk.gber@gmail.com

**GitHub**: Origin remote (to be verified)

**Local Path**: C:\Users\grube\op\operate-fresh
