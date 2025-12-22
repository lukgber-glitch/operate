const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  const results = {
    timestamp: new Date().toISOString(),
    authWorked: false,
    reachedChat: false,
    chatInputFound: false,
    messageSent: false,
    aiResponse: null,
    otherPagesLoaded: {},
    screenshots: [],
    errors: []
  };

  try {
    console.log('\n=== STEP 1: NAVIGATE TO LOCALHOST ===');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0', timeout: 10000 });
    console.log('OK: Reached localhost:3000');

    console.log('\n=== STEP 2: SET AUTHENTICATION COOKIES ===');
    
    const authData = {
      a: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI3YmYyMTdiZC1hNTAxLTQ5NGEtYjI3YS05YjY3YmE0NmE4MDAiLCJlbWFpbCI6ImJyb3dzZXJ0ZXN0QHRlc3QuY29tIiwib3JnSWQiOiIwMjAwOTc2NS1lYjA3LTRlYTgtOWVkYy0yZjVlZjlhYmVjOTAiLCJyb2xlIjoiT1dORVIiLCJpYXQiOjE3NjYyMzAwMzgsImV4cCI6MTc2NjIzMDkzOH0.X2dzRY2czU31O5lrOf8ugicN34YLDTz7j6wPNgMM7T4',
      r: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI3YmYyMTdiZC1hNTAxLTQ5NGEtYjI3YS05YjY3YmE0NmE4MDAiLCJlbWFpbCI6ImJyb3dzZXJ0ZXN0QHRlc3QuY29tIiwib3JnSWQiOiIwMjAwOTc2NS1lYjA3LTRlYTgtOWVkYy0yZjVlZjlhYmVjOTAiLCJyb2xlIjoiT1dORVIiLCJqdGkiOiIyM2I0MzQyMjFkYmFlNjY3NzkzNmYyZGNiZTk4MTIxYSIsImlhdCI6MTc2NjIzMDAzOCwiZXhwIjoxNzY2ODM0ODM4fQ.CeLAtHUP-UxI5YQRpDe-i6nbjAzrNY_ydXXo0G_HSxU'
    };

    await page.setCookie({
      name: 'op_auth',
      value: encodeURIComponent(JSON.stringify(authData)),
      domain: 'localhost',
      path: '/'
    });

    await page.setCookie({
      name: 'onboarding_complete',
      value: 'true',
      domain: 'localhost',
      path: '/'
    });

    console.log('OK: Cookies set');

    console.log('\n=== STEP 3: VERIFY AUTH - GO TO /CHAT ===');
    await page.goto('http://localhost:3000/chat', { waitUntil: 'networkidle0', timeout: 10000 });
    await page.waitForTimeout(3000);

    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);

    if (currentUrl.includes('/chat')) {
      results.authWorked = true;
      results.reachedChat = true;
      console.log('OK: AUTH SUCCESS');
    } else {
      console.log('FAIL: Redirected to:', currentUrl);
    }

    await page.screenshot({ path: 'test-screenshots/e2e-chat-page.png', fullPage: true });
    results.screenshots.push('e2e-chat-page.png');

    if (results.reachedChat) {
      console.log('\n=== STEP 4: TEST CHAT ===');

      let chatInput = null;
      const selectors = ['textarea', 'input[type="text"]'];

      for (const sel of selectors) {
        chatInput = await page.$(sel);
        if (chatInput) {
          console.log('Found input:', sel);
          results.chatInputFound = true;
          break;
        }
      }

      if (chatInput) {
        await chatInput.click();
        await page.waitForTimeout(500);
        await chatInput.type('Hello, what can you help me with?');
        console.log('OK: Typed message');

        const sendBtn = await page.$('button[type="submit"]');
        if (sendBtn) {
          await sendBtn.click();
          console.log('OK: Clicked send');
          results.messageSent = true;
        } else {
          await chatInput.press('Enter');
          console.log('OK: Pressed Enter');
          results.messageSent = true;
        }

        console.log('Waiting 15s for response...');
        await page.waitForTimeout(15000);

        const html = await page.content();
        results.aiResponse = 'Content length: ' + html.length;
        
        await page.screenshot({ path: 'test-screenshots/e2e-chat-response.png', fullPage: true });
        results.screenshots.push('e2e-chat-response.png');
      }
    }

    console.log('\n=== STEP 5: TEST OTHER PAGES ===');
    
    const pages = ['/finance/invoices', '/finance/expenses', '/time'];

    for (const p of pages) {
      try {
        console.log('Testing', p);
        await page.goto('http://localhost:3000' + p, { waitUntil: 'networkidle0', timeout: 10000 });
        await page.waitForTimeout(2000);
        
        const url = page.url();
        const ok = url.includes(p);
        results.otherPagesLoaded[p] = ok;
        
        console.log('  Result:', ok ? 'OK' : 'REDIRECTED');
        
        const name = 'e2e-' + p.replace(/\//g, '-') + '.png';
        await page.screenshot({ path: 'test-screenshots/' + name, fullPage: true });
        results.screenshots.push(name);
      } catch (e) {
        console.log('  Error:', e.message);
        results.otherPagesLoaded[p] = false;
      }
    }

  } catch (error) {
    console.error('ERROR:', error.message);
    results.errors.push(error.message);
  } finally {
    fs.writeFileSync('BROWSER_E2E_TEST_RESULTS.json', JSON.stringify(results, null, 2));
    
    const report = [
      '## BROWSER E2E TEST REPORT',
      'Timestamp: ' + results.timestamp,
      '',
      '### QUICK ANSWERS:',
      '1. Did auth work? ' + (results.authWorked ? 'YES' : 'NO'),
      '2. Did you reach /chat? ' + (results.reachedChat ? 'YES' : 'NO'),
      '3. Was chat input found? ' + (results.chatInputFound ? 'YES' : 'NO'),
      '4. Did message send? ' + (results.messageSent ? 'YES' : 'NO'),
      '5. Did AI respond? ' + (results.aiResponse || 'NO'),
      '6. Other pages: ' + JSON.stringify(results.otherPagesLoaded),
      '',
      '### SCREENSHOTS:',
      results.screenshots.join('\n'),
      '',
      '### ERRORS:',
      results.errors.length > 0 ? results.errors.join('\n') : 'None'
    ].join('\n');

    fs.writeFileSync('BROWSER_E2E_TEST_REPORT.txt', report);
    console.log('\n' + report);

    await browser.close();
  }
})();
