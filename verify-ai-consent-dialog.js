const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--start-maximized', '--no-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  console.log('Navigating to login page...');
  await page.goto('https://operate.guru/login', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await new Promise(r => setTimeout(r, 3000));

  console.log('Taking screenshot of login page...');
  await page.screenshot({ path: 'test-screenshots/01-login-page.png' });

  console.log('\n=== MANUAL STEP REQUIRED ===');
  console.log('Please login manually using:');
  console.log('Email: luk.gber@gmail.com');
  console.log('Password: schlagzeug');
  console.log('\nPress Enter in this terminal once you are logged in and on the dashboard...');

  // Wait for user to press Enter
  await new Promise(resolve => {
    process.stdin.once('data', () => resolve());
  });

  console.log('Navigating to chat page...');
  await page.goto('https://operate.guru/chat', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await new Promise(r => setTimeout(r, 3000));

  console.log('Taking screenshot of chat page...');
  await page.screenshot({ path: 'test-screenshots/02-chat-page-with-dialog.png', fullPage: true });

  // Check if dialog is present
  const dialogExists = await page.evaluate(() => {
    const dialog = document.querySelector('[role="dialog"]') || document.querySelector('.dialog') || document.querySelector('[class*="dialog"]');
    if (dialog) {
      const rect = dialog.getBoundingClientRect();
      const buttons = dialog.querySelectorAll('button');
      return {
        found: true,
        height: rect.height,
        width: rect.width,
        buttons: Array.from(buttons).map(btn => ({
          text: btn.textContent.trim(),
          visible: btn.offsetHeight > 0 && btn.offsetWidth > 0,
          rect: btn.getBoundingClientRect()
        }))
      };
    }
    return { found: false };
  });

  console.log('\n=== AI CONSENT DIALOG CHECK ===');
  console.log(JSON.stringify(dialogExists, null, 2));

  console.log('\nScreenshots saved:');
  console.log('- test-screenshots/01-login-page.png');
  console.log('- test-screenshots/02-chat-page-with-dialog.png');

  console.log('\nPress Enter to close browser...');
  await new Promise(resolve => {
    process.stdin.once('data', () => resolve());
  });

  await browser.close();
})();
