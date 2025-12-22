# Operate Testing Plan
## Ultra-Detailed Testing Strategy

---

## Executive Summary

After analyzing the codebase, I've identified a mixed testing landscape with:
- **Playwright E2E tests** (well-structured, in `apps/web/e2e/`)
- **Ad-hoc Puppeteer scripts** (50+ files in root, disorganized)
- **No unit test coverage** (Jest configured but no tests)
- **Scattered test reports** (JSON, MD files across root)

This plan addresses: credentials, timeouts, browser debug options, context management, and organization.

---

## Critical Issues Identified

### 1. Test Credential Problems
| Issue | Impact | Risk |
|-------|--------|------|
| Real user credentials in code | Data pollution | HIGH |
| Hardcoded in `test-config.json` | Security exposure | HIGH |
| No test environment isolation | Production data mixed | CRITICAL |
| Single user for all tests | Race conditions | MEDIUM |

### 2. Timeout Configuration Issues
| Current Setting | Problem | Recommendation |
|-----------------|---------|----------------|
| Navigation: 30s | Too short for live server | 60-90s |
| Action: 10s | OK for fast actions | 15s |
| Assertion: 10s | OK | 10s |
| Global: 60s | May be insufficient | 120s |
| Network idle: "networkidle0" | Too strict | "networkidle2" |

### 3. Context Overload
- **50+ test files** scattered in root directory
- **Multiple report formats** (JSON, MD, TXT)
- **No test organization** by feature/batch
- **Screenshots in various folders** with inconsistent naming

---

## Recommended Test Architecture

```
operate-fresh/
├── apps/web/
│   ├── __tests__/              # Unit tests (Jest)
│   │   ├── components/
│   │   ├── hooks/
│   │   └── utils/
│   └── e2e/                    # E2E tests (Playwright)
│       ├── auth/
│       │   ├── login.spec.ts
│       │   ├── logout.spec.ts
│       │   └── oauth.spec.ts
│       ├── finance/
│       │   ├── invoices.spec.ts
│       │   ├── banking.spec.ts
│       │   └── transactions.spec.ts
│       ├── hr/
│       │   ├── employees.spec.ts
│       │   └── payroll.spec.ts
│       ├── settings/
│       └── fixtures/
│           ├── auth.fixture.ts
│           ├── data.fixture.ts
│           └── api.fixture.ts
├── apps/api/
│   ├── test/
│   │   ├── unit/
│   │   ├── integration/
│   │   └── e2e/
└── testing/                    # Shared test infrastructure
    ├── config/
    │   ├── playwright.shared.ts
    │   ├── jest.shared.js
    │   └── test.env.example
    ├── fixtures/
    │   ├── users.json
    │   ├── invoices.json
    │   └── transactions.json
    └── reports/                # Consolidated reports
        └── .gitkeep
```

---

## Test Credentials Strategy

### Environment-Based Configuration

```typescript
// testing/config/credentials.ts
export interface TestCredentials {
  email: string;
  password: string;
  tier: 'free' | 'pro' | 'enterprise';
  features: string[];
}

export const getTestCredentials = (): TestCredentials => {
  const tier = process.env.TEST_USER_TIER || 'pro';

  return {
    email: process.env.TEST_USER_EMAIL!,
    password: process.env.TEST_USER_PASSWORD!,
    tier: tier as TestCredentials['tier'],
    features: process.env.TEST_USER_FEATURES?.split(',') || [],
  };
};

// For different test scenarios
export const TEST_ACCOUNTS = {
  primary: {
    email: process.env.TEST_USER_EMAIL,
    password: process.env.TEST_USER_PASSWORD,
  },
  german: {
    email: process.env.TEST_GERMAN_USER_EMAIL,
    password: process.env.TEST_GERMAN_USER_PASSWORD,
  },
  onboarding: {
    // Fresh account that hasn't completed onboarding
    email: process.env.TEST_ONBOARDING_USER_EMAIL,
    password: process.env.TEST_ONBOARDING_USER_PASSWORD,
  },
  readonly: {
    // Account with limited permissions for negative testing
    email: process.env.TEST_READONLY_USER_EMAIL,
    password: process.env.TEST_READONLY_USER_PASSWORD,
  },
};
```

