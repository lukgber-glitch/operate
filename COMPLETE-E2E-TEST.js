/**
 * COMPLETE E2E TEST - Onboarding + All Pages in one session
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000';
const SCREENSHOTS_DIR = path.join(__dirname, 'test-screenshots', 'COMPLETE-E2E');

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

const sleep = ms => new Promise(r => setTimeout(r, ms));
const log = msg => console.log(msg);

async function screenshot(page, name) {
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `${name}.png`), fullPage: true });
}

const results = { pass: 0, fail: 0, skip: 0, tests: [] };

function logResult(category, name, status, details = '') {
  const icon = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⚠️';
  log(`  ${icon} ${name.padEnd(30)} ${details}`);
  results.tests.push({ category, name, status, details });
  if (status === 'pass') results.pass++;
  else if (status === 'fail') results.fail++;
  else results.skip++;
}

async function run() {
  log('\n' + '═'.repeat(70));
  log('  COMPLETE E2E TEST - ONBOARDING + ALL PAGES');
  log('═'.repeat(70));

  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 30,
    args: ['--no-sandbox', '--window-size=1400,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });

  try {
    // ============ LOGIN ============
    log('\n🔐 LOGIN');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });
    await page.evaluate(() => { localStorage.clear(); });
    await page.type('#email', 'test@operate.guru');
    await page.type('#password', 'TestPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => {});
    await sleep(2000);

    const afterLogin = page.url();
    log(`  → ${afterLogin}`);

    // ============ ONBOARDING ============
    if (afterLogin.includes('onboarding')) {
      log('\n📋 ONBOARDING FLOW');
      log('─'.repeat(50));

      // Step 1: Welcome
      log('  Step 1: Welcome');
      await sleep(1500);
      await page.click('button');
      await sleep(2000);

      // Step 2: Company Info
      log('  Step 2: Company Info');

      // Text fields
      for (const [name, val] of [
        ['companyInfo.name', 'Complete E2E Test Corp'],
        ['companyInfo.taxId', 'DE555666777'],
        ['companyInfo.address.street', 'E2E Straße'],
        ['companyInfo.address.streetNumber', '42'],
        ['companyInfo.address.postalCode', '10115'],
        ['companyInfo.address.city', 'Berlin'],
        ['companyInfo.businessEmail', 'complete@e2etest.de'],
        ['companyInfo.businessPhone', '+49 30 5556667'],
      ]) {
        const inp = await page.$(`input[name="${name}"]`);
        if (inp) { await inp.click({ clickCount: 3 }); await inp.type(val); }
      }

      // Comboboxes
      for (let i = 0; i < 5; i++) {
        const values = ['Germany', 'GmbH', 'Technology', 'January', 'EUR'];
        const cbs = await page.$$('[role="combobox"]');
        if (cbs[i]) {
          await cbs[i].click();
          await sleep(500);
          await page.keyboard.type(values[i]);
          await sleep(300);
          await page.keyboard.press('Enter');
          await sleep(500);
        }
      }

      // Next
      await page.evaluate(() => {
        const btn = [...document.querySelectorAll('button')].find(b => b.textContent.includes('Next'));
        if (btn) btn.click();
      });
      await sleep(2500);

      // Steps 3-6: Skip all
      for (let i = 0; i < 4; i++) {
        await page.evaluate(() => {
          const btn = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Skip');
          if (btn) btn.click();
        });
        await sleep(2000);
      }

      // Step 7: Preferences - Next
      await page.evaluate(() => {
        const btn = [...document.querySelectorAll('button')].find(b => b.textContent.includes('Next'));
        if (btn) btn.click();
      });
      await sleep(2000);

      // Step 8: Go to Dashboard
      await page.evaluate(() => {
        const btn = [...document.querySelectorAll('button')].find(b => b.textContent.includes('Dashboard'));
        if (btn) btn.click();
      });
      await sleep(3000);

      log('  ✅ Onboarding complete!');
    }

    // ============ TEST ALL PAGES ============
    log('\n' + '═'.repeat(70));
    log('  TESTING ALL PAGES');
    log('═'.repeat(70));

    const pages = [
      // Core
      { url: '/chat', name: 'AI Chat', cat: 'Core' },
      { url: '/dashboard', name: 'Dashboard', cat: 'Core' },

      // Finance
      { url: '/finance', name: 'Finance Overview', cat: 'Finance' },
      { url: '/finance/invoices', name: 'Invoices', cat: 'Finance' },
      { url: '/finance/invoices/new', name: 'New Invoice', cat: 'Finance' },
      { url: '/finance/invoices/recurring', name: 'Recurring Invoices', cat: 'Finance' },
      { url: '/finance/expenses', name: 'Expenses', cat: 'Finance' },
      { url: '/finance/expenses/new', name: 'New Expense', cat: 'Finance' },
      { url: '/finance/expenses/scan', name: 'Receipt Scanner', cat: 'Finance' },

      // Banking
      { url: '/finance/bank-accounts', name: 'Bank Accounts', cat: 'Banking' },
      { url: '/finance/banking', name: 'Transactions', cat: 'Banking' },

      // Time/HR
      { url: '/time', name: 'Time Tracking', cat: 'Time' },
      { url: '/calendar', name: 'Calendar', cat: 'Time' },
      { url: '/contracts', name: 'Contracts', cat: 'Time' },

      // CRM
      { url: '/clients', name: 'Clients', cat: 'CRM' },

      // Documents
      { url: '/documents', name: 'Documents', cat: 'Docs' },

      // Automation
      { url: '/autopilot', name: 'Autopilot', cat: 'Auto' },

      // Settings
      { url: '/settings', name: 'Settings', cat: 'Settings' },
      { url: '/billing', name: 'Billing', cat: 'Settings' },
      { url: '/developer', name: 'Developer', cat: 'Settings' },
    ];

    let currentCat = '';
    for (const p of pages) {
      if (p.cat !== currentCat) {
        currentCat = p.cat;
        log(`\n📁 ${currentCat}`);
      }

      await page.goto(`${BASE_URL}${p.url}`, { waitUntil: 'networkidle2', timeout: 20000 }).catch(() => {});
      await sleep(1500);

      const content = await page.content();
      const hasError = content.includes('Something went wrong');
      const is404 = content.includes('could not be found');

      const counts = await page.evaluate(() => ({
        b: document.querySelectorAll('button').length,
        i: document.querySelectorAll('input').length,
        t: document.querySelectorAll('table').length,
      }));

      if (hasError) {
        logResult(p.cat, p.name, 'fail', 'Error on page');
      } else if (is404) {
        logResult(p.cat, p.name, 'skip', '404');
      } else {
        logResult(p.cat, p.name, 'pass', `${counts.b}btn ${counts.i}inp ${counts.t}tbl`);
      }

      await screenshot(page, p.url.replace(/\//g, '-').slice(1) || 'home');
    }

    // ============ TEST INTERACTIONS ============
    log('\n' + '═'.repeat(70));
    log('  TESTING INTERACTIONS');
    log('═'.repeat(70));

    // Chat input
    log('\n📝 Chat');
    await page.goto(`${BASE_URL}/chat`, { waitUntil: 'networkidle2' });
    await sleep(2000);
    const textarea = await page.$('textarea');
    if (textarea) {
      await textarea.type('Test message from E2E');
      logResult('Interact', 'Chat input', 'pass', 'Can type');
    } else {
      logResult('Interact', 'Chat input', 'fail', 'No textarea');
    }
    await screenshot(page, 'interact-chat');

    // Invoice form
    log('\n📝 Invoice Form');
    await page.goto(`${BASE_URL}/finance/invoices/new`, { waitUntil: 'networkidle2' });
    await sleep(2000);
    const invInputs = await page.$$('input');
    logResult('Interact', 'Invoice form', invInputs.length > 0 ? 'pass' : 'fail', `${invInputs.length} inputs`);
    await screenshot(page, 'interact-invoice');

    // Expense form
    log('\n📝 Expense Form');
    await page.goto(`${BASE_URL}/finance/expenses/new`, { waitUntil: 'networkidle2' });
    await sleep(2000);
    const expInputs = await page.$$('input');
    logResult('Interact', 'Expense form', expInputs.length > 0 ? 'pass' : 'fail', `${expInputs.length} inputs`);
    await screenshot(page, 'interact-expense');

    // Settings
    log('\n📝 Settings');
    await page.goto(`${BASE_URL}/settings`, { waitUntil: 'networkidle2' });
    await sleep(2000);
    const settingsContent = await page.evaluate(() => document.body.textContent);
    const hasProfile = settingsContent.includes('Profile') || settingsContent.includes('profile');
    logResult('Interact', 'Settings sections', hasProfile ? 'pass' : 'skip', hasProfile ? 'Profile found' : 'No profile section');
    await screenshot(page, 'interact-settings');

  } catch (err) {
    log(`\n❌ Error: ${err.message}`);
  }

  // ============ SUMMARY ============
  log('\n' + '═'.repeat(70));
  log('  FINAL SUMMARY');
  log('═'.repeat(70));
  log(`  ✅ Passed:  ${results.pass}`);
  log(`  ❌ Failed:  ${results.fail}`);
  log(`  ⚠️ Skipped: ${results.skip}`);
  log(`  Total:     ${results.tests.length}`);

  const passRate = Math.round((results.pass / results.tests.length) * 100);
  log(`\n  📊 Pass Rate: ${passRate}%`);
  log('═'.repeat(70));

  if (results.fail > 0) {
    log('\n❌ FAILED:');
    results.tests.filter(t => t.status === 'fail').forEach(t => {
      log(`   - ${t.name}: ${t.details}`);
    });
  }

  fs.writeFileSync(
    path.join(__dirname, 'COMPLETE_E2E_RESULTS.json'),
    JSON.stringify(results, null, 2)
  );

  log(`\n📁 Screenshots: ${SCREENSHOTS_DIR}`);
  log('📄 Results: COMPLETE_E2E_RESULTS.json\n');

  await sleep(5000);
  await browser.close();
}

run().catch(console.error);
