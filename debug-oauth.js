const puppeteer = require('puppeteer');
const fs = require('fs');

async function debugOAuthCookies() {
  console.log('Starting OAuth Cookie Debug...');
  
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1400, height: 900 }
  });

  const page = await browser.newPage();
  const results = {
    timestamp: new Date().toISOString(),
    steps: [],
    networkLog: [],
    findings: []
  };

  const client = await page.target().createCDPSession();
  await client.send('Network.enable');
  
  client.on('Network.responseReceived', async ({ response }) => {
    const entry = {
      url: response.url,
      status: response.status,
      setCookie: response.headers['set-cookie'] || 'NONE'
    };
    results.networkLog.push(entry);
    
    if (response.url.includes('/auth/')) {
      console.log('AUTH RESPONSE:', response.url);
      console.log('Set-Cookie:', response.headers['set-cookie'] || 'NOT SET');
      console.log('Location:', response.headers['location'] || 'NOT SET');
    }
  });

  client.on('Network.requestWillBeSent', ({ request }) => {
    if (request.url.includes('/dashboard') || request.url.includes('/auth/callback')) {
      console.log('CRITICAL REQUEST:', request.url);
      console.log('Cookies:', request.headers['Cookie'] || 'NONE');
    }
  });

  try {
    console.log('Navigating to login page...');
    await page.goto('https://operate.guru/login', { waitUntil: 'networkidle2' });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'test-screenshots/debug-01-login.png' });
    
    let cookies = await page.cookies();
    console.log('Cookies after login:', cookies.map(c => c.name));

    console.log('Looking for Google button...');
    const buttons = await page.$$('button, a');
    let googleButton = null;
    for (const btn of buttons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text && text.toLowerCase().includes('google')) {
        googleButton = btn;
        break;
      }
    }
    
    if (!googleButton) throw new Error('No Google button found');

    await googleButton.click();
    console.log('Clicked Google button');

    await page.waitForNavigation({ timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'test-screenshots/debug-03-google.png' });

    console.log('Entering credentials...');
    await page.waitForSelector('input[type="email"]', { timeout: 5000 });
    await page.type('input[type="email"]', 'luk.gber@gmail.com');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(3000);

    const passwordField = await page.$('input[type="password"]');
    if (passwordField) {
      await page.type('input[type="password"]', 'schlagzeug');
      await page.keyboard.press('Enter');
    }
    
    console.log('Waiting for OAuth callback...');
    await page.waitForNavigation({ timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(5000);
    await page.screenshot({ path: 'test-screenshots/debug-04-after-oauth.png' });
    
    cookies = await page.cookies();
    console.log('=== COOKIES AFTER OAUTH ===');
    cookies.forEach(c => {
      console.log(`${c.name}: domain=${c.domain}, httpOnly=${c.httpOnly}, secure=${c.secure}`);
    });

    const opAuthCookie = cookies.find(c => c.name === 'op_auth');
    if (opAuthCookie) {
      console.log('✓ op_auth cookie FOUND');
      results.findings.push('op_auth cookie IS present');
    } else {
      console.log('✗ op_auth cookie NOT FOUND');
      results.findings.push('op_auth cookie MISSING');
    }

    await page.waitForTimeout(5000);
    const finalUrl = page.url();
    console.log('Final URL:', finalUrl);
    await page.screenshot({ path: 'test-screenshots/debug-05-final.png' });

    if (finalUrl.includes('/login')) {
      results.findings.push('Redirected to /login - AUTH FAILED');
    } else if (finalUrl.includes('/dashboard')) {
      results.findings.push('Reached /dashboard - AUTH SUCCESS');
    } else if (finalUrl.includes('/onboarding')) {
      results.findings.push('Reached /onboarding - AUTH SUCCESS');
    }

  } catch (error) {
    console.error('Error:', error);
    results.findings.push('ERROR: ' + error.message);
    await page.screenshot({ path: 'test-screenshots/debug-error.png' });
  }

  fs.writeFileSync('OAUTH_COOKIE_DEBUG.json', JSON.stringify(results, null, 2));
  console.log('Results saved to OAUTH_COOKIE_DEBUG.json');
  
  await browser.close();
}

debugOAuthCookies().catch(console.error);
