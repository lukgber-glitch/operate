const puppeteer = require('puppeteer');
const fs = require('fs');

async function testChatPage() {
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--start-maximized', '--no-sandbox', '--disable-web-security'],
    defaultViewport: null
  });

  const page = await browser.newPage();
  
  const results = {
    timestamp: new Date().toISOString(),
    chatPageLoaded: false,
    errorShown: false,
    errorMessage: null,
    screenshot: null,
    steps: []
  };

  try {
    console.log('1. Navigating to login page...');
    results.steps.push('Starting navigation to login page');
    
    await page.goto('https://operate.guru/login', { 
      waitUntil: 'domcontentloaded', 
      timeout: 60000 
    });
    
    results.steps.push('Login page loaded');
    console.log('Login page loaded successfully');
    
    // Wait for form
    await page.waitForTimeout(3000);
    
    console.log('2. Filling in credentials...');
    await page.waitForSelector('input[type="email"]', { timeout: 15000 });
    await page.type('input[type="email"]', 'luk.gber@gmail.com', { delay: 100 });
    await page.waitForTimeout(500);
    
    await page.type('input[type="password"]', 'Schlagzeug1@', { delay: 100 });
    await page.waitForTimeout(500);
    
    results.steps.push('Credentials entered');
    console.log('Credentials filled');
    
    console.log('3. Submitting login form...');
    const submitButton = await page.$('button[type="submit"]');
    if (submitButton) {
      await submitButton.click();
      results.steps.push('Submit button clicked');
      
      // Wait for navigation
      await page.waitForTimeout(5000);
      
      const currentUrl = page.url();
      console.log('Current URL after login:', currentUrl);
      results.steps.push(`Navigated to: ${currentUrl}`);
      
      // If not on chat, navigate there
      if (!currentUrl.includes('/chat')) {
        console.log('Navigating to chat page...');
        await page.goto('https://operate.guru/chat', { 
          waitUntil: 'domcontentloaded', 
          timeout: 60000 
        });
        results.steps.push('Manually navigated to /chat');
      }
      
      console.log('4. Waiting 10 seconds for page to fully load...');
      await page.waitForTimeout(10000);
      results.steps.push('Waited 10 seconds for page load');
      
      // Check for error boundary
      console.log('5. Checking for errors...');
      
      // Check for common error selectors
      const errorSelectors = [
        '[role="alert"]',
        '.error-boundary',
        '[class*="error"]',
        'h2:has-text("Error")',
        'h1:has-text("Error")'
      ];
      
      for (const selector of errorSelectors) {
        try {
          const element = await page.$(selector);
          if (element) {
            const text = await page.evaluate(el => el.textContent, element);
            if (text.toLowerCase().includes('error')) {
              results.errorShown = true;
              results.errorMessage = text;
              console.log('Error found:', text);
              results.steps.push(`Error found: ${text}`);
              break;
            }
          }
        } catch (e) {
          // Selector not found, continue
        }
      }
      
      // Check if chat loaded successfully
      console.log('6. Checking for chat interface...');
      const chatElements = await page.$$('textarea, input[type="text"], [class*="chat"]');
      
      if (chatElements.length > 0) {
        results.chatPageLoaded = true;
        console.log('Chat interface elements found:', chatElements.length);
        results.steps.push(`Chat interface found (${chatElements.length} elements)`);
      }
      
      // Get page title
      const title = await page.title();
      results.steps.push(`Page title: ${title}`);
      
      // Get visible text
      const bodyText = await page.evaluate(() => {
        return document.body.innerText.substring(0, 1000);
      });
      console.log('\nPage content preview:');
      console.log(bodyText);
      
      results.steps.push('Body text captured');
    } else {
      results.steps.push('ERROR: Submit button not found');
    }
    
    // Take final screenshot
    const screenshotPath = 'C:\Users\grube\op\operate-fresh\chat-page-final-state.png';
    await page.screenshot({ path: screenshotPath, fullPage: true });
    results.screenshot = screenshotPath;
    console.log('\nScreenshot saved to:', screenshotPath);
    results.steps.push('Screenshot captured');

  } catch (error) {
    console.error('Test error:', error.message);
    results.error = error.message;
    results.steps.push(`ERROR: ${error.message}`);
    
    // Take error screenshot
    try {
      const errorScreenshotPath = 'C:\Users\grube\op\operate-fresh\chat-page-error.png';
      await page.screenshot({ path: errorScreenshotPath, fullPage: true });
      results.screenshot = errorScreenshotPath;
      console.log('Error screenshot saved to:', errorScreenshotPath);
    } catch (e) {
      console.error('Screenshot error:', e.message);
    }
  } finally {
    // Save results
    fs.writeFileSync(
      'C:\Users\grube\op\operate-fresh\chat-page-test-results.json',
      JSON.stringify(results, null, 2)
    );
    
    console.log('\n=== TEST RESULTS ===');
    console.log('Chat Page Loaded:', results.chatPageLoaded ? 'YES ✓' : 'NO ✗');
    console.log('Error Shown:', results.errorShown ? 'YES ✗' : 'NO ✓');
    if (results.errorMessage) {
      console.log('Error Message:', results.errorMessage);
    }
    console.log('\nTest steps:', results.steps.join(' → '));
    
    await page.waitForTimeout(3000);
    await browser.close();
  }
}

testChatPage().catch(console.error);
