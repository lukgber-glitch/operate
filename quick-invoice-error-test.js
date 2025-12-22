const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({ 
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  
  const logs = [];
  const errors = [];
  
  page.on('console', msg => {
    const msgType = msg.type();
    const text = '[' + msgType + '] ' + msg.text();
    logs.push(text);
    console.log(text);
  });
  
  page.on('pageerror', error => {
    const text = '[PAGE ERROR] ' + error.message;
    errors.push(text);
    console.log(text);
  });
  
  page.on('requestfailed', request => {
    const failure = request.failure();
    const text = '[NETWORK FAIL] ' + request.url() + ' - ' + (failure ? failure.errorText : 'Unknown');
    errors.push(text);
    console.log(text);
  });
  
  try {
    console.log('Step 1: Navigate to login page...');
    await page.goto('https://operate.guru/login', { waitUntil: 'networkidle0', timeout: 30000 });
    
    console.log('Step 2: Fill in login credentials...');
    await page.waitForSelector('input[name="email"]', { timeout: 10000 });
    await page.type('input[name="email"]', 'browsertest@test.com');
    await page.type('input[name="password"]', 'Test123456!');
    
    console.log('Step 3: Click login button...');
    await page.click('button[type="submit"]');
    
    console.log('Step 4: Wait for navigation after login...');
    await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 30000 });
    await page.screenshot({ path: 'test-screenshots/after-login.png', fullPage: true });
    console.log('Screenshot saved: after-login.png');
    
    console.log('Step 5: Navigate to /finance/invoices...');
    await page.goto('https://operate.guru/finance/invoices', { waitUntil: 'networkidle0', timeout: 30000 });
    
    await page.waitForTimeout(2000);
    
    console.log('Step 6: Take screenshot of invoice page...');
    await page.screenshot({ path: 'test-screenshots/invoice-page-error.png', fullPage: true });
    console.log('Screenshot saved: invoice-page-error.png');
    
    console.log('Step 7: Looking for error messages on page...');
    const errorText = await page.evaluate(() => {
      const errorElements = document.querySelectorAll('[class*="error"], .text-red-600, .text-destructive, [role="alert"], .text-gray-500, .text-muted-foreground');
      const errors = [];
      
      errorElements.forEach(el => {
        if (el.textContent && el.textContent.trim()) {
          errors.push(el.textContent.trim());
        }
      });
      
      const allText = document.body.innerText;
      const errorMatches = allText.match(/error[^\n]*/gi);
      if (errorMatches) {
        errors.push(...errorMatches);
      }
      
      return {
        errors,
        bodyText: document.body.innerText,
        hasErrorBoundary: !!document.querySelector('[class*="error"]')
      };
    });
    
    console.log('\n=== ERROR DETAILS FROM PAGE ===');
    console.log(JSON.stringify(errorText, null, 2));
    
    console.log('\n=== CONSOLE LOGS ===');
    logs.forEach(log => console.log(log));
    
    console.log('\n=== ERRORS ===');
    errors.forEach(err => console.log(err));
    
    const report = {
      timestamp: new Date().toISOString(),
      url: page.url(),
      errorText,
      consoleLogs: logs,
      errors,
      screenshots: ['after-login.png', 'invoice-page-error.png']
    };
    
    fs.writeFileSync('invoice-error-report.json', JSON.stringify(report, null, 2));
    console.log('\nDetailed report saved to: invoice-error-report.json');
    
  } catch (error) {
    console.error('Test failed:', error.message);
    await page.screenshot({ path: 'test-screenshots/error-state.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();
