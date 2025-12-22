const puppeteer = require('puppeteer');
const fs = require('fs');

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  const results = { timestamp: new Date().toISOString(), loginSuccess: false, pages: {} };
  
  console.log('Opening https://operate.guru/login');
  console.log('PLEASE LOG IN MANUALLY - waiting 90 seconds...');
  
  try {
    await page.goto('https://operate.guru/login', { waitUntil: 'domcontentloaded', timeout: 60000 });
  } catch (err) {
    console.log('Page load error:', err.message);
  }
  
  const start = Date.now();
  let loggedIn = false;
  
  while (Date.now() - start < 90000) {
    await delay(2000);
    const url = page.url();
    
    if (url.includes('operate.guru') && !url.includes('/login') && !url.includes('google')) {
      loggedIn = true;
      console.log('Login detected at:', url);
      break;
    }
  }
  
  if (!loggedIn) {
    console.log('Login timeout');
    await browser.close();
    fs.writeFileSync('SETTINGS_UI_TEST_RESULTS.json', JSON.stringify(results, null, 2));
    return;
  }
  
  results.loginSuccess = true;
  console.log('');
  
  const pages = [
    ['/settings', 'Settings'],
    ['/settings/profile', 'Profile'],
    ['/settings/company', 'Company'],
    ['/settings/billing', 'Billing'],
    ['/settings/integrations', 'Integrations'],
    ['/clients', 'Clients'],
    ['/vendors', 'Vendors'],
    ['/documents', 'Documents'],
    ['/tax', 'Tax']
  ];
  
  for (const [path, name] of pages) {
    console.log('Testing: ' + name + ' (' + path + ')');
    
    try {
      const res = await page.goto('https://operate.guru' + path, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await delay(2000);
      
      const data = await page.evaluate(() => ({
        url: location.href,
        title: document.title,
        bodyLen: document.body.innerText.length
      }));
      
      const ok = res.status() === 200 && data.bodyLen > 100;
      results.pages[name] = { path, status: ok ? 'PASS' : 'FAIL', httpStatus: res.status(), ...data };
      console.log('  ' + (ok ? 'PASS' : 'FAIL') + ' - HTTP ' + res.status() + ', ' + data.bodyLen + ' chars');
    } catch (err) {
      results.pages[name] = { path, status: 'FAIL', error: err.message };
      console.log('  FAIL - ' + err.message);
    }
  }
  
  fs.writeFileSync('SETTINGS_UI_TEST_RESULTS.json', JSON.stringify(results, null, 2));
  
  console.log('');
  console.log('='.repeat(70));
  console.log('RESULTS SUMMARY');
  console.log('='.repeat(70));
  
  const all = Object.values(results.pages);
  const passed = all.filter(p => p.status === 'PASS');
  const failed = all.filter(p => p.status === 'FAIL');
  
  console.log('Total: ' + all.length + ' | Passed: ' + passed.length + ' | Failed: ' + failed.length);
  console.log('');
  
  all.forEach(p => {
    console.log((p.status === 'PASS' ? '[PASS]' : '[FAIL]') + ' ' + p.path);
  });
  
  if (failed.length > 0) {
    console.log('');
    console.log('Failed pages:');
    failed.forEach(p => {
      console.log('  ' + p.path + ': ' + (p.error || 'See details in JSON'));
    });
  }
  
  console.log('');
  console.log('Saved to: SETTINGS_UI_TEST_RESULTS.json');
  console.log('='.repeat(70));
  
  await browser.close();
})();
