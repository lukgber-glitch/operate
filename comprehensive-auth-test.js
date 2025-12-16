const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const results = {
  timestamp: new Date().toISOString(),
  summary: { total: 0, passed: 0, failed: 0, warnings: 0 },
  tests: [],
  issues: []
};

async function testLoginPage(browser) {
  console.log('\n=== TEST 1: Login Page Load & Elements ===');
  results.summary.total++;
  
  const page = await browser.newPage();
  const consoleErrors = [];
  
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  
  page.on('pageerror', error => consoleErrors.push(error.message));
  
  try {
    await page.goto('https://operate.guru/login', { waitUntil: 'networkidle2', timeout: 30000 });
    
    const elements = await page.evaluate(() => {
      return {
        hasEmailInput: \!\!document.querySelector('input[type=email], input[name=email]'),
        hasPasswordInput: \!\!document.querySelector('input[type=password]'),
        hasGoogleButton: \!\!document.querySelector('button[class*=google], button[class*=Google], a[href*=google]'),
        hasLoginButton: \!\!document.querySelector('button[type=submit]'),
        hasRegisterLink: \!\!document.querySelector('a[href*=register]'),
        hasForgotPasswordLink: \!\!document.querySelector('a[href*=forgot]'),
        pageTitle: document.title,
        url: window.location.href
      };
    });
    
    await page.screenshot({ 
      path: path.join(__dirname, 'test-screenshots', 'auth-01-login-page.png'), 
      fullPage: true 
    });
    
    const passed = elements.hasEmailInput && elements.hasPasswordInput;
    
    results.tests.push({
      name: 'Login Page Load',
      status: passed ? 'PASS' : 'FAIL',
      elements,
      consoleErrors: consoleErrors.length,
      screenshot: 'auth-01-login-page.png'
    });
    
    if (passed) {
      console.log('Login page loaded with inputs');
      results.summary.passed++;
    } else {
      console.log('Login page missing elements');
      results.summary.failed++;
    }
    
  } catch (error) {
    console.log('Failed:', error.message);
    results.summary.failed++;
  } finally {
    await page.close();
  }
}

async function testGoogleOAuth(browser) {
  console.log('\n=== TEST 2: Google OAuth ===');
  results.summary.total++;
  
  const page = await browser.newPage();
  
  try {
    await page.goto('https://operate.guru/login', { waitUntil: 'networkidle2' });
    
    const googleButton = await page.dollar('button[class*=google], button[class*=Google], a[href*=google]');
    
    if (googleButton) {
      console.log('Google button found');
      results.summary.passed++;
      await page.screenshot({ path: path.join(__dirname, 'test-screenshots', 'auth-02-google.png'), fullPage: true });
    } else {
      console.log('Google button NOT found');
      results.summary.failed++;
    }
    
    results.tests.push({
      name: 'Google OAuth',
      status: googleButton ? 'PASS' : 'FAIL'
    });
    
  } catch (error) {
    console.log('Failed:', error.message);
    results.summary.failed++;
  } finally {
    await page.close();
  }
}

async function runTests() {
  console.log('COMPREHENSIVE AUTH TEST');
  console.log('='.repeat(60));
  
  const screenshotDir = path.join(__dirname, 'test-screenshots');
  if (\!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }
  
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    await testLoginPage(browser);
    await testGoogleOAuth(browser);
  } finally {
    await browser.close();
  }
  
  console.log('\n=== SUMMARY ===');
  console.log('Total:', results.summary.total);
  console.log('Passed:', results.summary.passed);
  console.log('Failed:', results.summary.failed);
  
  fs.writeFileSync('COMPREHENSIVE_AUTH_TEST_RESULTS.json', JSON.stringify(results, null, 2));
  console.log('\nReport saved');
}

runTests().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
