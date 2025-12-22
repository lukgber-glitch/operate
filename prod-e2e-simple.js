const puppeteer = require('puppeteer');
const fs = require('fs');

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function runTest() {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  const results = {
    authWorked: false,
    reachedChat: false,
    chatInputFound: false,
    messageSent: false,
    aiResponse: null,
    otherPages: {}
  };

  try {
    console.log('Step 1: Navigate to login page');
    await page.goto('https://operate.guru', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await wait(2000);

    console.log('Step 2: Login');
    const credentials = { email: "browsertest@test.com", password: "TestPassword123!" };

    
    

    console.log('Step 3: Submit login');
    await page.goto('https://operate.guru/chat', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await wait(3000);

    const url = page.url();
    console.log('Current URL:', url);

    if (url.includes('/chat')) {
      results.authWorked = true;
      results.reachedChat = true;
      console.log('AUTH SUCCESS!');
    } else {
      console.log('AUTH FAILED - redirected to:', url);
    }

    await page.screenshot({ path: 'test-screenshots/production-e2e/prod-e2e-chat.png', fullPage: true });

    if (results.reachedChat) {
      console.log('Step 4: Test chat');
      await wait(2000);
      const textarea = await page.$('textarea');
      if (textarea) {
        results.chatInputFound = true;
        await textarea.type('Hello, what can you help me with?');
        console.log('Typed message');
        
        const submitBtn = await page.$('button[type="submit"]');
        if (submitBtn) {
          await submitBtn.click();
        } else {
          await textarea.press('Enter');
        }
        
        results.messageSent = true;
        console.log('Sent message - waiting 15s');
        
        await wait(15000);
        results.aiResponse = 'Completed wait';
        
        await page.screenshot({ path: 'test-screenshots/production-e2e/prod-e2e-response.png', fullPage: true });
      } else {
        console.log('No chat input found');
      }
    }

    console.log('Step 5: Test other pages');
    for (const p of ['/finance/invoices', '/finance/expenses', '/time']) {
      await page.goto('https://operate.guru' + p, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await wait(2000);
      const loaded = page.url().includes(p);
      results.otherPages[p] = loaded;
      console.log(p, ':', loaded ? 'OK' : 'FAIL');
    }

  } catch (e) {
    console.error('ERROR:', e.message);
  } finally {
    fs.writeFileSync('PRODUCTION_E2E_RESULTS.json', JSON.stringify(results, null, 2));
    
    console.log('\n=== RESULTS ===');
    console.log('1. Auth worked?', results.authWorked ? 'YES' : 'NO');
    console.log('2. Reached chat?', results.reachedChat ? 'YES' : 'NO');
    console.log('3. Input found?', results.chatInputFound ? 'YES' : 'NO');
    console.log('4. Message sent?', results.messageSent ? 'YES' : 'NO');
    console.log('5. AI response?', results.aiResponse || 'NO');
    console.log('6. Other pages:', JSON.stringify(results.otherPages));
    
    await browser.close();
  }
}

runTest();