### Recommended `.env.test.local`

```bash
# Primary Test User (completed onboarding, has data)
TEST_USER_EMAIL=test-primary@operate.guru
TEST_USER_PASSWORD=TestPass123!Secure
TEST_USER_TIER=pro

# German Locale Test User
TEST_GERMAN_USER_EMAIL=test-de@operate.guru
TEST_GERMAN_USER_PASSWORD=TestPass123!Secure

# Fresh Onboarding Test User (reset before each test run)
TEST_ONBOARDING_USER_EMAIL=test-onboarding@operate.guru
TEST_ONBOARDING_USER_PASSWORD=TestPass123!Secure

# Read-only User (for permission testing)
TEST_READONLY_USER_EMAIL=test-readonly@operate.guru
TEST_READONLY_USER_PASSWORD=TestPass123!Secure

# URLs
TEST_BASE_URL=https://operate.guru
TEST_API_URL=https://operate.guru/api/v1

# Timeouts (milliseconds)
TEST_NAVIGATION_TIMEOUT=60000
TEST_ACTION_TIMEOUT=15000
TEST_ASSERTION_TIMEOUT=10000

# Debug
TEST_HEADLESS=true
TEST_SLOW_MO=0
TEST_TRACE=on-first-retry
```

### Account Creation Strategy

```sql
-- Create dedicated test accounts (run once in production DB)
-- These accounts should have predictable state

-- Primary test account (has invoices, transactions, etc.)
INSERT INTO users (email, password_hash, onboarding_completed, tier)
VALUES ('test-primary@operate.guru', '$2b$10$...', true, 'pro');

-- Onboarding test account (reset to fresh state before each test)
INSERT INTO users (email, password_hash, onboarding_completed, tier)
VALUES ('test-onboarding@operate.guru', '$2b$10$...', false, 'free');
```

---

## Timeout Strategy

### Playwright Configuration

```typescript
// apps/web/playwright.config.ts
import { defineConfig } from '@playwright/test';

const isCI = !!process.env.CI;
const isLive = process.env.TEST_BASE_URL?.includes('operate.guru');

export default defineConfig({
  // Global timeout per test
  timeout: isLive ? 120_000 : 60_000,

  // Expect timeout for assertions
  expect: {
    timeout: isLive ? 15_000 : 10_000,
  },

  use: {
    // Base URL
    baseURL: process.env.TEST_BASE_URL || 'http://localhost:3000',

    // Navigation timeout
    navigationTimeout: isLive ? 90_000 : 30_000,

    // Action timeout (click, fill, etc.)
    actionTimeout: isLive ? 20_000 : 10_000,

    // Trace recording strategy
    trace: isCI ? 'on-first-retry' : 'retain-on-failure',

    // Screenshot strategy
    screenshot: 'only-on-failure',

    // Video strategy (expensive, only for debugging)
    video: isCI ? 'off' : 'retain-on-failure',

    // Slow down actions for debugging
    launchOptions: {
      slowMo: process.env.TEST_SLOW_MO
        ? parseInt(process.env.TEST_SLOW_MO)
        : 0,
    },
  },

  // Retry configuration
  retries: isCI ? 2 : 1,

  // Parallel execution
  fullyParallel: !isCI, // Serial in CI for stability
  workers: isCI ? 2 : 4,
});
```

### Puppeteer Script Configuration

