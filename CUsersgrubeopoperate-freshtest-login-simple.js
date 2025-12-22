const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
  const screenshotDir = path.join(__dirname, 'test-screenshots');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1920, height: 1080 },
    args: ['--start-maximized', '--no-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  try {
    console.log('Step 1: Navigating to login page...');
    await page.goto('https://operate.guru/login', { 
      waitUntil: 'domcontentloaded', 
      timeout: 60000 
    });
    await page.waitForTimeout(3000);
    
    const loginPagePath = path.join(screenshotDir, 'login-page.png');
    await page.screenshot({ path: loginPagePath, fullPage: true });
    console.log('Screenshot: login-page.png');

    console.log('Step 2: Entering email...');
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    await page.type('input[type="email"]', 'browsertest@test.com', { delay: 50 });
    await page.waitForTimeout(500);

    console.log('Step 3: Entering password...');
    await page.waitForSelector('input[type="password"]', { timeout: 10000 });
    await page.type('input[type="password"]', 'TestPassword123!', { delay: 50 });
    await page.waitForTimeout(500);

    const filledPath = path.join(screenshotDir, 'login-filled.png');
    await page.screenshot({ path: filledPath, fullPage: true });
    console.log('Screenshot: login-filled.png');

    console.log('Step 4: Clicking login button...');
    await page.click('button[type="submit"]');
    
    console.log('Step 5: Waiting up to 30 seconds for page to load...');
    await page.waitForTimeout(30000);
    
    const finalUrl = page.url();
    console.log('Final URL:', finalUrl);

    const finalPath = path.join(screenshotDir, 'login-final-state.png');
    await page.screenshot({ path: finalPath, fullPage: true });
    console.log('Screenshot: login-final-state.png');

    // Analyze page content
    const pageAnalysis = await page.evaluate(() => {
      const body = document.body.innerText;
      return {
        hasError: body.toLowerCase().includes('error'),
        hasInvalid: body.toLowerCase().includes('invalid'),
        hasChatInterface: document.querySelector('[class*="chat"]') != null,
        hasTextarea: document.querySelector('textarea') != null,
        title: document.title,
        bodyPreview: body.substring(0, 300)
      };
    });

    console.log('\n=== FINAL RESULTS ===');
    console.log('URL:', finalUrl);
    console.log('Title:', pageAnalysis.title);
    console.log('Has Error:', pageAnalysis.hasError ? 'YES' : 'NO');
    console.log('Has Chat Interface:', pageAnalysis.hasChatInterface ? 'YES' : 'NO');
    console.log('Has Textarea:', pageAnalysis.hasTextarea ? 'YES' : 'NO');
    console.log('\nPage preview:', pageAnalysis.bodyPreview);

    // Determine result
    if (finalUrl.includes('/chat') || finalUrl.includes('/dashboard')) {
      console.log('\nRESULT: SUCCESS - Logged in and redirected');
    } else if (finalUrl.includes('/login')) {
      console.log('\nRESULT: FAILED - Still on login page');
    } else {
      console.log('\nRESULT: UNKNOWN - Unexpected URL');
    }

  } catch (error) {
    console.error('Test error:', error.message);
    const errorPath = path.join(screenshotDir, 'error-state.png');
    await page.screenshot({ path: errorPath, fullPage: true });
  }

  await browser.close();
})();
