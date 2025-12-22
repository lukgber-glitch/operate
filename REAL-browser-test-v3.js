/**
 * REAL Browser Test v3 - Better step navigation
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000';
const SCREENSHOTS_DIR = path.join(__dirname, 'test-screenshots', 'REAL-TEST-V3');

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

const sleep = ms => new Promise(r => setTimeout(r, ms));
const log = msg => console.log(`[${new Date().toISOString().slice(11,19)}] ${msg}`);

async function screenshot(page, name) {
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `${name}.png`), fullPage: true });
  log(`📸 ${name}`);
}

async function run() {
  log('═'.repeat(60));
  log('REAL BROWSER TEST V3');
  log('═'.repeat(60));

  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 30,
    args: ['--no-sandbox', '--window-size=1400,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });

  try {
    // ========== LOGIN ==========
    log('\n🔐 LOGIN');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });
    await page.type('#email', 'test@operate.guru');
    await page.type('#password', 'TestPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => {});
    await sleep(2000);
    log(`URL: ${page.url()}`);

    // ========== ONBOARDING ==========
    if (page.url().includes('onboarding')) {
      log('\n📋 ONBOARDING');

      // Step 1: WELCOME
      log('\n→ STEP 1: Welcome');
      await sleep(1500);
      await page.evaluate(() => {
        const btn = [...document.querySelectorAll('button')].find(b => b.textContent.includes('Get Started'));
        if (btn) btn.click();
      });
      await sleep(2000);
      await screenshot(page, '01-after-welcome');

      // Step 2: COMPANY INFO
      log('\n→ STEP 2: Company Info');

      // Fill text inputs
      const fields = {
        'companyInfo.name': 'TestCorp E2E GmbH',
        'companyInfo.taxId': 'DE123456789',
        'companyInfo.address.street': 'Teststraße',
        'companyInfo.address.streetNumber': '123',
        'companyInfo.address.postalCode': '10115',
        'companyInfo.address.city': 'Berlin',
        'companyInfo.businessEmail': 'info@testcorp.de',
        'companyInfo.businessPhone': '+49301234567',
      };

      for (const [name, value] of Object.entries(fields)) {
        const input = await page.$(`input[name="${name}"]`);
        if (input) {
          await input.click({ clickCount: 3 });
          await input.type(value);
        }
      }
      log('  Text fields filled');

      // Fill comboboxes (Country, Legal Form, Industry, Fiscal Year, Currency)
      const comboValues = ['Germany', 'GmbH', 'Technology', 'January', 'EUR'];
      for (let i = 0; i < comboValues.length; i++) {
        const comboboxes = await page.$$('[role="combobox"]');
        if (comboboxes[i]) {
          await comboboxes[i].click();
          await sleep(400);
          await page.keyboard.type(comboValues[i]);
          await sleep(200);
          await page.keyboard.press('Enter');
          await sleep(400);
        }
      }
      log('  Select fields filled');
      await screenshot(page, '02-company-filled');

      // Click Next
      await page.evaluate(() => {
        const btn = [...document.querySelectorAll('button')].find(b => b.textContent.includes('Next'));
        if (btn) btn.click();
      });
      await sleep(2000);
      await screenshot(page, '03-after-company');

      // Steps 3-6: SKIP Banking, Email, Tax, Accounting
      const stepNames = ['Banking', 'Email', 'Tax', 'Accounting'];
      for (let i = 0; i < 4; i++) {
        log(`\n→ STEP ${i + 3}: ${stepNames[i]} (SKIP)`);
        await sleep(1000);

        // Look for Skip button at bottom of page
        const skipClicked = await page.evaluate(() => {
          // First scroll to bottom to make sure Skip is visible
          window.scrollTo(0, document.body.scrollHeight);

          // Find Skip button (usually has "Skip" text)
          const buttons = [...document.querySelectorAll('button')];
          const skipBtn = buttons.find(b => {
            const text = b.textContent.trim();
            return text === 'Skip' || text === 'Skip for now' || text.includes('Skip');
          });

          if (skipBtn && !skipBtn.disabled) {
            skipBtn.click();
            return true;
          }
          return false;
        });

        if (skipClicked) {
          log(`  Skipped`);
        } else {
          // Try Next if Skip not found
          await page.evaluate(() => {
            const btn = [...document.querySelectorAll('button')].find(b => b.textContent.includes('Next'));
            if (btn) btn.click();
          });
          log(`  Next (no Skip found)`);
        }

        await sleep(2000);
        await screenshot(page, `04-step-${i + 3}`);
      }

      // Step 7: PREFERENCES
      log('\n→ STEP 7: Preferences');
      await sleep(1000);
      await screenshot(page, '05-preferences');

      // Try to click Next/Continue
      await page.evaluate(() => {
        const btn = [...document.querySelectorAll('button')].find(b =>
          b.textContent.includes('Next') || b.textContent.includes('Continue') || b.textContent.includes('Complete')
        );
        if (btn) btn.click();
      });
      await sleep(2000);
      await screenshot(page, '06-after-preferences');

      // Step 8: COMPLETION
      log('\n→ STEP 8: Completion');
      await sleep(1000);

      // Look for "Go to Dashboard" or similar
      await page.evaluate(() => {
        const btn = [...document.querySelectorAll('button, a')].find(b =>
          b.textContent.includes('Dashboard') ||
          b.textContent.includes('Start') ||
          b.textContent.includes('Complete') ||
          b.textContent.includes('Finish')
        );
        if (btn) btn.click();
      });
      await sleep(3000);
      await screenshot(page, '07-completion');
    }

    // ========== CHECK URL ==========
    const finalUrl = page.url();
    log(`\n📍 Final URL: ${finalUrl}`);

    // ========== TEST PAGES ==========
    if (!finalUrl.includes('onboarding')) {
      log('\n✅ ONBOARDING COMPLETE! Testing pages...');
      log('═'.repeat(60));

      const pages = [
        { url: '/dashboard', name: 'Dashboard' },
        { url: '/finance/invoices', name: 'Invoices' },
        { url: '/finance/expenses', name: 'Expenses' },
        { url: '/finance/bank-accounts', name: 'Bank Accounts' },
        { url: '/chat', name: 'Chat' },
        { url: '/time', name: 'Time' },
        { url: '/clients', name: 'Clients' },
        { url: '/settings', name: 'Settings' },
        { url: '/autopilot', name: 'Autopilot' },
      ];

      for (const p of pages) {
        await page.goto(`${BASE_URL}${p.url}`, { waitUntil: 'networkidle2', timeout: 20000 });
        await sleep(1500);

        const content = await page.content();
        const hasError = content.includes('Something went wrong') || content.includes('Application error');
        const redirected = page.url().includes('onboarding') || page.url().includes('login');

        const counts = await page.evaluate(() => ({
          btns: document.querySelectorAll('button').length,
          inputs: document.querySelectorAll('input').length,
          tables: document.querySelectorAll('table').length,
        }));

        if (hasError) {
          log(`❌ ${p.name}: ERROR`);
        } else if (redirected) {
          log(`⚠️ ${p.name}: Redirected`);
        } else {
          log(`✅ ${p.name}: OK (${counts.btns}btn ${counts.inputs}inp ${counts.tables}tbl)`);
        }

        await screenshot(page, `page-${p.name.toLowerCase()}`);
      }

      // ========== TEST INTERACTIONS ==========
      log('\n📝 TESTING INTERACTIONS');
      log('─'.repeat(50));

      // Test Invoice New Form
      await page.goto(`${BASE_URL}/finance/invoices/new`, { waitUntil: 'networkidle2' });
      await sleep(2000);
      const invoiceInputs = await page.$$('input');
      log(`Invoice Form: ${invoiceInputs.length} input fields`);
      await screenshot(page, 'form-invoice-new');

      // Test Expense New Form
      await page.goto(`${BASE_URL}/finance/expenses/new`, { waitUntil: 'networkidle2' });
      await sleep(2000);
      const expenseInputs = await page.$$('input');
      log(`Expense Form: ${expenseInputs.length} input fields`);
      await screenshot(page, 'form-expense-new');

      // Test Chat Input
      await page.goto(`${BASE_URL}/chat`, { waitUntil: 'networkidle2' });
      await sleep(2000);
      const chatTextarea = await page.$('textarea');
      if (chatTextarea) {
        await chatTextarea.type('Hello, test message');
        log(`Chat: Input works`);
      }
      await screenshot(page, 'test-chat-input');

    } else {
      log('\n⚠️ STILL IN ONBOARDING');

      // Check what step we're on
      const stepInfo = await page.evaluate(() => {
        const stepText = document.body.textContent;
        if (stepText.includes('Welcome')) return 'Welcome';
        if (stepText.includes('Company Information')) return 'Company Info';
        if (stepText.includes('Bank Account')) return 'Banking';
        if (stepText.includes('Email')) return 'Email';
        if (stepText.includes('Tax')) return 'Tax';
        if (stepText.includes('Accounting')) return 'Accounting';
        if (stepText.includes('Preferences')) return 'Preferences';
        if (stepText.includes('Complete') || stepText.includes('Congratulations')) return 'Completion';
        return 'Unknown';
      });
      log(`Stuck on step: ${stepInfo}`);

      // Check for validation errors
      const errors = await page.evaluate(() => {
        return [...document.querySelectorAll('[class*="error"], [class*="destructive"], .text-red')]
          .map(e => e.textContent)
          .filter(t => t && t.length > 0 && t.length < 100);
      });
      if (errors.length > 0) {
        log(`Validation errors: ${errors.join(', ')}`);
      }
    }

    log('\n' + '═'.repeat(60));
    log('TEST COMPLETE');
    log(`Screenshots: ${SCREENSHOTS_DIR}`);

  } catch (error) {
    log(`\n❌ ERROR: ${error.message}`);
    await screenshot(page, 'ERROR');
  }

  log('\n⏳ Browser open 15s...');
  await sleep(15000);
  await browser.close();
}

run().catch(console.error);
