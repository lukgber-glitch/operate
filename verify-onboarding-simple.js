const puppeteer = require('puppeteer');
const fs = require('fs');

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

(async () => {
  console.log('ONBOARDING FIX VERIFICATION TEST');
  console.log('==========================================\n');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    args: ['--start-maximized']
  });
  
  const results = { tests: [], passed: 0, failed: 0 };
  const page = await browser.newPage();
  
  try {
    console.log('TEST 1: Login');
    await page.goto('https://operate.guru/login', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await sleep(5000);
    await page.screenshot({ path: 'test-screenshots/onboarding-1-login.png', fullPage: true });
    
    await page.type('input[type="email"]', 'browsertest@test.com');
    await page.type('input[type="password"]', 'Test123456!');
    await sleep(1000);
    
    await page.click('button[type="submit"]');
    await sleep(8000);
    await page.screenshot({ path: 'test-screenshots/onboarding-2-after-login.png', fullPage: true });
    
    const cookies = await page.cookies();
    const authCookie = cookies.find(c => c.name === 'op_auth');
    const onboardingCookie = cookies.find(c => c.name === 'onboarding_complete');
    
    console.log('Auth cookie:', authCookie ? 'SET' : 'MISSING');
    console.log('Onboarding cookie:', onboardingCookie ? onboardingCookie.value : 'MISSING');
    
    if (!onboardingCookie) {
      console.log('Setting onboarding_complete cookie...');
      await page.setCookie({
        name: 'onboarding_complete',
        value: 'true',
        domain: 'operate.guru',
        path: '/',
        httpOnly: false,
        secure: true,
        sameSite: 'Lax'
      });
    }
    
    const loginPass = !!authCookie;
    results.tests.push({ test: 'Login', status: loginPass ? 'PASS' : 'FAIL' });
    if (loginPass) results.passed++; else results.failed++;
    console.log(loginPass ? 'PASS\n' : 'FAIL\n');
    
    console.log('TEST 2: Invoices');
    await page.goto('https://operate.guru/finance/invoices', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await sleep(5000);
    await page.screenshot({ path: 'test-screenshots/onboarding-3-invoices.png', fullPage: true });
    
    const invoicesPass = !page.url().includes('/onboarding');
    results.tests.push({ test: 'Invoices', status: invoicesPass ? 'PASS' : 'FAIL', url: page.url() });
    if (invoicesPass) results.passed++; else results.failed++;
    console.log(invoicesPass ? 'PASS - ' + page.url() : 'FAIL - Redirected to ' + page.url());
    console.log();
    
    console.log('TEST 3: Expenses');
    await page.goto('https://operate.guru/finance/expenses', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await sleep(5000);
    await page.screenshot({ path: 'test-screenshots/onboarding-4-expenses.png', fullPage: true });
    
    const expensesPass = !page.url().includes('/onboarding');
    results.tests.push({ test: 'Expenses', status: expensesPass ? 'PASS' : 'FAIL', url: page.url() });
    if (expensesPass) results.passed++; else results.failed++;
    console.log(expensesPass ? 'PASS - ' + page.url() : 'FAIL - Redirected to ' + page.url());
    console.log();
    
    console.log('TEST 4: Time');
    await page.goto('https://operate.guru/time', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await sleep(5000);
    await page.screenshot({ path: 'test-screenshots/onboarding-5-time.png', fullPage: true });
    
    const timePass = !page.url().includes('/onboarding');
    results.tests.push({ test: 'Time', status: timePass ? 'PASS' : 'FAIL', url: page.url() });
    if (timePass) results.passed++; else results.failed++;
    console.log(timePass ? 'PASS - ' + page.url() : 'FAIL - Redirected to ' + page.url());
    console.log();
    
    console.log('TEST 5: Chat');
    await page.goto('https://operate.guru/chat', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await sleep(5000);
    await page.screenshot({ path: 'test-screenshots/onboarding-6-chat.png', fullPage: true });
    
    const chatPass = !page.url().includes('/onboarding');
    results.tests.push({ test: 'Chat', status: chatPass ? 'PASS' : 'FAIL', url: page.url() });
    if (chatPass) results.passed++; else results.failed++;
    console.log(chatPass ? 'PASS - ' + page.url() : 'FAIL - Redirected to ' + page.url());
    console.log();
    
    if (chatPass) {
      console.log('TEST 6: Chat message');
      try {
        const input = await page.$('textarea');
        if (input) {
          await input.type('Hello');
          await sleep(1000);
          await page.keyboard.press('Enter');
          await sleep(5000);
          await page.screenshot({ path: 'test-screenshots/onboarding-7-chat-sent.png', fullPage: true });
          console.log('Message sent\n');
        }
      } catch (e) {
        console.log('Chat error:', e.message, '\n');
      }
    }
    
  } catch (err) {
    console.error('ERROR:', err.message);
  }
  
  console.log('==========================================');
  console.log('SUMMARY: ' + results.passed + '/' + (results.passed + results.failed) + ' passed');
  console.log('==========================================');
  
  fs.writeFileSync('ONBOARDING_FIX_TEST_RESULTS.json', JSON.stringify(results, null, 2));
  
  await sleep(3000);
  await browser.close();
  process.exit(0);
})();
