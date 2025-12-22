const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
  const screenshotDir = path.join(__dirname, 'test-screenshots', 'login-chat');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  const browser = await puppeteer.launch({
    headless: false,
    args: ['--start-maximized'],
    defaultViewport: null
  });

  const page = await browser.newPage();
  
  const results = {
    timestamp: new Date().toISOString(),
    tests: [],
    consoleErrors: [],
    networkErrors: []
  };
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      results.consoleErrors.push(msg.text());
    }
  });
  
  page.on('requestfailed', request => {
    results.networkErrors.push(request.url() + ' - ' + request.failure().errorText);
  });
  
  console.log('\n=== LOGIN + CHAT VERIFICATION ===\n');
  
  try {
    console.log('Step 1: Navigate to login...');
    await page.goto('https://operate.guru/login', { 
      waitUntil: 'domcontentloaded',
      timeout: 30000 
    });
    await new Promise(resolve => setTimeout(resolve, 2000));
    await page.screenshot({ path: path.join(screenshotDir, '01-login.png'), fullPage: true });
    console.log('  ✓ Login page loaded');
    results.tests.push({ step: 1, name: 'Load login', status: 'PASS' });
    
    console.log('\nStep 2: Fill credentials...');
    await page.type('input[type="email"]', 'luk.gber@gmail.com', { delay: 50 });
    await page.type('input[type="password"]', 'Schlagzeug1@', { delay: 50 });
    await page.screenshot({ path: path.join(screenshotDir, '02-filled.png'), fullPage: true });
    console.log('  ✓ Credentials filled');
    results.tests.push({ step: 2, name: 'Fill form', status: 'PASS' });
    
    console.log('\nStep 3: Submit login...');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 30000 }),
      page.click('button[type="submit"]')
    ]);
    await new Promise(resolve => setTimeout(resolve, 2000));
    const urlAfter = page.url();
    await page.screenshot({ path: path.join(screenshotDir, '03-after-login.png'), fullPage: true });
    console.log('  ✓ Redirected to:', urlAfter);
    results.tests.push({ step: 3, name: 'Login submit', status: 'PASS', url: urlAfter });
    
    console.log('\nStep 4: Verify chat page...');
    console.log('  Waiting 5 seconds for page to load...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const finalUrl = page.url();
    const pageTitle = await page.title();
    
    const pageInfo = await page.evaluate(() => {
      const bodyText = document.body.innerText;
      return {
        hasError: bodyText.includes('Something went wrong'),
        hasChatInput: !!document.querySelector('textarea'),
        bodyLength: bodyText.length
      };
    });
    
    await page.screenshot({ path: path.join(screenshotDir, '04-chat-final.png'), fullPage: true });
    
    const htmlPath = path.join(screenshotDir, 'chat-page.html');
    fs.writeFileSync(htmlPath, await page.content());
    
    console.log('  URL:', finalUrl);
    console.log('  Title:', pageTitle);
    console.log('  Has error boundary:', pageInfo.hasError);
    console.log('  Has chat input:', pageInfo.hasChatInput);
    
    const testResult = {
      step: 4,
      name: 'Chat page verification',
      finalUrl,
      pageTitle,
      hasError: pageInfo.hasError,
      hasChatInput: pageInfo.hasChatInput,
      htmlSaved: htmlPath
    };
    
    if (pageInfo.hasError) {
      testResult.status = 'FAIL';
      testResult.error = 'Error boundary detected';
      console.log('  ✗ FAIL - Error boundary detected');
    } else if (!finalUrl.includes('/chat')) {
      testResult.status = 'FAIL';
      testResult.error = 'Not on chat page';
      console.log('  ✗ FAIL - Not on /chat page');
    } else {
      testResult.status = 'PASS';
      console.log('  ✓ PASS - Chat page loaded successfully');
    }
    
    results.tests.push(testResult);
    
  } catch (error) {
    console.error('\n✗ Test failed:', error.message);
    results.tests.push({ name: 'Test error', status: 'FAIL', error: error.message });
  }
  
  console.log('\n=== ERRORS ===');
  console.log('Console errors:', results.consoleErrors.length);
  if (results.consoleErrors.length > 0) {
    results.consoleErrors.slice(0, 10).forEach(e => console.log('  -', e));
  }
  console.log('Network errors:', results.networkErrors.length);
  if (results.networkErrors.length > 0) {
    results.networkErrors.slice(0, 10).forEach(e => console.log('  -', e));
  }
  
  console.log('\n=== SUMMARY ===');
  const passed = results.tests.filter(t => t.status === 'PASS').length;
  const failed = results.tests.filter(t => t.status === 'FAIL').length;
  console.log('PASSED:', passed);
  console.log('FAILED:', failed);
  console.log('TOTAL:', results.tests.length);
  
  results.summary = { passed, failed, total: results.tests.length };
  
  const resultsPath = path.join(__dirname, 'LOGIN_CHAT_TEST_RESULTS.json');
  fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
  console.log('\n✓ Results saved to:', resultsPath);
  
  console.log('\nClosing browser in 10 seconds...');
  await new Promise(resolve => setTimeout(resolve, 10000));
  await browser.close();
  
  process.exit(failed > 0 ? 1 : 0);
})();
