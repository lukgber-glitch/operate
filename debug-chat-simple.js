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
    consoleMessages.push({ type, text });
    console.log('[' + type + '] ' + text);
  });

  page.on('pageerror', error => {
    consoleMessages.push({ type: 'pageerror', text: error.toString() });
    console.log('[ERROR] ' + error.toString());
  });

  try {
    console.log('Navigating to login...');
    await page.goto('https://operate.guru/login', { 
      waitUntil: 'domcontentloaded', 
      timeout: 60000 
    });
    
    console.log('Waiting 5 seconds...');
    await new Promise(r => setTimeout(r, 5000));
    
    await page.screenshot({ path: 'test-screenshots/login-page.png' });
    
    console.log('Looking for email field...');
    const emailField = await page.$('input[type="email"]');
    if (emailField) {
      console.log('Found email field, typing...');
      await page.type('input[type="email"]', 'luk.gber@gmail.com', { delay: 100 });
      
      console.log('Looking for password field...');
      await page.type('input[type="password"]', 'Schlagzeug1@', { delay: 100 });
      
      console.log('Clicking submit...');
      await page.click('button[type="submit"]');
      
      console.log('Waiting for navigation...');
      await page.waitForNavigation({ timeout: 60000, waitUntil: 'domcontentloaded' });
      
      console.log('Current URL: ' + page.url());
      
      console.log('Waiting 15 seconds for chat to load...');
      await new Promise(r => setTimeout(r, 15000));
      
      await page.screenshot({ path: 'test-screenshots/chat-page.png', fullPage: true });
      
      const errors = consoleMessages.filter(m => 
        m.text.includes('ErrorBoundary') || 
        m.text.includes('Error') ||
        m.type === 'error' ||
        m.type === 'pageerror'
      );
      
      console.log('\n=== ERRORS FOUND ===');
      errors.forEach(e => console.log(e.type + ': ' + e.text));
      
      fs.writeFileSync('CHAT_ERROR_DEBUG.json', JSON.stringify({
        url: page.url(),
        errors,
        allMessages: consoleMessages
      }, null, 2));
    } else {
      console.log('Email field not found!');
    }
    
  } catch (error) {
    console.error('Failed:', error.message);
    await page.screenshot({ path: 'test-screenshots/error.png' });
  } finally {
    console.log('\nWaiting 5 seconds before closing...');
    await new Promise(r => setTimeout(r, 5000));
    await browser.close();
  }
})();
