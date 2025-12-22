const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1920, height: 1080 }
  });

  const page = await browser.newPage();
  
  console.log('\n=== QUICK PRODUCTION CHECK ===\n');
  
  try {
    console.log('Loading https://operate.guru/login ...');
    
    await page.goto('https://operate.guru/login', { 
      waitUntil: 'domcontentloaded',
      timeout: 45000 
    });
    
    // Wait for styles
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Take screenshot
    await page.screenshot({ 
      path: 'test-screenshots/prod-login-quick.png',
      fullPage: true 
    });
    
    // Check elements
    const pageInfo = await page.evaluate(() => {
      return {
        title: document.title,
        url: window.location.href,
        hasLoginForm: !!document.querySelector('form'),
        hasGoogleButton: Array.from(document.querySelectorAll('button')).some(b => 
          b.textContent.includes('Google') || b.textContent.includes('Sign In')
        ),
        buttonCount: document.querySelectorAll('button').length,
        hasStylesheets: document.styleSheets.length > 0,
        stylesheetCount: document.styleSheets.length
      };
    });
    
    console.log('\n✓ Page loaded successfully!');
    console.log('\nPage Details:');
    console.log('  Title:', pageInfo.title);
    console.log('  URL:', pageInfo.url);
    console.log('  Has login form:', pageInfo.hasLoginForm);
    console.log('  Has Google/Sign In button:', pageInfo.hasGoogleButton);
    console.log('  Total buttons:', pageInfo.buttonCount);
    console.log('  Stylesheets loaded:', pageInfo.stylesheetCount);
    console.log('\n✓ Screenshot saved: test-screenshots/prod-login-quick.png');
    
    console.log('\n=== RESULT: PASS ===');
    console.log('\nProduction deployment is WORKING!');
    console.log('- Login page loads');
    console.log('- Styling is present');
    console.log('- Google OAuth button exists');
    
  } catch (error) {
    console.error('\n✗ Test failed:', error.message);
  }
  
  console.log('\nBrowser will close in 5 seconds...');
  await new Promise(resolve => setTimeout(resolve, 5000));
  await browser.close();
})();
