const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--start-maximized'],
    defaultViewport: null
  });

  const page = await browser.newPage();
  
  // Capture console logs
  const consoleLogs = [];
  page.on('console', msg => {
    const msgType = msg.type();
    const text = msg.text();
    consoleLogs.push({
      type: msgType,
      text: text
    });
    console.log('[Console ' + msgType + ']:', text);
  });

  // Capture page errors
  const pageErrors = [];
  page.on('pageerror', error => {
    pageErrors.push(error.toString());
    console.log('[Page Error]:', error.toString());
  });

  try {
    console.log('Step 1: Navigate to login page...');
    await page.goto('https://operate.guru/login', { waitUntil: 'networkidle0', timeout: 30000 });
    
    console.log('Step 2: Fill in email...');
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    await page.type('input[type="email"]', 'luk.gber@gmail.com');
    
    console.log('Step 3: Fill in password...');
    await page.waitForSelector('input[type="password"]', { timeout: 10000 });
    await page.type('input[type="password"]', 'Schlagzeug1@');
    
    console.log('Step 4: Submit form...');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 30000 }),
      page.click('button[type="submit"]')
    ]);
    
    console.log('Step 5: Waiting 10 seconds for page to fully load...');
    await page.waitForTimeout(10000);
    
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);
    
    // Take screenshot
    const screenshotPath = path.join(process.cwd(), 'test-screenshots', 'chat-error-capture.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log('Screenshot saved to:', screenshotPath);
    
    // Look for error message in red box
    console.log('\nStep 6: Looking for error message on page...');
    const errorBoxText = await page.evaluate(() => {
      // Look for error message in various possible locations
      const selectors = [
        '.text-red-600',
        '.text-red-500',
        '[class*="error"]',
        '[class*="Error"]',
        'pre',
        'code'
      ];
      
      const results = [];
      for (const selector of selectors) {
        const elements = document.querySelectorAll(selector);
        for (const el of elements) {
          if (el.textContent && el.textContent.length > 10) {
            results.push({
              selector: selector,
              text: el.textContent.trim(),
              html: el.innerHTML
            });
          }
        }
      }
      
      // Also get all visible text on page
      return {
        errorElements: results,
        bodyText: document.body.innerText,
        h1: document.querySelector('h1')?.textContent,
        h2: document.querySelector('h2')?.textContent
      };
    });
    
    console.log('\n=== ERROR MESSAGE ON PAGE ===');
    console.log(JSON.stringify(errorBoxText, null, 2));
    
    // Filter console logs for ErrorBoundary messages
    const errorBoundaryLogs = consoleLogs.filter(log => 
      log.text.includes('[ErrorBoundary]') || 
      log.text.includes('Error:') ||
      log.text.includes('error')
    );
    
    console.log('\n=== ERRORBOUNDARY & ERROR CONSOLE LOGS ===');
    console.log(JSON.stringify(errorBoundaryLogs, null, 2));
    
    console.log('\n=== ALL CONSOLE LOGS ===');
    console.log(JSON.stringify(consoleLogs, null, 2));
    
    console.log('\n=== PAGE ERRORS ===');
    console.log(JSON.stringify(pageErrors, null, 2));
    
    // Save detailed report
    const report = {
      timestamp: new Date().toISOString(),
      currentUrl: currentUrl,
      errorOnPage: errorBoxText,
      errorBoundaryLogs: errorBoundaryLogs,
      allConsoleLogs: consoleLogs,
      pageErrors: pageErrors,
      screenshotPath: screenshotPath
    };
    
    const reportPath = path.join(process.cwd(), 'CHAT_ERROR_CAPTURE_REPORT.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log('\nDetailed report saved to:', reportPath);
    
    console.log('\n=== TEST COMPLETE ===');
    console.log('Please check the screenshot and logs above for the exact error message.');
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await browser.close();
  }
})();
