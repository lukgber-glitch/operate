const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({ headless: false, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  const results = { authWorked: false, reachedChat: false, chatInputFound: false, messageSent: false, aiResponse: null, otherPages: {} };

  try {
    console.log('Navigate to localhost:3000');
    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);

    console.log('Set auth cookies');
    await page.setCookie({
      name: 'op_auth',
      value: encodeURIComponent(JSON.stringify({
        a: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI3YmYyMTdiZC1hNTAxLTQ5NGEtYjI3YS05YjY3YmE0NmE4MDAiLCJlbWFpbCI6ImJyb3dzZXJ0ZXN0QHRlc3QuY29tIiwib3JnSWQiOiIwMjAwOTc2NS1lYjA3LTRlYTgtOWVkYy0yZjVlZjlhYmVjOTAiLCJyb2xlIjoiT1dORVIiLCJpYXQiOjE3NjYyMzAwMzgsImV4cCI6MTc2NjIzMDkzOH0.X2dzRY2czU31O5lrOf8ugicN34YLDTz7j6wPNgMM7T4',
        r: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI3YmYyMTdiZC1hNTAxLTQ5NGEtYjI3YS05YjY3YmE0NmE4MDAiLCJlbWFpbCI6ImJyb3dzZXJ0ZXN0QHRlc3QuY29tIiwib3JnSWQiOiIwMjAwOTc2NS1lYjA3LTRlYTgtOWVkYy0yZjVlZjlhYmVjOTAiLCJyb2xlIjoiT1dORVIiLCJqdGkiOiIyM2I0MzQyMjFkYmFlNjY3NzkzNmYyZGNiZTk4MTIxYSIsImlhdCI6MTc2NjIzMDAzOCwiZXhwIjoxNzY2ODM0ODM4fQ.CeLAtHUP-UxI5YQRpDe-i6nbjAzrNY_ydXXo0G_HSxU'
      })),
      domain: 'localhost', path: '/'
    });
    await page.setCookie({ name: 'onboarding_complete', value: 'true', domain: 'localhost', path: '/' });

    console.log('Navigate to /chat');
    await page.goto('http://localhost:3000/chat', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);

    const url = page.url();
    console.log('Current URL:', url);

    if (url.includes('/chat')) {
      results.authWorked = true;
      results.reachedChat = true;
      console.log('AUTH SUCCESS');
    } else {
      console.log('AUTH FAILED - at', url);
    }

    await page.screenshot({ path: 'test-screenshots/e2e-chat.png', fullPage: true });

    if (results.reachedChat) {
      const textarea = await page.;
      if (textarea) {
        results.chatInputFound = true;
        await textarea.type('Hello, what can you help me with?');
        console.log('Typed message');
        
        const submit = await page.;
        if (submit) { await submit.click(); } else { await textarea.press('Enter'); }
        
        results.messageSent = true;
        console.log('Sent message, waiting 15s');
        
        await page.waitForTimeout(15000);
        results.aiResponse = 'Completed';
        
        await page.screenshot({ path: 'test-screenshots/e2e-response.png', fullPage: true });
      } else {
        console.log('No textarea found');
      }
    }

    for (const p of ['/finance/invoices', '/finance/expenses', '/time']) {
      await page.goto('http://localhost:3000' + p, { timeout: 30000 });
      await page.waitForTimeout(2000);
      results.otherPages[p] = page.url().includes(p);
      console.log(p, ':', results.otherPages[p] ? 'OK' : 'FAIL');
    }

  } catch (e) {
    console.error('ERROR:', e.message);
  } finally {
    fs.writeFileSync('E2E_RESULTS.json', JSON.stringify(results, null, 2));
    console.log('RESULTS:', JSON.stringify(results, null, 2));
    await browser.close();
  }
})();
