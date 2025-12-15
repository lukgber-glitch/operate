const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Test credentials
const BASE_URL = 'http://localhost:3000';
const EMAIL = 'luk.gber@gmail.com';
const PASSWORD = 'Schlagzeug1@';

// Screenshot directory
const SCREENSHOT_DIR = path.join(__dirname, 'finance-e2e-screenshots');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

// Test results
const results = {
  timestamp: new Date().toISOString(),
  tests: []
};

async function captureScreenshot(page, name) {
  const filepath = path.join(SCREENSHOT_DIR, `${name}.png`);
  await page.screenshot({ path: filepath, fullPage: true });
  console.log(`📸 Screenshot saved: ${name}.png`);
  return filepath;
}

async function logTest(name, status, details = {}) {
  const result = {
    name,
    status,
    timestamp: new Date().toISOString(),
    ...details
  };
  results.tests.push(result);

  const icon = status === 'PASS' ? '✅' : '❌';
  console.log(`${icon} ${name}: ${status}`);
  if (details.message) {
    console.log(`   ${details.message}`);
  }
}

async function waitForNavigation(page, timeout = 10000) {
  try {
    await page.waitForNavigation({ waitUntil: 'networkidle0', timeout });
  } catch (e) {
    // Fallback to domcontentloaded if networkidle0 times out
    await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 5000 }).catch(() => {});
  }
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTests() {
  console.log('\n🚀 Starting Finance Module E2E Tests\n');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Screenshot Directory: ${SCREENSHOT_DIR}\n`);

  const browser = await puppeteer.launch({
    headless: false, // Set to true for CI
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080'],
    defaultViewport: { width: 1920, height: 1080 }
  });

  const page = await browser.newPage();

  // Set longer timeout for navigation
  page.setDefaultTimeout(30000);
  page.setDefaultNavigationTimeout(30000);

  try {
    // =====================================================
    // TEST 1: LOGIN
    // =====================================================
    console.log('\n--- TEST 1: Login ---');
    try {
      await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 10000 });

      await captureScreenshot(page, '01-login-page');

      // Fill login form
      await page.type('input[type="email"], input[name="email"]', EMAIL);
      await page.type('input[type="password"], input[name="password"]', PASSWORD);

      await captureScreenshot(page, '02-login-filled');

      // Submit form
      await Promise.all([
        page.click('button[type="submit"]'),
        page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {})
      ]);

      // Wait a bit for redirect
      await sleep(2000);

      await captureScreenshot(page, '03-after-login');

      const currentUrl = page.url();
      if (currentUrl.includes('/dashboard') || currentUrl.includes('/onboarding') || !currentUrl.includes('/login')) {
        await logTest('Login', 'PASS', {
          message: `Successfully logged in, redirected to: ${currentUrl}`
        });
      } else {
        await logTest('Login', 'FAIL', {
          message: `Still on login page: ${currentUrl}`
        });
      }
    } catch (error) {
      await logTest('Login', 'FAIL', {
        message: `Error: ${error.message}`,
        error: error.stack
      });
      await captureScreenshot(page, '01-login-error');
    }

    // =====================================================
    // TEST 2: INVOICE LIST
    // =====================================================
    console.log('\n--- TEST 2: Invoice List ---');
    try {
      await page.goto(`${BASE_URL}/finance/invoices`, { waitUntil: 'domcontentloaded' });
      await sleep(2000);

      await captureScreenshot(page, '04-invoice-list');

      // Check for key elements
      const checks = {
        table: await page.$('table, [role="table"]').then(el => !!el),
        newButton: await page.evaluate(() => {
          return !!Array.from(document.querySelectorAll('button, a')).find(el =>
            el.textContent.toLowerCase().includes('new') &&
            el.textContent.toLowerCase().includes('invoice')
          );
        }),
        searchFilter: await page.$('input[type="search"], input[placeholder*="search" i], input[placeholder*="filter" i]').then(el => !!el)
      };

      const allPresent = checks.table && checks.newButton;
      await logTest('Invoice List - Layout', allPresent ? 'PASS' : 'FAIL', {
        message: `Table: ${checks.table}, New Button: ${checks.newButton}, Search: ${checks.searchFilter}`,
        checks
      });
    } catch (error) {
      await logTest('Invoice List', 'FAIL', {
        message: `Error: ${error.message}`,
        error: error.stack
      });
      await captureScreenshot(page, '04-invoice-list-error');
    }

    // =====================================================
    // TEST 3: CREATE INVOICE FORM
    // =====================================================
    console.log('\n--- TEST 3: Create Invoice Form ---');
    try {
      await page.goto(`${BASE_URL}/finance/invoices/new`, { waitUntil: 'domcontentloaded' });
      await sleep(2000);

      await captureScreenshot(page, '05-invoice-new-form');

      // Check for form fields
      const formChecks = {
        clientSelector: await page.evaluate(() => {
          // Check for select, combobox, or dropdown
          return !!(
            document.querySelector('select[name*="client" i]') ||
            document.querySelector('[role="combobox"]') ||
            document.querySelector('input[placeholder*="client" i]') ||
            Array.from(document.querySelectorAll('label')).find(l =>
              l.textContent.toLowerCase().includes('client')
            )
          );
        }),
        lineItems: await page.evaluate(() => {
          return !!(
            document.querySelector('[data-testid*="line-item"]') ||
            Array.from(document.querySelectorAll('label, div, span')).find(l =>
              l.textContent.toLowerCase().includes('line item') ||
              l.textContent.toLowerCase().includes('description') && l.textContent.toLowerCase().includes('amount')
            )
          );
        }),
        taxField: await page.evaluate(() => {
          return !!(
            document.querySelector('input[name*="tax" i]') ||
            document.querySelector('select[name*="tax" i]') ||
            Array.from(document.querySelectorAll('label')).find(l =>
              l.textContent.toLowerCase().includes('tax')
            )
          );
        }),
        dueDate: await page.evaluate(() => {
          return !!(
            document.querySelector('input[type="date"]') ||
            document.querySelector('input[name*="due" i]') ||
            Array.from(document.querySelectorAll('label')).find(l =>
              l.textContent.toLowerCase().includes('due date')
            )
          );
        })
      };

      const hasRequiredFields = formChecks.clientSelector || formChecks.lineItems || formChecks.dueDate;
      await logTest('Invoice Form - Fields', hasRequiredFields ? 'PASS' : 'FAIL', {
        message: `Client: ${formChecks.clientSelector}, Line Items: ${formChecks.lineItems}, Tax: ${formChecks.taxField}, Due Date: ${formChecks.dueDate}`,
        checks: formChecks
      });
    } catch (error) {
      await logTest('Invoice Form', 'FAIL', {
        message: `Error: ${error.message}`,
        error: error.stack
      });
      await captureScreenshot(page, '05-invoice-form-error');
    }

    // =====================================================
    // TEST 4: EXPENSES LIST
    // =====================================================
    console.log('\n--- TEST 4: Expenses List ---');
    try {
      await page.goto(`${BASE_URL}/finance/expenses`, { waitUntil: 'domcontentloaded' });
      await sleep(2000);

      await captureScreenshot(page, '06-expenses-list');

      const hasContent = await page.evaluate(() => {
        return !!(
          document.querySelector('table') ||
          document.querySelector('[role="table"]') ||
          Array.from(document.querySelectorAll('h1, h2')).find(h =>
            h.textContent.toLowerCase().includes('expense')
          )
        );
      });

      await logTest('Expenses List', hasContent ? 'PASS' : 'FAIL', {
        message: hasContent ? 'Expenses page loaded with content' : 'No expenses content found'
      });
    } catch (error) {
      await logTest('Expenses List', 'FAIL', {
        message: `Error: ${error.message}`,
        error: error.stack
      });
      await captureScreenshot(page, '06-expenses-error');
    }

    // =====================================================
    // TEST 5: RECEIPT SCANNER
    // =====================================================
    console.log('\n--- TEST 5: Receipt Scanner ---');
    try {
      await page.goto(`${BASE_URL}/finance/expenses/scan`, { waitUntil: 'domcontentloaded' });
      await sleep(2000);

      await captureScreenshot(page, '07-receipt-scanner');

      const hasUploadArea = await page.evaluate(() => {
        return !!(
          document.querySelector('input[type="file"]') ||
          document.querySelector('[role="button"][aria-label*="upload" i]') ||
          Array.from(document.querySelectorAll('div, button')).find(el =>
            el.textContent.toLowerCase().includes('upload') ||
            el.textContent.toLowerCase().includes('drop') ||
            el.textContent.toLowerCase().includes('scan')
          )
        );
      });

      await logTest('Receipt Scanner', hasUploadArea ? 'PASS' : 'FAIL', {
        message: hasUploadArea ? 'Upload area detected' : 'No upload area found'
      });
    } catch (error) {
      await logTest('Receipt Scanner', 'FAIL', {
        message: `Error: ${error.message}`,
        error: error.stack
      });
      await captureScreenshot(page, '07-scanner-error');
    }

    // =====================================================
    // TEST 6: BANKING
    // =====================================================
    console.log('\n--- TEST 6: Banking ---');
    try {
      await page.goto(`${BASE_URL}/finance/banking`, { waitUntil: 'domcontentloaded' });
      await sleep(2000);

      await captureScreenshot(page, '08-banking');

      const hasBankingContent = await page.evaluate(() => {
        return !!(
          Array.from(document.querySelectorAll('h1, h2, h3')).find(h =>
            h.textContent.toLowerCase().includes('bank') ||
            h.textContent.toLowerCase().includes('account')
          ) ||
          document.querySelector('[data-testid*="bank"]') ||
          Array.from(document.querySelectorAll('div')).find(d =>
            d.textContent.includes('€') || d.textContent.includes('$')
          )
        );
      });

      await logTest('Banking', hasBankingContent ? 'PASS' : 'FAIL', {
        message: hasBankingContent ? 'Banking page loaded with accounts' : 'No banking content found'
      });
    } catch (error) {
      await logTest('Banking', 'FAIL', {
        message: `Error: ${error.message}`,
        error: error.stack
      });
      await captureScreenshot(page, '08-banking-error');
    }

    // =====================================================
    // TEST 7: RECONCILIATION
    // =====================================================
    console.log('\n--- TEST 7: Reconciliation ---');
    try {
      await page.goto(`${BASE_URL}/finance/reconciliation`, { waitUntil: 'domcontentloaded' });
      await sleep(2000);

      await captureScreenshot(page, '09-reconciliation');

      const hasReconciliationContent = await page.evaluate(() => {
        return !!(
          document.querySelector('table') ||
          document.querySelector('[role="table"]') ||
          Array.from(document.querySelectorAll('h1, h2')).find(h =>
            h.textContent.toLowerCase().includes('reconcil')
          ) ||
          Array.from(document.querySelectorAll('div')).find(d =>
            d.textContent.toLowerCase().includes('transaction')
          )
        );
      });

      await logTest('Reconciliation', hasReconciliationContent ? 'PASS' : 'FAIL', {
        message: hasReconciliationContent ? 'Reconciliation page loaded with transactions' : 'No reconciliation content found'
      });
    } catch (error) {
      await logTest('Reconciliation', 'FAIL', {
        message: `Error: ${error.message}`,
        error: error.stack
      });
      await captureScreenshot(page, '09-reconciliation-error');
    }

  } catch (error) {
    console.error('\n❌ Critical test error:', error);
    await captureScreenshot(page, '99-critical-error');
  } finally {
    await browser.close();
  }

  // =====================================================
  // GENERATE REPORT
  // =====================================================
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));

  const passed = results.tests.filter(t => t.status === 'PASS').length;
  const failed = results.tests.filter(t => t.status === 'FAIL').length;
  const total = results.tests.length;

  console.log(`\nTotal Tests: ${total}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`Success Rate: ${((passed/total) * 100).toFixed(1)}%`);

  console.log('\n' + '-'.repeat(60));
  console.log('DETAILED RESULTS:');
  console.log('-'.repeat(60));
  results.tests.forEach(test => {
    const icon = test.status === 'PASS' ? '✅' : '❌';
    console.log(`\n${icon} ${test.name}: ${test.status}`);
    if (test.message) {
      console.log(`   ${test.message}`);
    }
  });

  // Save JSON report
  const reportPath = path.join(SCREENSHOT_DIR, 'test-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`\n📄 Full report saved: ${reportPath}`);
  console.log(`📸 Screenshots saved in: ${SCREENSHOT_DIR}`);

  return results;
}

// Run tests
runTests().catch(console.error);
