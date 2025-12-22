const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ 
    headless: false,
    args: ['--no-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  
  try {
    console.log('Going to operate.guru...');
    await page.goto('https://operate.guru', { waitUntil: 'domcontentloaded', timeout: 30000 });
    
    await page.waitForTimeout(3000);
    
    console.log('Taking screenshot...');
    await page.screenshot({ path: 'test-screenshots/homepage.png', fullPage: true });
    
    const content = await page.content();
    console.log('Page title:', await page.title());
    console.log('Page URL:', page.url());
    
    console.log('\nPress Ctrl+C to close browser when done inspecting...');
    await page.waitForTimeout(60000);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
})();
