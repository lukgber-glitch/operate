const puppeteer = require('puppeteer');

const APP_URL = 'https://operate.guru';

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function captureResponsiveViews() {
  let browser;

  try {
    console.log('Starting responsive visual capture...\n');

    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const viewports = [
      { name: 'Desktop-1920', width: 1920, height: 1080 },
      { name: 'Desktop-1440', width: 1440, height: 900 },
      { name: 'Tablet-768', width: 768, height: 1024 },
      { name: 'Mobile-375', width: 375, height: 812 },
      { name: 'Mobile-414', width: 414, height: 896 }
    ];

    for (const viewport of viewports) {
      console.log(`Capturing ${viewport.name} (${viewport.width}x${viewport.height})...`);

      const page = await browser.newPage();
      await page.setViewport({
        width: viewport.width,
        height: viewport.height,
        deviceScaleFactor: 1
      });

      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

      // Navigate to login page
      await page.goto(APP_URL, { waitUntil: 'networkidle2', timeout: 30000 });
      await delay(3000); // Wait for any animations

      // Take full page screenshot
      await page.screenshot({
        path: `responsive-${viewport.name}.png`,
        fullPage: true
      });

      console.log(`  ✓ Saved responsive-${viewport.name}.png`);

      // Get page info
      const info = await page.evaluate(() => {
        return {
          url: window.location.href,
          title: document.title,
          hasHorizontalScroll: document.documentElement.scrollWidth > document.documentElement.clientWidth,
          bodyHeight: document.body.scrollHeight,
          viewportHeight: window.innerHeight
        };
      });

      console.log(`  URL: ${info.url}`);
      console.log(`  Title: ${info.title}`);
      console.log(`  Horizontal Scroll: ${info.hasHorizontalScroll ? 'YES ⚠️' : 'NO ✓'}`);
      console.log(`  Content Height: ${info.bodyHeight}px`);
      console.log('');

      await page.close();
    }

    console.log('✅ All responsive captures completed!');
    console.log('\nGenerated files:');
    console.log('  - responsive-Desktop-1920.png');
    console.log('  - responsive-Desktop-1440.png');
    console.log('  - responsive-Tablet-768.png');
    console.log('  - responsive-Mobile-375.png');
    console.log('  - responsive-Mobile-414.png');

  } catch (error) {
    console.error('Error during capture:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

captureResponsiveViews();
