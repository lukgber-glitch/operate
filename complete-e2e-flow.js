const puppeteer = require('puppeteer');

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

(async () => {
  console.log('=== CHAT E2E TEST ===
');
  const browser = await puppeteer.launch({ headless: false, defaultViewport: null, args: ['--start-maximized'] });
  const page = await browser.newPage();
  
  try {
    // STEP 1: Login
    console.log('STEP 1: Login via Google OAuth');
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle0', timeout: 30000 });
    await wait(3000);
    await page.screenshot({ path: 'test-screenshots/chat-e2e-01-login.png', fullPage: true });
    
    const googleLink = await page.$('a[aria-label="Sign in with Google"]');
    if (!googleLink) {
      console.log('ERROR: Google OAuth link not found');
      await browser.close();
      return;
    }
    
    console.log('Clicking Google OAuth link...');
    await googleLink.click();
    await wait(5000);
    
    console.log('Please complete Google OAuth manually (email: luk.gber@gmail.com, password: schlagzeug)');
    console.log('Waiting 60 seconds for manual OAuth completion...');
    await wait(60000);
    
    // STEP 2: Navigate to chat
    console.log('
STEP 2: Navigate to chat');
    await page.goto('http://localhost:3000/chat', { waitUntil: 'networkidle0', timeout: 30000 });
    await wait(3000);
    await page.screenshot({ path: 'test-screenshots/chat-e2e-02-chat-page.png', fullPage: true });
    
    if (page.url().includes('login')) {
      console.log('ERROR: Still on login - auth failed');
      await browser.close();
      return;
    }
    console.log('PASS - On chat page');
    
    // STEP 3: Find input
    console.log('
STEP 3: Find chat input');
    const input = await page.$('textarea');
    if (!input) {
      console.log('ERROR: No textarea found');
      await browser.close();
      return;
    }
    console.log('PASS - Textarea found');
    
    // STEP 4: Type message
    console.log('
STEP 4: Type message');
    await input.click();
    await wait(500);
    await input.type('Hello, what can you help me with?', { delay: 50 });
    await wait(1000);
    await page.screenshot({ path: 'test-screenshots/chat-e2e-03-typed.png', fullPage: true });
    console.log('PASS - Message typed');
    
    // STEP 5: Send message
    console.log('
STEP 5: Send message');
    const btn = await page.$('button[type="submit"]');
    if (btn) {
      await btn.click();
      console.log('PASS - Clicked send button');
    } else {
      await input.press('Enter');
      console.log('PASS - Pressed Enter');
    }
    
    await wait(2000);
    await page.screenshot({ path: 'test-screenshots/chat-e2e-04-sent.png', fullPage: true });
    
    // STEP 6: Wait for response
    console.log('
STEP 6: Wait for AI response (10 seconds)...');
    await wait(10000);
    await page.screenshot({ path: 'test-screenshots/chat-e2e-05-response.png', fullPage: true });
    
    // STEP 7: Verify
    console.log('
STEP 7: Verify messages');
    const msgs = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('[role="article"], .message, [class*="message"]')).map(e => e.textContent.trim().substring(0, 100));
    });
    
    console.log('Messages found:', msgs.length);
    msgs.forEach((m, i) => console.log());
    
    const userSent = msgs.some(m => m.includes('Hello'));
    const aiResponse = msgs.length > 1;
    
    console.log('
=== RESULTS ===');
    console.log('User message sent:', userSent ? 'YES' : 'NO');
    console.log('AI response received:', aiResponse ? 'YES' : 'NO');
    console.log('Status:', userSent && aiResponse ? 'PASS' : 'PARTIAL');
    
  } catch (error) {
    console.error('ERROR:', error.message);
    await page.screenshot({ path: 'test-screenshots/chat-e2e-error.png', fullPage: true });
  } finally {
    console.log('
Closing in 5 seconds...');
    await wait(5000);
    await browser.close();
  }
})();
