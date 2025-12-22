const puppeteer = require('puppeteer');
const fs = require('fs');

async function runTest() {
  console.log('=== FINAL E2E LOGIN + CHAT TEST ===');
  
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  const results = {
    timestamp: new Date().toISOString(),
    steps: [],
    finalUrl: '',
    chatInterfacePresent: false,
    errorMessages: [],
    consoleErrors: [],
    visibleElements: []
  };

  page.on('console', msg => {
    const text = msg.text();
    console.log('[CONSOLE]', text);
    if (msg.type() === 'error') {
      results.consoleErrors.push(text);
    }
  });

  page.on('pageerror', error => {
    console.log('[ERROR]', error.message);
    results.consoleErrors.push('PageError: ' + error.message);
  });

  try {
    console.log('\nSTEP 1: Navigate to login');
    await page.goto('https://operate.guru/login', { waitUntil: 'networkidle0', timeout: 30000 });
    await page.screenshot({ path: 'test-screenshots/final-01-login.png', fullPage: true });
    results.steps.push({ step: 1, status: 'SUCCESS' });

    console.log('\nSTEP 2: Fill email');
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    await page.type('input[type="email"]', 'test@operate.guru');
    results.steps.push({ step: 2, status: 'SUCCESS' });

    console.log('\nSTEP 3: Fill password');
    await page.type('input[type="password"]', 'TestPassword123!');
    await page.screenshot({ path: 'test-screenshots/final-02-filled.png', fullPage: true });
    results.steps.push({ step: 3, status: 'SUCCESS' });

    console.log('\nSTEP 4: Click Sign in');
    await page.click('button[type="submit"]');
    results.steps.push({ step: 4, status: 'SUCCESS' });

    console.log('\nSTEP 5: Wait 8 seconds');
    await page.waitForTimeout(8000);
    const urlAfterLogin = page.url();
    console.log('URL after login:', urlAfterLogin);
    await page.screenshot({ path: 'test-screenshots/final-03-after-login.png', fullPage: true });
    results.steps.push({ step: 5, status: 'SUCCESS', url: urlAfterLogin });

    console.log('\nSTEP 6: Navigate to chat');
    await page.goto('https://operate.guru/chat', { waitUntil: 'networkidle0', timeout: 30000 });
    results.steps.push({ step: 6, status: 'SUCCESS' });

    console.log('\nSTEP 7: Wait 10 seconds');
    await page.waitForTimeout(10000);
    results.steps.push({ step: 7, status: 'SUCCESS' });

    console.log('\nSTEP 8: Screenshot');
    await page.screenshot({ path: 'test-screenshots/final-04-chat-final.png', fullPage: true });
    results.steps.push({ step: 8, status: 'SUCCESS' });

    console.log('\nSTEP 9: Analysis');
    results.finalUrl = page.url();
    console.log('Final URL:', results.finalUrl);

    const errorCheck = await page.evaluate(() => {
      const errors = [];
      const text = document.body.innerText;
      if (text.includes('Something went wrong!')) errors.push('Error message found');
      if (text.includes('Error')) errors.push('Generic error found');
      return errors;
    });
    results.errorMessages = errorCheck;

    const chatCheck = await page.evaluate(() => {
      return {
        greeting: document.querySelector('h1, h2')?.innerText,
        input: document.querySelector('textarea, input[type="text"]')?.placeholder,
        chips: Array.from(document.querySelectorAll('button')).map(b => b.innerText).slice(0, 5)
      };
    });

    results.chatInterfacePresent = !!(chatCheck.greeting || chatCheck.input);
    console.log('\nCHAT INTERFACE:');
    console.log('Greeting:', chatCheck.greeting || 'NOT FOUND');
    console.log('Input:', chatCheck.input || 'NOT FOUND');
    console.log('Buttons:', chatCheck.chips.length);

    const elements = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('*'))
        .filter(el => {
          const s = window.getComputedStyle(el);
          const r = el.getBoundingClientRect();
          return s.display !== 'none' && r.width > 0 && r.height > 0;
        })
        .map(el => ({
          tag: el.tagName.toLowerCase(),
          text: el.innerText?.substring(0, 100) || ''
        }))
        .filter(el => el.text.trim())
        .slice(0, 30);
    });
    
    results.visibleElements = elements;
    console.log('\nVISIBLE ELEMENTS:', elements.length);
    elements.forEach((el, i) => {
      console.log(i + 1, el.tag, '-', el.text.substring(0, 60));
    });

    console.log('\nCONSOLE ERRORS:', results.consoleErrors.length);
    results.consoleErrors.forEach(e => console.log('-', e));

    console.log('\nERROR MESSAGES:', results.errorMessages.length);
    results.errorMessages.forEach(e => console.log('-', e));

    results.steps.push({ step: 9, status: 'SUCCESS' });

  } catch (error) {
    console.error('\nTEST FAILED:', error.message);
    results.steps.push({ step: 'ERROR', error: error.message });
    await page.screenshot({ path: 'test-screenshots/final-error.png', fullPage: true });
  }

  fs.writeFileSync('FINAL_E2E_TEST_RESULTS.json', JSON.stringify(results, null, 2));
  console.log('\n=== SUMMARY ===');
  console.log('Final URL:', results.finalUrl);
  console.log('Chat Interface:', results.chatInterfacePresent ? 'YES' : 'NO');
  console.log('Errors:', results.errorMessages.length);
  console.log('Console Errors:', results.consoleErrors.length);

  await browser.close();
}

runTest();
