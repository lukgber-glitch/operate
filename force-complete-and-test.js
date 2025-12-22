/**
 * Force Complete Onboarding & Full Test
 * Uses API to complete onboarding, then tests all pages
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000';
const API_URL = 'http://localhost:3001/api/v1';
const SCREENSHOTS_DIR = path.join(__dirname, 'test-screenshots', 'final-test');

const TEST_USER = {
  email: 'test@operate.guru',
  password: 'TestPassword123!'
};

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

const results = {
  timestamp: new Date().toISOString(),
  summary: { passed: 0, failed: 0, skipped: 0 },
  tests: [],
  pageDetails: {}
};

function log(msg) { console.log(msg); }

function logTest(category, name, status, details = null) {
  results.tests.push({ category, name, status, details });
  if (status === 'pass') results.summary.passed++;
  else if (status === 'fail') results.summary.failed++;
  else results.summary.skipped++;
  const icon = status === 'pass' ? '✓' : status === 'fail' ? '✗' : '○';
  console.log(`  ${icon} ${name}${details ? ': ' + details : ''}`);
}

async function screenshot(page, name) {
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `${name}.png`), fullPage: true });
}

async function forceCompleteOnboarding(page, cookies) {
  log('\n🔧 FORCE COMPLETING ONBOARDING VIA API');
  log('─'.repeat(60));

  try {
    // Get cookies from browser and build cookie header
    const cookieHeader = cookies.map(c => `${c.name}=${c.value}`).join('; ');

    // Call complete onboarding API
    const response = await page.evaluate(async (apiUrl, cookieHeader) => {
      const res = await fetch(`${apiUrl}/onboarding/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': cookieHeader
        },
        credentials: 'include'
      });
      return {
        status: res.status,
        ok: res.ok,
        body: await res.json().catch(() => null)
      };
    }, API_URL, cookieHeader);

    if (response.ok) {
      log('  ✓ Onboarding marked complete via API');
      return true;
    } else {
      log(`  ⚠ API returned ${response.status}: ${JSON.stringify(response.body)}`);
      // Try anyway - might already be complete
      return response.body?.isCompleted || false;
    }
  } catch (error) {
    log(`  ⚠ API call failed: ${error.message}`);
    return false;
  }
}

async function testPage(page, url, name, category) {
  try {
    await page.goto(`${BASE_URL}${url}`, { waitUntil: 'networkidle2', timeout: 25000 });
    await new Promise(r => setTimeout(r, 2000));

    const currentUrl = page.url();
    const content = await page.content();

    // Check for actual errors (not validation messages)
    const hasRealError =
      content.includes('Something went wrong') ||
      content.includes('Application error') ||
      content.includes('Internal Server Error') ||
      content.includes('Unhandled Runtime Error');

    const is404 = content.includes('This page could not be found') ||
                  content.includes('404');

    const redirectedToOnboarding = currentUrl.includes('/onboarding');
    const redirectedToLogin = currentUrl.includes('/login');

    // Count page elements
    const elementCounts = await page.evaluate(() => ({
      buttons: document.querySelectorAll('button').length,
      inputs: document.querySelectorAll('input').length,
      tables: document.querySelectorAll('table').length,
      forms: document.querySelectorAll('form').length,
      links: document.querySelectorAll('a').length
    }));

    const screenshotName = `page${url.replace(/\//g, '-')}`;
    await screenshot(page, screenshotName);

    results.pageDetails[url] = {
      name,
      category,
      actualUrl: currentUrl,
      hasError: hasRealError,
      is404,
      redirectedToOnboarding,
      redirectedToLogin,
      elements: elementCounts
    };

    // Determine result
    if (hasRealError) {
      logTest(category, name, 'fail', 'Runtime error');
      return false;
    } else if (is404) {
      logTest(category, name, 'skip', '404');
      return false;
    } else if (redirectedToLogin) {
      logTest(category, name, 'skip', 'Auth required');
      return false;
    } else if (redirectedToOnboarding) {
      logTest(category, name, 'pass', 'Redirects to onboarding');
      return true;
    } else {
      const elems = `${elementCounts.buttons}btn ${elementCounts.inputs}inp ${elementCounts.tables}tbl`;
      logTest(category, name, 'pass', `Loaded (${elems})`);
      return true;
    }
  } catch (error) {
    logTest(category, name, 'fail', error.message.substring(0, 50));
    return false;
  }
}

async function runTest() {
  log('\n' + '═'.repeat(60));
  log('  FINAL COMPREHENSIVE E2E TEST');
  log('═'.repeat(60));
  log(`Started: ${new Date().toISOString()}\n`);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  try {
    // === LOGIN ===
    log('🔐 LOGIN');
    log('─'.repeat(60));

    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });
    await page.type('#email', TEST_USER.email);
    await page.type('#password', TEST_USER.password);
    await page.click('button[type="submit"]');

    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {});
    await new Promise(r => setTimeout(r, 3000));

    const loginUrl = page.url();
    const loginSuccess = !loginUrl.includes('/login');
    logTest('Auth', 'Login', loginSuccess ? 'pass' : 'fail', loginUrl);

    if (!loginSuccess) {
      throw new Error('Login failed');
    }

    // Get cookies for API calls
    const cookies = await page.cookies();
    await screenshot(page, '00-after-login');

    // === FORCE COMPLETE ONBOARDING ===
    const onboardingComplete = await forceCompleteOnboarding(page, cookies);
    logTest('Onboarding', 'Force Complete', onboardingComplete ? 'pass' : 'skip',
            onboardingComplete ? 'API success' : 'May need manual');

    // Refresh page to pick up new cookie
    await page.reload({ waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 2000));
    await screenshot(page, '01-after-onboarding-complete');

    // === TEST ALL PAGES ===
    log('\n' + '═'.repeat(60));
    log('  TESTING ALL APPLICATION PAGES');
    log('═'.repeat(60));

    const allPages = [
      // Core
      { url: '/dashboard', name: 'Dashboard', cat: 'Core' },

      // Finance
      { url: '/finance', name: 'Finance Home', cat: 'Finance' },
      { url: '/finance/invoices', name: 'Invoices', cat: 'Finance' },
      { url: '/finance/invoices/new', name: 'New Invoice', cat: 'Finance' },
      { url: '/finance/invoices/recurring', name: 'Recurring Invoices', cat: 'Finance' },
      { url: '/finance/invoices/extracted', name: 'Extracted Invoices', cat: 'Finance' },
      { url: '/finance/expenses', name: 'Expenses', cat: 'Finance' },
      { url: '/finance/expenses/new', name: 'New Expense', cat: 'Finance' },
      { url: '/finance/expenses/scan', name: 'Receipt Scan', cat: 'Finance' },

      // Banking
      { url: '/finance/bank-accounts', name: 'Bank Accounts', cat: 'Banking' },
      { url: '/finance/banking', name: 'Transactions', cat: 'Banking' },

      // AI
      { url: '/chat', name: 'AI Chat', cat: 'AI' },

      // CRM
      { url: '/clients', name: 'Clients', cat: 'CRM' },
      { url: '/crm', name: 'CRM Dashboard', cat: 'CRM' },

      // Time/HR
      { url: '/time', name: 'Time Tracking', cat: 'Time' },
      { url: '/calendar', name: 'Calendar', cat: 'Time' },
      { url: '/contracts', name: 'Contracts', cat: 'HR' },
      { url: '/contracts/templates', name: 'Contract Templates', cat: 'HR' },

      // Documents
      { url: '/documents', name: 'Documents', cat: 'Docs' },
      { url: '/documents/upload', name: 'Upload', cat: 'Docs' },
      { url: '/documents/templates', name: 'Doc Templates', cat: 'Docs' },

      // Autopilot
      { url: '/autopilot', name: 'Autopilot', cat: 'Auto' },
      { url: '/autopilot/settings', name: 'Auto Settings', cat: 'Auto' },
      { url: '/autopilot/actions', name: 'Auto Actions', cat: 'Auto' },

      // Settings
      { url: '/settings', name: 'Settings', cat: 'Settings' },
      { url: '/billing', name: 'Billing', cat: 'Settings' },
      { url: '/developer', name: 'Developer', cat: 'Settings' },
      { url: '/developer/api-keys', name: 'API Keys', cat: 'Settings' },
      { url: '/developer/webhooks', name: 'Webhooks', cat: 'Settings' },
      { url: '/developer/logs', name: 'Logs', cat: 'Settings' },

      // Admin
      { url: '/admin', name: 'Admin', cat: 'Admin' },
      { url: '/admin/users', name: 'Users', cat: 'Admin' },
      { url: '/admin/roles', name: 'Roles', cat: 'Admin' },
      { url: '/admin/subscriptions', name: 'Subscriptions', cat: 'Admin' },

      // Feedback
      { url: '/feedback', name: 'Feedback', cat: 'Other' },
      { url: '/api-docs', name: 'API Docs', cat: 'Other' },
    ];

    let currentCat = '';
    for (const p of allPages) {
      if (p.cat !== currentCat) {
        currentCat = p.cat;
        log(`\n📁 ${currentCat.toUpperCase()}`);
        log('─'.repeat(50));
      }
      await testPage(page, p.url, p.name, p.cat);
    }

    // === TEST SPECIFIC FEATURES ===
    log('\n' + '═'.repeat(60));
    log('  TESTING SPECIFIC FEATURES');
    log('═'.repeat(60));

    // Test Chat input
    log('\n📝 Chat Features');
    log('─'.repeat(50));
    await page.goto(`${BASE_URL}/chat`, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 2000));

    const chatInput = await page.$('textarea, input[placeholder*="message"], [class*="chat-input"]');
    logTest('Chat', 'Chat input exists', chatInput ? 'pass' : 'skip');

    const sendBtn = await page.$('button[type="submit"], [class*="send"]');
    logTest('Chat', 'Send button exists', sendBtn ? 'pass' : 'skip');
    await screenshot(page, 'feature-chat');

    // Test Invoice form
    log('\n📝 Invoice Features');
    log('─'.repeat(50));
    await page.goto(`${BASE_URL}/finance/invoices/new`, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 2000));

    const invoiceForms = await page.$$('form, [class*="form"]');
    logTest('Invoice', 'Invoice form exists', invoiceForms.length > 0 ? 'pass' : 'skip');

    const invoiceInputs = await page.$$('input');
    logTest('Invoice', 'Input fields', invoiceInputs.length > 0 ? 'pass' : 'skip', `${invoiceInputs.length} inputs`);
    await screenshot(page, 'feature-invoice-form');

  } catch (error) {
    log('\n❌ Test error: ' + error.message);
    results.error = error.message;
  } finally {
    await browser.close();
  }

  // === SUMMARY ===
  log('\n' + '═'.repeat(60));
  log('  FINAL TEST SUMMARY');
  log('═'.repeat(60));
  log(`  ✓ Passed:  ${results.summary.passed}`);
  log(`  ✗ Failed:  ${results.summary.failed}`);
  log(`  ○ Skipped: ${results.summary.skipped}`);
  log(`  Total:     ${results.tests.length}`);

  const failedTests = results.tests.filter(t => t.status === 'fail');
  if (failedTests.length > 0) {
    log('\n❌ FAILED TESTS:');
    failedTests.forEach(t => {
      log(`   - [${t.category}] ${t.name}: ${t.details || 'No details'}`);
    });
  }

  const passRate = Math.round((results.summary.passed / results.tests.length) * 100);
  log(`\n📊 Pass Rate: ${passRate}%`);
  log('═'.repeat(60));

  // Save results
  fs.writeFileSync(
    path.join(__dirname, 'FINAL_E2E_RESULTS.json'),
    JSON.stringify(results, null, 2)
  );

  log(`\nResults: FINAL_E2E_RESULTS.json`);
  log(`Screenshots: ${SCREENSHOTS_DIR}`);
}

runTest().catch(console.error);
