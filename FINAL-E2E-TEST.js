const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--start-maximized'],
    defaultViewport: null
  });

  const page = await browser.newPage();
  
  const results = {
    timestamp: new Date().toISOString(),
    tests: []
  };
  
  console.log('\n=== COMPREHENSIVE E2E TEST ===\n');
  console.log('Credentials: browsertest@test.com / Test123456!\n');
  
  try {
    // Step 1: Go to login
    console.log('Step 1: Loading login page...');
    await page.goto('https://operate.guru/login', { 
      waitUntil: 'domcontentloaded',
      timeout: 30000 
    });
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('  ✓ Login page loaded');
    
    // Step 2: Click Google OAuth
    console.log('\nStep 2: Filling in email and password...
    const emailInput = await page.$('input[type="email"]');
    await emailInput.type('browsertest@test.com', { delay: 50 });
    const passwordInput = await page.$('input[type="password"]');
    await passwordInput.type('Test123456!', { delay: 50 });
    console.log('  ✓ Credentials entered');
    
    await page.screenshot({ path: 'test-screenshots/01-login-filled.png' });
    
    console.log('  Clicking Sign In button...');
    const submitBtn = await page.$('button[type="submit"]');
    await submitBtn.click();
    console.log('  ✓ Submit clicked, waiting for navigation...');
    
    // Wait for redirect to dashboard after login
    await page.waitForFunction(
      () => window.location.pathname.includes('/chat') || 
           window.location.pathname.includes('/dashboard'),
      { timeout: 60000 }
    );
    
    console.log('  ✓ Login successful! Redirected to:', page.url());
    
    // Wait for page to stabilize
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Step 3: Test /finance/invoices
    console.log('\nStep 3: Testing /finance/invoices...');
    const invoiceTest = { name: 'Finance - Invoices', url: 'https://operate.guru/finance/invoices' };
    
    try {
      await page.goto('https://operate.guru/finance/invoices', {
        waitUntil: 'domcontentloaded',
        timeout: 20000
      });
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const invoiceInfo = await page.evaluate(() => ({
        url: window.location.href,
        title: document.title,
        hasContent: document.body.textContent.length > 100,
        hasTable: !!document.querySelector('table'),
        buttonCount: document.querySelectorAll('button').length
      }));
      
      invoiceTest.status = 'PASS';
      invoiceTest.info = invoiceInfo;
      console.log('  ✓ Page loaded');
      console.log('  Title:', invoiceInfo.title);
      console.log('  Has content:', invoiceInfo.hasContent);
      console.log('  Has table:', invoiceInfo.hasTable);
      
      await page.screenshot({ path: 'test-screenshots/prod-invoices.png', fullPage: true });
      console.log('  ✓ Screenshot saved');
    } catch (error) {
      invoiceTest.status = 'FAIL';
      invoiceTest.error = error.message;
      console.log('  ✗ Failed:', error.message);
    }
    results.tests.push(invoiceTest);
    
    // Step 4: Test /finance/expenses
    console.log('\nStep 4: Testing /finance/expenses...');
    const expenseTest = { name: 'Finance - Expenses', url: 'https://operate.guru/finance/expenses' };
    
    try {
      await page.goto('https://operate.guru/finance/expenses', {
        waitUntil: 'domcontentloaded',
        timeout: 20000
      });
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const expenseInfo = await page.evaluate(() => ({
        url: window.location.href,
        title: document.title,
        hasContent: document.body.textContent.length > 100,
        buttonCount: document.querySelectorAll('button').length
      }));
      
      expenseTest.status = 'PASS';
      expenseTest.info = expenseInfo;
      console.log('  ✓ Page loaded');
      console.log('  Title:', expenseInfo.title);
      
      await page.screenshot({ path: 'test-screenshots/prod-expenses.png', fullPage: true });
      console.log('  ✓ Screenshot saved');
    } catch (error) {
      expenseTest.status = 'FAIL';
      expenseTest.error = error.message;
      console.log('  ✗ Failed:', error.message);
    }
    results.tests.push(expenseTest);
    
    // Step 5: Test /time
    console.log('\nStep 5: Testing /time...');
    const timeTest = { name: 'Time Tracking', url: 'https://operate.guru/time' };
    
    try {
      await page.goto('https://operate.guru/time', {
        waitUntil: 'domcontentloaded',
        timeout: 20000
      });
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const timeInfo = await page.evaluate(() => ({
        url: window.location.href,
        title: document.title,
        hasContent: document.body.textContent.length > 100,
        buttonCount: document.querySelectorAll('button').length
      }));
      
      timeTest.status = 'PASS';
      timeTest.info = timeInfo;
      console.log('  ✓ Page loaded');
      console.log('  Title:', timeInfo.title);
      
      await page.screenshot({ path: 'test-screenshots/prod-time.png', fullPage: true });
      console.log('  ✓ Screenshot saved');
    } catch (error) {
      timeTest.status = 'FAIL';
      timeTest.error = error.message;
      console.log('  ✗ Failed:', error.message);
    }
    results.tests.push(timeTest);
    
    // Step 6: Test /chat
    console.log('\nStep 6: Testing /chat...');
    const chatTest = { name: 'AI Chat', url: 'https://operate.guru/chat' };
    
    try {
      await page.goto('https://operate.guru/chat', {
        waitUntil: 'domcontentloaded',
        timeout: 20000
      });
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const chatInfo = await page.evaluate(() => ({
        url: window.location.href,
        title: document.title,
        hasTextarea: !!document.querySelector('textarea'),
        buttonCount: document.querySelectorAll('button').length
      }));
      
      chatTest.status = 'PASS';
      chatTest.info = chatInfo;
      console.log('  ✓ Page loaded');
      console.log('  Has chat textarea:', chatInfo.hasTextarea);
      
      await page.screenshot({ path: 'test-screenshots/prod-chat.png', fullPage: true });
      console.log('  ✓ Screenshot saved');
    } catch (error) {
      chatTest.status = 'FAIL';
      chatTest.error = error.message;
      console.log('  ✗ Failed:', error.message);
    }
    results.tests.push(chatTest);
    
    // Summary
    console.log('\n=== TEST SUMMARY ===\n');
    const passed = results.tests.filter(t => t.status === 'PASS').length;
    const failed = results.tests.filter(t => t.status === 'FAIL').length;
    
    console.log('PASSED:', passed);
    console.log('FAILED:', failed);
    console.log('TOTAL:', results.tests.length);
    
    results.summary = { passed, failed, total: results.tests.length };
    
    fs.writeFileSync('PROD_AUTH_FLOW_RESULTS.json', JSON.stringify(results, null, 2));
    console.log('\n✓ Results saved to PROD_AUTH_FLOW_RESULTS.json');
    
  } catch (error) {
    console.error('\n✗ Test failed:', error.message);
    results.error = error.message;
  }
  
  console.log('\nBrowser will stay open. Press Ctrl+C to close when done.');
  await new Promise(resolve => setTimeout(resolve, 300000)); // 5 minutes
  await browser.close();
})();