```javascript
// For ad-hoc Puppeteer scripts (legacy support)
const TIMEOUTS = {
  // Production/live server - longer timeouts
  live: {
    navigation: 90_000,    // 90 seconds
    page: 60_000,          // 60 seconds
    element: 30_000,       // 30 seconds
    network: 'networkidle2', // Less strict
  },
  // Local development - shorter timeouts
  local: {
    navigation: 30_000,    // 30 seconds
    page: 30_000,          // 30 seconds
    element: 10_000,       // 10 seconds
    network: 'networkidle0', // Strict
  },
};

const config = process.env.TEST_ENV === 'live'
  ? TIMEOUTS.live
  : TIMEOUTS.local;

// Usage in Puppeteer
const browser = await puppeteer.launch({
  headless: process.env.TEST_HEADLESS !== 'false',
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage', // Prevent memory issues
    '--disable-web-security',  // Allow cross-origin in tests
  ],
  defaultViewport: { width: 1920, height: 1080 },
  timeout: config.page,
});

const page = await browser.newPage();
page.setDefaultNavigationTimeout(config.navigation);
page.setDefaultTimeout(config.element);
```

### Adaptive Timeout Helper

```typescript
// testing/helpers/adaptive-timeout.ts

/**
 * Adaptive timeout that adjusts based on server response time
 */
export async function waitWithAdaptiveTimeout(
  page: Page,
  selector: string,
  baseTimeout: number = 10000
): Promise<void> {
  const startTime = Date.now();

  try {
    // First, try with base timeout
    await page.waitForSelector(selector, { timeout: baseTimeout });
  } catch (error) {
    // If failed, measure server health and retry with extended timeout
    const serverLatency = await measureServerLatency(page);
    const extendedTimeout = baseTimeout + (serverLatency * 3);

    console.log(`Extending timeout from ${baseTimeout}ms to ${extendedTimeout}ms (server latency: ${serverLatency}ms)`);

    await page.waitForSelector(selector, { timeout: extendedTimeout });
  }
}

async function measureServerLatency(page: Page): Promise<number> {
  const start = Date.now();
  await page.evaluate(() => fetch('/api/health').then(r => r.json()));
  return Date.now() - start;
}
```

---

## Browser Debug Options

### Playwright Debug Modes

```bash
# 1. UI Mode - Interactive debugging
pnpm test:e2e:ui

# 2. Headed Mode - See browser
pnpm test:e2e:headed

# 3. Debug Mode - Step through tests
pnpm test:e2e:debug

# 4. Trace Viewer - Post-mortem analysis
pnpm test:e2e
pnpm playwright show-trace trace.zip

# 5. Codegen - Record tests interactively
pnpm playwright codegen https://operate.guru/login

# 6. Inspector - Pause and inspect
PWDEBUG=1 pnpm test:e2e
```

### Enhanced Playwright Config for Debugging

```typescript
// playwright.config.ts - Debug-friendly setup
export default defineConfig({
  use: {
    // Trace everything for debugging
    trace: process.env.DEBUG ? 'on' : 'on-first-retry',

    // Full page screenshots
    screenshot: {
      mode: 'only-on-failure',
      fullPage: true,
    },

    // Record video for debugging
    video: process.env.DEBUG ? 'on' : 'retain-on-failure',

    // Show browser context info
    contextOptions: {
      logger: process.env.DEBUG ? {
        isEnabled: () => true,
        log: (name, severity, message) => console.log(`[${severity}] ${name}: ${message}`),
      } : undefined,
    },
  },

  // Reporter with detailed output
  reporter: process.env.DEBUG
    ? [['list']]
    : [
        ['html', { outputFolder: 'playwright-report' }],
        ['json', { outputFile: 'test-results/results.json' }],
        ['junit', { outputFile: 'test-results/junit.xml' }],
      ],
});
```

### Puppeteer Debug Utilities

