const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  const results = {
    timestamp: new Date().toISOString(),
    test: 'Chat Page Load Verification',
    steps: []
  };

  try {
    // Step 1: Navigate to login
    console.log('Step 1: Navigating to login page...');
    await page.goto('https://operate.guru/login', { waitUntil: 'networkidle0', timeout: 30000 });
    results.steps.push({
      step: 'Navigate to login',
      status: 'PASS',
      timestamp: new Date().toISOString()
    });

    await page.screenshot({ path: 'C:\Users\grube\op\operate-fresh\test-screenshots\chat-verify-01-login.png', fullPage: true });
    console.log('Screenshot saved: chat-verify-01-login.png');

    // Step 2: Fill in credentials
    console.log('Step 2: Filling in credentials...');
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    await page.type('input[type="email"]', 'luk.gber@gmail.com');
    await page.type('input[type="password"]', 'Schlagzeug1@');
    results.steps.push({
      step: 'Fill credentials',
      status: 'PASS',
      timestamp: new Date().toISOString()
    });

    await page.screenshot({ path: 'C:\Users\grube\op\operate-fresh\test-screenshots\chat-verify-02-filled.png', fullPage: true });
    console.log('Screenshot saved: chat-verify-02-filled.png');

    // Step 3: Submit login
    console.log('Step 3: Submitting login...');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 30000 }),
      page.click('button[type="submit"]')
    ]);
    
    const currentUrl = page.url();
    console.log('Current URL after login:', currentUrl);
    results.steps.push({
      step: 'Submit login',
      status: 'PASS',
      url: currentUrl,
      timestamp: new Date().toISOString()
    });

    await page.screenshot({ path: 'C:\Users\grube\op\operate-fresh\test-screenshots\chat-verify-03-after-login.png', fullPage: true });
    console.log('Screenshot saved: chat-verify-03-after-login.png');

    // Step 4: Wait for redirect to /chat
    console.log('Step 4: Waiting for redirect to /chat...');
    if (!currentUrl.includes('/chat')) {
      console.log('Not on chat page, waiting for redirect...');
      await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 30000 });
    }
    
    const chatUrl = page.url();
    console.log('Chat page URL:', chatUrl);
    results.steps.push({
      step: 'Redirect to chat',
      status: chatUrl.includes('/chat') ? 'PASS' : 'FAIL',
      url: chatUrl,
      timestamp: new Date().toISOString()
    });

    // Step 5: Wait 10 seconds for page to fully load
    console.log('Step 5: Waiting 10 seconds for page to fully load...');
    await page.waitForTimeout(10000);
    results.steps.push({
      step: 'Wait for page load',
      status: 'PASS',
      timestamp: new Date().toISOString()
    });

    // Step 6: Check for error boundary
    console.log('Step 6: Checking for error boundary...');
    const errorBoundary = await page.evaluate(() => {
      const errorText = document.body.textContent || '';
      return {
        hasError: errorText.includes('Something went wrong'),
        hasErrorBoundary: !!document.querySelector('[role="alert"]') || errorText.includes('Error'),
        bodyText: errorText.substring(0, 500)
      };
    });

    console.log('Error boundary check:', errorBoundary);
    results.errorBoundary = errorBoundary;

    // Step 7: Check for chat interface elements
    console.log('Step 7: Checking for chat interface elements...');
    const chatElements = await page.evaluate(() => {
      return {
        hasInput: !!document.querySelector('textarea') || !!document.querySelector('input[type="text"]'),
        hasSuggestionChips: document.body.textContent?.includes('Quick actions') || 
                           document.body.textContent?.includes('Suggestions') ||
                           !!document.querySelector('[data-testid*="suggestion"]') ||
                           !!document.querySelector('[class*="suggestion"]'),
        hasChatHistory: !!document.querySelector('[data-testid*="history"]') || 
                       !!document.querySelector('[class*="history"]'),
        visibleText: document.body.textContent?.substring(0, 1000)
      };
    });

    console.log('Chat elements check:', chatElements);
    results.chatElements = chatElements;

    // Take final screenshot
    await page.screenshot({ path: 'C:\Users\grube\op\operate-fresh\test-screenshots\chat-verify-04-final.png', fullPage: true });
    console.log('Screenshot saved: chat-verify-04-final.png');

    // Final assessment
    results.finalAssessment = {
      chatPageLoads: !errorBoundary.hasError && !errorBoundary.hasErrorBoundary,
      chatInterfaceVisible: chatElements.hasInput || chatElements.hasSuggestionChips,
      overallStatus: (!errorBoundary.hasError && !errorBoundary.hasErrorBoundary && 
                     (chatElements.hasInput || chatElements.hasSuggestionChips)) ? 'PASS' : 'FAIL'
    };

    console.log('\n=== TEST RESULTS ===');
    console.log('Chat page loads without error:', results.finalAssessment.chatPageLoads);
    console.log('Chat interface visible:', results.finalAssessment.chatInterfaceVisible);
    console.log('Overall status:', results.finalAssessment.overallStatus);

    // Save results
    fs.writeFileSync(
      'C:\Users\grube\op\operate-fresh\CHAT_PAGE_VERIFICATION.json',
      JSON.stringify(results, null, 2)
    );

    console.log('\nResults saved to CHAT_PAGE_VERIFICATION.json');

  } catch (error) {
    console.error('Test failed with error:', error);
    results.error = error.toString();
    results.finalAssessment = {
      chatPageLoads: false,
      chatInterfaceVisible: false,
      overallStatus: 'FAIL'
    };
    
    await page.screenshot({ path: 'C:\Users\grube\op\operate-fresh\test-screenshots\chat-verify-error.png', fullPage: true });
    
    fs.writeFileSync(
      'C:\Users\grube\op\operate-fresh\CHAT_PAGE_VERIFICATION.json',
      JSON.stringify(results, null, 2)
    );
  } finally {
    await browser.close();
  }
})();
