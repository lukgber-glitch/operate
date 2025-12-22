# Operate - Vibe Code Cleanup & Production Hardening Plan

> **Generated:** December 20, 2025
> **Based on:** Industry research on vibe coding cleanup best practices + comprehensive codebase audit
> **Goal:** Ensure zero problems in production - security, performance, maintainability, and reliability

---

## Executive Summary

Based on research into [vibe coding cleanup specialists](https://codeconductor.ai/blog/vibe-coding-cleanup-specialists/) and [common AI-generated code problems](https://techstartups.com/2025/12/11/the-vibe-coding-delusion-why-thousands-of-startups-are-now-paying-the-price-for-ai-generated-technical-debt/), combined with a thorough audit of the Operate codebase, this plan addresses:

- **1 Critical Issue:** Hardcoded secrets in version control
- **100+ TODOs:** Indicating incomplete work
- **1,348 weak type usages:** `any`/`unknown` throughout codebase
- **35 large files:** Needing refactoring (800+ LOC each)
- **50+ untested controllers:** Critical test coverage gaps
- **326 console.log statements:** In production code

**Industry Context:** According to [GitClear's analysis](https://www.infoworld.com/article/4098925/is-vibe-coding-the-new-gateway-to-technical-debt.html), AI-assisted code has 41% more code churn. [Veracode's 2025 report](https://fingerprint.com/blog/vibe-coding-security-checklist/) found nearly half of AI-generated code contains security flaws. This plan ensures Operate avoids these pitfalls.

---

## Phase 1: CRITICAL - Security Remediation (Immediate)

### 1.1 Secret Rotation & Management

**Priority:** 🔴 CRITICAL - Do First
**Timeline:** Immediate
**Owner:** DevOps/Security Lead

#### Issue Found
Hardcoded secrets in `.env` files committed to git:
- Database credentials (PostgreSQL password)
- JWT secrets (access & refresh)
- Google OAuth credentials
- Anthropic API key
- OpenAI API key
- Stripe live keys (secret, publishable, webhook)
- GoCardless access token
- NextAuth secret

#### Action Items

| # | Task | Status |
|---|------|--------|
| 1.1.1 | **Revoke & rotate all exposed API keys** | ⬜ TODO |
| | - Anthropic API key | ⬜ |
| | - OpenAI API key | ⬜ |
| | - Stripe keys (all 3) | ⬜ |
| | - GoCardless token | ⬜ |
| | - Google OAuth credentials | ⬜ |
| 1.1.2 | **Generate new JWT secrets** (256-bit random) | ⬜ TODO |
| 1.1.3 | **Update database password** | ⬜ TODO |
| 1.1.4 | **Remove secrets from git history** | ⬜ TODO |
| | - Use BFG Repo Cleaner or git filter-branch | |
| 1.1.5 | **Implement secrets management** | ⬜ TODO |
| | - Option A: Environment variables (Cloudways) | |
| | - Option B: HashiCorp Vault | |
| | - Option C: AWS Secrets Manager | |
| 1.1.6 | **Create `.env.example` template** (no real values) | ⬜ TODO |
| 1.1.7 | **Verify `.gitignore` includes all `.env*` files** | ⬜ TODO |
| 1.1.8 | **Delete `.env.local.backup` file** | ⬜ TODO |

#### Verification
```bash
# Verify no secrets in git history
git log -p --all -S 'sk-ant-api' -- . | head -20
git log -p --all -S 'sk_live_' -- . | head -20
```

---

### 1.2 Production Security Hardening

**Priority:** 🔴 HIGH
**Owner:** Backend Lead

| # | Task | File Location | Status |
|---|------|---------------|--------|
| 1.2.1 | Ensure `TEST_AUTH_SECRET` NOT set in production | Production env | ⬜ TODO |
| 1.2.2 | Verify HTTPS enforcement on all endpoints | `main.ts` | ✅ Done (HSTS configured) |
| 1.2.3 | Review CORS whitelist for production | `main.ts:96-117` | ✅ Done |
| 1.2.4 | Validate CSP headers block unsafe-inline | `main.ts:29-75` | ✅ Done |
| 1.2.5 | Confirm rate limiting active in production | `app.module.ts:79-116` | ✅ Done |
| 1.2.6 | Audit all `@Public()` endpoints | All controllers | ⬜ TODO |
| 1.2.7 | Review webhook signature verification | Stripe, banking webhooks | ✅ Done |

---

## Phase 2: Code Quality & Technical Debt

### 2.1 Empty Catch Blocks (Critical)

**Priority:** 🔴 HIGH
**Impact:** Silent failures hide bugs

| File | Line | Fix |
|------|------|-----|
| `apps/web/src/hooks/use-leave-overview.ts` | 44 | Add error logging or rethrow |
| `apps/web/src/hooks/use-leave-overview.ts` | 58 | Add error logging or rethrow |

**Pattern to Apply:**
```typescript
// BEFORE (bad)
catch (err) { }

// AFTER (good)
catch (err) {
  console.error('Leave overview fetch failed:', err);
  // Or: throw err; for critical paths
}
```

---

### 2.2 TODO/FIXME Resolution

**Priority:** 🟠 HIGH
**Count:** 100+ incomplete items

#### Critical TODOs by Module

| Module | Count | Key Items |
|--------|-------|-----------|
| **Autopilot** | 15+ | Suggestion engine, proactive alerts, learning |
| **Email Intelligence** | 9 | Invoice extraction, attachment handling |
| **Tax Filing** | 7 | Auto-filing, deadline tracking |
| **Bills/Vendors** | 7 | Payment scheduling, vendor management |
| **Notifications** | 6 | Push notifications, delivery tracking |
| **Documents** | 5 | OCR improvements, classification |

#### Action Plan
1. Export all TODOs to tracking system
2. Prioritize by business impact
3. Convert to sprint backlog items
4. Track completion in STATE.json

**Command to find all TODOs:**
```bash
grep -rn "TODO\|FIXME" apps/api/src --include="*.ts" | wc -l
```

---

### 2.3 TypeScript Type Safety

**Priority:** 🟠 MEDIUM
**Count:** 1,348 `any`/`unknown` usages in 571 files

#### High-Priority Files to Fix

| File | any Count | Priority |
|------|-----------|----------|
| `invoices.service.ts` | 15+ | HIGH - Financial data |
| `prisma.service.ts` | 10+ | HIGH - Database layer |
| `auth.service.ts` | 8+ | HIGH - Security |
| `automation.controller.ts` | 6+ | MEDIUM |
| `export-scheduler.service.ts` | 5+ | MEDIUM |

#### Strategy
1. Enable `noImplicitAny` in tsconfig (staged rollout)
2. Create interfaces for all API responses
3. Use Zod schemas for runtime validation
4. Replace `any` with proper generics or union types

---

### 2.4 Large File Refactoring

**Priority:** 🟡 MEDIUM
**Count:** 35 files > 800 LOC

#### Top 10 Files Needing Split

| File | Lines | Recommended Split |
|------|-------|-------------------|
| `tink-mock-data.util.ts` | 1,900 | Extract to JSON fixtures |
| `ai-report.service.ts` | 1,733 | Split by report type |
| `cashflow-report.service.ts` | 1,700 | Extract helpers |
| `report-generator.service.ts` | 1,649 | Strategy pattern |
| `pnl-report.service.ts` | 1,547 | Extract calculations |
| `settings/page.tsx` | 1,364 | Component composition |
| `invoices.service.ts` | 1,219 | Extract CRUD, calculations |
| `transaction-classifier.service.ts` | 917 | Extract rules engine |

#### Refactoring Pattern
```
Before: monolithic-service.ts (1500 LOC)

After:
├── service.ts (200 LOC) - orchestration
├── helpers/
│   ├── calculations.ts
│   ├── transformers.ts
│   └── validators.ts
├── strategies/
│   ├── type-a.strategy.ts
│   └── type-b.strategy.ts
└── types.ts
```

---

### 2.5 Console.log Cleanup

**Priority:** 🟡 LOW
**Count:** 326 files with console statements

#### Strategy
1. Replace with NestJS Logger in API
2. Replace with proper logging service in Web
3. Keep only in:
   - Test files (`*.spec.ts`, `*.test.ts`)
   - Build scripts (`scripts/`)
   - Development utilities

**Automated Fix:**
```typescript
// Create Logger wrapper
import { Logger } from '@nestjs/common';

const logger = new Logger('ServiceName');
logger.log('Info message');
logger.error('Error message', error.stack);
logger.warn('Warning message');
```

---

## Phase 3: Testing & Quality Assurance

### 3.1 Controller Test Coverage

**Priority:** 🔴 HIGH
**Gap:** 50+ controllers without unit tests

#### Controllers Needing Tests (Priority Order)

| Controller | Risk Level | Status |
|------------|------------|--------|
| `auth.controller.ts` | CRITICAL | ⬜ Partial |
| `oauth.controller.ts` | CRITICAL | ⬜ Missing |
| `billing.controller.ts` | HIGH | ⬜ Missing |
| `invoices.controller.ts` | HIGH | ⬜ E2E only |
| `banking.controller.ts` | HIGH | ⬜ E2E only |
| `users.controller.ts` | HIGH | ⬜ Missing |
| `automation.controller.ts` | MEDIUM | ✅ Has spec |
| `tax.controller.ts` | MEDIUM | ⬜ Missing |
| `payroll.controller.ts` | MEDIUM | ⬜ Missing |
| ... (40+ more) | | |

#### Test Template
```typescript
describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: createMock<AuthService>() },
      ],
    }).compile();

    controller = module.get(AuthController);
    authService = module.get(AuthService);
  });

  describe('login', () => {
    it('should return tokens on valid credentials', async () => {
      // Arrange
      authService.login.mockResolvedValue({ accessToken: 'token' });

      // Act
      const result = await controller.login({ email: 'test@test.com', password: 'pass' });

      // Assert
      expect(result.accessToken).toBeDefined();
    });
  });
});
```

---

### 3.2 Service Layer Tests

**Priority:** 🟠 HIGH
**Gap:** Core business logic untested

| Service | Test Priority | Reason |
|---------|---------------|--------|
| `auth.service.ts` | CRITICAL | Security |
| `invoices.service.ts` | CRITICAL | Financial accuracy |
| `transaction-classifier.service.ts` | HIGH | AI correctness |
| `bank-sync.service.ts` | HIGH | Data integrity |
| `tax-*.service.ts` | HIGH | Compliance |
| `reconciliation.service.ts` | HIGH | Accuracy |

---

### 3.3 Integration Test Gaps

**Priority:** 🟠 MEDIUM

#### Missing Integration Flows

| Flow | Status |
|------|--------|
| Auth → Dashboard → Logout | ⬜ Partial |
| Bank Connect → Sync → Classify | ⬜ Missing |
| Invoice Create → Send → Payment | ⬜ Missing |
| Document Upload → OCR → Extract | ⬜ Missing |
| Chat → Action → Confirmation | ⬜ Missing |
| Tax Calculate → File → Confirm | ⬜ Missing |

---

### 3.4 E2E Test Improvements

**Priority:** 🟡 MEDIUM

#### Current Coverage
- ✅ Auth flows (login, register, MFA)
- ✅ Basic banking
- ✅ Chat interface
- ✅ Invoice creation
- ✅ Tax page
- ✅ HR documents

#### Needed Additions
- ⬜ Complete payment flow with Stripe
- ⬜ Multi-tenant isolation tests
- ⬜ Error recovery scenarios
- ⬜ Offline mode functionality
- ⬜ Mobile responsive tests
- ⬜ Accessibility (a11y) tests

---

### 3.5 Test Infrastructure

| Item | Status | Action |
|------|--------|--------|
| Coverage reporting in CI | ⬜ Missing | Add Jest coverage thresholds |
| Test data factories | ⬜ Missing | Create Prisma factories |
| Mock service library | ⬜ Partial | Centralize mocks |
| Visual regression tests | ⬜ Missing | Add Playwright snapshots |
| Performance benchmarks | ⬜ Missing | Add k6 or Artillery |
| Security scanning | ⬜ Missing | Add SAST/DAST tools |

---

## Phase 4: Performance Optimization

### 4.1 Database Query Optimization

**Priority:** 🟠 MEDIUM

| Area | Issue | Fix |
|------|-------|-----|
| N+1 queries | Likely in list endpoints | Add `include` statements |
| Missing indexes | Unknown | Run EXPLAIN ANALYZE |
| Slow queries | Logged (>100ms) | Optimize or cache |
| Connection pooling | Unknown | Verify PgBouncer |

**Audit Command:**
```sql
-- Find slow queries
SELECT query, calls, mean_time, total_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 20;
```

---

### 4.2 API Response Optimization

| Optimization | Status | Impact |
|--------------|--------|--------|
| Response compression | ✅ Enabled | Bandwidth |
| Pagination | ⬜ Audit | Memory |
| Field selection | ⬜ Missing | Payload size |
| Caching headers | ⬜ Partial | Latency |
| Redis caching | ✅ Configured | Speed |

---

### 4.3 Frontend Performance

| Metric | Target | Current | Action |
|--------|--------|---------|--------|
| LCP | < 2.5s | Unknown | Measure |
| FID | < 100ms | Unknown | Measure |
| CLS | < 0.1 | Unknown | Measure |
| Bundle size | < 500KB | Unknown | Analyze |

**Measurement:**
```bash
# Add to CI
npx lighthouse https://operate.guru --output=json
```

---

## Phase 5: Documentation & Maintainability

### 5.1 Code Documentation

| Area | Status | Action |
|------|--------|--------|
| API endpoint docs | ⬜ Partial | Complete Swagger |
| Service JSDoc | ⬜ Missing | Add to complex functions |
| Component props | ⬜ Missing | Add prop documentation |
| Architecture docs | ⬜ Missing | Create ADRs |
| Onboarding guide | ⬜ Missing | Developer setup docs |

---

### 5.2 API Documentation

```typescript
// Good Swagger example
@ApiOperation({
  summary: 'Create invoice',
  description: 'Creates a new invoice for the organization'
})
@ApiResponse({ status: 201, type: InvoiceDto })
@ApiResponse({ status: 400, description: 'Invalid input' })
@Post()
async create(@Body() dto: CreateInvoiceDto) {}
```

---

## Phase 6: Monitoring & Observability

### 6.1 Error Tracking

| Item | Status | Action |
|------|--------|--------|
| Sentry integration | ✅ Configured | Verify coverage |
| Error boundaries | ⬜ Partial | Add to all routes |
| Alert thresholds | ⬜ Unknown | Configure |
| Error grouping | ⬜ Unknown | Review |

---

### 6.2 Application Monitoring

| Metric | Status | Tool |
|--------|--------|------|
| API latency | ⬜ Unknown | Add APM |
| Database queries | ✅ Logged | Prisma |
| Memory usage | ⬜ Unknown | PM2 |
| CPU usage | ⬜ Unknown | PM2 |
| Request rate | ⬜ Unknown | Add metrics |

---

### 6.3 Audit Logging

| Event | Logged | Location |
|-------|--------|----------|
| User login | ✅ Yes | Auth service |
| Data changes | ✅ Yes | Automation audit |
| API access | ⬜ Partial | Add middleware |
| Admin actions | ⬜ Unknown | Verify |
| Failed auth | ✅ Yes | Auth service |

---

## Phase 7: CI/CD & DevOps

### 7.1 Pipeline Improvements

| Step | Status | Action |
|------|--------|--------|
| Lint check | ⬜ Unknown | Add to CI |
| Type check | ⬜ Unknown | Add `tsc --noEmit` |
| Unit tests | ✅ Configured | Enforce |
| E2E tests | ✅ Configured | Expand |
| Security scan | ⬜ Missing | Add Snyk/Trivy |
| Dependency audit | ⬜ Missing | Add `npm audit` |
| Coverage gates | ⬜ Missing | Add thresholds |

---

### 7.2 Dependency Management

| Task | Frequency | Tool |
|------|-----------|------|
| Update dependencies | Monthly | Dependabot |
| Security audit | Weekly | `npm audit` |
| License check | On PR | license-checker |
| Unused deps | Monthly | depcheck |

**Current Vulnerabilities:**
```bash
# Run in project root
pnpm audit
```

---

## Phase 8: Compliance & GDPR

### 8.1 Data Protection

| Requirement | Status | Evidence |
|-------------|--------|----------|
| Data encryption at rest | ⬜ Verify | Database encryption |
| Data encryption in transit | ✅ Yes | HTTPS/TLS |
| Right to deletion | ⬜ Verify | DataSubjectRequest model exists |
| Data portability | ⬜ Unknown | Export functionality |
| Consent management | ⬜ Unknown | Verify implementation |
| Retention policies | ⬜ Verify | DataRetentionPolicy model exists |

---

## Implementation Priority Matrix

### Immediate (This Week)
1. 🔴 Rotate all exposed secrets
2. 🔴 Remove secrets from git history
3. 🔴 Implement proper secrets management
4. 🔴 Verify TEST_AUTH_SECRET not in production

### Short-term (2 Weeks)
5. 🟠 Fix empty catch blocks
6. 🟠 Add tests for auth controller
7. 🟠 Add tests for billing controller
8. 🟠 Add tests for invoices service
9. 🟠 Review and close critical TODOs

### Medium-term (1 Month)
10. 🟡 TypeScript strict mode migration (staged)
11. 🟡 Refactor large files (top 5)
12. 🟡 Complete Swagger documentation
13. 🟡 Add integration tests for critical flows
14. 🟡 Performance baseline measurement

### Long-term (Ongoing)
15. ⚪ Full test coverage (80%+)
16. ⚪ Complete TODO resolution
17. ⚪ Documentation improvements
18. ⚪ Monitoring enhancements
19. ⚪ Accessibility compliance

---

## Tracking & Verification

### Weekly Checklist
- [ ] Security scan passed
- [ ] No new secrets in commits
- [ ] Test coverage maintained
- [ ] No critical TODOs added
- [ ] Dependencies updated

### Monthly Review
- [ ] Full security audit
- [ ] Performance benchmarks
- [ ] Code quality metrics
- [ ] Documentation review
- [ ] Dependency audit

---

## Success Metrics

| Metric | Current | Target | Timeline |
|--------|---------|--------|----------|
| Security vulnerabilities | 1 critical | 0 | 1 week |
| Test coverage | ~30% | 80% | 3 months |
| TypeScript strict | No | Yes | 2 months |
| TODO count | 100+ | < 20 | 2 months |
| Large files (>800 LOC) | 35 | < 10 | 2 months |
| Lighthouse score | Unknown | > 90 | 1 month |

---

## Sources & References

- [Vibe Coding Cleanup Specialists - CodeConductor](https://codeconductor.ai/blog/vibe-coding-cleanup-specialists/)
- [Vibe Coding Technical Debt Crisis - TechStartups](https://techstartups.com/2025/12/11/the-vibe-coding-delusion-why-thousands-of-startups-are-now-paying-the-price-for-ai-generated-technical-debt/)
- [Vibe Coding Security Checklist - Fingerprint](https://fingerprint.com/blog/vibe-coding-security-checklist/)
- [Secure Vibe Coding Guide - Cloud Security Alliance](https://cloudsecurityalliance.org/blog/2025/04/09/secure-vibe-coding-guide)
- [OWASP AI Testing Guide](https://owasp.org/www-project-ai-testing-guide/)
- [Managing Technical Debt in Vibe Coding - InfoWorld](https://www.infoworld.com/article/4098925/is-vibe-coding-the-new-gateway-to-technical-debt.html)
- [Vibe Coding Cleanup Service - Ulam Labs](https://www.ulam.io/software-services/we-clean-up-after-vibe-coding)
- [Replit Secure Vibe Coding Best Practices](https://blog.replit.com/16-ways-to-vibe-code-securely)

---

*This plan ensures Operate meets production-grade standards and avoids the common pitfalls of vibe-coded applications.*
