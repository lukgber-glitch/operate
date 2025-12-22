/**
 * Full Debug Test - Onboarding + API Debug
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const log = msg => console.log(`[${new Date().toISOString().slice(11,19)}] ${msg}`);

async function run() {
  log('Starting Full Debug Test...\n');

  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 30,
    args: ['--no-sandbox', '--window-size=1400,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });

  // Capture ALL network requests
  const apiCalls = [];
  page.on('requestfinished', async (request) => {
    const url = request.url();
    if (url.includes('/api/')) {
      const response = request.response();
      apiCalls.push({
        url: url.replace(BASE_URL, ''),
        status: response?.status(),
        method: request.method()
      });
    }
  });

  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('orgId') || text.includes('FinanceAPI') || text.includes('[')) {
      console.log(`  [CONSOLE] ${text.substring(0, 100)}`);
    }
  });

  try {
    // CLEAR & LOGIN
    log('LOGIN');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });
    await page.evaluate(() => { localStorage.clear(); });
    await page.type('#email', 'test@operate.guru');
    await page.type('#password', 'TestPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => {});
    await sleep(2000);

    const afterLogin = page.url();
    log(`After login: ${afterLogin}`);

    // ONBOARDING if needed
    if (afterLogin.includes('onboarding')) {
      log('\nONBOARDING FLOW');

      // Step 1: Welcome - click Get Started
      await sleep(1500);
      await page.click('button');
      await sleep(2000);

      // Step 2: Company Info - fill form
      log('Filling Company Info...');

      // Text fields
      for (const [name, val] of [
        ['companyInfo.name', 'Debug Test Corp'],
        ['companyInfo.taxId', 'DE888999000'],
        ['companyInfo.address.street', 'Debugstr'],
        ['companyInfo.address.streetNumber', '99'],
        ['companyInfo.address.postalCode', '10115'],
        ['companyInfo.address.city', 'Berlin'],
        ['companyInfo.businessEmail', 'debug@test.de'],
        ['companyInfo.businessPhone', '+49301234567'],
      ]) {
        const inp = await page.$(`input[name="${name}"]`);
        if (inp) { await inp.click({ clickCount: 3 }); await inp.type(val); }
      }

      // Comboboxes - fill each one by index in order
      // Order: Country, Legal Form, Industry, Customer Type, Currency, Fiscal Year Month
      const comboValues = [
        { label: 'Country', value: 'Germany' },
        { label: 'Legal Form', value: 'GmbH' },
        { label: 'Industry', value: 'Technology' },
        { label: 'Customer Type', value: 'B2B' },
        { label: 'Currency', value: 'EUR' },
        { label: 'Fiscal Year', value: 'January' },
      ];

      for (let i = 0; i < comboValues.length; i++) {
        log(`  Filling combobox ${i}: ${comboValues[i].label}...`);
        const cbs = await page.$$('[role="combobox"]');
        if (cbs[i]) {
          await cbs[i].click();
          await sleep(600);
          await page.keyboard.type(comboValues[i].value);
          await sleep(400);
          await page.keyboard.press('Enter');
          await sleep(600);
        } else {
          log(`    ⚠️ Combobox ${i} not found`);
        }
      }

      // Click Next - with detailed debugging
      log('Clicking Next on Company Info...');

      // Check for validation errors
      const errors = await page.evaluate(() => {
        const errorEls = document.querySelectorAll('.text-red-500, [class*="error"], [class*="destructive"]');
        return [...errorEls].map(e => e.textContent).filter(t => t && t.length > 0);
      });
      if (errors.length > 0) {
        log(`  ⚠️ Validation errors: ${JSON.stringify(errors)}`);
      }

      // Check combobox values
      const currentComboValues = await page.evaluate(() => {
        const cbs = document.querySelectorAll('[role="combobox"]');
        return [...cbs].map(cb => cb.textContent);
      });
      log(`  Combobox values: ${JSON.stringify(currentComboValues)}`);

      // Try clicking Next
      const nextClicked = await page.evaluate(() => {
        const btn = [...document.querySelectorAll('button')].find(b => b.textContent.includes('Next'));
        if (btn) {
          const isDisabled = btn.disabled || btn.hasAttribute('disabled');
          console.log('Next button disabled:', isDisabled);
          btn.click();
          return { clicked: true, disabled: isDisabled };
        }
        return { clicked: false, disabled: null };
      });
      log(`  Next button: ${JSON.stringify(nextClicked)}`);
      await sleep(2500);

      // Check current step after click
      const afterNextStep = await page.evaluate(() => document.querySelector('h1, h2')?.textContent || 'Unknown');
      log(`  Step after Next: ${afterNextStep}`);

      // Steps 3-6: Skip all
      for (let i = 0; i < 4; i++) {
        await page.evaluate(() => {
          const btn = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Skip');
          if (btn) btn.click();
        });
        await sleep(2000);
      }

      // Step 7: Preferences - Next
      log('Step 7: Preferences');
      await sleep(1000);
      const step7Title = await page.evaluate(() => document.querySelector('h1, h2')?.textContent || 'Unknown');
      log(`  Current step: ${step7Title}`);
      await page.evaluate(() => {
        const btn = [...document.querySelectorAll('button')].find(b => b.textContent.includes('Next'));
        if (btn) btn.click();
      });
      await sleep(2000);

      const step8Title = await page.evaluate(() => document.querySelector('h1, h2')?.textContent || 'Unknown');
      log(`  After Next click: ${step8Title}`);

      // Step 8: Go to Dashboard - click button AND wait for navigation
      log('Clicking Go to Dashboard...');
      const dashClicked = await page.evaluate(() => {
        const btn = [...document.querySelectorAll('button')].find(b =>
          b.textContent.includes('Go to Dashboard') || b.textContent.includes('Dashboard')
        );
        if (btn) {
          console.log('Found dashboard button:', btn.textContent);
          btn.click();
          return true;
        }
        console.log('Dashboard button NOT found. Buttons:',
          [...document.querySelectorAll('button')].map(b => b.textContent.trim())
        );
        return false;
      });
      log(`Dashboard button clicked: ${dashClicked}`);

      // Wait for navigation
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }).catch(e => {
        log(`Navigation timeout: ${e.message}`);
      });
      await sleep(3000);

      log(`Current URL after dashboard click: ${page.url()}`);
      log('Onboarding complete!');
    }

    // VERIFY WE LEFT ONBOARDING
    const currentUrl = page.url();
    if (currentUrl.includes('onboarding')) {
      log('ERROR: Still in onboarding');
      await browser.close();
      return;
    }

    // NOW TEST PAGES
    log('\n═══════════════════════════════════════════════════════════');
    log('TESTING API CALLS');
    log('═══════════════════════════════════════════════════════════\n');

    // Check orgId
    const orgId = await page.evaluate(() => window.__orgId);
    log(`window.__orgId: ${orgId || 'NOT SET'}`);

    // Check cookies
    const cookies = await page.cookies();
    const authCookie = cookies.find(c => c.name === 'op_auth');
    log(`op_auth cookie: ${authCookie ? 'EXISTS (' + authCookie.value.length + ' chars)' : 'NOT FOUND'}`);

    // Parse JWT to extract orgId
    if (authCookie) {
      try {
        const authData = JSON.parse(decodeURIComponent(authCookie.value));
        if (authData.a) {
          const parts = authData.a.split('.');
          if (parts.length === 3) {
            const payload = JSON.parse(atob(parts[1]));
            log(`JWT payload.orgId: ${payload.orgId || 'NOT IN JWT'}`);
            log(`JWT payload.sub: ${payload.sub || 'NOT IN JWT'}`);
          }
        }
      } catch (e) {
        log(`Cookie parse error: ${e.message}`);
      }
    }

    // TEST INVOICES PAGE
    log('\n▸ Testing /finance/invoices...');
    apiCalls.length = 0;
    await page.goto(`${BASE_URL}/finance/invoices`, { waitUntil: 'networkidle2', timeout: 20000 });
    await sleep(3000);

    log('  API Calls:');
    apiCalls.forEach(c => log(`    ${c.method.padEnd(6)} ${c.url} -> ${c.status}`));

    const hasError1 = await page.evaluate(() => document.body.textContent.includes('Something went wrong'));
    const errorMsg1 = hasError1 ? await page.evaluate(() => {
      const el = document.querySelector('.text-red-500, [class*="destructive"], [class*="error"]');
      return el ? el.textContent : '';
    }) : '';
    log(`  Has error: ${hasError1} ${errorMsg1}`);

    // TEST TIME PAGE
    log('\n▸ Testing /time...');
    apiCalls.length = 0;
    await page.goto(`${BASE_URL}/time`, { waitUntil: 'networkidle2', timeout: 20000 });
    await sleep(3000);

    log('  API Calls:');
    apiCalls.forEach(c => log(`    ${c.method.padEnd(6)} ${c.url} -> ${c.status}`));

    const hasError2 = await page.evaluate(() => document.body.textContent.includes('Something went wrong'));
    log(`  Has error: ${hasError2}`);

    // TEST EXPENSES PAGE
    log('\n▸ Testing /finance/expenses...');
    apiCalls.length = 0;
    await page.goto(`${BASE_URL}/finance/expenses`, { waitUntil: 'networkidle2', timeout: 20000 });
    await sleep(3000);

    log('  API Calls:');
    apiCalls.forEach(c => log(`    ${c.method.padEnd(6)} ${c.url} -> ${c.status}`));

    const hasError3 = await page.evaluate(() => document.body.textContent.includes('Something went wrong'));
    log(`  Has error: ${hasError3}`);

    // TEST A PAGE THAT WORKS
    log('\n▸ Testing /chat...');
    apiCalls.length = 0;
    await page.goto(`${BASE_URL}/chat`, { waitUntil: 'networkidle2', timeout: 20000 });
    await sleep(3000);

    log('  API Calls:');
    apiCalls.forEach(c => log(`    ${c.method.padEnd(6)} ${c.url} -> ${c.status}`));

    const hasError4 = await page.evaluate(() => document.body.textContent.includes('Something went wrong'));
    log(`  Has error: ${hasError4}`);

  } catch (err) {
    log(`\nERROR: ${err.message}`);
  }

  log('\nWaiting 10s for manual inspection...');
  await sleep(10000);
  await browser.close();
}

run().catch(console.error);
