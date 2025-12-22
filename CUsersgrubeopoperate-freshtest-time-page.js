const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1920, height: 1080 }
  });

  const page = await browser.newPage();
  const screenshotDir = 'C:\Users\grube\op\operate-fresh\test-screenshots\time-page-test';
  
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  const consoleMessages = [];
  const errors = [];

  page.on('console', msg => {
    const text = msg.text();
    consoleMessages.push({ type: msg.type(), text });
    console.log('[' + msg.type() + '] ' + text);
  });

  page.on('pageerror', error => {
    errors.push(error.toString());
    console.log('Page Error:', error);
  });

  page.on('requestfailed', request => {
    errors.push('Failed request: ' + request.url() + ' - ' + request.failure().errorText);
    console.log('Request Failed:', request.url(), request.failure().errorText);
  });

  try {
    console.log('Step 1: Navigating to login page...');
    await page.goto('https://operate.guru/login', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    await page.screenshot({ path: path.join(screenshotDir, '01-login-page.png'), fullPage: true });
    console.log('Login page loaded');

    console.log('\nStep 2: Entering credentials...');
    await page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 10000 });
    await page.type('input[type="email"], input[name="email"]', 'test@example.com');
    await page.type('input[type="password"], input[name="password"]', 'testpassword123');
    await page.screenshot({ path: path.join(screenshotDir, '02-credentials-entered.png'), fullPage: true });
    console.log('Credentials entered');

    console.log('\nStep 3: Clicking login button...');
    await page.click('button[type="submit"]');
    
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });
    await page.screenshot({ path: path.join(screenshotDir, '03-after-login.png'), fullPage: true });
    console.log('Logged in successfully');
    console.log('Current URL after login:', page.url());

    await page.waitForTimeout(2000);

    console.log('\nStep 4: Navigating to /time page...');
    await page.goto('https://operate.guru/time', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    await page.waitForTimeout(3000);
    
    await page.screenshot({ path: path.join(screenshotDir, '04-time-page.png'), fullPage: true });
    console.log('Time page loaded');
    console.log('Current URL:', page.url());

    const pageContent = await page.evaluate(() => {
      return {
        title: document.title,
        h1: document.querySelector('h1')?.textContent || 'No h1 found',
        bodyText: document.body.innerText.substring(0, 500),
        hasErrorMessage: document.body.innerText.includes('Error') || document.body.innerText.includes('error'),
        has404: document.body.innerText.includes('404') || document.body.innerText.includes('Not Found')
      };
    });

    console.log('\nPage Content Analysis:');
    console.log('Title:', pageContent.title);
    console.log('H1:', pageContent.h1);
    console.log('Has Error Message:', pageContent.hasErrorMessage);
    console.log('Has 404:', pageContent.has404);
    console.log('Body preview:', pageContent.bodyText.substring(0, 200));

    const performanceData = await page.evaluate(() => {
      return JSON.parse(JSON.stringify(performance.getEntries()));
    });

    const apiRequests = performanceData.filter(entry => 
      entry.name.includes('/api/') || entry.name.includes('time-tracking') || entry.name.includes('time-entries')
    );

    console.log('\nAPI Requests made:');
    apiRequests.forEach(req => {
      console.log('- ' + req.name);
    });

    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(screenshotDir, '05-final-state.png'), fullPage: true });

    const report = {
      timestamp: new Date().toISOString(),
      testSteps: [
        'Login page loaded',
        'Credentials entered',
        'Login successful',
        'Navigated to /time page'
      ],
      pageContent,
      consoleMessages: consoleMessages.slice(-20),
      errors,
      apiRequests: apiRequests.map(r => r.name),
      finalUrl: page.url(),
      screenshots: [
        '01-login-page.png',
        '02-credentials-entered.png',
        '03-after-login.png',
        '04-time-page.png',
        '05-final-state.png'
      ]
    };

    fs.writeFileSync(
      path.join(screenshotDir, 'TIME_PAGE_TEST_REPORT.json'),
      JSON.stringify(report, null, 2)
    );

    console.log('\n✅ Test completed successfully');
    console.log('Screenshots saved to: ' + screenshotDir);

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    await page.screenshot({ path: path.join(screenshotDir, 'error-state.png'), fullPage: true });
    
    const errorReport = {
      timestamp: new Date().toISOString(),
      error: error.toString(),
      stack: error.stack,
      consoleMessages,
      errors,
      finalUrl: page.url()
    };
    
    fs.writeFileSync(
      path.join(screenshotDir, 'ERROR_REPORT.json'),
      JSON.stringify(errorReport, null, 2)
    );
  } finally {
    await browser.close();
  }
})();
