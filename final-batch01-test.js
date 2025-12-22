const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  const results = { timestamp: new Date().toISOString(), pages: {} };
  
  const pages = [
    '/login',
    '/register', 
    '/forgot-password',
    '/verify-email',
    '/mfa-setup',
    '/mfa-verify',
    '/auth/error'
  ];
  
  for (let i = 0; i < pages.length; i++) {
    const pagePath = pages[i];
    const name = pagePath.replace('/auth/', '').replace('/', '');
    console.log('Testing:', pagePath);
    
    try {
      await page.goto('https://operate.guru' + pagePath, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(3000);
      
      const data = await page.evaluate(() => ({
        url: window.location.href,
        title: document.title,
        forms: document.querySelectorAll('form').length
      }));
      
      await page.screenshot({ path: 'C:/Users/grube/op/operate-fresh/test-screenshots/batch1-' + String(i+1).padStart(2, '0') + '-' + name + '.png', fullPage: true });
      
      results.pages[name] = { status: 'PASS', ...data };
      console.log('  PASS');
    } catch (err) {
      results.pages[name] = { status: 'FAIL', error: err.message };
      console.log('  FAIL:', err.message);
    }
  }
  
  fs.writeFileSync('C:/Users/grube/op/operate-fresh/BATCH1_AUTH_TEST_RESULTS.json', JSON.stringify(results, null, 2));
  console.log('
Done! Results saved.');
  await browser.close();
})();