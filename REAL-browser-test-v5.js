/**
 * REAL Browser Test v5 - Wait for DOM changes after each Skip
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000';
const SCREENSHOTS_DIR = path.join(__dirname, 'test-screenshots', 'REAL-TEST-V5');

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

const sleep = ms => new Promise(r => setTimeout(r, ms));
const log = msg => console.log(`[${new Date().toISOString().slice(11,19)}] ${msg}`);

async function screenshot(page, name) {
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `${name}.png`), fullPage: true });
  log(`📸 ${name}`);
}

async function getPageTitle(page) {
  return page.evaluate(() => {
    const h1 = document.querySelector('h1, h2');
    return h1 ? h1.textContent.trim() : 'unknown';
  });
}

async function clickButtonAndWait(page, buttonText, expectedTitleChange = null) {
  const beforeTitle = await getPageTitle(page);
  log(`  Before: "${beforeTitle.substring(0, 40)}"`);

  // Click the button
  const clicked = await page.evaluate((text) => {
    const btns = [...document.querySelectorAll('button')];
    const btn = btns.find(b => {
      const btnText = b.textContent.trim();
      return btnText === text || btnText.includes(text);
    });
    if (btn && !btn.disabled) {
      btn.click();
      return true;
    }
    return false;
  }, buttonText);

  if (!clicked) {
    log(`  Button "${buttonText}" not found or disabled`);
    return false;
  }

  log(`  Clicked "${buttonText}"`);

  // Wait for title to change (up to 5 seconds)
  try {
    await page.waitForFunction(
      (oldTitle) => {
        const h1 = document.querySelector('h1, h2');
        const newTitle = h1 ? h1.textContent.trim() : '';
        return newTitle !== oldTitle;
      },
      { timeout: 5000 },
      beforeTitle
    );
    const afterTitle = await getPageTitle(page);
    log(`  After: "${afterTitle.substring(0, 40)}"`);
    return true;
  } catch (e) {
    log(`  Title didn't change (timeout)`);
    return false;
  }
}

async function run() {
  log('═'.repeat(60));
  log('REAL BROWSER TEST V5 - WAIT FOR DOM CHANGES');
  log('═'.repeat(60));

  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 30,
    args: ['--no-sandbox', '--window-size=1400,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });

  // Capture console logs
  page.on('console', msg => {
    const text = msg.text();
    if (msg.type() === 'error' && !text.includes('401') && !text.includes('favicon')) {
      console.log(`  [CONSOLE] ${text.substring(0, 100)}`);
    }
  });

  try {
    // CLEAR STORAGE
    log('\n🧹 CLEAR STORAGE');
    await page.goto(BASE_URL, { waitUntil: 'networkidle2' });
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    log('  Done');

    // LOGIN
    log('\n🔐 LOGIN');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });
    await page.type('#email', 'test@operate.guru');
    await page.type('#password', 'TestPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => {});
    await sleep(2000);
    log(`  URL: ${page.url()}`);

    if (!page.url().includes('onboarding')) {
      log('  Not redirected to onboarding - already complete?');
      await screenshot(page, '00-not-onboarding');
    } else {
      // ONBOARDING
      log('\n📋 ONBOARDING');

      // Step 1: Welcome
      log('\n→ STEP 1: Welcome');
      await sleep(1500);
      await screenshot(page, '01-welcome');
      await clickButtonAndWait(page, 'Get Started');
      await sleep(1000);
      await screenshot(page, '02-company-info');

      // Step 2: Company Info - Fill form
      log('\n→ STEP 2: Company Info');

      // Fill text fields
      for (const [name, val] of [
        ['companyInfo.name', 'E2E TestCorp'],
        ['companyInfo.taxId', 'DE111222333'],
        ['companyInfo.address.street', 'Teststr'],
        ['companyInfo.address.streetNumber', '1'],
        ['companyInfo.address.postalCode', '10115'],
        ['companyInfo.address.city', 'Berlin'],
        ['companyInfo.businessEmail', 'e2e@test.de'],
        ['companyInfo.businessPhone', '+491234567'],
      ]) {
        const inp = await page.$(`input[name="${name}"]`);
        if (inp) {
          await inp.click({ clickCount: 3 });
          await inp.type(val);
        }
      }
      log('  ✓ Text fields');

      // Fill selects
      for (const val of ['Germany', 'GmbH', 'Technology', 'January', 'EUR']) {
        const cbs = await page.$$('[role="combobox"]');
        for (const cb of cbs) {
          const isEmpty = await page.evaluate(el => {
            const text = el.textContent;
            return text.includes('Select') || text.includes('Choose') || text.length < 3;
          }, cb);
          if (isEmpty) {
            await cb.click();
            await sleep(400);
            await page.keyboard.type(val);
            await sleep(200);
            await page.keyboard.press('Enter');
            await sleep(400);
            log(`  ✓ Selected: ${val}`);
            break;
          }
        }
      }

      await screenshot(page, '03-company-filled');

      // Click Next
      log('\n→ Click Next (Company → Banking)');
      await clickButtonAndWait(page, 'Next');
      await sleep(1000);
      await screenshot(page, '04-banking');

      // Step 3: Banking - Skip
      log('\n→ STEP 3: Banking - SKIP');
      let title = await getPageTitle(page);
      log(`  Current page: ${title}`);
      await clickButtonAndWait(page, 'Skip');
      await sleep(1000);
      await screenshot(page, '05-email');

      // Step 4: Email - Skip
      log('\n→ STEP 4: Email - SKIP');
      title = await getPageTitle(page);
      log(`  Current page: ${title}`);
      await clickButtonAndWait(page, 'Skip');
      await sleep(1000);
      await screenshot(page, '06-tax');

      // Step 5: Tax - Skip
      log('\n→ STEP 5: Tax - SKIP');
      title = await getPageTitle(page);
      log(`  Current page: ${title}`);
      await clickButtonAndWait(page, 'Skip');
      await sleep(1000);
      await screenshot(page, '07-accounting');

      // Step 6: Accounting - Skip
      log('\n→ STEP 6: Accounting - SKIP');
      title = await getPageTitle(page);
      log(`  Current page: ${title}`);
      await clickButtonAndWait(page, 'Skip');
      await sleep(1000);
      await screenshot(page, '08-preferences');

      // Step 7: Preferences - Next
      log('\n→ STEP 7: Preferences');
      title = await getPageTitle(page);
      log(`  Current page: ${title}`);
      await clickButtonAndWait(page, 'Next') || await clickButtonAndWait(page, 'Complete');
      await sleep(1000);
      await screenshot(page, '09-completion');

      // Step 8: Completion - Go to Dashboard
      log('\n→ STEP 8: Completion');
      title = await getPageTitle(page);
      log(`  Current page: ${title}`);

      // Look for Go to Dashboard button
      const dashClicked = await page.evaluate(() => {
        const btns = [...document.querySelectorAll('button')];
        const btn = btns.find(b => b.textContent.includes('Dashboard'));
        if (btn) { btn.click(); return true; }
        return false;
      });
      log(`  Dashboard clicked: ${dashClicked}`);
      await sleep(3000);
      await screenshot(page, '10-final');
    }

    // FINAL URL CHECK
    const finalUrl = page.url();
    log(`\n📍 Final URL: ${finalUrl}`);

    if (!finalUrl.includes('onboarding')) {
      log('\n✅ SUCCESS - Testing pages...');

      for (const p of ['/chat', '/dashboard', '/finance/invoices', '/finance/expenses', '/time', '/clients']) {
        await page.goto(`${BASE_URL}${p}`, { waitUntil: 'networkidle2', timeout: 15000 });
        await sleep(1500);

        const err = await page.evaluate(() => document.body.textContent.includes('Something went wrong'));
        const redir = page.url().includes('onboarding');
        const counts = await page.evaluate(() => ({
          b: document.querySelectorAll('button').length,
          i: document.querySelectorAll('input').length
        }));

        log(`${err ? '❌' : redir ? '⚠️' : '✅'} ${p} (${counts.b}btn ${counts.i}inp)`);
        await screenshot(page, `page${p.replace(/\//g, '-')}`);
      }
    } else {
      log('\n⚠️ Still in onboarding');
    }

    log('\n' + '═'.repeat(60));
    log('DONE');

  } catch (err) {
    log(`\n❌ ${err.message}`);
    await screenshot(page, 'error');
  }

  log('\n⏳ 15s inspection...');
  await sleep(15000);
  await browser.close();
}

run().catch(console.error);
