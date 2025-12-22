/**
 * REAL Browser Test - Actually completes onboarding and tests pages
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000';
const SCREENSHOTS_DIR = path.join(__dirname, 'test-screenshots', 'REAL-TEST');

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function log(msg) {
  console.log(`[${new Date().toISOString().slice(11,19)}] ${msg}`);
}

async function screenshot(page, name) {
  const filepath = path.join(SCREENSHOTS_DIR, `${name}.png`);
  await page.screenshot({ path: filepath, fullPage: true });
  log(`📸 Screenshot: ${name}.png`);
  return filepath;
}

async function run() {
  log('═'.repeat(60));
  log('REAL BROWSER TEST - WITH ACTUAL ONBOARDING COMPLETION');
  log('═'.repeat(60));

  const browser = await puppeteer.launch({
    headless: false, // VISIBLE BROWSER for debugging
    slowMo: 100, // Slow down for visibility
    args: ['--no-sandbox', '--window-size=1400,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });

  // Enable console logging
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`  [CONSOLE ERROR] ${msg.text().substring(0, 100)}`);
    }
  });

  try {
    // ========== LOGIN ==========
    log('\n🔐 STEP 1: LOGIN');
    log('─'.repeat(50));

    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });
    await screenshot(page, '01-login-page');

    await page.type('#email', 'test@operate.guru');
    await page.type('#password', 'TestPassword123!');
    await screenshot(page, '02-login-filled');

    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {});
    await sleep(3000);

    const afterLoginUrl = page.url();
    log(`After login URL: ${afterLoginUrl}`);
    await screenshot(page, '03-after-login');

    // ========== ONBOARDING ==========
    if (afterLoginUrl.includes('onboarding')) {
      log('\n📋 STEP 2: COMPLETE ONBOARDING');
      log('─'.repeat(50));

      // Step 1: Welcome - Click Get Started
      log('→ Welcome step');
      await sleep(2000);

      // Find and click Get Started button
      const getStartedBtn = await page.evaluateHandle(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        return buttons.find(b => b.textContent.includes('Get Started'));
      });

      if (getStartedBtn) {
        await getStartedBtn.click();
        log('  Clicked "Get Started"');
        await sleep(2000);
      }
      await screenshot(page, '04-after-get-started');

      // Step 2: Company Info - FILL ALL REQUIRED FIELDS
      log('→ Company Info step - filling ALL fields');
      await sleep(1000);

      // Company Name
      const nameInput = await page.$('input[name="companyInfo.name"]');
      if (nameInput) {
        await nameInput.click({ clickCount: 3 });
        await nameInput.type('TestCorp E2E GmbH');
        log('  ✓ Company name filled');
      }

      // Country - click the select and choose Germany
      const countrySelect = await page.$('[name="companyInfo.country"]');
      if (countrySelect) {
        await countrySelect.click();
        await sleep(500);
        await page.keyboard.type('Germany');
        await page.keyboard.press('Enter');
        log('  ✓ Country selected');
      } else {
        // Try finding combobox
        const comboboxes = await page.$$('[role="combobox"]');
        if (comboboxes.length > 0) {
          await comboboxes[0].click();
          await sleep(500);
          await page.keyboard.type('Germany');
          await page.keyboard.press('Enter');
          log('  ✓ Country selected via combobox');
        }
      }
      await sleep(500);

      // Legal Form
      const legalFormInput = await page.$('input[name="companyInfo.legalForm"]');
      if (legalFormInput) {
        await legalFormInput.click({ clickCount: 3 });
        await legalFormInput.type('GmbH');
        log('  ✓ Legal form filled');
      }

      // Tax ID
      const taxIdInput = await page.$('input[name="companyInfo.taxId"]');
      if (taxIdInput) {
        await taxIdInput.click({ clickCount: 3 });
        await taxIdInput.type('DE123456789');
        log('  ✓ Tax ID filled');
      }

      // Industry
      const industryInput = await page.$('input[name="companyInfo.industry"]');
      if (industryInput) {
        await industryInput.click({ clickCount: 3 });
        await industryInput.type('Technology');
        log('  ✓ Industry filled');
      }

      // Address fields
      const addressFields = [
        { name: 'companyInfo.address.street', value: 'Teststraße' },
        { name: 'companyInfo.address.streetNumber', value: '123' },
        { name: 'companyInfo.address.postalCode', value: '10115' },
        { name: 'companyInfo.address.city', value: 'Berlin' },
      ];

      for (const field of addressFields) {
        const input = await page.$(`input[name="${field.name}"]`);
        if (input) {
          await input.click({ clickCount: 3 });
          await input.type(field.value);
          log(`  ✓ ${field.name.split('.').pop()} filled`);
        }
      }

      // Business Email
      const emailInput = await page.$('input[name="companyInfo.businessEmail"]');
      if (emailInput) {
        await emailInput.click({ clickCount: 3 });
        await emailInput.type('info@testcorp.de');
        log('  ✓ Business email filled');
      }

      // Business Phone
      const phoneInput = await page.$('input[name="companyInfo.businessPhone"]');
      if (phoneInput) {
        await phoneInput.click({ clickCount: 3 });
        await phoneInput.type('+49301234567');
        log('  ✓ Business phone filled');
      }

      // Fiscal Year Start
      const fiscalInput = await page.$('input[name="companyInfo.fiscalYearStart"]');
      if (fiscalInput) {
        await fiscalInput.click({ clickCount: 3 });
        await fiscalInput.type('1');
        log('  ✓ Fiscal year filled');
      }

      // Currency
      const currencyInput = await page.$('input[name="companyInfo.currency"]');
      if (currencyInput) {
        await currencyInput.click({ clickCount: 3 });
        await currencyInput.type('EUR');
        log('  ✓ Currency filled');
      }

      await screenshot(page, '05-company-info-filled');

      // Click Next
      log('→ Clicking Next...');
      const nextBtn = await page.evaluateHandle(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        return buttons.find(b => b.textContent.includes('Next'));
      });
      if (nextBtn) {
        await nextBtn.click();
        await sleep(2000);
      }
      await screenshot(page, '06-after-company-next');

      // Steps 3-6: Skip Banking, Email, Tax, Accounting
      for (let i = 3; i <= 6; i++) {
        log(`→ Step ${i}: Looking for Skip button...`);
        await sleep(1000);

        const skipBtn = await page.evaluateHandle(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          return buttons.find(b => b.textContent.includes('Skip'));
        });

        if (skipBtn && await skipBtn.evaluate(el => el !== null)) {
          await skipBtn.click();
          log(`  Skipped step ${i}`);
          await sleep(1500);
        } else {
          // Try Next button instead
          const nextBtn2 = await page.evaluateHandle(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            return buttons.find(b => b.textContent.includes('Next'));
          });
          if (nextBtn2) {
            await nextBtn2.click();
            log(`  Next on step ${i}`);
            await sleep(1500);
          }
        }
        await screenshot(page, `07-step-${i}`);
      }

      // Step 7: Preferences
      log('→ Preferences step');
      await sleep(1000);
      await screenshot(page, '08-preferences');

      // Click Next/Complete
      const completeBtn = await page.evaluateHandle(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        return buttons.find(b =>
          b.textContent.includes('Next') ||
          b.textContent.includes('Complete') ||
          b.textContent.includes('Finish')
        );
      });
      if (completeBtn) {
        await completeBtn.click();
        await sleep(2000);
      }
      await screenshot(page, '09-after-preferences');

      // Step 8: Completion - Go to Dashboard
      log('→ Completion step');
      await sleep(2000);

      const dashboardBtn = await page.evaluateHandle(() => {
        const buttons = Array.from(document.querySelectorAll('button, a'));
        return buttons.find(b =>
          b.textContent.includes('Dashboard') ||
          b.textContent.includes('Start') ||
          b.textContent.includes('Go to')
        );
      });
      if (dashboardBtn) {
        await dashboardBtn.click();
        log('  Clicked go to dashboard');
        await sleep(3000);
      }
      await screenshot(page, '10-completion');
    }

    // ========== CHECK IF WE LEFT ONBOARDING ==========
    const currentUrl = page.url();
    log(`\nCurrent URL: ${currentUrl}`);

    if (currentUrl.includes('onboarding')) {
      log('\n⚠️ STILL IN ONBOARDING - checking what went wrong...');
      await screenshot(page, '11-still-onboarding');

      // Take screenshot of any error messages
      const errorText = await page.evaluate(() => {
        const errors = document.querySelectorAll('[class*="error"], [class*="invalid"], [role="alert"]');
        return Array.from(errors).map(e => e.textContent).join(', ');
      });
      if (errorText) {
        log(`  Error messages found: ${errorText}`);
      }
    } else {
      log('\n✅ LEFT ONBOARDING - now testing pages!');
    }

    // ========== TEST ACTUAL PAGES ==========
    log('\n📊 STEP 3: TESTING PAGES');
    log('─'.repeat(50));

    const pagesToTest = [
      { url: '/dashboard', name: 'Dashboard' },
      { url: '/finance/invoices', name: 'Invoices' },
      { url: '/finance/expenses', name: 'Expenses' },
      { url: '/finance/bank-accounts', name: 'Bank Accounts' },
      { url: '/chat', name: 'Chat' },
      { url: '/time', name: 'Time Tracking' },
      { url: '/clients', name: 'Clients' },
      { url: '/settings', name: 'Settings' },
    ];

    for (const p of pagesToTest) {
      log(`\n→ Testing ${p.name} (${p.url})`);

      await page.goto(`${BASE_URL}${p.url}`, { waitUntil: 'networkidle2', timeout: 20000 });
      await sleep(2000);

      const pageUrl = page.url();
      const content = await page.content();

      // Check for errors
      const hasError = content.includes('Something went wrong') ||
                       content.includes('Application error');
      const isOnboarding = pageUrl.includes('onboarding');

      // Count elements
      const counts = await page.evaluate(() => ({
        buttons: document.querySelectorAll('button').length,
        inputs: document.querySelectorAll('input').length,
        tables: document.querySelectorAll('table').length,
      }));

      if (hasError) {
        log(`  ❌ ERROR on page`);
      } else if (isOnboarding) {
        log(`  ⚠️ Redirected to onboarding`);
      } else {
        log(`  ✅ Page loaded (${counts.buttons} buttons, ${counts.inputs} inputs, ${counts.tables} tables)`);
      }

      await screenshot(page, `page-${p.name.toLowerCase().replace(/\s/g, '-')}`);
    }

    log('\n' + '═'.repeat(60));
    log('TEST COMPLETE');
    log('═'.repeat(60));
    log(`Screenshots saved to: ${SCREENSHOTS_DIR}`);

  } catch (error) {
    log(`\n❌ ERROR: ${error.message}`);
    await screenshot(page, 'ERROR');
  }

  // Keep browser open for manual inspection
  log('\n⏳ Browser will stay open for 30 seconds for manual inspection...');
  await sleep(30000);
  await browser.close();
}

run().catch(console.error);
