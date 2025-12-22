const puppeteer = require('puppeteer');
const fs = require('fs');

async function testLogin() {
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });

  const results = {
    timestamp: new Date().toISOString(),
    steps: [],
    success: false,
    finalUrl: null,
    error: null
  };

  try {
    // Step 1: Navigate to operate.guru
    console.log('Step 1: Navigating to https://operate.guru...');
    await page.goto('https://operate.guru', { waitUntil: 'networkidle2', timeout: 30000 });
    
    const initialUrl = page.url();
    console.log('Initial URL:', initialUrl);
    results.steps.push({ step: 'navigate', url: initialUrl, success: true });
    
    await page.screenshot({ path: 'test-screenshots/login-step1-initial.png', fullPage: true });

    // Step 2: Check if we're on login page
    await page.waitForTimeout(2000);
    const currentUrl = page.url();
    console.log('Current URL after load:', currentUrl);
    
    // Step 3: Look for email input field
    console.log('Step 2: Looking for email input...');
    const emailSelector = 'input[type="email"], input[name="email"], input[id="email"]';
    await page.waitForSelector(emailSelector, { timeout: 10000 });
    
    // Step 4: Fill in email
    console.log('Step 3: Filling in email...');
    await page.type(emailSelector, 'luk.gber@gmail.com');
    results.steps.push({ step: 'fill_email', success: true });
    
    // Step 5: Fill in password
    console.log('Step 4: Filling in password...');
    const passwordSelector = 'input[type="password"], input[name="password"], input[id="password"]';
    await page.waitForSelector(passwordSelector, { timeout: 5000 });
    await page.type(passwordSelector, 'schlagzeug');
    results.steps.push({ step: 'fill_password', success: true });
    
    await page.screenshot({ path: 'test-screenshots/login-step2-filled.png', fullPage: true });

    // Step 6: Click login button
    console.log('Step 5: Clicking login button...');
    const buttonSelectors = [
      'button[type="submit"]',
      'button:has-text("Sign in")',
      'button:has-text("Log in")',
      'button:has-text("Login")'
    ];
    
    let loginButton = null;
    for (const selector of buttonSelectors) {
      try {
        loginButton = await page.$(selector);
        if (loginButton) break;
      } catch (e) {
        continue;
      }
    }
    
    if (!loginButton) {
      // Try finding button by text content
      loginButton = await page.evaluateHandle(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        return buttons.find(btn => 
          btn.textContent.toLowerCase().includes('sign in') ||
          btn.textContent.toLowerCase().includes('log in') ||
          btn.textContent.toLowerCase().includes('login')
        );
      });
    }
    
    if (loginButton) {
      await loginButton.click();
      results.steps.push({ step: 'click_login', success: true });
      
      // Wait for navigation
      console.log('Step 6: Waiting for redirect...');
      await page.waitForNavigation({ timeout: 15000, waitUntil: 'networkidle2' }).catch(() => {
        console.log('Navigation timeout, checking current state...');
      });
      
      await page.waitForTimeout(3000);
      
      const finalUrl = page.url();
      console.log('Final URL:', finalUrl);
      results.finalUrl = finalUrl;
      
      await page.screenshot({ path: 'test-screenshots/login-step3-result.png', fullPage: true });
      
      // Check if login was successful
      if (finalUrl.includes('/chat') || finalUrl.includes('/dashboard') || !finalUrl.includes('/login')) {
        console.log('SUCCESS: Login successful!');
        results.success = true;
        results.steps.push({ step: 'verify_redirect', success: true, finalUrl });
      } else {
        console.log('FAILED: Still on login page');
        results.success = false;
        results.error = 'Login failed - still on login page';
        
        // Check for error messages
        const errorText = await page.evaluate(() => {
          const errors = document.querySelectorAll('[role="alert"], .error, .text-red-500, .text-destructive');
          return Array.from(errors).map(el => el.textContent).join('; ');
        });
        
        if (errorText) {
          results.error = `Login failed - ${errorText}`;
        }
      }
    } else {
      results.error = 'Could not find login button';
      results.steps.push({ step: 'click_login', success: false, error: 'Button not found' });
    }

  } catch (error) {
    console.error('Error during login test:', error.message);
    results.error = error.message;
    await page.screenshot({ path: 'test-screenshots/login-error.png', fullPage: true });
  }

  // Save results
  fs.writeFileSync('test-login-results.json', JSON.stringify(results, null, 2));
  console.log('\n=== LOGIN TEST RESULTS ===');
  console.log('Success:', results.success);
  console.log('Final URL:', results.finalUrl);
  if (results.error) console.log('Error:', results.error);
  console.log('Screenshots saved to test-screenshots/');

  await page.waitForTimeout(3000);
  await browser.close();
  
  return results;
}

testLogin().catch(console.error);
