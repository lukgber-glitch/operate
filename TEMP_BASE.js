const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const CONFIG = {
  baseUrl: 'https://operate.guru',
  debugPort: 9222,
  screenshotDir: path.join(__dirname, 'test-screenshots', 'batch-01'),
  timeout: 60000,
};

const BATCH_01_PAGES = [
  { route: '/login', name: 'Login Page', elements: ['input[type="email"]', 'input[type="password"]', 'button[type="submit"]'] },
  { route: '/register', name: 'Register Page', elements: ['input[type="email"]', 'input[type="password"]'] },
  { route: '/forgot-password', name: 'Forgot Password', elements: ['input[type="email"]', 'button[type="submit"]'] },
  { route: '/reset-password', name: 'Reset Password', elements: [] },
  { route: '/verify-email', name: 'Verify Email', elements: [] },
  { route: '/mfa-setup', name: 'MFA Setup', elements: [], requiresAuth: true },
  { route: '/mfa-verify', name: 'MFA Verify', elements: [], requiresAuth: true },
  { route: '/auth/callback', name: 'OAuth Callback', elements: [] },
  { route: '/auth/error?error=test_error', name: 'Auth Error', elements: [] },
  { route: '/onboarding', name: 'Onboarding', elements: [], requiresAuth: true },
];

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testPage(browser, pageSpec) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  
  const result = {
    route: pageSpec.route,
    name: pageSpec.name,
    status: 'UNKNOWN',
    httpStatus: null,
    finalUrl: null,
    elementsFound: [],
    elementsMissing: [],
    consoleErrors: [],
    screenshot: null,
  };

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  try {
    console.log('Testing:', pageSpec.name, '-', CONFIG.baseUrl + pageSpec.route);
    
    const response = await page.goto(CONFIG.baseUrl + pageSpec.route, {
      waitUntil: 'domcontentloaded',
      timeout: CONFIG.timeout,
    });

    result.httpStatus = response ? response.status() : null;
    result.finalUrl = page.url();
    
    await delay(3000);

    // Screenshot
    const screenshotName = pageSpec.route.replace(/\//g, '-').replace(/\?/g, '_') + '.png';
    const screenshotPath = path.join(CONFIG.screenshotDir, screenshotName);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    result.screenshot = screenshotPath;
    console.log('  Screenshot:', screenshotName);

    // Check elements
    if (pageSpec.elements && pageSpec.elements.length > 0) {
      for (const selector of pageSpec.elements) {
        try {
          const elem = await page.$(selector);
          if (elem) {
            result.elementsFound.push(selector);
            console.log('  Found:', selector);
          } else {
            result.elementsMissing.push(selector);
            console.log('  Missing:', selector);
          }
        } catch (e) {
          result.elementsMissing.push(selector);
        }
      }
    }

    result.consoleErrors = consoleErrors;
    
    if (result.httpStatus === 200 && result.elementsMissing.length === 0) {
      result.status = 'PASS';
    } else if (result.elementsMissing.length > 0) {
      result.status = 'FAIL';
    } else {
      result.status = 'WARNING';
    }

    console.log('  Status:', result.status, '\n');

  } catch (error) {
    result.status = 'ERROR';
    result.error = error.message;
    console.error('  ERROR:', error.message, '\n');
  } finally {
    await page.close();
  }

  return result;
}

async function runTests() {
  console.log('='.repeat(80));
  console.log('BATCH 01: AUTH PAGES TEST');
  console.log('='.repeat(80));
  console.log('Base URL:', CONFIG.baseUrl);
  console.log('Debug Port:', CONFIG.debugPort);
  console.log('Total Pages:', BATCH_01_PAGES.length);
  console.log('='.repeat(80), '\n');

  if (!fs.existsSync(CONFIG.screenshotDir)) {
