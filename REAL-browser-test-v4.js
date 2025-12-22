/**
 * REAL Browser Test v4 - Clear localStorage first!
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000';
const SCREENSHOTS_DIR = path.join(__dirname, 'test-screenshots', 'REAL-TEST-V4');

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
  log('REAL BROWSER TEST V4 - CLEAR LOCALSTORAGE FIRST');
  log('═'.repeat(60));

  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 50,
    args: ['--no-sandbox', '--window-size=1400,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });

  try {
    // ========== CLEAR STORAGE FIRST ==========
    log('\n🧹 CLEARING STORAGE');
    await page.goto(BASE_URL, { waitUntil: 'networkidle2' });

    await page.evaluate(() => {
      // Clear ALL localStorage
      localStorage.clear();
      // Clear specific onboarding key
      localStorage.removeItem('operate_onboarding_progress');
      // Clear cookies
      document.cookie.split(";").forEach(c => {
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
    });
    log('  ✓ Cleared localStorage and cookies');

    // ========== LOGIN ==========
    log('\n🔐 LOGIN');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });
    await screenshot(page, '01-login');

    await page.type('#email', 'test@operate.guru');
    await page.type('#password', 'TestPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => {});
    await sleep(3000);
    log(`  URL: ${page.url()}`);
    await screenshot(page, '02-after-login');

    // ========== ONBOARDING ==========
    if (page.url().includes('onboarding')) {
      log('\n📋 ONBOARDING FLOW');

      // STEP 1: WELCOME
      log('\n→ STEP 1/8: Welcome');
      await sleep(2000);

      // Click Get Started
      await page.evaluate(() => {
        const btns = [...document.querySelectorAll('button')];
        const btn = btns.find(b => b.textContent.includes('Get Started'));
        if (btn) { btn.click(); console.log('Clicked Get Started'); }
      });
      await sleep(2500);
      await screenshot(page, '03-step2-company');

      // Check current step
      let stepInfo = await page.evaluate(() => {
        const stepIndicator = document.body.textContent.match(/Step (\d+) of (\d+)/);
        return stepIndicator ? `Step ${stepIndicator[1]}/${stepIndicator[2]}` : 'unknown';
      });
      log(`  Current: ${stepInfo}`);

      // STEP 2: COMPANY INFO
      log('\n→ STEP 2/8: Company Info');

      // Fill ALL required fields
      const textInputs = [
        ['companyInfo.name', 'TestCorp Browser E2E'],
        ['companyInfo.taxId', 'DE987654321'],
        ['companyInfo.address.street', 'Testweg'],
        ['companyInfo.address.streetNumber', '42'],
        ['companyInfo.address.postalCode', '80331'],
        ['companyInfo.address.city', 'München'],
        ['companyInfo.businessEmail', 'test@e2e-testcorp.de'],
        ['companyInfo.businessPhone', '+49891234567'],
      ];

      for (const [name, value] of textInputs) {
        const input = await page.$(`input[name="${name}"]`);
        if (input) {
          await input.click({ clickCount: 3 });
          await input.type(value);
        }
      }
      log('  ✓ Text fields filled');

      // Fill combobox selects one by one with waits
      const selectValues = [
        ['Country', 'Germany'],
        ['Legal Form', 'GmbH'],
        ['Industry', 'Technology'],
        ['Fiscal Year', 'January'],
        ['Currency', 'EUR'],
      ];

      for (let i = 0; i < selectValues.length; i++) {
        const comboboxes = await page.$$('[role="combobox"]');
        if (comboboxes[i]) {
          await comboboxes[i].click();
          await sleep(500);
          await page.keyboard.type(selectValues[i][1]);
          await sleep(300);
          await page.keyboard.press('Enter');
          await sleep(500);
          log(`  ✓ ${selectValues[i][0]}: ${selectValues[i][1]}`);
        }
      }

      await screenshot(page, '04-company-filled');

      // Click Next button
      log('  → Clicking Next...');
      await page.evaluate(() => {
        const btns = [...document.querySelectorAll('button')];
        const btn = btns.find(b => b.textContent.trim() === 'Next' || b.textContent.includes('Next'));
        if (btn) { btn.click(); }
      });
      await sleep(3000);
      await screenshot(page, '05-after-company-next');

      // STEPS 3-6: Banking, Email, Tax, Accounting - SKIP each one
      const optionalSteps = ['Banking', 'Email', 'Tax', 'Accounting'];

      for (let i = 0; i < optionalSteps.length; i++) {
        stepInfo = await page.evaluate(() => {
          const match = document.body.textContent.match(/Step (\d+) of (\d+)/);
          return match ? `${match[1]}/${match[2]}` : '?';
        });
        log(`\n→ STEP ${i + 3}/8: ${optionalSteps[i]} (current: ${stepInfo})`);
        await sleep(1500);

        // Scroll to bottom to ensure Skip button is visible
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await sleep(500);

        // Click Skip button
        const skipResult = await page.evaluate(() => {
          const btns = [...document.querySelectorAll('button')];
          const skipBtn = btns.find(b => b.textContent.trim() === 'Skip' || b.textContent.includes('Skip'));
          if (skipBtn && !skipBtn.disabled) {
            skipBtn.click();
            return 'clicked';
          }
          // Try Next if no Skip
          const nextBtn = btns.find(b => b.textContent.trim() === 'Next');
          if (nextBtn && !nextBtn.disabled) {
            nextBtn.click();
            return 'next';
          }
          return 'not found';
        });

        log(`  Skip result: ${skipResult}`);
        await sleep(2500); // Wait for state update
        await screenshot(page, `06-step${i + 3}-${optionalSteps[i].toLowerCase()}`);
      }

      // STEP 7: Preferences
      stepInfo = await page.evaluate(() => {
        const match = document.body.textContent.match(/Step (\d+) of (\d+)/);
        return match ? `${match[1]}/${match[2]}` : '?';
      });
      log(`\n→ STEP 7/8: Preferences (current: ${stepInfo})`);
      await sleep(1500);
      await screenshot(page, '07-preferences');

      // Click Next/Continue
      await page.evaluate(() => {
        const btns = [...document.querySelectorAll('button')];
        const btn = btns.find(b =>
          b.textContent.includes('Next') ||
          b.textContent.includes('Continue') ||
          b.textContent.includes('Complete')
        );
        if (btn && !btn.disabled) btn.click();
      });
      await sleep(3000);
      await screenshot(page, '08-after-preferences');

      // STEP 8: Completion
      stepInfo = await page.evaluate(() => {
        const match = document.body.textContent.match(/Step (\d+) of (\d+)/);
        const hasComplete = document.body.textContent.includes('Setup Complete') ||
                            document.body.textContent.includes('Congratulations');
        return hasComplete ? 'Completion Page' : (match ? `${match[1]}/${match[2]}` : '?');
      });
      log(`\n→ STEP 8/8: Completion (current: ${stepInfo})`);
      await sleep(2000);
      await screenshot(page, '09-completion-page');

      // Click "Go to Dashboard" button
      const dashboardClicked = await page.evaluate(() => {
        const btns = [...document.querySelectorAll('button, a')];
        const btn = btns.find(b =>
          b.textContent.includes('Dashboard') ||
          b.textContent.includes('Go to') ||
          b.textContent.includes('Start Using')
        );
        if (btn) {
          btn.click();
          return true;
        }
        return false;
      });
      log(`  Dashboard button: ${dashboardClicked ? 'clicked' : 'not found'}`);
      await sleep(4000);
      await screenshot(page, '10-after-dashboard-click');
    }

    // ========== FINAL CHECK ==========
    const finalUrl = page.url();
    log(`\n📍 FINAL URL: ${finalUrl}`);

    if (!finalUrl.includes('onboarding')) {
      log('\n✅ SUCCESS! Left onboarding - now testing pages');
      log('═'.repeat(60));

      const testPages = [
        '/dashboard', '/chat', '/finance/invoices', '/finance/expenses',
        '/finance/bank-accounts', '/time', '/clients', '/settings'
      ];

      for (const p of testPages) {
        await page.goto(`${BASE_URL}${p}`, { waitUntil: 'networkidle2', timeout: 20000 });
        await sleep(2000);

        const content = await page.content();
        const hasError = content.includes('Something went wrong');
        const isOnboarding = page.url().includes('onboarding');

        const counts = await page.evaluate(() => ({
          btns: document.querySelectorAll('button').length,
          inputs: document.querySelectorAll('input').length,
        }));

        if (hasError) {
          log(`❌ ${p}: ERROR`);
        } else if (isOnboarding) {
          log(`⚠️ ${p}: Redirected to onboarding`);
        } else {
          log(`✅ ${p}: OK (${counts.btns} btns, ${counts.inputs} inputs)`);
        }

        await screenshot(page, `page-${p.replace(/\//g, '-').slice(1) || 'root'}`);
      }
    } else {
      log('\n⚠️ STILL IN ONBOARDING');

      // Debug: check what step we're on
      const debugInfo = await page.evaluate(() => {
        const content = document.body.textContent;
        return {
          hasWelcome: content.includes('Welcome to'),
          hasCompany: content.includes('Company Information'),
          hasBank: content.includes('Bank Account'),
          hasEmail: content.includes('Connect Your Email'),
          hasTax: content.includes('Tax Software'),
          hasAccounting: content.includes('Accounting'),
          hasPreferences: content.includes('Preferences'),
          hasComplete: content.includes('Setup Complete'),
          stepIndicator: content.match(/Step (\d+) of (\d+)/)?.[0] || 'none',
        };
      });
      log(`  Debug: ${JSON.stringify(debugInfo, null, 2)}`);
    }

    log('\n' + '═'.repeat(60));
    log('TEST COMPLETE');

  } catch (error) {
    log(`\n❌ ERROR: ${error.message}`);
    await screenshot(page, 'ERROR');
  }

  log('\n⏳ Browser open 15s for inspection...');
  await sleep(15000);
  await browser.close();
}

run().catch(console.error);
