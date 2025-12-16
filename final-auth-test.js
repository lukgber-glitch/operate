const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function runComprehensiveAuthTest() {
  console.log('COMPREHENSIVE AUTHENTICATION TEST');
  console.log('Testing: https://operate.guru');
  console.log('='.repeat(70));
  
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1920, height: 1080 }
  });
  
  const results = {
    timestamp: new Date().toISOString(),
    tests: [],
    issues: []
  };
  
  try {
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    console.log('\n[TEST 1] Login Page - Bypassing security check...');
    await page.goto('https://operate.guru/login', { waitUntil: 'domcontentloaded', timeout: 60000 });
    
    console.log('Waiting 15 seconds for Cloudflare check...');
    await wait(15000);
    
    const loginPageInfo = await page.evaluate(() => {
      return {
        title: document.title,
        url: window.location.href,
        hasEmailInput: !!document.querySelector('input[type="email"], input[name="email"]'),
        hasPasswordInput: !!document.querySelector('input[type="password"]'),
        hasGoogleButton: document.querySelectorAll('button').length > 0 ? 
          Array.from(document.querySelectorAll('button')).some(b => b.innerText.toLowerCase().includes('google')) : false,
        hasSubmitButton: !!document.querySelector('button[type="submit"]'),
        allButtons: Array.from(document.querySelectorAll('button')).map(b => b.innerText.trim()).filter(t => t),
        bodyPreview: document.body.innerText.substring(0, 300)
      };
    });
    
    await page.screenshot({ path: path.join(__dirname, 'test-screenshots', 'final-login.png'), fullPage: true });
    
    console.log('  Title:', loginPageInfo.title);
    console.log('  Email input:', loginPageInfo.hasEmailInput ? 'FOUND' : 'NOT FOUND');
    console.log('  Password input:', loginPageInfo.hasPasswordInput ? 'FOUND' : 'NOT FOUND');
    console.log('  Google button:', loginPageInfo.hasGoogleButton ? 'FOUND' : 'NOT FOUND');
    console.log('  Buttons on page:', loginPageInfo.allButtons.length);
    if (loginPageInfo.allButtons.length > 0) {
      console.log('  Button texts:', loginPageInfo.allButtons.join(', '));
    }
    
    results.tests.push({
      name: 'Login Page Load',
      status: loginPageInfo.hasEmailInput && loginPageInfo.hasPasswordInput ? 'PASS' : 'FAIL',
      data: loginPageInfo,
      screenshot: 'final-login.png'
    });
    
    if (!loginPageInfo.hasEmailInput) {
      results.issues.push({
        page: 'Login',
        severity: 'CRITICAL',
        description: 'Login form not loaded - possibly blocked by security check',
        bodyPreview: loginPageInfo.bodyPreview
      });
    }
    
    if (loginPageInfo.hasEmailInput && loginPageInfo.hasPasswordInput) {
      console.log('\n[TEST 2] Invalid Credentials...');
      
      await page.type('input[type="email"], input[name="email"]', 'test@invalid.com', { delay: 50 });
      await page.type('input[type="password"]', 'wrongpass123', { delay: 50 });
      await page.screenshot({ path: path.join(__dirname, 'test-screenshots', 'final-filled.png'), fullPage: true });
      
      const submitBtn = await page.$('button[type="submit"]');
      if (submitBtn) {
        await submitBtn.click();
        await wait(3000);
        
        const errorInfo = await page.evaluate(() => {
          const errorEls = document.querySelectorAll('[class*="error"], [class*="Error"], [role="alert"]');
          return {
            hasError: errorEls.length > 0,
            errorTexts: Array.from(errorEls).map(el => el.innerText).filter(t => t),
            currentUrl: window.location.href
          };
        });
        
        await page.screenshot({ path: path.join(__dirname, 'test-screenshots', 'final-error.png'), fullPage: true });
        
        console.log('  Error shown:', errorInfo.hasError ? 'YES' : 'NO');
        if (errorInfo.errorTexts.length > 0) {
          console.log('  Error messages:', errorInfo.errorTexts.join(' | '));
        }
        
        results.tests.push({
          name: 'Invalid Login Error Handling',
          status: errorInfo.hasError ? 'PASS' : 'WARN',
          data: errorInfo,
          screenshots: ['final-filled.png', 'final-error.png']
        });
        
        if (!errorInfo.hasError) {
          results.issues.push({
            page: 'Login',
            severity: 'MEDIUM',
            description: 'No error message displayed for invalid credentials'
          });
        }
      }
    }
    
    console.log('\n[TEST 3] Protected Route Access...');
    const dashPage = await browser.newPage();
    await dashPage.goto('https://operate.guru/dashboard', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await wait(15000);
    
    const dashUrl = dashPage.url();
    const redirected = dashUrl.includes('/login');
    
    await dashPage.screenshot({ path: path.join(__dirname, 'test-screenshots', 'final-dashboard.png'), fullPage: true });
    
    console.log('  Final URL:', dashUrl);
    console.log('  Redirected to login:', redirected ? 'YES (SECURE)' : 'NO (SECURITY ISSUE)');
    
    results.tests.push({
      name: 'Protected Route Security',
      status: redirected ? 'PASS' : 'FAIL',
      finalUrl: dashUrl,
      screenshot: 'final-dashboard.png'
    });
    
    if (!redirected) {
      results.issues.push({
        page: 'Dashboard',
        severity: 'CRITICAL',
        description: 'Protected route accessible without authentication',
        url: dashUrl
      });
    }
    
    await dashPage.close();
    
  } catch (error) {
    console.error('\nFATAL ERROR:', error.message);
    results.error = error.message;
  } finally {
    const reportPath = path.join(__dirname, 'FINAL_AUTH_TEST_REPORT.json');
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
    
    console.log('\n' + '='.repeat(70));
    console.log('SUMMARY');
    console.log('='.repeat(70));
    console.log('Total tests:', results.tests.length);
    console.log('Passed:', results.tests.filter(t => t.status === 'PASS').length);
    console.log('Failed:', results.tests.filter(t => t.status === 'FAIL').length);
    console.log('Warnings:', results.tests.filter(t => t.status === 'WARN').length);
    console.log('Issues found:', results.issues.length);
    console.log('\nReport saved to:', reportPath);
    console.log('\nBrowser will remain open for 30 seconds for manual inspection...');
    
    await wait(30000);
    await browser.close();
  }
}

runComprehensiveAuthTest().catch(error => {
  console.error('Script error:', error);
  process.exit(1);
});
