const puppeteer = require('puppeteer');
const fs = require('fs');

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function test() {
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--start-maximized']
  });

  const page = await browser.newPage();
  const logs = [];
  const errors = [];
  
  page.on('console', msg => {
    const text = msg.text();
    logs.push({ type: msg.type(), text });
    if (msg.type() === 'error') {
      console.log('[CONSOLE ERROR]', text);
    }
  });
  
  page.on('pageerror', error => {
    errors.push(error.message);
    console.log('[PAGE ERROR]', error.message);
  });

  try {
    console.log('\n=== STEP 1: Navigate to login ===');
    await page.goto('https://operate.guru/login', { 
      waitUntil: 'domcontentloaded',
      timeout: 30000 
    });
    await delay(3000);
    await page.screenshot({ path: 'test-screenshots/e2e-01-login.png', fullPage: true });
    console.log('Screenshot saved: login page');

    console.log('\n=== STEP 2: Enter credentials ===');
    const emailInput = await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    await emailInput.type('test@operate.guru');
    
    const passwordInput = await page.$('input[type="password"]');
    await passwordInput.type('TestPassword123!');
    
    await page.screenshot({ path: 'test-screenshots/e2e-02-filled.png', fullPage: true });
    console.log('Screenshot saved: credentials filled');

    console.log('\n=== STEP 3: Click login ===');
    const submitButton = await page.$('button[type="submit"]');
    await submitButton.click();
    await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 15000 });
    
    const afterLoginUrl = page.url();
    console.log('After login URL:', afterLoginUrl);
    await delay(2000);
    await page.screenshot({ path: 'test-screenshots/e2e-03-after-login.png', fullPage: true });
    console.log('Screenshot saved: after login');

    console.log('\n=== STEP 4: Navigate to chat ===');
    await page.goto('https://operate.guru/chat', { 
      waitUntil: 'domcontentloaded',
      timeout: 30000 
    });
    await delay(4000);
    
    const chatUrl = page.url();
    console.log('Chat URL:', chatUrl);
    await page.screenshot({ path: 'test-screenshots/e2e-04-chat.png', fullPage: true });
    console.log('Screenshot saved: chat page');

    console.log('\n=== STEP 5: Check for errors ===');
    const errorCheck = await page.evaluate(() => {
      const bodyText = document.body.innerText;
      const hasErrorText = bodyText.includes('Something went wrong');
      const hasErrorBoundary = document.querySelector('[role="alert"]') !== null;
      return {
        hasSomethingWentWrong: hasErrorText,
        hasErrorBoundary: hasErrorBoundary,
        bodySnippet: bodyText.substring(0, 300)
      };
    });
    
    console.log('Error boundary check:', JSON.stringify(errorCheck, null, 2));

    console.log('\n=== STEP 6: Check chat elements ===');
    const chatElements = await page.evaluate(() => {
      const hasChatInput = document.querySelector('textarea') !== null;
      const hasMessages = document.querySelector('[role="log"]') !== null;
      const hasSidebar = document.querySelector('aside') !== null;
      return {
        hasChatInput: hasChatInput,
        hasMessages: hasMessages,
        hasSidebar: hasSidebar,
        title: document.title
      };
    });
    
    console.log('Chat elements:', JSON.stringify(chatElements, null, 2));
    
    await delay(2000);
    await page.screenshot({ path: 'test-screenshots/e2e-05-final.png', fullPage: true });
    console.log('Screenshot saved: final state');

    console.log('\n=== TEST SUMMARY ===');
    const loginSuccessful = afterLoginUrl.includes('/login') === false;
    const chatLoaded = chatUrl.includes('/chat');
    const hasErrors = errorCheck.hasSomethingWentWrong || errorCheck.hasErrorBoundary;
    
    console.log('Login successful:', loginSuccessful);
    console.log('Chat page loaded:', chatLoaded);
    console.log('Has error boundary:', hasErrors);
    console.log('Has chat input:', chatElements.hasChatInput);
    console.log('JavaScript errors found:', errors.length);
    
    if (errors.length > 0) {
      console.log('\n=== JAVASCRIPT ERRORS ===');
      errors.forEach((err, i) => {
        const num = i + 1;
        console.log(num + '. ' + err);
      });
    }
    
    const filterErrors = logs.filter(log => {
      return log.text.includes('.filter is not a function') || 
             log.text.includes('is not a function') ||
             log.type === 'error';
    });
    
    if (filterErrors.length > 0) {
      console.log('\n=== FUNCTION ERRORS ===');
      filterErrors.forEach(log => {
        console.log('[' + log.type + '] ' + log.text);
      });
    }

    console.log('\nKeeping browser open for 10 seconds...');
    await delay(10000);

  } catch (error) {
    console.error('\n[FATAL ERROR]', error.message);
    console.error('Stack:', error.stack);
    await page.screenshot({ path: 'test-screenshots/e2e-error.png', fullPage: true });
  } finally {
    await browser.close();
    console.log('\nBrowser closed');
  }
}

test().catch(console.error);
