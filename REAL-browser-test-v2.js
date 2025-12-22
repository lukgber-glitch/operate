/**
 * REAL Browser Test v2 - Fixed select handling
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000';
const SCREENSHOTS_DIR = path.join(__dirname, 'test-screenshots', 'REAL-TEST-V2');

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

const sleep = ms => new Promise(r => setTimeout(r, ms));
const log = msg => console.log(`[${new Date().toISOString().slice(11,19)}] ${msg}`);

async function screenshot(page, name) {
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `${name}.png`), fullPage: true });
  log(`📸 ${name}.png`);
}

async function clickButton(page, text) {
  const clicked = await page.evaluate((searchText) => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const btn = buttons.find(b => b.textContent && b.textContent.includes(searchText));
    if (btn) {
      btn.click();
      return true;
    }
    return false;
  }, text);
  return clicked;
}

async function fillSelect(page, labelText, optionText) {
  // Find and click the select trigger by looking for nearby label
  const clicked = await page.evaluate((label, option) => {
    // Try to find select by aria-label or nearby label
    const selects = Array.from(document.querySelectorAll('[role="combobox"], button[class*="select"], [data-radix-collection-item]'));

    // Also look for buttons that might be select triggers
    const allTriggers = Array.from(document.querySelectorAll('button'));

    for (const trigger of [...selects, ...allTriggers]) {
      const parent = trigger.closest('.space-y-2, .form-group, div');
      if (parent) {
        const labelEl = parent.querySelector('label');
        if (labelEl && labelEl.textContent.toLowerCase().includes(label.toLowerCase())) {
          trigger.click();
          return true;
        }
      }
      // Check aria-label
      if (trigger.getAttribute('aria-label')?.toLowerCase().includes(label.toLowerCase())) {
        trigger.click();
        return true;
      }
    }
    return false;
  }, labelText, optionText);

  if (clicked) {
    await sleep(500);
    // Type to filter and select
    await page.keyboard.type(optionText);
    await sleep(300);
    await page.keyboard.press('Enter');
    await sleep(300);
    log(`  ✓ Selected ${labelText}: ${optionText}`);
    return true;
  }
  return false;
}

async function run() {
  log('═'.repeat(60));
  log('REAL BROWSER TEST V2 - FIXED SELECT HANDLING');
  log('═'.repeat(60));

  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 50,
    args: ['--no-sandbox', '--window-size=1400,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });

  page.on('console', msg => {
    if (msg.type() === 'error' && !msg.text().includes('401')) {
      console.log(`  [ERROR] ${msg.text().substring(0, 80)}`);
    }
  });

  try {
    // ========== LOGIN ==========
    log('\n🔐 STEP 1: LOGIN');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });
    await screenshot(page, '01-login');

    await page.type('#email', 'test@operate.guru');
    await page.type('#password', 'TestPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => {});
    await sleep(2000);

    log(`After login: ${page.url()}`);
    await screenshot(page, '02-after-login');

    // ========== ONBOARDING ==========
    if (page.url().includes('onboarding')) {
      log('\n📋 STEP 2: ONBOARDING');

      // Welcome - Get Started
      log('→ Welcome step');
      await sleep(1500);
      await clickButton(page, 'Get Started');
      await sleep(2000);
      await screenshot(page, '03-company-info-empty');

      // Company Info - Fill ALL fields
      log('→ Filling Company Info (ALL FIELDS)');

      // Text inputs
      const textFields = [
        { selector: 'input[name="companyInfo.name"]', value: 'TestCorp E2E GmbH' },
        { selector: 'input[name="companyInfo.taxId"]', value: 'DE123456789' },
        { selector: 'input[name="companyInfo.tradeRegisterNumber"]', value: 'HRB 12345' },
        { selector: 'input[name="companyInfo.address.street"]', value: 'Teststraße' },
        { selector: 'input[name="companyInfo.address.streetNumber"]', value: '123' },
        { selector: 'input[name="companyInfo.address.postalCode"]', value: '10115' },
        { selector: 'input[name="companyInfo.address.city"]', value: 'Berlin' },
        { selector: 'input[name="companyInfo.address.state"]', value: 'Berlin' },
        { selector: 'input[name="companyInfo.businessEmail"]', value: 'info@testcorp.de' },
        { selector: 'input[name="companyInfo.businessPhone"]', value: '+49301234567' },
        { selector: 'input[name="companyInfo.website"]', value: 'https://testcorp.de' },
      ];

      for (const field of textFields) {
        const input = await page.$(field.selector);
        if (input) {
          await input.click({ clickCount: 3 });
          await input.type(field.value);
          log(`  ✓ ${field.selector.split('.').pop().replace('"]', '')}`);
        }
      }

      // Select fields - need to click combobox triggers
      log('→ Filling SELECT fields');

      // Find all comboboxes on the page
      const comboboxes = await page.$$('[role="combobox"]');
      log(`  Found ${comboboxes.length} comboboxes`);

      // Country (first combobox usually)
      if (comboboxes.length >= 1) {
        await comboboxes[0].click();
        await sleep(500);
        await page.keyboard.type('Germany');
        await sleep(300);
        await page.keyboard.press('Enter');
        await sleep(500);
        log('  ✓ Country: Germany');
      }

      // Legal Form (second combobox)
      const comboboxes2 = await page.$$('[role="combobox"]');
      if (comboboxes2.length >= 2) {
        await comboboxes2[1].click();
        await sleep(500);
        await page.keyboard.type('GmbH');
        await sleep(300);
        await page.keyboard.press('Enter');
        await sleep(500);
        log('  ✓ Legal Form: GmbH');
      }

      // Industry (third combobox)
      const comboboxes3 = await page.$$('[role="combobox"]');
      if (comboboxes3.length >= 3) {
        await comboboxes3[2].click();
        await sleep(500);
        await page.keyboard.type('Technology');
        await sleep(300);
        await page.keyboard.press('Enter');
        await sleep(500);
        log('  ✓ Industry: Technology');
      }

      // Fiscal Year Start (might be fourth combobox or input)
      const fiscalInput = await page.$('input[name="companyInfo.fiscalYearStart"]');
      if (fiscalInput) {
        await fiscalInput.click({ clickCount: 3 });
        await fiscalInput.type('1');
        log('  ✓ Fiscal Year: January');
      } else {
        const comboboxes4 = await page.$$('[role="combobox"]');
        if (comboboxes4.length >= 4) {
          await comboboxes4[3].click();
          await sleep(500);
          await page.keyboard.type('January');
          await page.keyboard.press('Enter');
          await sleep(500);
          log('  ✓ Fiscal Year: January');
        }
      }

      // Currency (might be fifth combobox)
      const currencyInput = await page.$('input[name="companyInfo.currency"]');
      if (currencyInput) {
        await currencyInput.click({ clickCount: 3 });
        await currencyInput.type('EUR');
        log('  ✓ Currency: EUR');
      } else {
        const comboboxes5 = await page.$$('[role="combobox"]');
        if (comboboxes5.length >= 5) {
          await comboboxes5[4].click();
          await sleep(500);
          await page.keyboard.type('EUR');
          await page.keyboard.press('Enter');
          await sleep(500);
          log('  ✓ Currency: EUR');
        }
      }

      await screenshot(page, '04-company-info-filled');

      // Scroll down to see all fields
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await sleep(500);
      await screenshot(page, '05-company-info-scrolled');

      // Click Next
      log('→ Clicking Next');
      await clickButton(page, 'Next');
      await sleep(2000);
      await screenshot(page, '06-after-next');

      // Check if still on company info (validation errors)
      const stillOnCompany = await page.evaluate(() => {
        return document.body.textContent.includes('Company Information');
      });

      if (stillOnCompany) {
        log('⚠️ Still on Company Info - checking validation errors');
        const errors = await page.evaluate(() => {
          const errorEls = document.querySelectorAll('[class*="error"], [class*="destructive"], .text-red-500, [role="alert"]');
          return Array.from(errorEls).map(e => e.textContent).filter(t => t.length > 0 && t.length < 100);
        });
        if (errors.length > 0) {
          log(`  Validation errors: ${errors.join(', ')}`);
        }

        // Try to find and fill missing required fields
        const requiredLabels = await page.evaluate(() => {
          const labels = document.querySelectorAll('label');
          return Array.from(labels)
            .filter(l => l.textContent.includes('*') || l.textContent.includes('required'))
            .map(l => l.textContent);
        });
        log(`  Required fields: ${requiredLabels.join(', ')}`);
      }

      // Steps 3-6: Banking, Email, Tax, Accounting - SKIP
      for (let step = 3; step <= 6; step++) {
        log(`→ Step ${step}: Skip/Next`);
        await sleep(1000);

        const skipped = await clickButton(page, 'Skip');
        if (!skipped) {
          await clickButton(page, 'Next');
        }
        await sleep(1500);
        await screenshot(page, `07-step-${step}`);
      }

      // Preferences
      log('→ Preferences step');
      await sleep(1000);
      await screenshot(page, '08-preferences');
      await clickButton(page, 'Next') || await clickButton(page, 'Complete');
      await sleep(2000);

      // Completion
      log('→ Completion');
      await screenshot(page, '09-completion');
      await clickButton(page, 'Dashboard') || await clickButton(page, 'Start') || await clickButton(page, 'Go');
      await sleep(3000);
      await screenshot(page, '10-after-completion');
    }

    // ========== TEST PAGES ==========
    const finalUrl = page.url();
    log(`\nFinal URL: ${finalUrl}`);

    if (!finalUrl.includes('onboarding')) {
      log('\n✅ ONBOARDING COMPLETE - TESTING PAGES');
      log('═'.repeat(60));

      const pages = [
        '/dashboard', '/finance/invoices', '/finance/expenses',
        '/finance/bank-accounts', '/chat', '/time', '/clients', '/settings'
      ];

      for (const p of pages) {
        await page.goto(`${BASE_URL}${p}`, { waitUntil: 'networkidle2', timeout: 20000 });
        await sleep(1500);

        const content = await page.content();
        const hasError = content.includes('Something went wrong');
        const isOnboarding = page.url().includes('onboarding');

        const counts = await page.evaluate(() => ({
          buttons: document.querySelectorAll('button').length,
          inputs: document.querySelectorAll('input').length,
        }));

        const status = hasError ? '❌ ERROR' : isOnboarding ? '⚠️ ONBOARDING' : '✅ OK';
        log(`${status} ${p} (${counts.buttons}btn, ${counts.inputs}inp)`);

        await screenshot(page, `page-${p.replace(/\//g, '-').substring(1)}`);
      }
    } else {
      log('\n⚠️ STILL IN ONBOARDING - Could not complete');
    }

    log('\n' + '═'.repeat(60));
    log('TEST COMPLETE');
    log(`Screenshots: ${SCREENSHOTS_DIR}`);

  } catch (error) {
    log(`\n❌ ERROR: ${error.message}`);
    await screenshot(page, 'ERROR');
  }

  log('\n⏳ Browser stays open 20s for inspection...');
  await sleep(20000);
  await browser.close();
}

run().catch(console.error);
