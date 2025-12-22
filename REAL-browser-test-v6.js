/**
 * REAL Browser Test v6 - Fix combobox selection
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000';
const SCREENSHOTS_DIR = path.join(__dirname, 'test-screenshots', 'REAL-TEST-V6');

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
  log('REAL BROWSER TEST V6 - FIX COMBOBOX SELECTION');
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
      console.log(`  [ERR] ${msg.text().substring(0, 80)}`);
    }
  });

  try {
    // CLEAR & LOGIN
    log('\n🔐 LOGIN');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });
    await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
    await page.type('#email', 'test@operate.guru');
    await page.type('#password', 'TestPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => {});
    await sleep(2000);
    log(`  URL: ${page.url()}`);

    if (page.url().includes('onboarding')) {
      // ONBOARDING
      log('\n📋 ONBOARDING\n');

      // STEP 1: Welcome
      log('STEP 1: Welcome');
      await sleep(1500);
      await page.click('button');  // Click Get Started (first button)
      await sleep(2000);
      await screenshot(page, '01-company-form');

      // STEP 2: Company Info - CAREFUL FORM FILLING
      log('\nSTEP 2: Company Info - Filling form carefully...');

      // Text inputs first
      const textFields = [
        { sel: 'input[name="companyInfo.name"]', val: 'Browser Test Corp' },
        { sel: 'input[name="companyInfo.taxId"]', val: 'DE999888777' },
        { sel: 'input[name="companyInfo.address.street"]', val: 'Hauptstraße' },
        { sel: 'input[name="companyInfo.address.streetNumber"]', val: '100' },
        { sel: 'input[name="companyInfo.address.postalCode"]', val: '10117' },
        { sel: 'input[name="companyInfo.address.city"]', val: 'Berlin' },
        { sel: 'input[name="companyInfo.businessEmail"]', val: 'contact@browsertest.de' },
        { sel: 'input[name="companyInfo.businessPhone"]', val: '+49 30 9876543' },
      ];

      for (const f of textFields) {
        const el = await page.$(f.sel);
        if (el) {
          await el.click({ clickCount: 3 });
          await el.type(f.val);
          log(`  ✓ ${f.sel.split('.').pop().replace('"]', '')}`);
        }
      }

      await screenshot(page, '02-text-filled');

      // Now fill comboboxes ONE BY ONE with proper identification
      // Find all combobox triggers on the page
      log('\n  Filling dropdown selects...');

      // Get all comboboxes
      const fillCombobox = async (index, value, label) => {
        const comboboxes = await page.$$('[role="combobox"]');
        if (comboboxes[index]) {
          await comboboxes[index].click();
          await sleep(600);

          // Type to filter
          await page.keyboard.type(value);
          await sleep(400);

          // Press Enter to select
          await page.keyboard.press('Enter');
          await sleep(600);

          log(`  ✓ ${label}: ${value}`);
          return true;
        }
        log(`  ✗ ${label}: combobox[${index}] not found`);
        return false;
      };

      // Fill in order: Country(0), Legal Form(1), Industry(2), Fiscal Year(3), Currency(4)
      await fillCombobox(0, 'Germany', 'Country');
      await fillCombobox(1, 'GmbH', 'Legal Form');
      await fillCombobox(2, 'Technology', 'Industry');
      await fillCombobox(3, 'January', 'Fiscal Year');
      await fillCombobox(4, 'EUR', 'Currency');

      await screenshot(page, '03-all-filled');

      // Scroll to see full form
      await page.evaluate(() => window.scrollTo(0, 500));
      await sleep(500);
      await screenshot(page, '04-scrolled');

      // Check for any remaining validation errors
      const errors = await page.evaluate(() => {
        return [...document.querySelectorAll('.text-red-500, [class*="error"], [class*="destructive"]')]
          .map(e => e.textContent)
          .filter(t => t && t.includes('required'));
      });

      if (errors.length > 0) {
        log(`\n  ⚠️ Validation errors still present: ${errors.join(', ')}`);
      } else {
        log('\n  ✓ No validation errors visible');
      }

      // Click Next
      log('\n  Clicking Next...');
      await page.evaluate(() => {
        const btn = [...document.querySelectorAll('button')].find(b => b.textContent.includes('Next'));
        if (btn) btn.click();
      });
      await sleep(3000);
      await screenshot(page, '05-after-next');

      // Check if we moved to Banking step
      const pageTitle = await page.evaluate(() => {
        const h1 = document.querySelector('h1, h2');
        return h1 ? h1.textContent : '';
      });
      log(`  Page title: ${pageTitle}`);

      if (pageTitle.includes('Bank')) {
        log('\n✅ Advanced to Banking step!');

        // STEPS 3-6: Skip Banking, Email, Tax, Accounting
        for (const step of ['Banking', 'Email', 'Tax', 'Accounting']) {
          log(`\n  Skipping ${step}...`);
          await page.evaluate(() => {
            const btn = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Skip');
            if (btn) btn.click();
          });
          await sleep(2000);

          const newTitle = await page.evaluate(() => document.querySelector('h1, h2')?.textContent || '');
          log(`  Now on: ${newTitle.substring(0, 30)}`);
          await screenshot(page, `06-skip-${step.toLowerCase()}`);
        }

        // STEP 7: Preferences - click Next
        log('\n  Preferences - Next...');
        await page.evaluate(() => {
          const btn = [...document.querySelectorAll('button')].find(b => b.textContent.includes('Next'));
          if (btn) btn.click();
        });
        await sleep(2000);
        await screenshot(page, '07-preferences');

        // STEP 8: Completion - Go to Dashboard
        log('\n  Completion - Go to Dashboard...');
        await page.evaluate(() => {
          const btn = [...document.querySelectorAll('button')].find(b => b.textContent.includes('Dashboard'));
          if (btn) btn.click();
        });
        await sleep(3000);
        await screenshot(page, '08-dashboard');

      } else {
        log('\n⚠️ Still on Company Info - form validation failed');

        // Debug: show all validation errors
        const allErrors = await page.evaluate(() => {
          return [...document.querySelectorAll('p, span')]
            .filter(e => e.className.includes('error') || e.className.includes('destructive') || e.className.includes('red'))
            .map(e => e.textContent);
        });
        log(`  Errors: ${JSON.stringify(allErrors)}`);
      }
    }

    // FINAL CHECK
    const finalUrl = page.url();
    log(`\n📍 Final URL: ${finalUrl}`);

    if (!finalUrl.includes('onboarding')) {
      log('\n✅ ONBOARDING COMPLETE! Testing pages...\n');

      for (const p of ['/chat', '/dashboard', '/finance/invoices', '/finance/expenses', '/time', '/settings']) {
        await page.goto(`${BASE_URL}${p}`, { waitUntil: 'networkidle2', timeout: 20000 });
        await sleep(1500);

        const hasError = await page.evaluate(() => document.body.textContent.includes('Something went wrong'));
        const counts = await page.evaluate(() => ({
          b: document.querySelectorAll('button').length,
          i: document.querySelectorAll('input').length,
          t: document.querySelectorAll('table').length
        }));

        log(`${hasError ? '❌' : '✅'} ${p} (${counts.b}btn ${counts.i}inp ${counts.t}tbl)`);
        await screenshot(page, `page-${p.replace(/\//g, '-').slice(1)}`);
      }
    }

    log('\n' + '═'.repeat(60));
    log('TEST COMPLETE');

  } catch (err) {
    log(`\n❌ ERROR: ${err.message}`);
    await screenshot(page, 'error');
  }

  log('\n⏳ Browser open 10s...');
  await sleep(10000);
  await browser.close();
}

run().catch(console.error);
