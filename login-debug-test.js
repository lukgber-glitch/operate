const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
  const screenshotDir = path.join(__dirname, 'test-screenshots');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1920, height: 1080 }
  });

  const page = await browser.newPage();
  const report = { timestamp: new Date().toISOString(), steps: [] };

  try {
    console.log('Step 1: Navigate to login');
    await page.goto('https://operate.guru/login', { waitUntil: 'networkidle2', timeout: 30000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(screenshotDir, 'step1-login-page.png'), fullPage: true });
    
    const url1 = page.url();
    const title1 = await page.title();
    console.log('URL:', url1, 'Title:', title1);
    report.steps.push({ step: 1, url: url1, title: title1 });

    console.log('Step 2: Fill email');
    await page.type('input[type=email]', 'browsertest@test.com');
    report.steps.push({ step: 2, action: 'typed email' });

    console.log('Step 3: Fill password');
    await page.type('input[type=password]', 'TestPassword123!');
    report.steps.push({ step: 3, action: 'typed password' });

    console.log('Step 4: Screenshot before submit');
    await page.screenshot({ path: path.join(screenshotDir, 'step4-before-submit.png'), fullPage: true });

    console.log('Step 5: Click submit');
    await page.click('button[type=submit]');
    await page.waitForTimeout(10000);

    console.log('Step 6: Screenshot after submit');
    await page.screenshot({ path: path.join(screenshotDir, 'step6-after-submit.png'), fullPage: true });
    
    const url2 = page.url();
    const stillOnLogin = url2.includes('/login');
    console.log('After submit URL:', url2, 'Still on login:', stillOnLogin);
    report.steps.push({ step: 6, url: url2, stillOnLogin });

    if (!stillOnLogin) {
      console.log('Step 7: Go to invoices');
      await page.goto('https://operate.guru/finance/invoices', { waitUntil: 'networkidle2' });
      await page.waitForTimeout(2000);
      await page.screenshot({ path: path.join(screenshotDir, 'step7-invoices.png'), fullPage: true });
      const url3 = page.url();
      console.log('Invoices URL:', url3);
      report.steps.push({ step: 7, url: url3 });
    }

    fs.writeFileSync(path.join(screenshotDir, 'report.json'), JSON.stringify(report, null, 2));
    console.log('SUCCESS - Report saved');

  } catch (error) {
    console.error('ERROR:', error.message);
    report.error = error.message;
    fs.writeFileSync(path.join(screenshotDir, 'report.json'), JSON.stringify(report, null, 2));
  } finally {
    await browser.close();
  }
})();