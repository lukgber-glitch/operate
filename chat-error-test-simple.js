const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

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
    consoleLogs.push({ type: msgType, text: text });
    console.log('[Console]', msgType, ':', text);
  });

  const pageErrors = [];
  page.on('pageerror', error => {
    pageErrors.push(error.toString());
    console.log('[Page Error]:', error.toString());
  });

  try {
    console.log('Navigate to login...');
    await page.goto('https://operate.guru/login', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await sleep(3000);
    
    console.log('Fill email...');
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    await page.type('input[type="email"]', 'luk.gber@gmail.com');
    
    console.log('Fill password...');
    await page.waitForSelector('input[type="password"]', { timeout: 10000 });
    await page.type('input[type="password"]', 'Schlagzeug1@');
    
    console.log('Submit...');
    await page.click('button[type="submit"]');
    await sleep(15000);
    
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);
    
    const screenshotPath = path.join(process.cwd(), 'test-screenshots', 'chat-error-capture.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log('Screenshot saved');
    
    const errorBoxText = await page.evaluate(() => {
      const results = [];
      document.querySelectorAll('.text-red-600, .text-red-500, pre, code').forEach(el => {
        if (el.textContent && el.textContent.trim().length > 5) {
          results.push(el.textContent.trim());
        }
      });
      
      return {
        errors: results,
        bodyText: document.body.innerText.substring(0, 2000),
        title: document.title
      };
    });
    
    console.log('\n=== ERROR MESSAGES ===');
    console.log(JSON.stringify(errorBoxText, null, 2));
    
    const errorLogs = consoleLogs.filter(log => 
      log.text.toLowerCase().includes('error') || log.text.includes('[ErrorBoundary]')
    );
    
    console.log('\n=== ERROR LOGS ===');
    console.log(JSON.stringify(errorLogs, null, 2));
    
    const report = {
      timestamp: new Date().toISOString(),
      currentUrl: currentUrl,
      errorOnPage: errorBoxText,
      errorLogs: errorLogs,
      pageErrors: pageErrors
    };
    
    fs.writeFileSync('CHAT_ERROR_CAPTURE_REPORT.json', JSON.stringify(report, null, 2));
    console.log('\nReport saved');
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await browser.close();
  }
})();
