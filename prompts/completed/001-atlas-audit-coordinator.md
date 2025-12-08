<objective>
Act as ATLAS (Project Manager) to coordinate a comprehensive audit of the Operate application. You will launch and coordinate specialized audit agents in parallel, collect their findings, prioritize issues, and create an actionable remediation plan.

This is the master coordination prompt - you orchestrate the audit but do NOT write code directly.
</objective>

<context>
Operate is an enterprise SaaS platform for business automation:
- Goal: Companies open the app and it proactively suggests improvements for cashflow, taxes, expenses
- Chat-first interface where suggestions get "locked in" to the AI chatbot
- Tech stack: NestJS backend, Next.js frontend, Prisma/PostgreSQL database
- Integrations: Google OAuth, Anthropic AI, TrueLayer, Tink, Stripe, Plaid

Project structure:
- apps/api/ - NestJS Backend
- apps/web/ - Next.js Frontend
- apps/workers/ - Background jobs
- packages/database/ - Prisma schema
- packages/shared/ - Shared types
</context>

<coordination_strategy>
Phase 1: Launch Parallel Research Agents (run simultaneously)
- Agent 1: Code Quality & Corruption Scanner
- Agent 2: Security Audit Agent
- Agent 3: API Completeness Checker
- Agent 4: Database & Schema Validator
- Agent 5: UX & Chat Enhancement Researcher

Phase 2: Collect and Analyze Findings
- Aggregate all agent reports
- Identify critical issues vs nice-to-haves
- Map dependencies between fixes

Phase 3: Create Prioritized Fix Plan
- P0: Security vulnerabilities, data corruption risks
- P1: Broken functionality, missing core features
- P2: Performance issues, code quality
- P3: UX improvements, nice-to-have features

Phase 4: Launch Fix Agents (sequential where needed)
</coordination_strategy>

<your_tasks>
1. Read and understand the current project state from:
   - agents/STATE.json
   - agents/FULL_AUTOMATION_PLAN.md
   - Current git status (there are many modified files)

2. Launch Task agents in parallel for each audit area:
   - Use subagent_type="Explore" for codebase analysis
   - Use subagent_type="general-purpose" for research tasks

3. Collect findings into a structured report at:
   `./audits/COMPREHENSIVE_AUDIT_REPORT.md`

4. Create prioritized fix plan at:
   `./audits/REMEDIATION_PLAN.md`

5. Update agents/STATE.json with audit status
</your_tasks>

<output>
Create the following deliverables:

1. `./audits/COMPREHENSIVE_AUDIT_REPORT.md` containing:
   - Executive Summary
   - Findings by Category (Critical/High/Medium/Low)
   - Code Quality Issues
   - Security Vulnerabilities
   - Missing APIs/Features
   - UX/Chat Improvements
   - Quick Wins (easy to implement)

2. `./audits/REMEDIATION_PLAN.md` containing:
   - Prioritized task list with effort estimates
   - Dependency mapping
   - Recommended execution order
   - Agent assignments for each fix

3. Update `agents/STATE.json` with:
   - audit_status: "complete"
   - audit_date: [current date]
   - critical_issues_count: [number]
   - total_issues_count: [number]
</output>

<success_criteria>
- All 5 audit areas have been thoroughly analyzed
- Critical security issues identified and flagged
- Missing business functionality documented
- Chat/UX enhancement opportunities listed
- Actionable fix plan created with clear priorities
- State file updated with audit results
</success_criteria>