```javascript
// testing/helpers/puppeteer-debug.js

/**
 * Enhanced Puppeteer browser launch with debug options
 */
async function launchDebugBrowser(options = {}) {
  const defaultOptions = {
    headless: process.env.DEBUG ? false : 'new',
    devtools: process.env.DEBUG === 'devtools',
    slowMo: process.env.DEBUG ? 100 : 0,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--window-size=1920,1080',
      // Enable logging
      '--enable-logging',
      '--v=1',
    ],
  };

  return puppeteer.launch({ ...defaultOptions, ...options });
}

/**
 * Setup page with debug listeners
 */
async function setupDebugPage(page) {
  // Log console messages
  page.on('console', msg => {
    const type = msg.type();
    if (type === 'error' || type === 'warning') {
      console.log(`[BROWSER ${type.toUpperCase()}]`, msg.text());
    }
  });

  // Log page errors
  page.on('pageerror', error => {
    console.error('[PAGE ERROR]', error.message);
  });

  // Log failed requests
  page.on('requestfailed', request => {
    console.error('[REQUEST FAILED]', request.url(), request.failure()?.errorText);
  });

  // Log responses with errors
  page.on('response', response => {
    if (response.status() >= 400) {
      console.warn(`[HTTP ${response.status()}]`, response.url());
    }
  });

  // Auto-screenshot on navigation
  if (process.env.DEBUG_SCREENSHOTS) {
    page.on('framenavigated', async frame => {
      if (frame === page.mainFrame()) {
        const timestamp = Date.now();
        await page.screenshot({
          path: `debug-screenshots/nav-${timestamp}.png`,
          fullPage: true,
        });
      }
    });
  }

  return page;
}

module.exports = { launchDebugBrowser, setupDebugPage };
```

---

## Context Overload Prevention

### Test Organization Strategy

```
BEFORE (Current - Chaotic):
operate-fresh/
├── batch1-auth-pages-test.js
├── batch1-test-output.txt
├── browser-auth-pages-test.json
├── browser-complete-auth-test.js
├── comprehensive-auth-test.js
├── comprehensive-finance-test.js
├── run-batch1-simple.js
├── run-batch12-13-test.js
├── run-batch14-15-test.js
├── run-batch8-hr-payroll.js
├── ... (50+ more files)
├── BATCH1_AUTH_TEST_RESULTS.json
├── BATCH2_ONBOARDING_FINAL.json
├── ... (30+ report files)
└── test-screenshots/
    └── (200+ screenshots)

AFTER (Proposed - Organized):
operate-fresh/
├── testing/
│   ├── e2e/
│   │   ├── suites/
│   │   │   ├── auth.suite.js
│   │   │   ├── finance.suite.js
│   │   │   ├── hr.suite.js
│   │   │   ├── settings.suite.js
│   │   │   └── full-regression.suite.js
│   │   ├── runners/
│   │   │   └── puppeteer-runner.js
│   │   └── config/
│   │       └── test.config.js
│   ├── reports/
│   │   └── [auto-generated per run]
│   └── screenshots/
│       └── [organized by date/suite]
└── apps/web/e2e/
    └── [Playwright tests - keep as-is]
```

### Cleanup Script

```javascript
// scripts/cleanup-test-files.js
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const ARCHIVE_DIR = path.join(ROOT, '_test-archive');

// Files to move to archive
const patterns = [
  /^batch\d+-.*\.(js|json|txt|md)$/i,
  /^run-.*\.js$/i,
  /^test-.*\.js$/i,
  /^comprehensive-.*\.js$/i,
  /^browser-.*\.(js|json)$/i,
  /^BATCH.*\.(json|md|txt)$/i,
  /^BROWSER_TEST.*\.(json|md|txt)$/i,
  /^.*TEST.*RESULTS.*\.(json|md)$/i,
];

function shouldArchive(filename) {
  return patterns.some(pattern => pattern.test(filename));
}

function main() {
  if (!fs.existsSync(ARCHIVE_DIR)) {
    fs.mkdirSync(ARCHIVE_DIR, { recursive: true });
  }

  const files = fs.readdirSync(ROOT);
  let archived = 0;

  files.forEach(file => {
    if (shouldArchive(file)) {
      const src = path.join(ROOT, file);
      const dest = path.join(ARCHIVE_DIR, file);

      if (fs.statSync(src).isFile()) {
        fs.renameSync(src, dest);
        console.log(`Archived: ${file}`);
        archived++;
      }
    }
  });

  console.log(`\nArchived ${archived} files to ${ARCHIVE_DIR}`);
}

main();
```

### Consolidated Test Runner

