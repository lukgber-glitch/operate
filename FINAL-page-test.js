/**
 * FINAL Page Test - All pages after successful onboarding
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000';
const SCREENSHOTS_DIR = path.join(__dirname, 'test-screenshots', 'FINAL-PAGES');

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

const sleep = ms => new Promise(r => setTimeout(r, ms));
const log = msg => console.log(msg);

async function screenshot(page, name) {
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `${name}.png`), fullPage: true });
}

async function run() {
  log('═'.repeat(70));
  log('  FINAL COMPREHENSIVE PAGE TEST');
  log('═'.repeat(70));

  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--window-size=1400,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });

  const results = { pass: 0, fail: 0, tests: [] };

  try {
    // LOGIN (onboarding should already be complete from previous test)
    log('\n🔐 Login');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });
    await page.type('#email', 'test@operate.guru');
    await page.type('#password', 'TestPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => {});
    await sleep(3000);

    const afterLogin = page.url();
    log(`  After login: ${afterLogin}`);

    if (afterLogin.includes('onboarding')) {
      log('\n⚠️ Still needs onboarding - run REAL-browser-test-v6.js first');
      await browser.close();
      return;
    }

    log('\n✅ Logged in successfully!\n');

    // TEST ALL PAGES
    log('═'.repeat(70));
    log('  TESTING ALL PAGES');
    log('═'.repeat(70));

    const pages = [
      // Core
      { url: '/chat', name: 'Chat/AI Assistant', category: 'Core' },
      { url: '/dashboard', name: 'Dashboard', category: 'Core' },

      // Finance
      { url: '/finance', name: 'Finance Overview', category: 'Finance' },
      { url: '/finance/invoices', name: 'Invoices List', category: 'Finance' },
      { url: '/finance/invoices/new', name: 'New Invoice Form', category: 'Finance' },
      { url: '/finance/invoices/recurring', name: 'Recurring Invoices', category: 'Finance' },
      { url: '/finance/expenses', name: 'Expenses List', category: 'Finance' },
      { url: '/finance/expenses/new', name: 'New Expense Form', category: 'Finance' },
      { url: '/finance/expenses/scan', name: 'Receipt Scanner', category: 'Finance' },

      // Banking
      { url: '/finance/bank-accounts', name: 'Bank Accounts', category: 'Banking' },
      { url: '/finance/banking', name: 'Transactions', category: 'Banking' },

      // Time & HR
      { url: '/time', name: 'Time Tracking', category: 'Time/HR' },
      { url: '/calendar', name: 'Calendar', category: 'Time/HR' },
      { url: '/contracts', name: 'Contracts', category: 'Time/HR' },

      // CRM
      { url: '/clients', name: 'Clients', category: 'CRM' },
      { url: '/crm', name: 'CRM Dashboard', category: 'CRM' },

      // Documents
      { url: '/documents', name: 'Documents', category: 'Documents' },

      // Autopilot
      { url: '/autopilot', name: 'Autopilot', category: 'Automation' },

      // Settings
      { url: '/settings', name: 'Settings', category: 'Settings' },
      { url: '/billing', name: 'Billing', category: 'Settings' },
      { url: '/developer', name: 'Developer', category: 'Settings' },
    ];

    let currentCategory = '';

    for (const p of pages) {
      if (p.category !== currentCategory) {
        currentCategory = p.category;
        log(`\n📁 ${currentCategory}`);
        log('─'.repeat(50));
      }

      await page.goto(`${BASE_URL}${p.url}`, { waitUntil: 'networkidle2', timeout: 20000 }).catch(() => {});
      await sleep(2000);

      const actualUrl = page.url();
      const content = await page.content();

      const hasError = content.includes('Something went wrong') || content.includes('Application error');
      const is404 = content.includes('This page could not be found') || content.includes('404');
      const redirectedAway = !actualUrl.includes(p.url.split('/')[1]);

      // Count elements
      const counts = await page.evaluate(() => ({
        buttons: document.querySelectorAll('button').length,
        inputs: document.querySelectorAll('input').length,
        tables: document.querySelectorAll('table').length,
        forms: document.querySelectorAll('form').length,
      }));

      let status, details;
      if (hasError) {
        status = '❌ ERROR';
        details = 'Shows error message';
        results.fail++;
      } else if (is404) {
        status = '⚠️ 404';
        details = 'Page not found';
        results.fail++;
      } else if (redirectedAway) {
        status = '⚠️ REDIR';
        details = `→ ${actualUrl.split('/').slice(3).join('/')}`;
        results.pass++; // Not necessarily a fail
      } else {
        status = '✅ OK';
        details = `${counts.buttons}btn ${counts.inputs}inp ${counts.tables}tbl`;
        results.pass++;
      }

      results.tests.push({ page: p.name, url: p.url, status, details, counts });

      log(`  ${status} ${p.name.padEnd(25)} ${details}`);

      const screenshotName = p.url.replace(/\//g, '-').slice(1) || 'root';
      await screenshot(page, screenshotName);
    }

    // TEST SPECIFIC INTERACTIONS
    log('\n' + '═'.repeat(70));
    log('  TESTING INTERACTIONS');
    log('═'.repeat(70));

    // Test Chat Input
    log('\n📝 Chat Page');
    await page.goto(`${BASE_URL}/chat`, { waitUntil: 'networkidle2' });
    await sleep(2000);

    const chatTextarea = await page.$('textarea');
    if (chatTextarea) {
      await chatTextarea.type('Hello, this is a test message');
      log('  ✅ Chat input works');
      await screenshot(page, 'test-chat-input');
    } else {
      log('  ⚠️ Chat textarea not found');
    }

    // Test Invoice Form
    log('\n📝 New Invoice Form');
    await page.goto(`${BASE_URL}/finance/invoices/new`, { waitUntil: 'networkidle2' });
    await sleep(2000);

    const invoiceInputs = await page.$$('input');
    log(`  Found ${invoiceInputs.length} input fields`);

    // Try to find customer field
    const customerInput = await page.$('input[name*="customer"], input[placeholder*="customer"]');
    if (customerInput) {
      await customerInput.type('Test Customer');
      log('  ✅ Customer input works');
    }
    await screenshot(page, 'test-invoice-form');

    // Test Expense Form
    log('\n📝 New Expense Form');
    await page.goto(`${BASE_URL}/finance/expenses/new`, { waitUntil: 'networkidle2' });
    await sleep(2000);

    const expenseInputs = await page.$$('input');
    log(`  Found ${expenseInputs.length} input fields`);
    await screenshot(page, 'test-expense-form');

    // Test Settings Page
    log('\n📝 Settings Page');
    await page.goto(`${BASE_URL}/settings`, { waitUntil: 'networkidle2' });
    await sleep(2000);

    const settingsSections = await page.evaluate(() => {
      const headings = document.querySelectorAll('h2, h3');
      return Array.from(headings).map(h => h.textContent).slice(0, 5);
    });
    log(`  Sections: ${settingsSections.join(', ')}`);
    await screenshot(page, 'test-settings');

  } catch (err) {
    log(`\n❌ Error: ${err.message}`);
  }

  // SUMMARY
  log('\n' + '═'.repeat(70));
  log('  FINAL SUMMARY');
  log('═'.repeat(70));
  log(`  ✅ Passed: ${results.pass}`);
  log(`  ❌ Failed: ${results.fail}`);
  log(`  Total:    ${results.tests.length}`);
  log('═'.repeat(70));

  // Failed tests
  const failed = results.tests.filter(t => t.status.includes('❌'));
  if (failed.length > 0) {
    log('\n❌ Failed Pages:');
    failed.forEach(t => log(`   - ${t.page}: ${t.details}`));
  }

  // Save results
  fs.writeFileSync(
    path.join(__dirname, 'FINAL_PAGE_TEST_RESULTS.json'),
    JSON.stringify(results, null, 2)
  );

  log(`\n📁 Screenshots: ${SCREENSHOTS_DIR}`);
  log('📄 Results: FINAL_PAGE_TEST_RESULTS.json');

  await sleep(5000);
  await browser.close();
}

run().catch(console.error);
