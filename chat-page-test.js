const puppeteer = require('puppeteer');
const fs = require('fs');

async function testChatPage() {
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--start-maximized', '--no-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  const results = {
    timestamp: new Date().toISOString(),
    chatPageLoaded: false,
    errorShown: false,
    errorMessage: null,
    screenshot: null
  };

  try {
    console.log('1. Navigating to login page...');
    await page.goto('https://operate.guru/login', { waitUntil: 'networkidle2', timeout: 30000 });
    
    console.log('2. Filling in credentials...');
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    await page.type('input[type="email"]', 'luk.gber@gmail.com');
    await page.type('input[type="password"]', 'Schlagzeug1@');
    
    console.log('3. Submitting login form...');
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 })
    ]);

    console.log('4. Waiting for redirect to chat page...');
    await page.waitForTimeout(2000);
    
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);

    if (!currentUrl.includes('/chat')) {
      console.log('Redirecting to chat page manually...');
      await page.goto('https://operate.guru/chat', { waitUntil: 'networkidle2', timeout: 30000 });
    }

    console.log('5. Waiting 10 seconds for page to fully load...');
    await page.waitForTimeout(10000);

    // Check for error boundary
    console.log('6. Checking for error boundary...');
    const errorBoundary = await page.$('[role="alert"]');
    const errorMessage = await page.$('h2');
    
    if (errorBoundary || errorMessage) {
      results.errorShown = true;
      
      if (errorMessage) {
        results.errorMessage = await page.evaluate(el => el.textContent, errorMessage);
        console.log('Error message found:', results.errorMessage);
      }
    }

    // Check if chat interface is loaded
    console.log('7. Checking for chat interface...');
    const chatInput = await page.$('textarea[placeholder*="Type"], textarea[placeholder*="message"], input[placeholder*="Type"]');
    const chatContainer = await page.$('[class*="chat"]');
    
    if (chatInput || chatContainer) {
      results.chatPageLoaded = true;
      console.log('Chat interface found!');
    }

    // Get page content for debugging
    const pageText = await page.evaluate(() => document.body.innerText);
    console.log('\nPage content preview:', pageText.substring(0, 500));

    // Take screenshot
    const screenshotPath = 'C:\Users\grube\op\operate-fresh\chat-page-final-state.png';
    await page.screenshot({ path: screenshotPath, fullPage: true });
    results.screenshot = screenshotPath;
    console.log('\nScreenshot saved to:', screenshotPath);

    // Save results
    fs.writeFileSync(
      'C:\Users\grube\op\operate-fresh\chat-page-test-results.json',
      JSON.stringify(results, null, 2)
    );

    console.log('\n=== TEST RESULTS ===');
    console.log('Chat Page Loaded:', results.chatPageLoaded ? 'YES' : 'NO');
    console.log('Error Shown:', results.errorShown ? 'YES' : 'NO');
    if (results.errorMessage) {
      console.log('Error Message:', results.errorMessage);
    }

  } catch (error) {
    console.error('Test error:', error.message);
    results.error = error.message;
    
    // Take error screenshot
    try {
      const errorScreenshotPath = 'C:\Users\grube\op\operate-fresh\chat-page-error-state.png';
      await page.screenshot({ path: errorScreenshotPath, fullPage: true });
      results.screenshot = errorScreenshotPath;
      console.log('Error screenshot saved to:', errorScreenshotPath);
    } catch (screenshotError) {
      console.error('Could not take error screenshot:', screenshotError.message);
    }
  } finally {
    await browser.close();
  }

  return results;
}

testChatPage().catch(console.error);
