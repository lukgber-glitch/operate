/**
 * Detailed Login and Dashboard Test
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function testLoginDetailed() {
  console.log('🔍 Detailed Login Page Analysis\n');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  const page = await browser.newPage();
  const consoleMessages = [];
  const networkRequests = [];
  const failedRequests = [];

  // Monitor console
  page.on('console', msg => {
    consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
  });

  // Monitor network
  page.on('request', request => {
    networkRequests.push(`${request.method()} ${request.url()}`);
  });

  page.on('requestfailed', request => {
    failedRequests.push({
      url: request.url(),
      error: request.failure().errorText
    });
  });

  try {
    console.log('Navigating to /login...');

    const response = await page.goto('https://operate.guru/login', {
      waitUntil: 'networkidle0',
      timeout: 30000
    });

    console.log(`✓ Page loaded with status: ${response.status()}`);
    console.log(`✓ Final URL: ${page.url()}\n`);

    // Get page content info
    const pageInfo = await page.evaluate(() => {
      return {
        title: document.title,
        hasEmailInput: !!document.querySelector('input[type="email"]'),
        hasPasswordInput: !!document.querySelector('input[type="password"]'),
        hasSubmitButton: !!document.querySelector('button[type="submit"]'),
        bodyClasses: document.body.className,
        metaTags: Array.from(document.querySelectorAll('meta')).map(m => ({
          name: m.getAttribute('name'),
          content: m.getAttribute('content')
        })).filter(m => m.name)
      };
    });

    console.log('Page Info:');
    console.log(`  Title: ${pageInfo.title}`);
    console.log(`  Has Email Input: ${pageInfo.hasEmailInput}`);
    console.log(`  Has Password Input: ${pageInfo.hasPasswordInput}`);
    console.log(`  Has Submit Button: ${pageInfo.hasSubmitButton}\n`);

    // Screenshot
    const screenshotPath = path.join(__dirname, 'test-screenshots', 'login-detailed.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`✓ Screenshot saved: ${screenshotPath}\n`);

    // Console messages
    if (consoleMessages.length > 0) {
      console.log(`Console Messages (${consoleMessages.length}):`);
      consoleMessages.forEach(msg => console.log(`  ${msg}`));
      console.log();
    }

    // Failed requests
    if (failedRequests.length > 0) {
      console.log(`Failed Requests (${failedRequests.length}):`);
      failedRequests.forEach(req => {
        console.log(`  ${req.url}`);
        console.log(`    Error: ${req.error}`);
      });
      console.log();
    }

    // Network summary
    const totalRequests = networkRequests.length;
    const jsRequests = networkRequests.filter(r => r.includes('.js')).length;
    const cssRequests = networkRequests.filter(r => r.includes('.css')).length;
    const apiRequests = networkRequests.filter(r => r.includes('/api/')).length;

    console.log('Network Summary:');
    console.log(`  Total Requests: ${totalRequests}`);
    console.log(`  JS Files: ${jsRequests}`);
    console.log(`  CSS Files: ${cssRequests}`);
    console.log(`  API Calls: ${apiRequests}\n`);

  } catch (error) {
    console.error(`✗ Error: ${error.message}\n`);

    // Try to get partial info
    try {
      const url = page.url();
      console.log(`Current URL: ${url}`);

      const screenshotPath = path.join(__dirname, 'test-screenshots', 'login-error.png');
      await page.screenshot({ path: screenshotPath, fullPage: true });
      console.log(`Screenshot saved: ${screenshotPath}\n`);
    } catch (e) {
      console.error('Could not capture error screenshot');
    }

    console.log(`Console Messages (${consoleMessages.length}):`);
    consoleMessages.forEach(msg => console.log(`  ${msg}`));
    console.log();

    if (failedRequests.length > 0) {
      console.log(`Failed Requests (${failedRequests.length}):`);
      failedRequests.forEach(req => {
        console.log(`  ${req.url}: ${req.error}`);
      });
    }
  }

  await browser.close();
}

async function testDashboardDetailed() {
  console.log('\n🔍 Detailed Dashboard Page Analysis\n');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  const page = await browser.newPage();
  const consoleMessages = [];
  const failedRequests = [];

  page.on('console', msg => {
    consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
  });

  page.on('requestfailed', request => {
    failedRequests.push({
      url: request.url(),
      error: request.failure().errorText
    });
  });

  try {
    console.log('Navigating to /dashboard...');

    const response = await page.goto('https://operate.guru/dashboard', {
      waitUntil: 'networkidle0',
      timeout: 30000
    });

    console.log(`✓ Page loaded with status: ${response.status()}`);
    console.log(`✓ Final URL: ${page.url()}`);

    const screenshotPath = path.join(__dirname, 'test-screenshots', 'dashboard-detailed.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`✓ Screenshot saved: ${screenshotPath}\n`);

  } catch (error) {
    console.error(`✗ Error: ${error.message}`);

    try {
      const url = page.url();
      console.log(`Current URL after error: ${url}`);

      const screenshotPath = path.join(__dirname, 'test-screenshots', 'dashboard-error.png');
      await page.screenshot({ path: screenshotPath, fullPage: true });
      console.log(`Screenshot saved: ${screenshotPath}\n`);
    } catch (e) {
      console.error('Could not capture error screenshot');
    }

    if (consoleMessages.length > 0) {
      console.log(`Console Messages (${consoleMessages.length}):`);
      consoleMessages.forEach(msg => console.log(`  ${msg}`));
    }

    if (failedRequests.length > 0) {
      console.log(`\nFailed Requests (${failedRequests.length}):`);
      failedRequests.forEach(req => {
        console.log(`  ${req.url}: ${req.error}`);
      });
    }
  }

  await browser.close();
}

async function run() {
  await testLoginDetailed();
  await testDashboardDetailed();
}

run().catch(console.error);
