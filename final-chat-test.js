const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1920, height: 1080 }
  });
  
  const page = await browser.newPage();
  const errors = [];
  
  page.on('pageerror', error => {
    errors.push({ message: error.message });
    console.log('[ERROR]', error.message);
  });
  
  try {
    console.log('Step 1: Navigate to login');
    await page.goto('https://operate.guru/login', { waitUntil: 'networkidle2', timeout: 30000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'test-screenshots/final-01-login.png', fullPage: true });
    
    console.log('Step 2: Fill email');
    await page.type('input[type="email"]', 'test@operate.guru');
    
    console.log('Step 3: Fill password');
    await page.type('input[type="password"]', 'TestPassword123!');
    
    console.log('Step 4: Click signin');
    await page.screenshot({ path: 'test-screenshots/final-02-before-signin.png', fullPage: true });
    await page.click('button[type="submit"]');
    
    console.log('Step 5: Wait 8 seconds');
    await page.waitForTimeout(8000);
    const urlAfterLogin = page.url();
    console.log('URL after login:', urlAfterLogin);
    await page.screenshot({ path: 'test-screenshots/final-03-after-login.png', fullPage: true });
    
    console.log('Step 6: Navigate to chat if needed');
    if (!urlAfterLogin.includes('/chat')) {
      await page.goto('https://operate.guru/chat', { waitUntil: 'networkidle2', timeout: 30000 });
    }
    
    console.log('Step 7: Wait 10 seconds for chat to load');
    await page.waitForTimeout(10000);
    const finalUrl = page.url();
    console.log('Final URL:', finalUrl);
    
    console.log('Step 8: Analyze page');
    await page.screenshot({ path: 'test-screenshots/final-04-chat.png', fullPage: true });
    
    const pageData = await page.evaluate(() => {
      const data = {
        hasError: document.body.innerText.includes('Something went wrong!'),
        elements: []
      };
      
      const greeting = document.querySelector('h1');
      if (greeting) data.elements.push({ type: 'Greeting', text: greeting.innerText });
      
      const input = document.querySelector('input[type="text"]') || document.querySelector('textarea');
      if (input) data.elements.push({ type: 'Input', placeholder: input.placeholder });
      
      const buttons = document.querySelectorAll('button');
      data.elements.push({ type: 'Buttons', count: buttons.length });
      
      return data;
    });
    
    console.log('\n=== RESULTS ===');
    console.log('Final URL:', finalUrl);
    console.log('Has Error:', pageData.hasError);
    console.log('JS Errors:', errors.length);
    console.log('UI Elements:', JSON.stringify(pageData.elements, null, 2));
    
    if (errors.length > 0) {
      console.log('\nJavaScript Errors:');
      errors.forEach(e => console.log(' -', e.message));
    }
    
    fs.writeFileSync('FINAL_TEST_RESULTS.json', JSON.stringify({
      finalUrl,
      hasError: pageData.hasError,
      jsErrors: errors,
      elements: pageData.elements
    }, null, 2));
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
  
  await page.waitForTimeout(5000);
  await browser.close();
})();
