/**
 * Quick Debug Test - Check API calls and orgId
 */

const puppeteer = require('puppeteer');

const BASE_URL = 'http://localhost:3000';
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function run() {
  console.log('Starting Debug Test...\n');

  const browser = await puppeteer.launch({
    headless: false,
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
    if (text.includes('orgId') || text.includes('FinanceAPI') || text.includes('TimeTracking')) {
      console.log(`[CONSOLE] ${text}`);
    }
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

    if (afterLogin.includes('onboarding')) {
      console.log('   Still needs onboarding - please complete it first');
      await browser.close();
      return;
    }

    // Check window.__orgId
    const orgId = await page.evaluate(() => window.__orgId);
    console.log(`   window.__orgId: ${orgId || 'NOT SET'}`);

    // Check cookies
    const cookies = await page.cookies();
    const authCookie = cookies.find(c => c.name === 'op_auth');
    console.log(`   op_auth cookie: ${authCookie ? 'EXISTS' : 'NOT FOUND'}`);

    // TEST PAGES
    console.log('\n2. Testing /finance/invoices...');
    apiCalls.length = 0;
    await page.goto(`${BASE_URL}/finance/invoices`, { waitUntil: 'networkidle2', timeout: 15000 });
    await sleep(3000);

    const orgId2 = await page.evaluate(() => window.__orgId);
    console.log(`   window.__orgId after page load: ${orgId2 || 'NOT SET'}`);

    console.log('   API Calls:');
    apiCalls.forEach(c => console.log(`     ${c.method} ${c.url} -> ${c.status}`));

    // Check for errors on page
    const hasError = await page.evaluate(() => document.body.textContent.includes('Something went wrong'));
    console.log(`   Page has error: ${hasError}`);

    // TEST TIME PAGE
    console.log('\n3. Testing /time...');
    apiCalls.length = 0;
    await page.goto(`${BASE_URL}/time`, { waitUntil: 'networkidle2', timeout: 15000 });
    await sleep(3000);

    console.log('   API Calls:');
    apiCalls.forEach(c => console.log(`     ${c.method} ${c.url} -> ${c.status}`));

    const hasError2 = await page.evaluate(() => document.body.textContent.includes('Something went wrong'));
    console.log(`   Page has error: ${hasError2}`);

    // TEST EXPENSES PAGE
    console.log('\n4. Testing /finance/expenses...');
    apiCalls.length = 0;
    await page.goto(`${BASE_URL}/finance/expenses`, { waitUntil: 'networkidle2', timeout: 15000 });
    await sleep(3000);

    console.log('   API Calls:');
    apiCalls.forEach(c => console.log(`     ${c.method} ${c.url} -> ${c.status}`));

    const hasError3 = await page.evaluate(() => document.body.textContent.includes('Something went wrong'));
    console.log(`   Page has error: ${hasError3}`);

  } catch (err) {
    console.log(`\nError: ${err.message}`);
  }

  console.log('\n5. Waiting for manual inspection...');
  await sleep(10000);
  await browser.close();
}

run().catch(console.error);