```javascript
// testing/run-tests.js
const { program } = require('commander');
const { spawn } = require('child_process');

program
  .name('test-runner')
  .description('Unified test runner for Operate')
  .option('-s, --suite <name>', 'Test suite to run (auth, finance, hr, all)')
  .option('-e, --env <env>', 'Environment (local, staging, production)', 'staging')
  .option('-b, --browser', 'Run in headed browser mode')
  .option('-d, --debug', 'Enable debug mode')
  .option('-r, --report', 'Generate HTML report')
  .parse();

const options = program.opts();

const ENV_CONFIG = {
  local: 'http://localhost:3000',
  staging: 'https://staging.operate.guru',
  production: 'https://operate.guru',
};

async function runTests() {
  const baseUrl = ENV_CONFIG[options.env] || ENV_CONFIG.staging;

  const env = {
    ...process.env,
    TEST_BASE_URL: baseUrl,
    TEST_HEADLESS: options.browser ? 'false' : 'true',
    DEBUG: options.debug ? '1' : '',
  };

  let command, args;

  if (options.suite === 'all' || !options.suite) {
    // Run Playwright tests
    command = 'npx';
    args = ['playwright', 'test'];

    if (options.debug) args.push('--debug');
    if (options.browser) args.push('--headed');
    if (options.report) args.push('--reporter=html');
  } else {
    // Run specific suite
    command = 'npx';
    args = ['playwright', 'test', `--grep=${options.suite}`];
  }

  console.log(`Running: ${command} ${args.join(' ')}`);
  console.log(`Environment: ${options.env} (${baseUrl})`);

  const proc = spawn(command, args, {
    cwd: path.join(process.cwd(), 'apps/web'),
    env,
    stdio: 'inherit',
  });

  proc.on('close', code => process.exit(code));
}

runTests();
```

---

## Test Data Management

### Fixtures Strategy

```typescript
// testing/fixtures/users.fixture.ts
export const TEST_USERS = {
  // Primary account with full data
  primary: {
    id: 'test-user-001',
    email: 'test-primary@operate.guru',
    company: {
      name: 'Test Company GmbH',
      vatId: 'DE123456789',
      country: 'DE',
    },
    invoices: 25,
    transactions: 150,
    employees: 5,
  },

  // Fresh account for onboarding tests
  fresh: {
    id: 'test-user-002',
    email: 'test-onboarding@operate.guru',
    company: null,
    invoices: 0,
    transactions: 0,
    employees: 0,
  },
};

// testing/fixtures/invoices.fixture.ts
export const TEST_INVOICES = [
  {
    id: 'inv-001',
    number: 'TEST-2024-001',
    amount: 1000.00,
    currency: 'EUR',
    status: 'paid',
    customer: 'Test Customer 1',
  },
  // ... more fixtures
];
```

### Database Seeding

```typescript
// testing/seed/seed-test-data.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedTestData() {
  console.log('Seeding test data...');

  // Create test user
  await prisma.user.upsert({
    where: { email: 'test-primary@operate.guru' },
    update: {},
    create: {
      email: 'test-primary@operate.guru',
      passwordHash: await hash('TestPass123!Secure'),
      emailVerified: new Date(),
      onboardingCompleted: true,
      company: {
        create: {
          name: 'Test Company GmbH',
          country: 'DE',
          vatId: 'DE123456789',
        },
      },
    },
  });

  // Create test invoices
  // ... etc

  console.log('Test data seeded successfully');
}

export async function cleanupTestData() {
  // Remove test data but keep accounts
  await prisma.invoice.deleteMany({
    where: { user: { email: { contains: 'test-' } } },
  });
}
```

---

## Test Execution Strategy

### Batch Testing Approach

