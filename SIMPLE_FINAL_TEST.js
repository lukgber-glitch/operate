const puppeteer = require('puppeteer');
const fs = require('fs');

async function test() {
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  const logs = [];
  const errors = [];

  page.on('console', msg => logs.push('[CONSOLE] ' + msg.text()));
  page.on('pageerror', err => errors.push('[ERROR] ' + err.message));

  try {
    console.log('1. Going to login page...');
    await page.goto('https://operate.guru/login', { 
      waitUntil: 'domcontentloaded', 
      timeout: 60000 
    });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'test-screenshots/simple-01-login.png', fullPage: true });
    console.log('   Screenshot saved');

    console.log('2. Filling email...');
    await page.waitForSelector('input[type="email"]', { visible: true, timeout: 10000 });
    await page.type('input[type="email"]', 'test@operate.guru');

    console.log('3. Filling password...');
    await page.type('input[type="password"]', 'TestPassword123!');
    await page.screenshot({ path: 'test-screenshots/simple-02-filled.png', fullPage: true });

    console.log('4. Clicking submit...');
    await page.click('button[type="submit"]');

    console.log('5. Waiting for navigation...');
    await page.waitForTimeout(10000);
    const afterLogin = page.url();
    console.log('   URL after login:', afterLogin);
    await page.screenshot({ path: 'test-screenshots/simple-03-after-login.png', fullPage: true });

    console.log('6. Going to chat page...');
    await page.goto('https://operate.guru/chat', { 
      waitUntil: 'domcontentloaded', 
      timeout: 60000 
    });
    await page.waitForTimeout(12000);
    const chatUrl = page.url();
    console.log('   Final URL:', chatUrl);
    await page.screenshot({ path: 'test-screenshots/simple-04-chat.png', fullPage: true });

    console.log('7. Analyzing page...');
    const analysis = await page.evaluate(() => {
      const bodyText = document.body.innerText;
      return {
        url: window.location.href,
        title: document.title,
        hasError: bodyText.includes('Something went wrong') || bodyText.includes('Error'),
        hasGreeting: !!document.querySelector('h1, h2'),
        hasInput: !!document.querySelector('textarea, input[type="text"]'),
        buttons: Array.from(document.querySelectorAll('button')).length,
        visibleText: bodyText.substring(0, 500)
      };
    });

    console.log('\n=== FINAL RESULTS ===');
    console.log('URL:', analysis.url);
    console.log('Title:', analysis.title);
    console.log('Has Error:', analysis.hasError);
    console.log('Has Greeting:', analysis.hasGreeting);
    console.log('Has Input:', analysis.hasInput);
    console.log('Buttons:', analysis.buttons);
    console.log('\nVisible Text:');
    console.log(analysis.visibleText);
    console.log('\nConsole Logs:', logs.length);
    logs.forEach(l => console.log(l));
    console.log('\nErrors:', errors.length);
    errors.forEach(e => console.log(e));

    fs.writeFileSync('SIMPLE_TEST_RESULTS.json', JSON.stringify({
      analysis,
      logs,
      errors,
      timestamp: new Date().toISOString()
    }, null, 2));

    console.log('\n--- Test Complete ---');

  } catch (err) {
    console.error('TEST FAILED:', err.message);
    await page.screenshot({ path: 'test-screenshots/simple-error.png', fullPage: true });
  }

  await browser.close();
}

test();
