const puppeteer = require('puppeteer');
const fs = require('fs');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function test() {
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  const logs = [];
  const errors = [];

  page.on('console', msg => logs.push(msg.text()));
  page.on('pageerror', err => errors.push(err.message));

  try {
    console.log('\n1. Navigate to login page');
    await page.goto('https://operate.guru/login', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await sleep(3000);
    await page.screenshot({ path: 'test-screenshots/final-01.png', fullPage: true });

    console.log('2. Fill email');
    await page.waitForSelector('input[type="email"]', { visible: true });
    await page.type('input[type="email"]', 'test@operate.guru');

    console.log('3. Fill password');
    await page.type('input[type="password"]', 'TestPassword123!');
    await page.screenshot({ path: 'test-screenshots/final-02.png', fullPage: true });

    console.log('4. Click Sign in');
    await page.click('button[type="submit"]');
    await sleep(8000);
    console.log('   URL after login:', page.url());
    await page.screenshot({ path: 'test-screenshots/final-03.png', fullPage: true });

    console.log('5. Navigate to /chat');
    await page.goto('https://operate.guru/chat', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await sleep(10000);
    console.log('   Final URL:', page.url());
    await page.screenshot({ path: 'test-screenshots/final-04-chat.png', fullPage: true });

    console.log('6. Analyze page');
    const result = await page.evaluate(() => {
      const text = document.body.innerText;
      const h1 = document.querySelector('h1');
      const h2 = document.querySelector('h2');
      const input = document.querySelector('textarea') || document.querySelector('input[type="text"]');
      const buttons = document.querySelectorAll('button');
      
      return {
        url: window.location.href,
        title: document.title,
        hasErrorMsg: text.includes('Something went wrong') || text.includes('Error'),
        greeting: h1 ? h1.innerText : (h2 ? h2.innerText : null),
        hasInput: !!input,
        inputPlaceholder: input ? input.placeholder : null,
        buttonCount: buttons.length,
        buttonTexts: Array.from(buttons).slice(0, 8).map(b => b.innerText),
        bodyText: text.substring(0, 800)
      };
    });

    console.log('\n========== RESULTS ==========');
    console.log('Final URL:', result.url);
    console.log('Page Title:', result.title);
    console.log('Has Error Message:', result.hasErrorMsg ? 'YES' : 'NO');
    console.log('Greeting:', result.greeting || 'NONE');
    console.log('Has Message Input:', result.hasInput ? 'YES' : 'NO');
    console.log('Input Placeholder:', result.inputPlaceholder || 'NONE');
    console.log('Button Count:', result.buttonCount);
    console.log('Button Texts:', result.buttonTexts);
    console.log('\n--- Visible Text (first 800 chars) ---');
    console.log(result.bodyText);
    console.log('\n--- Console Logs ---');
    logs.forEach(l => console.log(l));
    console.log('\n--- JavaScript Errors ---');
    if (errors.length === 0) {
      console.log('No errors');
    } else {
      errors.forEach(e => console.log(e));
    }

    const report = {
      timestamp: new Date().toISOString(),
      finalUrl: result.url,
      chatInterfacePresent: result.hasInput && result.greeting,
      errorMessagePresent: result.hasErrorMsg,
      consoleErrors: errors,
      analysis: result,
      consoleLogs: logs
    };

    fs.writeFileSync('FINAL_CHAT_TEST_RESULTS.json', JSON.stringify(report, null, 2));
    console.log('\n========== Test Complete ==========');

  } catch (err) {
    console.error('\nTEST FAILED:', err.message);
    console.error(err.stack);
    await page.screenshot({ path: 'test-screenshots/final-error.png', fullPage: true });
  }

  await browser.close();
}

test();
