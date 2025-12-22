const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const TEST_PAGES = [
  '/finance/invoices',
  '/finance/expenses',
  '/time',
  '/chat'
];

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runQuickTest() {
  console.log('=== QUICK PAGE VERIFICATION TEST ===');
  
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  
  const screenshotDir = path.join(__dirname, 'test-screenshots', 'quick-verify');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }
  
  const results = [];
  
  try {
    console.log('Step 1: Logging in...');
    await page.goto('https://operate.guru/login', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await delay(2000);
    await page.screenshot({ path: path.join(screenshotDir, '01-login-page.png'), fullPage: true });
    
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    await page.type('input[type="email"]', 'browsertest@test.com', { delay: 50 });
    await page.type('input[type="password"]', 'Test123456!', { delay: 50 });
    await page.screenshot({ path: path.join(screenshotDir, '02-credentials-filled.png'), fullPage: true });
    
    await page.click('button[type="submit"]');
    console.log('Submitted login, waiting for navigation...');
    await page.waitForNavigation({ timeout: 30000 }).catch(() => {});
    await delay(3000);
    
    const afterLoginUrl = page.url();
    console.log('After login URL:', afterLoginUrl);
    await page.screenshot({ path: path.join(screenshotDir, '03-after-login.png'), fullPage: true });
    
    if (afterLoginUrl.includes('/login')) {
      console.log('ERROR: Still on login page, login failed!');
      await browser.close();
      return;
    }
    
    console.log('Login successful!');
    console.log('');
    
    for (let i = 0; i < TEST_PAGES.length; i++) {
      const pagePath = TEST_PAGES[i];
      const pageNum = String(i + 4).padStart(2, '0');
      const pageName = pagePath.split('/').pop() || 'page';
      
      console.log('Testing: ' + pagePath);
      
      const result = {
        path: pagePath,
        status: 'UNKNOWN',
        error: null,
        hasError: false
      };
      
      try {
        await page.goto('https://operate.guru' + pagePath, { 
          waitUntil: 'networkidle2', 
          timeout: 30000 
        });
        
        await delay(2000);
        
        const hasError = await page.evaluate(() => {
          const bodyText = document.body.textContent || '';
          const lowerText = bodyText.toLowerCase();
          return lowerText.includes('error') || 
                 lowerText.includes('something went wrong') || 
                 lowerText.includes('internal server error') ||
                 lowerText.includes('500');
        });
        
        result.hasError = hasError;
        result.status = hasError ? 'ERROR_DETECTED' : 'PASS';
        
        console.log('  Status: ' + result.status);
        
        await page.screenshot({ 
          path: path.join(screenshotDir, pageNum + '-' + pageName + '.png'), 
          fullPage: true 
        });
        
      } catch (error) {
        result.status = 'FAIL';
        result.error = error.message;
        console.log('  FAIL: ' + error.message);
      }
      
      results.push(result);
    }
    
    if (results.find(r => r.path === '/chat' && r.status === 'PASS')) {
      console.log('');
      console.log('Testing chat interaction...');
      await page.goto('https://operate.guru/chat', { waitUntil: 'networkidle2', timeout: 30000 });
      await delay(2000);
      
      try {
        const inputFound = await page.$('textarea') || await page.$('input[type="text"]');
        if (inputFound) {
          await page.type('textarea, input[type="text"]', 'Test message', { delay: 50 });
          await delay(500);
          await page.screenshot({ path: path.join(screenshotDir, 'chat-message-typed.png'), fullPage: true });
          console.log('  Chat input works!');
        } else {
          console.log('  No chat input found');
        }
      } catch (error) {
        console.log('  Chat test failed: ' + error.message);
      }
    }
    
  } catch (error) {
    console.error('Test error:', error.message);
  } finally {
    await browser.close();
  }
  
  console.log('');
  console.log('=== TEST SUMMARY ===');
  console.log('Page                      | Status');
  console.log('--------------------------|---------------');
  results.forEach(r => {
    const pathStr = r.path.padEnd(25);
    console.log(pathStr + ' | ' + r.status);
  });
  
  const passed = results.filter(r => r.status === 'PASS').length;
  console.log('');
  console.log('Passed: ' + passed + '/' + results.length);
  console.log('Screenshots saved to: ' + screenshotDir);
  
  fs.writeFileSync(
    path.join(__dirname, 'QUICK_VERIFY_RESULTS.json'),
    JSON.stringify({ timestamp: new Date().toISOString(), results }, null, 2)
  );
}

runQuickTest()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Failed:', error);
    process.exit(1);
  });
