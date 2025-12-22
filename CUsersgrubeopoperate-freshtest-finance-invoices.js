const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  
  // Set up console and error listeners first
  const consoleLogs = [];
  page.on('console', msg => {
    consoleLogs.push({ type: msg.type(), text: msg.text() });
  });
  
  const errors = [];
  page.on('pageerror', error => {
    errors.push(error.message);
  });
  
  try {
    console.log('Step 1: Navigating to login page...');
    await page.goto('https://operate.guru/login', { 
      waitUntil: 'domcontentloaded', 
      timeout: 60000 
    });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'test-screenshots/finance-invoice-01-login.png', fullPage: true });
    console.log('Screenshot saved: finance-invoice-01-login.png');
    console.log('Login page URL:', page.url());
    
    console.log('Step 2: Entering credentials...');
    await page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 10000 });
    await page.type('input[type="email"], input[name="email"]', 'test@example.com', { delay: 100 });
    await page.type('input[type="password"], input[name="password"]', 'testpassword123', { delay: 100 });
    await page.screenshot({ path: 'test-screenshots/finance-invoice-02-credentials.png', fullPage: true });
    console.log('Screenshot saved: finance-invoice-02-credentials.png');
    
    console.log('Step 3: Clicking login button...');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'test-screenshots/finance-invoice-03-after-login.png', fullPage: true });
    console.log('Screenshot saved: finance-invoice-03-after-login.png');
    console.log('After login URL:', page.url());
    
    console.log('Step 4: Navigating to /finance/invoices...');
    await page.goto('https://operate.guru/finance/invoices', { 
      waitUntil: 'domcontentloaded', 
      timeout: 60000 
    });
    await page.waitForTimeout(4000);
    
    await page.screenshot({ path: 'test-screenshots/finance-invoice-04-invoices-page.png', fullPage: true });
    console.log('Screenshot saved: finance-invoice-04-invoices-page.png');
    console.log('Invoices page URL:', page.url());
    
    console.log('Step 5: Checking page state...');
    const pageInfo = await page.evaluate(() => {
      const errorEl = document.querySelector('.error, [role="alert"]');
      return {
        title: document.title,
        hasErrors: errorEl !== null,
        hasTable: document.querySelector('table') !== null,
        hasInvoiceData: document.querySelectorAll('table tbody tr').length,
        errorText: errorEl ? errorEl.innerText : 'None',
        bodyText: document.body.innerText.substring(0, 800)
      };
    });
    
    console.log('\n=== PAGE INFO ===');
    console.log('Title:', pageInfo.title);
    console.log('Has Errors:', pageInfo.hasErrors);
    console.log('Error Text:', pageInfo.errorText);
    console.log('Has Table:', pageInfo.hasTable);
    console.log('Invoice Rows:', pageInfo.hasInvoiceData);
    console.log('Body Preview:', pageInfo.bodyText);
    
    console.log('\n=== CONSOLE LOGS (Last 20) ===');
    consoleLogs.slice(-20).forEach(log => {
      console.log('[' + log.type + ']', log.text);
    });
    
    console.log('\n=== ERRORS ===');
    if (errors.length > 0) {
      errors.forEach(err => console.log('ERROR:', err));
    } else {
      console.log('No page errors detected');
    }
    
  } catch (error) {
    console.log('\n=== TEST ERROR ===');
    console.log(error.message);
    await page.screenshot({ path: 'test-screenshots/finance-invoice-error.png', fullPage: true });
  }
  
  await browser.close();
  console.log('\n=== TEST COMPLETE ===');
})();
