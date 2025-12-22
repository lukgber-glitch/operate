const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1920, height: 1080 }
  });

  const page = await browser.newPage();
  
  const failedRequests = [];
  const consoleErrors = [];
  
  page.on('response', response => {
    const status = response.status();
    const url = response.url();
    if (status === 404 || status === 401 || status >= 500) {
      failedRequests.push({ url, status, statusText: response.statusText() });
      console.log('[' + status + '] ' + url);
    }
  });

  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  try {
    await page.goto('https://operate.guru/login', { 
      waitUntil: 'domcontentloaded', 
      timeout: 60000 
    });
    
    await new Promise(r => setTimeout(r, 3000));
    await page.type('input[type="email"]', 'luk.gber@gmail.com', { delay: 50 });
    await page.type('input[type="password"]', 'Schlagzeug1@', { delay: 50 });
    await page.click('button[type="submit"]');
    
    await page.waitForNavigation({ timeout: 60000, waitUntil: 'domcontentloaded' });
    
    console.log('\nWaiting 15 seconds to capture all API calls...\n');
    await new Promise(r => setTimeout(r, 15000));
    
    console.log('\n=== FAILED API CALLS ===');
    failedRequests.forEach(req => {
      console.log(req.status + ' - ' + req.url);
    });
    
    fs.writeFileSync('CHAT_FAILED_URLS.json', JSON.stringify({
      failedRequests,
      consoleErrors,
      totalFailed: failedRequests.length
    }, null, 2));
    
    console.log('\nSaved to CHAT_FAILED_URLS.json');
    
  } catch (error) {
    console.error('Failed:', error.message);
  } finally {
    await new Promise(r => setTimeout(r, 5000));
    await browser.close();
  }
})();
