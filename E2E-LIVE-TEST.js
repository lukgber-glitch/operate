/**
 * Quick E2E Test for Finance Pages
 * Tests invoices, expenses, and time pages after the fix
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000';
const SCREENSHOTS_DIR = path.join(__dirname, 'test-screenshots');

// Ensure screenshots directory exists
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

async function runTest() {
  console.log('Starting E2E Test...\n');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  const results = {
    login: { status: 'pending', error: null },
    invoices: { status: 'pending', error: null },
    expenses: { status: 'pending', error: null },
    time: { status: 'pending', error: null }
  };

  // Collect console errors
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  try {
    // Step 1: Login
    console.log('1. Testing Login...');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2', timeout: 30000 });
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'e2e-01-login.png') });

    // Fill login form
    await page.type('#email', 'test@operate.guru');
    await page.type('#password', 'TestPassword123!');
    await page.click('button[type="submit"]');

    // Wait for navigation after login
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {});
    await new Promise(r => setTimeout(r, 2000)); // Extra wait for any redirects

    const currentUrl = page.url();
    console.log(`   Redirected to: ${currentUrl}`);

    if (currentUrl.includes('/login') || currentUrl.includes('/error')) {
      results.login = { status: 'fail', error: 'Login failed - stayed on login page' };
    } else {
      results.login = { status: 'pass', error: null };
    }
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'e2e-02-after-login.png') });

    // Step 2: Test Invoices Page
    console.log('2. Testing Invoices Page...');
    await page.goto(`${BASE_URL}/finance/invoices`, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 2000)); // Wait for data loading

    const invoicesContent = await page.content();
    const invoicesHasError = invoicesContent.includes('Something went wrong') ||
                             invoicesContent.includes('error') && invoicesContent.includes('destructive');

    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'e2e-03-invoices.png') });

    if (invoicesHasError) {
      results.invoices = { status: 'fail', error: 'Page shows error message' };
    } else {
      results.invoices = { status: 'pass', error: null };
    }

    // Step 3: Test Expenses Page
    console.log('3. Testing Expenses Page...');
    await page.goto(`${BASE_URL}/finance/expenses`, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 2000));

    const expensesContent = await page.content();
    const expensesHasError = expensesContent.includes('Something went wrong');

    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'e2e-04-expenses.png') });

    if (expensesHasError) {
      results.expenses = { status: 'fail', error: 'Page shows error message' };
    } else {
      results.expenses = { status: 'pass', error: null };
    }

    // Step 4: Test Time Page
    console.log('4. Testing Time Page...');
    await page.goto(`${BASE_URL}/time`, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 2000));

    const timeContent = await page.content();
    const timeHasError = timeContent.includes('Something went wrong');

    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'e2e-05-time.png') });

    if (timeHasError) {
      results.time = { status: 'fail', error: 'Page shows error message' };
    } else {
      results.time = { status: 'pass', error: null };
    }

  } catch (error) {
    console.error('Test error:', error.message);
  } finally {
    await browser.close();
  }

  // Print results
  console.log('\n' + '='.repeat(60));
  console.log('E2E TEST RESULTS');
  console.log('='.repeat(60));

  for (const [testName, result] of Object.entries(results)) {
    const icon = result.status === 'pass' ? '✓' : result.status === 'fail' ? '✗' : '?';
    console.log(`${icon} ${testName.padEnd(15)}: ${result.status.toUpperCase()}${result.error ? ` - ${result.error}` : ''}`);
  }

  if (consoleErrors.length > 0) {
    console.log('\nConsole Errors:');
    consoleErrors.slice(0, 10).forEach(err => console.log(`  - ${err.substring(0, 100)}`));
  }

  console.log('\nScreenshots saved to: ' + SCREENSHOTS_DIR);
  console.log('='.repeat(60));

  // Write JSON report
  const report = {
    timestamp: new Date().toISOString(),
    results,
    consoleErrors: consoleErrors.slice(0, 20),
    screenshots: [
      'e2e-01-login.png',
      'e2e-02-after-login.png',
      'e2e-03-invoices.png',
      'e2e-04-expenses.png',
      'e2e-05-time.png'
    ]
  };

  fs.writeFileSync(
    path.join(__dirname, 'E2E_TEST_RESULTS.json'),
    JSON.stringify(report, null, 2)
  );

  console.log('\nReport saved to: E2E_TEST_RESULTS.json');
}

runTest().catch(console.error);
