const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

(async () => {
  console.log('LOGIN + CHAT PAGE VERIFICATION');
  
  const screenshotDir = path.join(__dirname, 'test-screenshots', 'login-chat');
  const resultsPath = path.join(__dirname, 'LOGIN_CHAT_TEST_RESULTS.json');
  
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }
  
  const results = {
    testSuite: 'Login + Chat Verification',
    timestamp: new Date().toISOString(),
    tests: [],
    consoleErrors: [],
    networkErrors: [],
    screenshots: []
  };
  
  const browser = await puppeteer.launch({ 
    headless: false,
    args: ['--start-maximized']
  });
  
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('CONSOLE ERROR:', msg.text());
      results.consoleErrors.push(msg.text());
    }
  });
  
  page.on('requestfailed', request => {
    const err = request.url() + ' - ' + request.failure().errorText;
    console.log('NETWORK ERROR:', err);
    results.networkErrors.push(err);
  });
  
  async function screenshot(name, desc) {
    const file = path.join(screenshotDir, name + '.png');
    await page.screenshot({ path: file, fullPage: true });
    results.screenshots.push(file);
    console.log('[SCREENSHOT]', desc);
  }
  
  try {
    console.log('
Step 1: Navigate to login');
    await page.goto('https://operate.guru/login', { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(2000);
    await screenshot('01-login', 'Login page');
    results.tests.push({ step: 1, name: 'Navigate', status: 'PASS', url: page.url() });
    console.log('  PASS');
    
    console.log('
Step 2: Fill credentials');
    await page.type('input[type="email"]', 'luk.gber@gmail.com', { delay: 50 });
    await page.type('input[type="password"]', 'Schlagzeug1@', { delay: 50 });
    await screenshot('02-filled', 'Credentials filled');
    results.tests.push({ step: 2, name: 'Fill form', status: 'PASS' });
    console.log('  PASS');
    
    console.log('
Step 3: Submit');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }),
      page.click('button[type="submit"]')
    ]);
    const urlAfter = page.url();
    await sleep(1000);
    await screenshot('03-after-login', 'After login');
    results.tests.push({ step: 3, name: 'Submit', status: 'PASS', url: urlAfter });
    console.log('  PASS - Redirected to:', urlAfter);
    
    console.log('
Step 4: Wait and verify chat page');
    await sleep(5000);
    const finalUrl = page.url();
    const pageTitle = await page.title();
    const hasError = await page.evaluate(() => {
      return document.body.innerText.includes('Something went wrong');
    });
    
    await screenshot('04-chat-final', 'Chat page final');
    
    const htmlPath = path.join(screenshotDir, 'chat-page.html');
    const html = await page.content();
    fs.writeFileSync(htmlPath, html);
    
    const testResult = {
      step: 4,
      name: 'Chat page verification',
      finalUrl,
      pageTitle,
      hasError,
      htmlSaved: htmlPath
    };
    
    if (hasError) {
      testResult.status = 'FAIL';
      testResult.error = 'Error boundary detected';
      console.log('  FAIL - Error boundary found');
    } else if (!finalUrl.includes('/chat')) {
      testResult.status = 'FAIL';
      testResult.error = 'Not on chat page. URL: ' + finalUrl;
      console.log('  FAIL - Not on /chat');
    } else {
      testResult.status = 'PASS';
      console.log('  PASS - Chat page loaded');
      console.log('    URL:', finalUrl);
      console.log('    Title:', pageTitle);
    }
    
    results.tests.push(testResult);
    
  } catch (err) {
    console.error('
ERROR:', err.message);
    results.tests.push({ name: 'Test error', status: 'FAIL', error: err.message });
  }
  
  console.log('
=== ERRORS ===');
  console.log('Console errors:', results.consoleErrors.length);
  results.consoleErrors.slice(0, 5).forEach(e => console.log('  -', e));
  console.log('Network errors:', results.networkErrors.length);
  results.networkErrors.slice(0, 5).forEach(e => console.log('  -', e));
  
  console.log('
=== SUMMARY ===');
  const passed = results.tests.filter(t => t.status === 'PASS').length;
  const failed = results.tests.filter(t => t.status === 'FAIL').length;
  console.log('Passed:', passed);
  console.log('Failed:', failed);
  console.log('Screenshots:', results.screenshots.length);
  
  results.completedAt = new Date().toISOString();
  fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
  console.log('
Results saved to:', resultsPath);
  
  console.log('
Closing in 10 seconds...');
  await sleep(10000);
  await browser.close();
  
  process.exit(failed > 0 ? 1 : 0);
})();
