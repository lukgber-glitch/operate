const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({ headless: false, args: ['--start-maximized'] });
  const page = await browser.newPage();
  const wait = ms => new Promise(r => setTimeout(r, ms));
  
  console.log('E2E TEST START - browsertest@test.com');
  
  try {
    console.log('Step 1: Login');
    await page.goto('https://operate.guru/login', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await wait(3000);
    await page.screenshot({ path: 'test-screenshots/e2e-01-login.png', fullPage: true });
    
    await page.type('input[type="email"]', 'browsertest@test.com', { delay: 50 });
    await page.type('input[type="password"]', 'Test123456\!', { delay: 50 });
    await page.screenshot({ path: 'test-screenshots/e2e-02-filled.png' });
    
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
    await wait(5000);
    await page.screenshot({ path: 'test-screenshots/e2e-03-after-login.png', fullPage: true });
    console.log('After login URL:', page.url());
    
    console.log('Step 2: Chat');
    await page.goto('https://operate.guru/chat', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await wait(3000);
    await page.screenshot({ path: 'test-screenshots/e2e-04-chat.png', fullPage: true });
    
    const alert = await page.\;
    if (alert) {
      const text = await alert.evaluate(el => el.textContent);
      console.log('ALERT FOUND:', text);
    }
    
    const input = await page.\;
    if (input) {
      await input.type('Hello test', { delay: 50 });
      const send = await page.\;
      if (send) await send.click();
      await wait(10000);
      await page.screenshot({ path: 'test-screenshots/e2e-05-chat-sent.png', fullPage: true });
    }
    
    console.log('Step 3: Finance Pages');
    await page.goto('https://operate.guru/finance/invoices', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await wait(3000);
    await page.screenshot({ path: 'test-screenshots/e2e-06-invoices.png', fullPage: true });
    console.log('Invoices URL:', page.url());
    
    await page.goto('https://operate.guru/finance/expenses', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await wait(3000);
    await page.screenshot({ path: 'test-screenshots/e2e-07-expenses.png', fullPage: true });
    console.log('Expenses URL:', page.url());
    
    await page.goto('https://operate.guru/time', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await wait(3000);
    await page.screenshot({ path: 'test-screenshots/e2e-08-time.png', fullPage: true });
    console.log('Time URL:', page.url());
    
    console.log('TEST COMPLETE');
  } catch (err) {
    console.error('ERROR:', err.message);
    await page.screenshot({ path: 'test-screenshots/e2e-ERROR.png', fullPage: true });
  }
  
  await browser.close();
})();