```
┌─────────────────────────────────────────────────────────────────┐
│                    TEST EXECUTION FLOW                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. SMOKE TESTS (5 min)                                        │
│     └─ Login, Dashboard load, Critical API health              │
│                                                                 │
│  2. AUTH BATCH (10 min)                                        │
│     └─ Login/Logout, OAuth, Session, Protected routes          │
│                                                                 │
│  3. CORE FEATURES (30 min)                                     │
│     ├─ Finance: Invoices, Banking, Transactions                │
│     ├─ HR: Employees, Payroll                                  │
│     └─ Settings: Profile, Security, Billing                    │
│                                                                 │
│  4. EDGE CASES (15 min)                                        │
│     └─ Error handling, Permissions, Validation                 │
│                                                                 │
│  5. FULL REGRESSION (60 min) - Weekly only                     │
│     └─ All features, All browsers, Mobile viewports            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### CI/CD Pipeline

```yaml
# .github/workflows/test.yml
name: E2E Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  smoke-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - run: pnpm install
      - run: pnpm playwright install chromium

      - name: Run Smoke Tests
        run: pnpm --filter @operate/web test:e2e --grep @smoke
        env:
          TEST_BASE_URL: https://operate.guru
          TEST_USER_EMAIL: ${{ secrets.TEST_USER_EMAIL }}
          TEST_USER_PASSWORD: ${{ secrets.TEST_USER_PASSWORD }}

      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: smoke-test-results
          path: apps/web/test-results/

  full-e2e:
    needs: smoke-tests
    runs-on: ubuntu-latest
    strategy:
      matrix:
        browser: [chromium, firefox, webkit]
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm playwright install ${{ matrix.browser }}

      - name: Run E2E Tests
        run: pnpm --filter @operate/web test:e2e --project=${{ matrix.browser }}
        env:
          TEST_BASE_URL: https://operate.guru
          TEST_USER_EMAIL: ${{ secrets.TEST_USER_EMAIL }}
          TEST_USER_PASSWORD: ${{ secrets.TEST_USER_PASSWORD }}

      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: e2e-results-${{ matrix.browser }}
          path: |
            apps/web/test-results/
            apps/web/playwright-report/
```

---

## Recommended Immediate Actions

### Priority 1: Security (Do Now)

```bash
# 1. Move credentials to environment
# Create apps/web/.env.test.local (gitignored)
TEST_USER_EMAIL=luk.gber@gmail.com
TEST_USER_PASSWORD=Schlagzeug1@

# 2. Update test-config.json to remove credentials
# Replace with:
{
  "baseUrl": "${TEST_BASE_URL:-https://operate.guru}",
  "credentials": "FROM_ENV",
  ...
}

# 3. Add to .gitignore
*.env.test.local
test-results/
playwright-report/
```

### Priority 2: Organization (This Week)

1. **Archive old test files**: Run the cleanup script
2. **Consolidate to Playwright**: Migrate Puppeteer scripts to Playwright
3. **Standardize reporting**: Single output location

### Priority 3: Infrastructure (This Sprint)

1. **Create dedicated test accounts** in production
2. **Set up test data seeding**
3. **Configure CI/CD pipeline**

---

## Quick Reference Commands

```bash
# Run all E2E tests
cd apps/web && pnpm test:e2e

# Run with UI (debugging)
pnpm test:e2e:ui

# Run headed (see browser)
pnpm test:e2e:headed

# Run specific test file
pnpm test:e2e auth.spec.ts

# Run tests matching pattern
pnpm test:e2e --grep "login"

# Run with debug mode
PWDEBUG=1 pnpm test:e2e

# Generate report
pnpm test:e2e:report

# Run on specific browser
pnpm test:e2e:chromium
pnpm test:e2e:firefox
pnpm test:e2e:webkit

# Run with environment
TEST_BASE_URL=https://operate.guru pnpm test:e2e
```

---

## Summary

| Area | Current State | Recommendation |
|------|---------------|----------------|
| **Credentials** | Hardcoded in files | Environment variables |
| **Timeouts** | 30s (too short) | 60-90s for live server |
| **Debug** | Limited | Playwright UI + traces |
| **Organization** | 50+ scattered files | Consolidated structure |
| **Reports** | Multiple formats | Single HTML report |
| **CI/CD** | None | GitHub Actions pipeline |
| **Test Data** | Uses real data | Dedicated test accounts |

**Estimated Implementation Time**:
- Security fixes: 1 hour
- Organization: 4 hours
- Full infrastructure: 2 days
