const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function testWithLongerWait() {
  console.log('COMPREHENSIVE AUTH TEST - Enhanced with longer waits');
  console.log('='.repeat(70));
  
  const browser = await puppeteer.launch({
    headless: false,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--disable-web-security'
    ],
    defaultViewport: { width: 1920, height: 1080 }
  });
  
  const page = await browser.newPage();
  
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  
  const results = {
    timestamp: new Date().toISOString(),
    tests: []
  };
  
  try {
    console.log('\nTEST 1: Login Page - Waiting for security check to pass...');
    await page.goto('https://operate.guru/login', { waitUntil: 'domcontentloaded', timeout: 60000 });
    
    console.log('Waiting 10 seconds for security check...');
    await page.waitForTimeout(10000);
    
    const pageInfo = await page.evaluate(() => {
      return {
        title: document.title,
        url: window.location.href,
        hasEmailInput: !!document.querySelector('input[type="email"], input[name="email"]'),
        hasPasswordInput: !!document.querySelector('input[type="password"]'),
        hasGoogleButton: !!document.querySelector('button[class*="google"], button[class*="Google"]'),
        hasSubmitButton: !!document.querySelector('button[type="submit"]'),
        bodyText: document.body.innerText.substring(0, 500)
      };
    });
    
    await page.screenshot({ 
      path: path.join(__dirname, 'test-screenshots', 'enhanced-login.png'), 
      fullPage: true 
    });
    
    console.log('Page Title:', pageInfo.title);
    console.log('Has Email Input:', pageInfo.hasEmailInput);
    console.log('Has Password Input:', pageInfo.hasPasswordInput);
    console.log('Has Google Button:', pageInfo.hasGoogleButton);
    console.log('Body preview:', pageInfo.bodyText.substring(0, 100));
    
    results.tests.push({
      name: 'Login Page (Enhanced)',
      pageInfo,
      screenshot: 'enhanced-login.png'
    });
    
    if (pageInfo.hasEmailInput && pageInfo.hasPasswordInput) {
      console.log('\nTEST 2: Testing invalid credentials...');
      
      await page.type('input[type="email"], input[name="email"]', 'invalid@test.com');
      await page.type('input[type="password"]', 'wrongpassword123');
      
      await page.screenshot({ 
        path: path.join(__dirname, 'test-screenshots', 'enhanced-filled.png'), 
        fullPage: true 
      });
      
      const submitBtn = await page.$('button[type="submit"]');
      if (submitBtn) {
        await submitBtn.click();
        await page.waitForTimeout(3000);
        
        const errorCheck = await page.evaluate(() => {
          const errorEl = document.querySelector('[class*="error"], [role="alert"]');
          return {
            hasError: !!errorEl,
            errorText: errorEl ? errorEl.innerText : null
          };
        });
        
        await page.screenshot({ 
          path: path.join(__dirname, 'test-screenshots', 'enhanced-error.png'), 
          fullPage: true 
        });
        
        console.log('Error displayed:', errorCheck.hasError);
        console.log('Error text:', errorCheck.errorText);
        
        results.tests.push({
          name: 'Invalid Credentials Test',
          errorCheck,
          screenshot: 'enhanced-error.png'
        });
      }
    } else {
      console.log('WARN: Login form not found after waiting');
    }
    
    if (pageInfo.hasGoogleButton) {
      console.log('\nTEST 3: Testing Google OAuth button...');
      
      await page.goto('https://operate.guru/login', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(10000);
      
      const googleBtn = await page.$('button[class*="google"], button[class*="Google"]');
      if (googleBtn) {
        console.log('Clicking Google button...');
        await googleBtn.click();
        await page.waitForTimeout(5000);
        
        const redirectUrl = page.url();
        console.log('Redirect URL:', redirectUrl);
        
        await page.screenshot({ 
          path: path.join(__dirname, 'test-screenshots', 'enhanced-google.png'), 
          fullPage: true 
        });
        
        results.tests.push({
          name: 'Google OAuth',
          redirectUrl,
          isGoogleAuth: redirectUrl.includes('google') || redirectUrl.includes('accounts'),
          screenshot: 'enhanced-google.png'
        });
      }
    }
    
    console.log('\nTEST 4: Protected route access...');
    await page.goto('https://operate.guru/dashboard', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(10000);
    
    const dashboardUrl = page.url();
    const redirectedToLogin = dashboardUrl.includes('/login');
    
    await page.screenshot({ 
      path: path.join(__dirname, 'test-screenshots', 'enhanced-dashboard.png'), 
      fullPage: true 
    });
    
    console.log('Dashboard URL:', dashboardUrl);
    console.log('Redirected to login:', redirectedToLogin);
    
    results.tests.push({
      name: 'Protected Route',
      dashboardUrl,
      redirectedToLogin,
      screenshot: 'enhanced-dashboard.png'
    });
    
  } catch (error) {
    console.error('Error:', error.message);
    results.error = error.message;
  }
  
  fs.writeFileSync(
    path.join(__dirname, 'ENHANCED_AUTH_TEST_RESULTS.json'),
    JSON.stringify(results, null, 2)
  );
  
  console.log('\n' + '='.repeat(70));
  console.log('Report saved to: ENHANCED_AUTH_TEST_RESULTS.json');
  console.log('Browser left open for manual inspection. Press Ctrl+C to close.');
  
  await new Promise(() => {});
}

testWithLongerWait().catch(console.error);
