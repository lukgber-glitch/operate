const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
  console.log('======================================================================');
  console.log('PRODUCTION E2E TEST - User Journey');
  console.log('======================================================================');
  
  const screenshotDir = path.join(__dirname, 'test-screenshots', 'batch-01');
  const cookiesPath = path.join(__dirname, 'test-cookies.json');
  const resultsPath = path.join(__dirname, 'PRODUCTION_E2E_RESULTS.json');
  
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }
  
  const browser = await puppeteer.launch({ 
    headless: false,
    args: ['--start-maximized', '--disable-blink-features=AutomationControlled']
  });
  
  const results = {
    testSuite: 'BATCH 01 - Authentication Flow',
    timestamp: new Date().toISOString(),
    pages: [],
    summary: { total: 0, passed: 0, failed: 0 },
    cookiesSaved: false,
    screenshots: []
  };
  
  async function screenshot(page, name, desc) {
    const file = path.join(screenshotDir, name + '.png');
    await page.screenshot({ path: file, fullPage: true });
    results.screenshots.push(file);
    console.log('[SCREENSHOT]', desc);
  }
  
  // Test 1: Login with credentials
  console.log('\nTest 1: Login Page');
  try {
    const page = await browser.newPage();
    await page.goto('https://operate.guru/login', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await await new Promise(r=>setTimeout(r,));
    await screenshot(page, '01-login', 'Login page loaded');
    
    const email = await page.$('input[type="email"]');
    const password = await page.$('input[type="password"]');
    const submit = await page.$('button[type="submit"]');
    
    if (email && password && submit) {
      await email.type('browsertest@test.com');
      await password.type('TestPassword123!');
      await screenshot(page, '02-filled', 'Credentials filled');
      
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 30000 }),
        submit.click()
      ]);
      
      await await new Promise(r=>setTimeout(r,));
      const url = page.url();
      await screenshot(page, '03-after-login', 'After login');
      
      if (!url.includes('/login')) {
        const cookies = await page.cookies();
        fs.writeFileSync(cookiesPath, JSON.stringify(cookies, null, 2));
        results.cookiesSaved = true;
        results.pages.push({ name: 'Login', status: 'PASS', url });
        results.summary.passed++;
        console.log('  PASS - Redirected to:', url);
      } else {
        results.pages.push({ name: 'Login', status: 'FAIL', error: 'Still on login' });
        results.summary.failed++;
        console.log('  FAIL - Still on login page');
      }
    } else {
      results.pages.push({ name: 'Login', status: 'FAIL', error: 'Form missing' });
      results.summary.failed++;
      console.log('  FAIL - Form elements missing');
    }
    results.summary.total++;
    await page.close();
  } catch (err) {
    results.pages.push({ name: 'Login', status: 'FAIL', error: err.message });
    results.summary.failed++;
    results.summary.total++;
    console.log('  FAIL -', err.message);
  }
  
  const pages = [{name:"Chat",url:"/chat",screenshot:"04-chat",needsAuth:true},{name:"Invoices",url:"/finance/invoices",screenshot:"05-invoices",needsAuth:true},{name:"Expenses",url:"/finance/expenses",screenshot:"06-expenses",needsAuth:true},{name:"Time",url:"/time",screenshot:"07-time",needsAuth:true}];
  
  for (const test of pages) {
    console.log('\nTest:', test.name);
    try {
      const page = await browser.newPage();
      
      if (test.needsAuth && fs.existsSync(cookiesPath)) {
        const cookies = JSON.parse(fs.readFileSync(cookiesPath));
        await page.setCookie(...cookies);
      }
      
      await page.goto('https://operate.guru' + test.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await await new Promise(r=>setTimeout(r,));
      await screenshot(page, test.screenshot, test.name + ' page');
      
      results.pages.push({ name: test.name, status: 'PASS', url: page.url() });
      results.summary.passed++;
      console.log('  PASS - Loaded:', page.url());
      
      await page.close();
    } catch (err) {
      results.pages.push({ name: test.name, status: 'FAIL', error: err.message });
      results.summary.failed++;
      console.log('  FAIL -', err.message);
    }
    results.summary.total++;
  }
  
  results.completedAt = new Date().toISOString();
  fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
  
  console.log('\n======================================================================');
  console.log('SUMMARY');
  console.log('======================================================================');
  console.log('Total Tests:', results.summary.total);
  console.log('Passed:', results.summary.passed);
  console.log('Failed:', results.summary.failed);
  console.log('Cookies Saved:', results.cookiesSaved ? 'YES' : 'NO');
  console.log('Screenshots:', results.screenshots.length);
  console.log('\nResults saved to:', resultsPath);
  console.log('======================================================================');
  
  await browser.close();
})();
