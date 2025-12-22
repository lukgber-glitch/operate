const puppeteer = require('puppeteer');
const fs = require('fs');

async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

(async () => {
  console.log('GOOGLE OAUTH FLOW TEST - operate.guru');
  console.log('');

  const results = {
    timestamp: new Date().toISOString(),
    steps: [],
    console_logs: [],
    network_logs: [],
    errors: []
  };

  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--window-size=1920,1080']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    page.on('console', msg => {
      const text = msg.text();
      results.console_logs.push(text);
      if (text.includes('[Auth Callback]')) {
        console.log('[CONSOLE]', text);
      }
    });

    page.on('response', async response => {
      const url = response.url();
      if (url.includes('auth') || url.includes('exchange')) {
        const log = response.status() + ' ' + url;
        results.network_logs.push(log);
        console.log('[NETWORK]', log);
      }
    });

    page.on('pageerror', error => {
      results.errors.push(error.toString());
    });

    console.log('Step 1: Clearing cookies...');
    await page.goto('https://operate.guru');
    const cookies = await page.cookies();
    if (cookies.length > 0) {
      await page.deleteCookie(...cookies);
    }

    console.log('Step 2: Loading login page...');
    await page.goto('https://operate.guru/login', { waitUntil: 'networkidle0' });
    await wait(2000);
    await page.screenshot({ path: 'test-screenshots/oauth-1-login.png', fullPage: true });

    console.log('Step 3: Finding Google button...');
    const buttons = await page.$$('button');
    let googleButton = null;
    for (const btn of buttons) {
      const text = await page.evaluate(el => el.textContent || '', btn);
      if (text.toLowerCase().includes('google')) {
        googleButton = btn;
        break;
      }
    }

    console.log('Step 4: Clicking Google button...');
    await googleButton.click();
    await wait(3000);
    await page.screenshot({ path: 'test-screenshots/oauth-2-after-click.png', fullPage: true });

    console.log('Step 5: Monitoring (3 min) - Complete OAuth manually...');
    for (let i = 0; i < 36; i++) {
      await wait(5000);
      const url = page.url();
      
      if (url.includes('/auth/callback')) {
        console.log('CALLBACK DETECTED:', url);
        await page.screenshot({ path: 'test-screenshots/oauth-callback-' + i + '.png', fullPage: true });
        
        const bodyText = await page.evaluate(() => document.body.innerText || '');
        console.log('Content length:', bodyText.trim().length);
        
        if (bodyText.trim().length < 50) {
          console.log('BLANK PAGE!');
          results.steps.push({ blank_page: true, url: url });
        }
      }

      if (url.includes('/chat')) {
        console.log('SUCCESS - Reached chat');
        break;
      }
    }



    // TEST FINANCE PAGES AFTER AUTH
    console.log('
Step 6: Testing finance pages...');
    results.financePages = {};
    const financePages = ['/finance', '/finance/invoices', '/finance/expenses', '/finance/transactions', '/finance/banking', '/finance/reports'];
    
    for (const p of financePages) {
      try {
        await page.goto('https://operate.guru' + p, { waitUntil: 'networkidle0', timeout: 15000 });
        await wait(2000);
        const currentUrl = page.url();
        const loaded = currentUrl.includes(p) || currentUrl === 'https://operate.guru' + p;
        results.financePages[p] = { loaded: loaded, url: currentUrl };
        console.log(p, ':', loaded ? 'OK' : 'REDIRECT', '-', currentUrl);
        const screenshotPath = 'test-screenshots/finance/test-' + p.split('/').join('-') + '.png';
        await page.screenshot({ path: screenshotPath, fullPage: true });
      } catch (err) {
        results.financePages[p] = { error: err.message };
        console.log(p, ':', 'ERROR -', err.message);
      }
    }

  } catch (error) {
    console.error('ERROR:', error.message);
    results.errors.push(error.message);
  } finally {
    fs.writeFileSync('FINANCE_PAGES_OAUTH_TEST_RESULTS.json', JSON.stringify(results, null, 2));
    console.log('Results saved to OAUTH_TEST_RESULTS.json');
    await browser.close();
  }
})();
