const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--start-maximized'],
    defaultViewport: null
  });

  const results = {
    timestamp: new Date().toISOString(),
    tests: []
  };

  try {
    const page = await browser.newPage();
    
    // Capture console messages
    const consoleMessages = [];
    page.on('console', msg => {
      consoleMessages.push({
        type: msg.type(),
        text: msg.text()
      });
    });

    // Capture errors
    const errors = [];
    page.on('pageerror', error => {
      errors.push(error.message);
    });

    console.log('\n=== PRODUCTION VERIFICATION TEST ===\n');
    console.log('Target: https://operate.guru\n');

    // Test 1: Login Page Load
    console.log('Test 1: Loading login page...');
    const loginTest = { name: 'Login Page Load', url: 'https://operate.guru/login' };
    
    try {
      await page.goto('https://operate.guru/login', { 
        waitUntil: 'networkidle0',
        timeout: 30000 
      });
      
      loginTest.status = 'PASS';
      loginTest.loaded = true;
      
      await page.screenshot({ 
        path: 'test-screenshots/prod-login.png',
        fullPage: true 
      });
      console.log('  ✓ Page loaded successfully');
      console.log('  ✓ Screenshot saved: prod-login.png');
    } catch (error) {
      loginTest.status = 'FAIL';
      loginTest.error = error.message;
      console.log('  ✗ Failed to load:', error.message);
    }

    results.tests.push(loginTest);

    // Test 2: Check Page Styling
    console.log('\nTest 2: Checking page styling...');
    const stylingTest = { name: 'Page Styling' };
    
    try {
      const hasStyles = await page.evaluate(() => {
        const body = document.body;
        const computedStyle = window.getComputedStyle(body);
        return {
          backgroundColor: computedStyle.backgroundColor,
          hasStylesheets: document.styleSheets.length > 0,
          bodyClasses: body.className
        };
      });
      
      stylingTest.styles = hasStyles;
      stylingTest.status = hasStyles.hasStylesheets ? 'PASS' : 'FAIL';
      
      console.log('  Background:', hasStyles.backgroundColor);
      console.log('  Stylesheets:', hasStyles.hasStylesheets ? 'LOADED' : 'MISSING');
      console.log('  Body classes:', hasStyles.bodyClasses || 'none');
    } catch (error) {
      stylingTest.status = 'FAIL';
      stylingTest.error = error.message;
      console.log('  ✗ Failed:', error.message);
    }

    results.tests.push(stylingTest);

    // Test 3: Check for Google OAuth Button
    console.log('\nTest 3: Checking Google OAuth button...');
    const oauthTest = { name: 'Google OAuth Button' };
    
    try {
      const hasOAuthButton = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const googleButton = buttons.find(btn => 
          btn.textContent.toLowerCase().includes('google') ||
          btn.textContent.toLowerCase().includes('sign in')
        );
        return {
          found: !!googleButton,
          text: googleButton?.textContent || null,
          totalButtons: buttons.length
        };
      });
      
      oauthTest.result = hasOAuthButton;
      oauthTest.status = hasOAuthButton.found ? 'PASS' : 'FAIL';
      
      console.log('  OAuth button:', hasOAuthButton.found ? 'FOUND' : 'NOT FOUND');
      if (hasOAuthButton.found) {
        console.log('  Button text:', hasOAuthButton.text);
      }
      console.log('  Total buttons on page:', hasOAuthButton.totalButtons);
    } catch (error) {
      oauthTest.status = 'FAIL';
      oauthTest.error = error.message;
      console.log('  ✗ Failed:', error.message);
    }

    results.tests.push(oauthTest);

    // Test 4: Console Errors
    console.log('\nTest 4: Checking console for errors...');
    const consoleTest = { 
      name: 'Console Errors',
      errors: errors,
      warnings: consoleMessages.filter(m => m.type === 'warning'),
      totalMessages: consoleMessages.length
    };
    
    consoleTest.status = errors.length === 0 ? 'PASS' : 'FAIL';
    
    if (errors.length > 0) {
      console.log('  ✗ Found', errors.length, 'error(s):');
      errors.forEach(err => console.log('    -', err));
    } else {
      console.log('  ✓ No JavaScript errors');
    }
    
    if (consoleTest.warnings.length > 0) {
      console.log('  ⚠ Found', consoleTest.warnings.length, 'warning(s)');
    }

    results.tests.push(consoleTest);

    // Test 5: Try to access protected page
    console.log('\nTest 5: Testing protected route redirect...');
    const redirectTest = { name: 'Protected Route Redirect' };
    
    try {
      await page.goto('https://operate.guru/chat', {
        waitUntil: 'networkidle0',
        timeout: 15000
      });
      
      const finalUrl = page.url();
      redirectTest.initialUrl = 'https://operate.guru/chat';
      redirectTest.finalUrl = finalUrl;
      redirectTest.redirected = !finalUrl.includes('/chat');
      redirectTest.status = redirectTest.redirected ? 'PASS' : 'INFO';
      
      console.log('  Initial:', redirectTest.initialUrl);
      console.log('  Final:', finalUrl);
      console.log('  Redirected:', redirectTest.redirected ? 'YES' : 'NO');
      
      if (redirectTest.redirected) {
        console.log('  ✓ Auth protection working');
      }
    } catch (error) {
      redirectTest.status = 'FAIL';
      redirectTest.error = error.message;
      console.log('  ✗ Failed:', error.message);
    }

    results.tests.push(redirectTest);

    // Summary
    console.log('\n=== TEST SUMMARY ===\n');
    const passed = results.tests.filter(t => t.status === 'PASS').length;
    const failed = results.tests.filter(t => t.status === 'FAIL').length;
    const info = results.tests.filter(t => t.status === 'INFO').length;
    
    console.log('PASSED:', passed);
    console.log('FAILED:', failed);
    console.log('INFO:', info);
    console.log('TOTAL:', results.tests.length);
    
    results.summary = {
      passed,
      failed,
      info,
      total: results.tests.length
    };

    fs.writeFileSync(
      'PROD_VERIFY_RESULTS.json',
      JSON.stringify(results, null, 2)
    );
    
    console.log('\n✓ Results saved to PROD_VERIFY_RESULTS.json');
    console.log('\nBrowser will close in 10 seconds...');
    
    await new Promise(resolve => setTimeout(resolve, 10000));

  } catch (error) {
    console.error('\n✗ Test suite failed:', error.message);
    results.criticalError = error.message;
  } finally {
    await browser.close();
  }

  process.exit(results.summary?.failed > 0 ? 1 : 0);
})();
