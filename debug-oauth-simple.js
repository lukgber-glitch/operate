const puppeteer = require('puppeteer');
const fs = require('fs');

async function debug() {
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox'],
    defaultViewport: { width: 1400, height: 900 }
  });

  const page = await browser.newPage();
  const findings = [];
  
  // Monitor network
  page.on('response', async response => {
    const url = response.url();
    if (url.includes('/auth/') || url.includes('/api/v1/auth/')) {
      const headers = response.headers();
      console.log('\n=== AUTH RESPONSE ===');
      console.log('URL:', url);
      console.log('Status:', response.status());
      console.log('Set-Cookie:', headers['set-cookie'] || 'NOT SET');
      console.log('Location:', headers['location'] || 'NOT SET');
      findings.push({
        url,
        status: response.status(),
        setCookie: headers['set-cookie'] || 'NOT SET',
        location: headers['location'] || 'NOT SET'
      });
    }
  });

  page.on('request', request => {
    const url = request.url();
    if (url.includes('/dashboard') || url.includes('/auth/callback')) {
      const cookies = request.headers()['cookie'] || 'NONE';
      console.log('\n=== CRITICAL REQUEST ===');
      console.log('URL:', url);
      console.log('Cookies:', cookies);
      findings.push({ request: url, cookies });
    }
  });

  try {
    console.log('Loading login page...');
    await page.goto('https://operate.guru/login', { 
      waitUntil: 'domcontentloaded',
      timeout: 60000 
    });
    await page.waitForTimeout(3000);
    
    let cookies = await page.cookies();
    console.log('Initial cookies:', cookies.map(c => c.name));
    findings.push({ step: 'initial', cookies: cookies.map(c => c.name) });

    console.log('Page loaded. Waiting for manual OAuth flow...');
    console.log('Please complete OAuth login manually in the browser...');
    
    // Wait 60 seconds for manual login
    await page.waitForTimeout(60000);
    
    cookies = await page.cookies();
    console.log('\n=== FINAL COOKIES ===');
    cookies.forEach(c => {
      console.log(`${c.name}:`);
      console.log(`  domain: ${c.domain}`);
      console.log(`  httpOnly: ${c.httpOnly}`);
      console.log(`  secure: ${c.secure}`);
      console.log(`  sameSite: ${c.sameSite}`);
    });

    const opAuth = cookies.find(c => c.name === 'op_auth');
    if (opAuth) {
      console.log('\n✓ op_auth cookie FOUND');
      findings.push({ result: 'op_auth cookie FOUND', cookie: opAuth });
    } else {
      console.log('\n✗ op_auth cookie NOT FOUND');
      findings.push({ result: 'op_auth cookie MISSING' });
    }

    console.log('Final URL:', page.url());
    findings.push({ finalUrl: page.url() });

  } catch (error) {
    console.error('Error:', error.message);
    findings.push({ error: error.message });
  }

  fs.writeFileSync('oauth-debug-findings.json', JSON.stringify(findings, null, 2));
  console.log('\nSaved to oauth-debug-findings.json');
  
  console.log('\nPress Ctrl+C to close browser...');
  await new Promise(() => {}); // Keep browser open
}

debug().catch(console.error);
