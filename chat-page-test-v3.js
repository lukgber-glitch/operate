const puppeteer = require('puppeteer');
const fs = require('fs');

// Helper to wait
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function testChatPage() {
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--start-maximized', '--no-sandbox'],
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
    console.log('✓ Login page loaded');
    
    await wait(2000);
    
    console.log('2. Filling in credentials...');
    await page.waitForSelector('input[type="email"]', { timeout: 15000 });
    await page.type('input[type="email"]', 'luk.gber@gmail.com', { delay: 50 });
    await wait(500);
    
    await page.type('input[type="password"]', 'Schlagzeug1@', { delay: 50 });
    await wait(500);
    
    results.steps.push('Credentials entered');
    console.log('✓ Credentials filled');
    
    console.log('3. Submitting login form...');
    const submitButton = await page.$('button[type="submit"]');
    if (!submitButton) {
      throw new Error('Submit button not found');
    }
    
    await submitButton.click();
    results.steps.push('Submit button clicked');
    console.log('✓ Submit clicked');
    
    // Wait for navigation
    await wait(5000);
    
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
      console.log('✓ Navigated to /chat');
    }
    
    console.log('4. Waiting 10 seconds for page to fully load...');
    await wait(10000);
    results.steps.push('Waited 10 seconds for page load');
    
    // Check for error boundary
    console.log('5. Checking for errors...');
    
    // Get all text content
    const bodyText = await page.evaluate(() => document.body.innerText);
    
    // Check for error keywords
    if (bodyText.toLowerCase().includes('something went wrong') || 
        bodyText.toLowerCase().includes('error occurred') ||
        bodyText.toLowerCase().includes('error boundary')) {
      results.errorShown = true;
      
      // Try to get error message
      const errorElements = await page.$$('h1, h2, [role="alert"]');
      for (const elem of errorElements) {
        const text = await page.evaluate(el => el.textContent, elem);
        if (text.toLowerCase().includes('error') || text.toLowerCase().includes('wrong')) {
          results.errorMessage = text;
          console.log('✗ Error found:', text);
          results.steps.push(`Error found: ${text}`);
          break;
        }
      }
    } else {
      console.log('✓ No error boundary detected');
      results.steps.push('No error boundary found');
    }
    
    // Check if chat loaded successfully
    console.log('6. Checking for chat interface...');
    
    // Look for chat-specific elements
    const chatInput = await page.$('textarea');
    const hasTextarea = !!chatInput;
    
    // Check for chat-related text
    const hasChatUI = bodyText.includes('Type a message') || 
                      bodyText.includes('Chat') ||
                      bodyText.includes('conversation');
    
    if (hasTextarea || hasChatUI) {
      results.chatPageLoaded = true;
      console.log('✓ Chat interface found');
      results.steps.push('Chat interface detected');
    } else {
      console.log('✗ Chat interface NOT found');
      results.steps.push('Chat interface NOT detected');
    }
    
    // Get page title
    const title = await page.title();
    results.steps.push(`Page title: ${title}`);
    console.log('Page title:', title);
    
    // Show page content preview
    console.log('\n--- Page Content Preview ---');
    console.log(bodyText.substring(0, 500));
    console.log('----------------------------\n');
    
    // Take final screenshot
    const screenshotPath = 'C:\Users\grube\op\operate-fresh\test-screenshots\chat-page-verification.png';
    await page.screenshot({ path: screenshotPath, fullPage: true });
    results.screenshot = screenshotPath;
    console.log('Screenshot saved to:', screenshotPath);
    results.steps.push('Screenshot captured');

  } catch (error) {
    console.error('✗ Test error:', error.message);
    results.error = error.message;
    results.steps.push(`ERROR: ${error.message}`);
    
    // Take error screenshot
    try {
      const errorScreenshotPath = 'C:\Users\grube\op\operate-fresh\test-screenshots\chat-page-error.png';
      await page.screenshot({ path: errorScreenshotPath, fullPage: true });
      results.screenshot = errorScreenshotPath;
      console.log('Error screenshot saved to:', errorScreenshotPath);
    } catch (e) {
      console.error('Screenshot error:', e.message);
    }
  } finally {
    // Save results
    const resultsPath = 'C:\Users\grube\op\operate-fresh\chat-page-test-results.json';
    fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
    
    console.log('\n╔════════════════════════════════════════╗');
    console.log('║         TEST RESULTS SUMMARY           ║');
    console.log('╠════════════════════════════════════════╣');
    console.log('║ Chat Page Loaded:', results.chatPageLoaded ? 'YES ✓        ║' : 'NO ✗         ║');
    console.log('║ Error Shown:     ', results.errorShown ? 'YES ✗        ║' : 'NO ✓         ║');
    if (results.errorMessage) {
      console.log('║ Error Message:', results.errorMessage.substring(0, 20), '║');
    }
    console.log('╚════════════════════════════════════════╝\n');
    
    console.log('Results saved to:', resultsPath);
    
    await wait(3000);
    await browser.close();
  }
}

testChatPage().catch(console.error);
