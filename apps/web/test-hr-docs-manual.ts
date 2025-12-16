/**
 * Manual HR and Documents Module Test Script
 *
 * This script tests all HR and Documents pages on https://operate.guru
 *
 * Run with: npx playwright test e2e/hr-documents.spec.ts --headed --project=chromium
 */

import { chromium } from '@playwright/test';

const TEST_URL = 'https://operate.guru';

interface TestResult {
  page: string;
  url: string;
  status: 'passed' | 'failed';
  error?: string;
  screenshot?: string;
}

const results: TestResult[] = [];

async function testPage(page: any, url: string, pageName: string) {
  console.log(`\nTesting: ${pageName}`);
  console.log(`URL: ${url}`);

  try {
    const response = await page.goto(url, {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    if (!response.ok() && response.status() !== 304) {
      throw new Error(`HTTP ${response.status()}`);
    }

    // Check for error messages
    const bodyText = await page.textContent('body');
    const hasError = bodyText?.toLowerCase().includes('error occurred') ||
                    bodyText?.toLowerCase().includes('not found') ||
                    bodyText?.toLowerCase().includes('404') ||
                    bodyText?.toLowerCase().includes('500');

    if (hasError) {
      throw new Error('Error message detected on page');
    }

    // Take screenshot
    const screenshotName = pageName.replace(/[^a-z0-9]/gi, '-').toLowerCase();
    await page.screenshot({
      path: `test-results/${screenshotName}.png`,
      fullPage: false
    });

    results.push({
      page: pageName,
      url,
      status: 'passed',
      screenshot: `test-results/${screenshotName}.png`
    });

    console.log(`✅ PASSED`);
  } catch (error) {
    results.push({
      page: pageName,
      url,
      status: 'failed',
      error: error instanceof Error ? error.message : String(error)
    });

    console.log(`❌ FAILED: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function run() {
  console.log('==========================================');
  console.log('HR & DOCUMENTS MODULE TESTING');
  console.log('==========================================\n');

  const browser = await chromium.launch({
    headless: false,
    args: ['--start-maximized']
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });

  const page = await context.newPage();

  try {
    // Step 1: Login
    console.log('Step 1: Navigating to login page...');
    await page.goto(`${TEST_URL}/login`);
    await page.waitForLoadState('networkidle');

    console.log('\n==========================================');
    console.log('MANUAL LOGIN REQUIRED');
    console.log('==========================================');
    console.log('Email: luk.gber@gmail.com');
    console.log('Password: schlagzeug');
    console.log('\nWaiting 90 seconds for manual login...');
    console.log('==========================================\n');

    // Wait for manual login
    await page.waitForTimeout(90000);

    const currentUrl = page.url();
    console.log(`Current URL: ${currentUrl}`);

    if (currentUrl.includes('login')) {
      throw new Error('Login failed - still on login page');
    }

    console.log('✅ Login successful!\n');

    // HR MODULE TESTS
    console.log('\n==========================================');
    console.log('HR MODULE TESTS');
    console.log('==========================================');

    await testPage(page, `${TEST_URL}/hr`, 'HR Dashboard');
    await testPage(page, `${TEST_URL}/hr/employees`, 'Employee List');
    await testPage(page, `${TEST_URL}/hr/employees/new`, 'Add Employee Form');
    await testPage(page, `${TEST_URL}/hr/employees/onboarding`, 'Employee Onboarding');
    await testPage(page, `${TEST_URL}/hr/leave`, 'Leave Management');
    await testPage(page, `${TEST_URL}/hr/leave/requests`, 'Leave Requests');
    await testPage(page, `${TEST_URL}/hr/leave/approvals`, 'Leave Approvals');
    await testPage(page, `${TEST_URL}/hr/benefits`, 'Benefits Dashboard');
    await testPage(page, `${TEST_URL}/hr/benefits/enroll`, 'Benefits Enrollment');
    await testPage(page, `${TEST_URL}/hr/payroll`, 'Payroll Dashboard');
    await testPage(page, `${TEST_URL}/hr/payroll/run`, 'Run Payroll');

    // DOCUMENTS MODULE TESTS
    console.log('\n==========================================');
    console.log('DOCUMENTS MODULE TESTS');
    console.log('==========================================');

    await testPage(page, `${TEST_URL}/documents`, 'Documents List');
    await testPage(page, `${TEST_URL}/documents/upload`, 'Upload Documents');
    await testPage(page, `${TEST_URL}/documents/templates`, 'Document Templates');

    // CONTRACTS MODULE TESTS
    console.log('\n==========================================');
    console.log('CONTRACTS MODULE TESTS');
    console.log('==========================================');

    await testPage(page, `${TEST_URL}/contracts`, 'Contracts List');
    await testPage(page, `${TEST_URL}/contracts/new`, 'Create Contract');
    await testPage(page, `${TEST_URL}/contracts/templates`, 'Contract Templates');

    // Keep browser open for inspection
    console.log('\n⏸️  Keeping browser open for 20 seconds for inspection...');
    await page.waitForTimeout(20000);

  } catch (error) {
    console.error('\n❌ Critical Error:', error);
    results.push({
      page: 'Test Setup',
      url: TEST_URL,
      status: 'failed',
      error: error instanceof Error ? error.message : String(error)
    });
  } finally {
    // Print summary
    const passed = results.filter(r => r.status === 'passed').length;
    const failed = results.filter(r => r.status === 'failed').length;
    const total = results.length;
    const successRate = total > 0 ? Math.round((passed / total) * 100) : 0;

    console.log('\n\n==========================================');
    console.log('TEST RESULTS SUMMARY');
    console.log('==========================================');
    console.log(`Total Tests: ${total}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`Success Rate: ${successRate}%`);

    const failedTests = results.filter(r => r.status === 'failed');
    if (failedTests.length > 0) {
      console.log('\nISSUES FOUND:');
      console.log('==========================================');
      failedTests.forEach((test, idx) => {
        console.log(`${idx + 1}. ${test.page}`);
        console.log(`   URL: ${test.url}`);
        console.log(`   Error: ${test.error}`);
        console.log('');
      });
    }

    // JSON output
    console.log('\n📋 JSON OUTPUT:');
    console.log(JSON.stringify({
      summary: { total, passed, failed },
      issues: failedTests.map(t => ({
        page: t.page,
        url: t.url,
        error: t.error
      }))
    }, null, 2));

    await browser.close();
  }
}

run();
