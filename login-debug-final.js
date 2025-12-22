const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

(async () => {
  console.log('====== LOGIN DEBUG TEST ======');
  
  const screenshotDir = path.join(__dirname, 'test-screenshots');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  const browser = await puppeteer.launch({ 
    headless: false,
    args: ['--start-maximized']
  });
  
  const report = {
    timestamp: new Date().toISOString(),
    steps: []
  };

  try {
    const page = await browser.newPage();
    
    console.log('\nSTEP 1: Navigate to login');
    await page.goto('https://operate.guru/login', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await sleep(3000);
    await page.screenshot({ path: path.join(screenshotDir, 'debug-01-initial.png'), fullPage: true });
    console.log('URL:', page.url());
    console.log('Title:', await page.title());
    report.steps.push({ step: 1, url: page.url() });
    
    console.log('\nSTEP 2: Take screenshot');
    await page.screenshot({ path: path.join(screenshotDir, 'debug-02-page.png'), fullPage: true });
    
    console.log('\nSTEP 3: Fill email');
    const email = await page.$('input[type="email"]');
    if (!email) throw new Error('Email input not found');
    await email.type('browsertest@test.com', { delay: 50 });
    console.log('Email filled');
    
    console.log('\nSTEP 4: Fill password');
    const password = await page.$('input[type="password"]');
    if (!password) throw new Error('Password input not found');
    await password.type('TestPassword123!', { delay: 50 });
    console.log('Password filled');
    
    console.log('\nSTEP 5: Screenshot before submit');
    await page.screenshot({ path: path.join(screenshotDir, 'debug-05-filled.png'), fullPage: true });
    
    console.log('\nSTEP 6: Click submit');
    const submit = await page.$('button[type="submit"]');
    if (!submit) throw new Error('Submit button not found');
    
    const responses = [];
    page.on('response', async (resp) => {
      const url = resp.url();
      if (url.includes('api') || url.includes('auth') || url.includes('login')) {
        const info = { url, status: resp.status(), statusText: resp.statusText() };
        try {
          if (resp.status() !== 304) {
            const text = await resp.text();
            info.body = text.substring(0, 500);
          }
        } catch (e) {}
        responses.push(info);
        console.log('Response:', url, resp.status());
      }
    });
    
    await submit.click();
    console.log('Clicked submit, waiting 10 seconds...');
    await sleep(10000);
    
    console.log('\nSTEP 7: Screenshot after submit');
    await page.screenshot({ path: path.join(screenshotDir, 'debug-07-result.png'), fullPage: true });
    
    const finalUrl = page.url();
    const stillOnLogin = finalUrl.includes('/login');
    console.log('Final URL:', finalUrl);
    console.log('Still on login?', stillOnLogin);
    
    const errors = await page.evaluate(() => {
      const errs = [];
      document.querySelectorAll('[role="alert"], .error, [class*="error"]').forEach(el => {
        const text = el.textContent.trim();
        if (text) errs.push(text);
      });
      return errs;
    });
    console.log('Errors found:', errors);
    
    report.steps.push({
      step: 7,
      finalUrl,
      stillOnLogin,
      errors,
      responses
    });
    
    console.log('\nSTEP 8: Check result');
    if (!stillOnLogin && errors.length === 0) {
      console.log('SUCCESS - Login worked!');
      report.success = true;
    } else {
      console.log('FAILURE - Login did not work');
      report.success = false;
      report.failureReason = stillOnLogin ? 'Still on login page' : 'Errors present';
    }
    
    if (report.success) {
      console.log('\nSTEP 9: Navigate to invoices');
      await page.goto('https://operate.guru/finance/invoices', { waitUntil: 'domcontentloaded', timeout: 60000 });
      await sleep(3000);
      await page.screenshot({ path: path.join(screenshotDir, 'debug-09-invoices.png'), fullPage: true });
      console.log('Invoices URL:', page.url());
      report.steps.push({ step: 9, url: page.url() });
    } else {
      console.log('\nSTEP 9: Skipped (login failed)');
    }
    
    fs.writeFileSync(
      path.join(screenshotDir, 'debug-report.json'),
      JSON.stringify(report, null, 2)
    );
    
    console.log('\n====== TEST COMPLETE ======');
    console.log('Success:', report.success);
    console.log('Report saved to test-screenshots/debug-report.json');
    
  } catch (error) {
    console.error('\nERROR:', error.message);
    console.error(error.stack);
    report.error = { message: error.message, stack: error.stack };
    fs.writeFileSync(
      path.join(screenshotDir, 'debug-report.json'),
      JSON.stringify(report, null, 2)
    );
  } finally {
    await browser.close();
  }
})();
