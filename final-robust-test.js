const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1920, height: 1080 },
    args: ['--no-sandbox']
  });
  
  const page = await browser.newPage();
  const errors = [];
  
  page.on('pageerror', err => errors.push(err.message));
  
  console.log('=== FINAL LOGIN + CHAT TEST ===\n');
  
  try {
    console.log('1. Navigating to login page...');
    await page.goto('https://operate.guru/login', { 
      waitUntil: 'domcontentloaded', 
      timeout: 60000 
    });
    await new Promise(r => setTimeout(r, 3000));
    await page.screenshot({ path: 'test-screenshots/step1-login.png', fullPage: true });
    console.log('   SUCCESS - Login page loaded\n');
    
    console.log('2. Filling email...');
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    await page.type('input[type="email"]', 'test@operate.guru', { delay: 100 });
    console.log('   SUCCESS\n');
    
    console.log('3. Filling password...');
    await page.type('input[type="password"]', 'TestPassword123!', { delay: 100 });
    console.log('   SUCCESS\n');
    
    console.log('4. Clicking sign in...');
    await page.screenshot({ path: 'test-screenshots/step2-before-submit.png', fullPage: true });
    await page.click('button[type="submit"]');
    console.log('   SUCCESS - Button clicked\n');
    
    console.log('5. Waiting 8 seconds for redirect...');
    await new Promise(r => setTimeout(r, 8000));
    const urlAfter = page.url();
    console.log('   URL after login:', urlAfter);
    await page.screenshot({ path: 'test-screenshots/step3-after-login.png', fullPage: true });
    
    console.log('\n6. Navigating to chat...');
    if (!urlAfter.includes('/chat')) {
      console.log('   Not on /chat, navigating...');
      await page.goto('https://operate.guru/chat', { 
        waitUntil: 'domcontentloaded', 
        timeout: 60000 
      });
    } else {
      console.log('   Already on /chat');
    }
    
    console.log('\n7. Waiting 10 seconds for chat to load...');
    await new Promise(r => setTimeout(r, 10000));
    const finalUrl = page.url();
    console.log('   Final URL:', finalUrl);
    
    console.log('\n8. Analyzing page...');
    await page.screenshot({ path: 'test-screenshots/step4-chat-final.png', fullPage: true });
    
    const analysis = await page.evaluate(() => {
      return {
        finalUrl: window.location.href,
        hasErrorText: document.body.innerText.includes('Something went wrong!'),
        greeting: document.querySelector('h1') ? document.querySelector('h1').innerText : 'NOT FOUND',
        hasInput: !!(document.querySelector('input[type="text"]') || document.querySelector('textarea')),
        inputPlaceholder: (document.querySelector('input[type="text"]') || document.querySelector('textarea') || {}).placeholder,
        buttonCount: document.querySelectorAll('button').length,
        hasSidebar: !!document.querySelector('aside') || !!document.querySelector('nav'),
        headings: Array.from(document.querySelectorAll('h1, h2, h3')).map(h => h.innerText).slice(0, 5)
      };
    });
    
    console.log('\n=== RESULTS ===');
    console.log('Final URL:', analysis.finalUrl);
    console.log('"Something went wrong!" error:', analysis.hasErrorText ? 'YES - ERROR FOUND!' : 'NO');
    console.log('Chat input found:', analysis.hasInput ? 'YES' : 'NO');
    console.log('Input placeholder:', analysis.inputPlaceholder || 'N/A');
    console.log('Greeting:', analysis.greeting);
    console.log('Button count:', analysis.buttonCount);
    console.log('Has sidebar:', analysis.hasSidebar);
    console.log('Headings:', analysis.headings);
    console.log('\nJavaScript Errors:', errors.length);
    
    if (errors.length > 0) {
      console.log('\n=== JS ERRORS ===');
      errors.forEach((e, i) => console.log(`${i+1}. ${e}`));
    }
    
    const filterErrors = errors.filter(e => 
      e.includes('.filter') || e.includes('.map') || e.includes('.reduce')
    );
    if (filterErrors.length > 0) {
      console.log('\n=== ARRAY METHOD ERRORS ===');
      filterErrors.forEach(e => console.log(' -', e));
    }
    
    const report = {
      timestamp: new Date().toISOString(),
      finalUrl: analysis.finalUrl,
      hasErrorMessage: analysis.hasErrorText,
      chatInterfacePresent: analysis.hasInput,
      jsErrors: errors,
      arrayMethodErrors: filterErrors,
      uiElements: analysis
    };
    
    fs.writeFileSync('FINAL_TEST_REPORT.json', JSON.stringify(report, null, 2));
    console.log('\nReport saved to FINAL_TEST_REPORT.json');
    
  } catch (error) {
    console.error('\n!!! TEST FAILED !!!');
    console.error('Error:', error.message);
    await page.screenshot({ path: 'test-screenshots/error-state.png', fullPage: true });
  }
  
  console.log('\nClosing browser in 5 seconds...');
  await new Promise(r => setTimeout(r, 5000));
  await browser.close();
})();
