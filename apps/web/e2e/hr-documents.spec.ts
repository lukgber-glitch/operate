import { test, expect, Page } from '@playwright/test';

// Test configuration
const TEST_URL = 'https://operate.guru';
const TEST_EMAIL = 'luk.gber@gmail.com';
const TEST_PASSWORD = 'schlagzeug';

// Helper to login before tests
async function login(page: Page) {
  await page.goto(`${TEST_URL}/login`);
  await page.waitForLoadState('networkidle');

  // Manual login notice
  console.log('⏸️  MANUAL LOGIN REQUIRED - Please log in with:', TEST_EMAIL);

  // Wait for manual login (90 seconds)
  await page.waitForTimeout(90000);

  // Verify we're logged in by checking URL
  const currentUrl = page.url();
  if (currentUrl.includes('login')) {
    throw new Error('Login appears to have failed - still on login page');
  }
}

// Test results tracking
const results = {
  summary: { total: 0, passed: 0, failed: 0 },
  issues: [] as Array<{ page: string; url: string; error: string }>
};

test.describe('HR Module Tests', () => {
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await login(page);
    await page.close();
  });

  test('HR Dashboard loads', async ({ page }) => {
    results.summary.total++;
    const url = `${TEST_URL}/hr`;

    try {
      await page.goto(url);
      await page.waitForLoadState('networkidle');

      // Check for no error messages
      const bodyText = await page.textContent('body');
      const hasError = bodyText?.toLowerCase().includes('error') ||
                      bodyText?.toLowerCase().includes('not found') ||
                      bodyText?.toLowerCase().includes('404');

      if (hasError) {
        throw new Error('Error message detected on page');
      }

      // Take screenshot
      await page.screenshot({ path: 'test-results/hr-dashboard.png', fullPage: false });

      results.summary.passed++;
      expect(page.url()).toContain('/hr');
    } catch (error) {
      results.summary.failed++;
      results.issues.push({
        page: 'HR Dashboard',
        url,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  });

  test('Employee List loads', async ({ page }) => {
    results.summary.total++;
    const url = `${TEST_URL}/hr/employees`;

    try {
      await page.goto(url);
      await page.waitForLoadState('networkidle');

      // Check for table or list
      const hasTable = await page.locator('table, [role="table"]').count() > 0;
      console.log(`Employee table/list found: ${hasTable}`);

      await page.screenshot({ path: 'test-results/hr-employees.png', fullPage: false });

      results.summary.passed++;
      expect(page.url()).toContain('/hr/employees');
    } catch (error) {
      results.summary.failed++;
      results.issues.push({
        page: 'Employee List',
        url,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  });

  test('Add Employee Form loads', async ({ page }) => {
    results.summary.total++;
    const url = `${TEST_URL}/hr/employees/new`;

    try {
      await page.goto(url);
      await page.waitForLoadState('networkidle');

      await page.screenshot({ path: 'test-results/hr-employees-new.png', fullPage: false });

      results.summary.passed++;
      expect(page.url()).toContain('/hr/employees/new');
    } catch (error) {
      results.summary.failed++;
      results.issues.push({
        page: 'Add Employee Form',
        url,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  });

  test('Employee Onboarding loads', async ({ page }) => {
    results.summary.total++;
    const url = `${TEST_URL}/hr/employees/onboarding`;

    try {
      await page.goto(url);
      await page.waitForLoadState('networkidle');

      await page.screenshot({ path: 'test-results/hr-onboarding.png', fullPage: false });

      results.summary.passed++;
      expect(page.url()).toContain('/hr/employees/onboarding');
    } catch (error) {
      results.summary.failed++;
      results.issues.push({
        page: 'Employee Onboarding',
        url,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  });

  test('Leave Management loads', async ({ page }) => {
    results.summary.total++;
    const url = `${TEST_URL}/hr/leave`;

    try {
      await page.goto(url);
      await page.waitForLoadState('networkidle');

      await page.screenshot({ path: 'test-results/hr-leave.png', fullPage: false });

      results.summary.passed++;
      expect(page.url()).toContain('/hr/leave');
    } catch (error) {
      results.summary.failed++;
      results.issues.push({
        page: 'Leave Management',
        url,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  });

  test('Leave Requests loads', async ({ page }) => {
    results.summary.total++;
    const url = `${TEST_URL}/hr/leave/requests`;

    try {
      await page.goto(url);
      await page.waitForLoadState('networkidle');

      await page.screenshot({ path: 'test-results/hr-leave-requests.png', fullPage: false });

      results.summary.passed++;
      expect(page.url()).toContain('/hr/leave/requests');
    } catch (error) {
      results.summary.failed++;
      results.issues.push({
        page: 'Leave Requests',
        url,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  });

  test('Leave Approvals loads', async ({ page }) => {
    results.summary.total++;
    const url = `${TEST_URL}/hr/leave/approvals`;

    try {
      await page.goto(url);
      await page.waitForLoadState('networkidle');

      await page.screenshot({ path: 'test-results/hr-leave-approvals.png', fullPage: false });

      results.summary.passed++;
      expect(page.url()).toContain('/hr/leave/approvals');
    } catch (error) {
      results.summary.failed++;
      results.issues.push({
        page: 'Leave Approvals',
        url,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  });

  test('Benefits Dashboard loads', async ({ page }) => {
    results.summary.total++;
    const url = `${TEST_URL}/hr/benefits`;

    try {
      await page.goto(url);
      await page.waitForLoadState('networkidle');

      await page.screenshot({ path: 'test-results/hr-benefits.png', fullPage: false });

      results.summary.passed++;
      expect(page.url()).toContain('/hr/benefits');
    } catch (error) {
      results.summary.failed++;
      results.issues.push({
        page: 'Benefits Dashboard',
        url,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  });

  test('Benefits Enrollment loads', async ({ page }) => {
    results.summary.total++;
    const url = `${TEST_URL}/hr/benefits/enroll`;

    try {
      await page.goto(url);
      await page.waitForLoadState('networkidle');

      await page.screenshot({ path: 'test-results/hr-benefits-enroll.png', fullPage: false });

      results.summary.passed++;
      expect(page.url()).toContain('/hr/benefits/enroll');
    } catch (error) {
      results.summary.failed++;
      results.issues.push({
        page: 'Benefits Enrollment',
        url,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  });

  test('Payroll Dashboard loads', async ({ page }) => {
    results.summary.total++;
    const url = `${TEST_URL}/hr/payroll`;

    try {
      await page.goto(url);
      await page.waitForLoadState('networkidle');

      await page.screenshot({ path: 'test-results/hr-payroll.png', fullPage: false });

      results.summary.passed++;
      expect(page.url()).toContain('/hr/payroll');
    } catch (error) {
      results.summary.failed++;
      results.issues.push({
        page: 'Payroll Dashboard',
        url,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  });

  test('Run Payroll loads', async ({ page }) => {
    results.summary.total++;
    const url = `${TEST_URL}/hr/payroll/run`;

    try {
      await page.goto(url);
      await page.waitForLoadState('networkidle');

      await page.screenshot({ path: 'test-results/hr-payroll-run.png', fullPage: false });

      results.summary.passed++;
      expect(page.url()).toContain('/hr/payroll/run');
    } catch (error) {
      results.summary.failed++;
      results.issues.push({
        page: 'Run Payroll',
        url,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  });
});

test.describe('Documents Module Tests', () => {
  test('Documents List loads', async ({ page }) => {
    results.summary.total++;
    const url = `${TEST_URL}/documents`;

    try {
      await page.goto(url);
      await page.waitForLoadState('networkidle');

      // Check for documents view
      const hasDocuments = await page.locator('[class*="document"], table').count() > 0;
      console.log(`Documents view found: ${hasDocuments}`);

      await page.screenshot({ path: 'test-results/documents-list.png', fullPage: false });

      results.summary.passed++;
      expect(page.url()).toContain('/documents');
    } catch (error) {
      results.summary.failed++;
      results.issues.push({
        page: 'Documents List',
        url,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  });

  test('Upload Documents loads', async ({ page }) => {
    results.summary.total++;
    const url = `${TEST_URL}/documents/upload`;

    try {
      await page.goto(url);
      await page.waitForLoadState('networkidle');

      await page.screenshot({ path: 'test-results/documents-upload.png', fullPage: false });

      results.summary.passed++;
      expect(page.url()).toContain('/documents/upload');
    } catch (error) {
      results.summary.failed++;
      results.issues.push({
        page: 'Upload Documents',
        url,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  });

  test('Document Templates loads', async ({ page }) => {
    results.summary.total++;
    const url = `${TEST_URL}/documents/templates`;

    try {
      await page.goto(url);
      await page.waitForLoadState('networkidle');

      await page.screenshot({ path: 'test-results/documents-templates.png', fullPage: false });

      results.summary.passed++;
      expect(page.url()).toContain('/documents/templates');
    } catch (error) {
      results.summary.failed++;
      results.issues.push({
        page: 'Document Templates',
        url,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  });
});

test.describe('Contracts Module Tests', () => {
  test('Contracts List loads', async ({ page }) => {
    results.summary.total++;
    const url = `${TEST_URL}/contracts`;

    try {
      await page.goto(url);
      await page.waitForLoadState('networkidle');

      // Check for contracts table
      const hasContracts = await page.locator('table, [role="table"]').count() > 0;
      console.log(`Contracts table found: ${hasContracts}`);

      await page.screenshot({ path: 'test-results/contracts-list.png', fullPage: false });

      results.summary.passed++;
      expect(page.url()).toContain('/contracts');
    } catch (error) {
      results.summary.failed++;
      results.issues.push({
        page: 'Contracts List',
        url,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  });

  test('Create Contract loads', async ({ page }) => {
    results.summary.total++;
    const url = `${TEST_URL}/contracts/new`;

    try {
      await page.goto(url);
      await page.waitForLoadState('networkidle');

      await page.screenshot({ path: 'test-results/contracts-new.png', fullPage: false });

      results.summary.passed++;
      expect(page.url()).toContain('/contracts/new');
    } catch (error) {
      results.summary.failed++;
      results.issues.push({
        page: 'Create Contract',
        url,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  });

  test('Contract Templates loads', async ({ page }) => {
    results.summary.total++;
    const url = `${TEST_URL}/contracts/templates`;

    try {
      await page.goto(url);
      await page.waitForLoadState('networkidle');

      await page.screenshot({ path: 'test-results/contracts-templates.png', fullPage: false });

      results.summary.passed++;
      expect(page.url()).toContain('/contracts/templates');
    } catch (error) {
      results.summary.failed++;
      results.issues.push({
        page: 'Contract Templates',
        url,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  });
});

// Output results after all tests
test.afterAll(async () => {
  const successRate = results.summary.total > 0
    ? Math.round((results.summary.passed / results.summary.total) * 100)
    : 0;

  console.log('\n==========================================');
  console.log('TEST RESULTS SUMMARY');
  console.log('==========================================');
  console.log(`Total Tests: ${results.summary.total}`);
  console.log(`Passed: ${results.summary.passed}`);
  console.log(`Failed: ${results.summary.failed}`);
  console.log(`Success Rate: ${successRate}%`);

  if (results.issues.length > 0) {
    console.log('\nISSUES FOUND:');
    console.log('==========================================');
    results.issues.forEach((issue, idx) => {
      console.log(`${idx + 1}. ${issue.page}`);
      console.log(`   URL: ${issue.url}`);
      console.log(`   Error: ${issue.error}`);
    });
  }

  console.log('\nJSON OUTPUT:');
  console.log(JSON.stringify(results, null, 2));
});
