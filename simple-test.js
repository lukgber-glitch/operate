const puppeteer = require('puppeteer');

console.log('Starting simple Puppeteer test...');

async function test() {
  let browser;
  try {
    console.log('Launching browser...');
    browser = await puppeteer.launch({
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    console.log('Creating new page...');
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    console.log('Navigating to https://operate.guru/login...');
    await page.goto('https://operate.guru/login', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });

    console.log('Page loaded!');
    console.log('Title:', await page.title());
    console.log('URL:', page.url());

    // Wait for user to login manually
    console.log('\n--- MANUAL LOGIN REQUIRED ---');
    console.log('Please log in using Google OAuth in the browser window.');
    console.log('Waiting for 60 seconds for you to complete login...\n');

    await page.waitForTimeout(60000);

    console.log('\nCurrent URL after wait:', page.url());

    // Test if we're logged in by checking the current URL
    const currentUrl = page.url();
    if (currentUrl.includes('/dashboard') || currentUrl.includes('/chat') || !currentUrl.includes('/login')) {
      console.log('✓ Appears to be logged in!');

      // Take a screenshot
      console.log('\nTaking screenshot...');
      await page.screenshot({ path: 'C:\\Users\\grube\\op\\operate-fresh\\test-screenshot.png' });
      console.log('Screenshot saved to test-screenshot.png');

      // Try to navigate to dashboard
      console.log('\nNavigating to /dashboard...');
      await page.goto('https://operate.guru/dashboard', {
        waitUntil: 'domcontentloaded',
        timeout: 15000
      });

      await page.waitForTimeout(3000);

      console.log('Dashboard URL:', page.url());
      console.log('Dashboard Title:', await page.title());

      await page.screenshot({ path: 'C:\\Users\\grube\\op\\operate-fresh\\dashboard-screenshot.png' });
      console.log('Dashboard screenshot saved');

    } else {
      console.log('✗ Still on login page');
    }

    console.log('\nKeeping browser open for 10 more seconds...');
    await page.waitForTimeout(10000);

  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
  } finally {
    if (browser) {
      console.log('\nClosing browser...');
      await browser.close();
    }
    console.log('Done!');
  }
}

test().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
