/**
 * Simple Page Test - Check actual error messages
 */

const puppeteer = require('puppeteer');

const BASE_URL = 'http://localhost:3000';
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function run() {
  console.log('Starting Simple Page Test...\n');

  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--window-size=1400,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });

  // Capture console logs
  page.on('console', msg => {
    const type = msg.type();
    if (type === 'error' || type === 'warn') {
      console.log(`[${type.toUpperCase()}] ${msg.text()}`);
    }
  });

  // Capture page errors
  page.on('pageerror', err => {
    console.log(`[PAGE ERROR] ${err.message}`);
  });

  try {
    // LOGIN
    console.log('1. Logging in...');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });
    await page.type('#email', 'test@operate.guru');
    await page.type('#password', 'TestPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => {});
    await sleep(2000);

    const afterLogin = page.url();
    console.log(`   After login: ${afterLogin}`);

    // Complete onboarding if needed
    if (afterLogin.includes('onboarding')) {
      console.log('   Completing onboarding...');

      // Step 1: Welcome - click Get Started
      await sleep(1500);
      await page.click('button');
      await sleep(2000);

      // Step 2: Company Info - fill form
      console.log('   Filling Company Info...');

      // Text fields
      for (const [name, val] of [
        ['companyInfo.name', 'Page Test Corp'],
        ['companyInfo.taxId', 'DE999888777'],
        ['companyInfo.address.street', 'Teststr'],
        ['companyInfo.address.streetNumber', '1'],
        ['companyInfo.address.postalCode', '10115'],
        ['companyInfo.address.city', 'Berlin'],
        ['companyInfo.businessEmail', 'page@test.de'],
        ['companyInfo.businessPhone', '+49301234567'],
      ]) {
        const inp = await page.$(`input[name="${name}"]`);
        if (inp) { await inp.click({ clickCount: 3 }); await inp.type(val); }
      }

      // Fill comboboxes
      const comboValues = ['Germany', 'GmbH', 'Technology', 'B2B', 'EUR', 'January'];
      for (let i = 0; i < comboValues.length; i++) {
        const cbs = await page.$$('[role="combobox"]');
        if (cbs[i]) {
          await cbs[i].click();
          await sleep(600);
          await page.keyboard.type(comboValues[i]);
          await sleep(400);
          await page.keyboard.press('Enter');
          await sleep(600);
        }
      }

      // Click Next
      await page.evaluate(() => {
        const btn = [...document.querySelectorAll('button')].find(b => b.textContent.includes('Next'));
        if (btn) btn.click();
      });
      await sleep(2500);

      // Skip remaining steps
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
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }).catch(() => {});
      await sleep(3000);
      console.log('   Onboarding complete! URL:', page.url());
    }

    // TEST INVOICES PAGE
    console.log('\n2. Testing /finance/invoices...');
    await page.goto(`${BASE_URL}/finance/invoices`, { waitUntil: 'networkidle2', timeout: 20000 });
    await sleep(3000);

    // Check for various error indicators
    const pageCheck = await page.evaluate(() => {
      const body = document.body;
      const html = body.innerHTML;

      // Check for error messages
      const hasErrorBoundary = html.includes('Something went wrong');
      const hasError = html.includes('error') || html.includes('Error');
      const hasInvoices = html.includes('Invoice') || html.includes('invoice');

      // Check for specific error elements
      const errorElements = document.querySelectorAll('.text-red-500, [class*="destructive"], [class*="error"]');
      const errorTexts = [...errorElements].map(el => el.textContent?.trim()).filter(t => t);

      // Get any h1/h2 headings
      const headings = [...document.querySelectorAll('h1, h2')].map(h => h.textContent?.trim());

      // Get visible text content (first 500 chars)
      const visibleText = body.innerText?.substring(0, 500) || '';

      return {
        hasErrorBoundary,
        hasError,
        hasInvoices,
        errorTexts,
        headings,
        visibleText: visibleText.replace(/\s+/g, ' ').trim()
      };
    });

    console.log('   Error boundary found:', pageCheck.hasErrorBoundary);
    console.log('   Error indicators:', pageCheck.hasError);
    console.log('   Has invoices content:', pageCheck.hasInvoices);
    console.log('   Headings:', pageCheck.headings);
    if (pageCheck.errorTexts.length > 0) {
      console.log('   Error texts:', pageCheck.errorTexts);
    }
    console.log('   Visible text preview:', pageCheck.visibleText.substring(0, 200));

    // TEST TIME PAGE
    console.log('\n3. Testing /time...');
    await page.goto(`${BASE_URL}/time`, { waitUntil: 'networkidle2', timeout: 20000 });
    await sleep(3000);

    const timeCheck = await page.evaluate(() => {
      const body = document.body;
      const html = body.innerHTML;

      const hasErrorBoundary = html.includes('Something went wrong');
      const hasTimeTracking = html.includes('Time') || html.includes('Timer');
      const headings = [...document.querySelectorAll('h1, h2')].map(h => h.textContent?.trim());
      const visibleText = body.innerText?.substring(0, 500) || '';

      return {
        hasErrorBoundary,
        hasTimeTracking,
        headings,
        visibleText: visibleText.replace(/\s+/g, ' ').trim()
      };
    });

    console.log('   Error boundary found:', timeCheck.hasErrorBoundary);
    console.log('   Has time content:', timeCheck.hasTimeTracking);
    console.log('   Headings:', timeCheck.headings);
    console.log('   Visible text preview:', timeCheck.visibleText.substring(0, 200));

    // TEST EXPENSES PAGE
    console.log('\n4. Testing /finance/expenses...');
    await page.goto(`${BASE_URL}/finance/expenses`, { waitUntil: 'networkidle2', timeout: 20000 });
    await sleep(3000);

    const expensesCheck = await page.evaluate(() => {
      const body = document.body;
      const html = body.innerHTML;

      const hasErrorBoundary = html.includes('Something went wrong');
      const hasExpenses = html.includes('Expense') || html.includes('expense');
      const headings = [...document.querySelectorAll('h1, h2')].map(h => h.textContent?.trim());
      const visibleText = body.innerText?.substring(0, 500) || '';

      return {
        hasErrorBoundary,
        hasExpenses,
        headings,
        visibleText: visibleText.replace(/\s+/g, ' ').trim()
      };
    });

    console.log('   Error boundary found:', expensesCheck.hasErrorBoundary);
    console.log('   Has expenses content:', expensesCheck.hasExpenses);
    console.log('   Headings:', expensesCheck.headings);
    console.log('   Visible text preview:', expensesCheck.visibleText.substring(0, 200));

  } catch (err) {
    console.log(`\nError: ${err.message}`);
  }

  console.log('\n5. Waiting for manual inspection...');
  await sleep(10000);
  await browser.close();
}

run().catch(console.error);
