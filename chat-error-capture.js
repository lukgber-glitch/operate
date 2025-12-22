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

  const pageErrors = [];
  page.on('pageerror', error => {
    pageErrors.push(error.toString());
    console.log('[Page Error]:', error.toString());
  });

  try {
    console.log('Step 1: Navigate to login page...');
    await page.goto('https://operate.guru/login', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);
    
    console.log('Step 2: Fill in email...');
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    await page.type('input[type="email"]', 'luk.gber@gmail.com');
    
    console.log('Step 3: Fill in password...');
    await page.waitForSelector('input[type="password"]', { timeout: 10000 });
    await page.type('input[type="password"]', 'Schlagzeug1@');
    
    console.log('Step 4: Click submit button...');
    await page.click('button[type="submit"]');
    
    console.log('Step 5: Waiting for navigation...');
    await page.waitForTimeout(15000);
    
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);
    
    const screenshotPath = path.join(process.cwd(), 'test-screenshots', 'chat-error-capture.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log('Screenshot saved to:', screenshotPath);
    
    console.log('\nStep 6: Looking for error message on page...');
    const errorBoxText = await page.evaluate(() => {
      const selectors = [
        '.text-red-600',
        '.text-red-500',
        '[class*="error"]',
        '[class*="Error"]',
        'pre',
        'code',
        'div[role="alert"]'
      ];
      
      const results = [];
      for (const selector of selectors) {
        const elements = document.querySelectorAll(selector);
        for (const el of elements) {
          if (el.textContent && el.textContent.trim().length > 5) {
            results.push({
              selector: selector,
              text: el.textContent.trim()
            });
          }
        }
      }
      
      return {
        errorElements: results,
        bodyText: document.body.innerText.substring(0, 2000),
        h1: document.querySelector('h1')?.textContent,
        h2: document.querySelector('h2')?.textContent,
        title: document.title
      };
    });
    
    console.log('\n=== ERROR MESSAGE ON PAGE ===');
    console.log(JSON.stringify(errorBoxText, null, 2));
    
    const errorBoundaryLogs = consoleLogs.filter(log => 
      log.text.includes('[ErrorBoundary]') || 
      log.text.includes('Error') ||
      log.text.toLowerCase().includes('error')
    );
    
    console.log('\n=== ERROR-RELATED CONSOLE LOGS ===');
    console.log(JSON.stringify(errorBoundaryLogs, null, 2));
    
    console.log('\n=== PAGE ERRORS ===');
    console.log(JSON.stringify(pageErrors, null, 2));
    
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
    console.log('\nKey findings:');
    console.log('- Current URL:', currentUrl);
    console.log('- Page Title:', errorBoxText.title);
    console.log('- H1:', errorBoxText.h1);
    console.log('- H2:', errorBoxText.h2);
    console.log('- Error elements found:', errorBoxText.errorElements.length);
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await browser.close();
  }
})();
