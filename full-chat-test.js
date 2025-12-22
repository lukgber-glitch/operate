const puppeteer = require('puppeteer');

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

(async () => {
  console.log('\n=== CHAT E2E TEST ===\n');
  
  const browser = await puppeteer.launch({ 
    headless: false, 
    defaultViewport: null,
    args: ['--start-maximized']
  });
  
  const page = await browser.newPage();
  
  try {
    // STEP 1: Login via Google OAuth
    console.log('STEP 1: Login via Google OAuth');
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle0', timeout: 30000 });
    await wait(3000);
    await page.screenshot({ path: 'test-screenshots/chat-test-01-login.png', fullPage: true });
    
    // Click Google OAuth button
    console.log('Looking for Google OAuth button...');
    
    // Try multiple selectors
    const selectors = [
      'button[data-provider="google"]',
      'button:has-text("Google")',
      'button svg[class*="google"]',
      'div[class*="oauth"] button:first-of-type',
      'button[aria-label*="Google"]'
    ];
    
    let googleBtn = null;
    for (const selector of selectors) {
      try {
        googleBtn = await page.$(selector);
        if (googleBtn) {
          console.log('Found Google button with selector:', selector);
          break;
        }
      } catch (e) {}
    }
    
    if (!googleBtn) {
      console.log('ERROR: Google OAuth button not found');
      console.log('Available buttons:');
      const buttons = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('button')).map(b => ({
          text: b.textContent.trim().substring(0, 50),
          class: b.className,
          id: b.id
        }));
      });
      console.log(JSON.stringify(buttons, null, 2));
      await browser.close();
      return;
    }
    
    console.log('Clicking Google OAuth button...');
    await googleBtn.click();
    
    // Wait for either Google OAuth page OR redirect to chat (if already logged in)
    await wait(5000);
    const currentUrl = page.url();
    console.log('Current URL after Google click:', currentUrl);
    await page.screenshot({ path: 'test-screenshots/chat-test-02-after-google-click.png', fullPage: true });
    
    // Check if we're on Google OAuth page
    if (currentUrl.includes('accounts.google.com')) {
      console.log('On Google OAuth page, filling credentials...');
      
      // Fill email
      const emailInput = await page.waitForSelector('input[type="email"]', { timeout: 10000 }).catch(() => null);
      if (emailInput) {
        await emailInput.type('luk.gber@gmail.com', { delay: 50 });
        await wait(1000);
        
        const nextBtn = await page.$('button:has-text("Next")') || await page.$('#identifierNext') || await page.$('button[type="button"]');
        if (nextBtn) {
          await nextBtn.click();
          await wait(3000);
        }
        
        // Fill password
        const passwordInput = await page.waitForSelector('input[type="password"]', { timeout: 10000 }).catch(() => null);
        if (passwordInput) {
          await passwordInput.type('schlagzeug', { delay: 50 });
          await wait(1000);
          
          const signInBtn = await page.$('button:has-text("Next")') || await page.$('#passwordNext') || await page.$('button[type="button"]');
          if (signInBtn) {
            await signInBtn.click();
            await wait(5000);
          }
        }
      }
      
      // Wait for redirect back
      await wait(5000);
    }
    
    await page.screenshot({ path: 'test-screenshots/chat-test-03-after-login.png', fullPage: true });
    console.log('Login completed, current URL:', page.url());
    
    // STEP 2: Navigate to chat
    console.log('\nSTEP 2: Navigate to /chat');
    await page.goto('http://localhost:3000/chat', { waitUntil: 'networkidle0', timeout: 30000 });
    await wait(3000);
    await page.screenshot({ path: 'test-screenshots/chat-test-04-chat-page.png', fullPage: true });
    console.log('Chat page loaded, URL:', page.url());
    
    // Check if redirected to login
    if (page.url().includes('login')) {
      console.log('ERROR: Still on login page, authentication failed');
      await browser.close();
      return;
    }
    
    // STEP 3: Find chat input
    console.log('\nSTEP 3: Find chat input');
    const textarea = await page.$('textarea');
    if (!textarea) {
      console.log('ERROR: No textarea found on chat page');
      const pageContent = await page.evaluate(() => document.body.innerText.substring(0, 500));
      console.log('Page content:', pageContent);
      await browser.close();
      return;
    }
    console.log('PASS - Textarea found');
    
    // STEP 4: Type message
    console.log('\nSTEP 4: Type test message');
    await textarea.click();
    await wait(500);
    await textarea.type('Hello, what can you help me with?', { delay: 50 });
    await wait(1000);
    await page.screenshot({ path: 'test-screenshots/chat-test-05-typed.png', fullPage: true });
    console.log('PASS - Message typed');
    
    // STEP 5: Send message
    console.log('\nSTEP 5: Send message');
    const submitBtn = await page.$('button[type="submit"]');
    if (submitBtn) {
      await submitBtn.click();
      console.log('PASS - Clicked send button');
    } else {
      await textarea.press('Enter');
      console.log('PASS - Pressed Enter');
    }
    
    await wait(2000);
    await page.screenshot({ path: 'test-screenshots/chat-test-06-sent.png', fullPage: true });
    
    // STEP 6: Wait for AI response
    console.log('\nSTEP 6: Wait for AI response (10 seconds)...');
    await wait(10000);
    await page.screenshot({ path: 'test-screenshots/chat-test-07-response.png', fullPage: true });
    
    // STEP 7: Verify messages
    console.log('\nSTEP 7: Verify messages');
    const messages = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('[role="article"], .message, [class*="message"], [class*="chat"]'));
      return elements.map(e => e.textContent.trim().substring(0, 150));
    });
    
    console.log('\nMessages found:', messages.length);
    messages.forEach((msg, i) => {
      console.log(`  ${i+1}. ${msg}`);
    });
    
    const userMsgSent = messages.some(m => m.includes('Hello'));
    const aiResponse = messages.length > 1;
    
    console.log('\n=== FINAL RESULTS ===');
    console.log('User message sent:', userMsgSent ? 'YES' : 'NO');
    console.log('AI response received:', aiResponse ? 'YES' : 'NO');
    console.log('Total messages:', messages.length);
    console.log('Test status:', userMsgSent && aiResponse ? 'PASS' : 'PARTIAL');
    
  } catch (error) {
    console.error('\nERROR:', error.message);
    console.error(error.stack);
    await page.screenshot({ path: 'test-screenshots/chat-test-error.png', fullPage: true });
  } finally {
    console.log('\nClosing browser in 5 seconds...');
    await wait(5000);
    await browser.close();
  }
})();
