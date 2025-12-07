# Sprint 1: Security Hardening - ACTIVE

**Status:** IN PROGRESS
**Started:** 2024-12-07T20:00:00Z
**Owner:** SENTINEL (5 parallel agents)

## Active Agents

| Task | Description | Agent | Status |
|------|-------------|-------|--------|
| S1-01 | Fix OAuth Token Exposure | 2bcd674b | 🔄 Running |
| S1-02 | Create TenantGuard Middleware | ff81beab | 🔄 Running |
| S1-04 | Audit Raw SQL Queries | 31530234 | 🔄 Running |
| S1-05 | Hash Refresh Tokens | eb24aeed | 🔄 Running |
| S1-06 | Add Financial Audit Logs | 351cb664 | 🔄 Running |

## Pending (Sequential)

| Task | Description | Depends On | Status |
|------|-------------|------------|--------|
| S1-03 | Apply TenantGuard to Controllers | S1-02 | ⏳ Waiting |

## Task Details

### S1-01: Fix OAuth Token Exposure [2h]
- **File:** apps/api/src/modules/auth/oauth.controller.ts
- **Problem:** Tokens visible in redirect URL
- **Fix:** Use httpOnly cookies instead of URL params

### S1-02: Create TenantGuard Middleware [8h]
- **File:** apps/api/src/common/guards/tenant.guard.ts (CREATE)
- **Problem:** No multi-tenancy enforcement
- **Fix:** Guard that validates orgId on all requests

### S1-03: Apply TenantGuard to Controllers [8h]
- **Files:** All controllers in apps/api/src/modules/*/
- **Problem:** Controllers don't use tenant guard
- **Fix:** Add @UseGuards(TenantGuard) decorator
- **Depends:** S1-02 must complete first

### S1-04: Audit Raw SQL Queries [6h]
- **Files:** elster.service.ts, tink.service.ts, peppol.service.ts
- **Problem:** Raw SQL may lack tenant filter
- **Fix:** Add organizationId WHERE clause or convert to Prisma

### S1-05: Hash Refresh Tokens [4h]
- **File:** apps/api/src/modules/auth/auth.service.ts
- **Problem:** Refresh tokens stored plaintext
- **Fix:** SHA256 hash before storing

### S1-06: Add Financial Audit Logs [6h]
- **Files:** invoices.service.ts, expenses.service.ts, transactions.service.ts
- **Problem:** No audit trail for financial access
- **Fix:** Log all read/write operations

## Sprint 1 Total: 34h

---

## Next Steps

1. Wait for S1-01, S1-04, S1-05, S1-06 to complete
2. Wait for S1-02 to complete
3. Launch S1-03 (depends on S1-02)
4. When all complete, mark Sprint 1 DONE
5. Launch Sprint 2: Chatbot Connectivity
