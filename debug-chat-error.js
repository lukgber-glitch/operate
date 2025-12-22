const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1920, height: 1080 }
  });

  const page = await browser.newPage();
  
  const consoleMessages = [];
  page.on('console', msg => {
    const text = msg.text();
    const type = msg.type();
    consoleMessages.push({ type, text, timestamp: new Date().toISOString() });
    console.log('[CONSOLE ' + type + '] ' + text);
  });

  page.on('pageerror', error => {
    consoleMessages.push({ 
      type: 'pageerror', 
      text: error.toString(), 
      stack: error.stack,
      timestamp: new Date().toISOString() 
    });
    console.log('[PAGE ERROR] ' + error.toString());
  });

  page.on('requestfailed', request => {
    consoleMessages.push({ 
      type: 'requestfailed', 
      text: request.url() + ' - ' + request.failure().errorText,
      timestamp: new Date().toISOString() 
    });
  });

  try {
    console.log('Step 1: Navigate to login page...');
    await page.goto('https://operate.guru/login', { waitUntil: 'networkidle2', timeout: 30000 });
    await page.screenshot({ path: 'test-screenshots/chat-debug-login.png', fullPage: true });

    console.log('Step 2: Fill in email...');
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    await page.type('input[type="email"]', 'luk.gber@gmail.com');

    console.log('Step 3: Fill in password...');
    await page.waitForSelector('input[type="password"]', { timeout: 10000 });
    await page.type('input[type="password"]', 'Schlagzeug1@');

    console.log('Step 4: Submit form...');
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ timeout: 30000, waitUntil: 'networkidle2' })
    ]);

    console.log('Step 5: Waiting for redirect...');
    const currentUrl = page.url();
    console.log('Current URL: ' + currentUrl);
    
    await page.screenshot({ path: 'test-screenshots/chat-debug-after-login.png', fullPage: true });

    console.log('Step 6: Waiting 10 seconds for page to fully load...');
    await new Promise(resolve => setTimeout(resolve, 10000));

    console.log('Step 7: Taking final screenshot...');
    await page.screenshot({ path: 'test-screenshots/chat-debug-final.png', fullPage: true });

    const errorBoundaryMessages = consoleMessages.filter(m => 
      m.text.includes('[ErrorBoundary]') || 
      m.text.includes('Error message:') ||
      m.text.toLowerCase().includes('error')
    );

    console.log('\n=== ERROR MESSAGES ===');
    errorBoundaryMessages.forEach(msg => {
      console.log('[' + msg.type + '] ' + msg.text);
    });

    fs.writeFileSync(
      'CHAT_ERROR_DEBUG.json',
      JSON.stringify({
        url: currentUrl,
        allConsoleMessages: consoleMessages,
        errorBoundaryMessages,
        timestamp: new Date().toISOString()
      }, null, 2)
    );

    console.log('\nTotal messages: ' + consoleMessages.length);
    console.log('Error messages: ' + errorBoundaryMessages.length);

  } catch (error) {
    console.error('Test failed:', error.message);
    await page.screenshot({ path: 'test-screenshots/chat-debug-error.png', fullPage: true });
  } finally {
    console.log('\nClosing in 5 seconds...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    await browser.close();
  }
})();
