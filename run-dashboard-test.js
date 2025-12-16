#!/usr/bin/env node

/**
 * Operate.guru Dashboard Testing Suite
 *
 * This script automates testing of all main dashboard pages
 * Requires manual Google OAuth login
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Configuration
const BASE_URL = 'https://operate.guru';
const SCREENSHOT_DIR = path.join(__dirname, 'screenshots');
const RESULTS_FILE = path.join(__dirname, 'test-results.json');
const LOGIN_WAIT_TIME = 90000; // 90 seconds for manual login
const PAGE_LOAD_TIMEOUT = 30000; // 30 seconds

// Pages to test
const PAGES = [
  { path: '/dashboard', name: 'Main Dashboard', checks: ['widgets'] },
  { path: '/chat', name: 'AI Chat', checks: ['chat-input'] },
  { path: '/autopilot', name: 'Autopilot Settings', checks: ['form'] },
  { path: '/autopilot/actions', name: 'Autopilot Actions', checks: ['list'] },
  { path: '/calendar', name: 'Calendar', checks: ['calendar'] },
  { path: '/tasks', name: 'Tasks', checks: ['list'] },
  { path: '/notifications', name: 'Notifications', checks: ['list'] },
  { path: '/notifications/inbox', name: 'Notification Inbox', checks: ['list'] },
  { path: '/search', name: 'Global Search', checks: ['search-input'] },
  { path: '/profile', name: 'User Profile', checks: ['profile-data'] },
  { path: '/settings', name: 'Settings', checks: ['settings-nav'] },
  { path: '/settings/profile', name: 'Profile Settings', checks: ['form'] },
  { path: '/settings/security', name: 'Security Settings', checks: ['form'] },
  { path: '/settings/notifications', name: 'Notification Preferences', checks: ['form'] },
  { path: '/settings/billing', name: 'Billing', checks: ['billing-info'] }
];

// Test results
const results = {
  timestamp: new Date().toISOString(),
  summary: {
    total: PAGES.length,
    passed: 0,
    failed: 0,
    skipped: 0
  },
  issues: [],
  pages: []
};

/**
 * Initialize test environment
 */
function init() {
  console.log('==============================================');
  console.log('Operate.guru Dashboard Testing Suite');
  console.log('==============================================\n');

  // Create screenshot directory
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
    console.log(`Created screenshot directory: ${SCREENSHOT_DIR}\n`);
  }
}

/**
 * Test a single page
 */
async function testPage(page, pageConfig, index) {
  const pageResult = {
    path: pageConfig.path,
    name: pageConfig.name,
    status: 'pending',
    errors: [],
    warnings: [],
    timestamp: new Date().toISOString(),
    metrics: {}
  };

  console.log(`\n[${ index + 1}/${PAGES.length}] Testing: ${pageConfig.name}`);
  console.log(`URL: ${BASE_URL}${pageConfig.path}`);

  const startTime = Date.now();

  try {
    // Navigate to page
    const response = await page.goto(`${BASE_URL}${pageConfig.path}`, {
      waitUntil: 'networkidle2',
      timeout: PAGE_LOAD_TIMEOUT
    });

    const loadTime = Date.now() - startTime;
    pageResult.metrics.loadTime = loadTime;
    console.log(`  Load time: ${loadTime}ms`);

    // Check HTTP status
    const status = response.status();
    pageResult.metrics.httpStatus = status;

    if (status >= 400) {
      pageResult.errors.push(`HTTP ${status} error`);
      console.log(`  ✗ HTTP ${status} error`);
    } else {
      console.log(`  ✓ HTTP ${status}`);
    }

    // Wait for content to load
    await page.waitForTimeout(2000);

    // Get page title
    const title = await page.title();
    pageResult.metrics.title = title;
    console.log(`  Title: "${title}"`);

    // Check for page content
    const bodyText = await page.evaluate(() => document.body.innerText);
    pageResult.metrics.contentLength = bodyText.length;

    if (bodyText.length < 50) {
      pageResult.errors.push('Page appears to be empty or has minimal content');
      console.log(`  ✗ Minimal content (${bodyText.length} chars)`);
    } else {
      console.log(`  ✓ Content loaded (${bodyText.length} chars)`);
    }

    // Check for error messages
    const errorMessages = await page.evaluate(() => {
      const errors = [];
      const errorSelectors = [
        '[role="alert"]',
        '.error',
        '.alert-error',
        '[data-error="true"]'
      ];

      errorSelectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
          const text = el.innerText.trim();
          if (text && !text.toLowerCase().includes('no items')) {
            errors.push(text);
          }
        });
      });

      return errors;
    });

    if (errorMessages.length > 0) {
      errorMessages.forEach(msg => {
        pageResult.errors.push(`Error alert: ${msg}`);
        console.log(`  ✗ Error message: "${msg}"`);
      });
    }

    // Check for perpetual loading states
    const loadingElements = await page.evaluate(() => {
      const loaders = document.querySelectorAll(
        '[data-loading="true"], .loading, .spinner, [class*="loading"]'
      );
      return loaders.length;
    });

    if (loadingElements > 0) {
      pageResult.warnings.push(`${loadingElements} loading elements still visible`);
      console.log(`  ! Warning: ${loadingElements} loading elements`);
    }

    // Check for navigation
    const navCount = await page.evaluate(() => {
      return document.querySelectorAll('nav a, [role="navigation"] a').length;
    });
    pageResult.metrics.navigationLinks = navCount;
    console.log(`  Navigation links: ${navCount}`);

    // Check for interactive elements
    const buttonCount = await page.evaluate(() => {
      return document.querySelectorAll('button:not([disabled])').length;
    });
    pageResult.metrics.buttons = buttonCount;
    console.log(`  Enabled buttons: ${buttonCount}`);

    // Page-specific checks
    if (pageConfig.checks.includes('widgets')) {
      const widgetCount = await page.evaluate(() => {
        return document.querySelectorAll('[data-widget], .widget, [class*="widget"]').length;
      });
      pageResult.metrics.widgets = widgetCount;
      console.log(`  Widgets: ${widgetCount}`);

      if (widgetCount === 0) {
        pageResult.warnings.push('No dashboard widgets found');
      }
    }

    if (pageConfig.checks.includes('chat-input')) {
      const hasInput = await page.evaluate(() => {
        return !!document.querySelector('textarea, input[type="text"][placeholder*="message" i]');
      });
      pageResult.metrics.hasChatInput = hasInput;

      if (!hasInput) {
        pageResult.errors.push('Chat input not found');
        console.log('  ✗ Chat input not found');
      } else {
        console.log('  ✓ Chat input found');
      }
    }

    if (pageConfig.checks.includes('calendar')) {
      const hasCalendar = await page.evaluate(() => {
        return !!document.querySelector(
          '[data-calendar], [class*="calendar"], .fc, [role="grid"]'
        );
      });
      pageResult.metrics.hasCalendar = hasCalendar;

      if (!hasCalendar) {
        pageResult.errors.push('Calendar component not found');
        console.log('  ✗ Calendar not found');
      } else {
        console.log('  ✓ Calendar found');
      }
    }

    if (pageConfig.checks.includes('form')) {
      const formCount = await page.evaluate(() => {
        return document.querySelectorAll('form, [data-form]').length;
      });
      pageResult.metrics.forms = formCount;
      console.log(`  Forms: ${formCount}`);
    }

    if (pageConfig.checks.includes('list')) {
      const listItems = await page.evaluate(() => {
        return document.querySelectorAll('ul li, [role="list"] [role="listitem"]').length;
      });
      pageResult.metrics.listItems = listItems;
      console.log(`  List items: ${listItems}`);
    }

    // Take screenshot
    const screenshotName = pageConfig.path.replace(/\//g, '-').replace(/^-/, '') || 'root';
    const screenshotPath = path.join(SCREENSHOT_DIR, `${screenshotName}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    pageResult.screenshot = screenshotPath;
    console.log(`  Screenshot: ${screenshotName}.png`);

    // Determine overall status
    if (pageResult.errors.length === 0) {
      pageResult.status = 'passed';
      results.summary.passed++;
      console.log(`  ✓ PASSED`);
    } else {
      pageResult.status = 'failed';
      results.summary.failed++;
      console.log(`  ✗ FAILED (${pageResult.errors.length} errors)`);

      // Add to issues list
      results.issues.push({
        page: pageConfig.path,
        component: 'Page Load',
        type: 'frontend',
        severity: status >= 500 ? 'critical' : 'high',
        description: pageResult.errors.join('; '),
        console_errors: []
      });
    }

  } catch (error) {
    pageResult.status = 'failed';
    pageResult.errors.push(error.message);
    results.summary.failed++;
    console.log(`  ✗ FAILED - ${error.message}`);

    results.issues.push({
      page: pageConfig.path,
      component: 'Page Load',
      type: 'frontend',
      severity: 'critical',
      description: `Failed to load page: ${error.message}`,
      console_errors: []
    });
  }

  results.pages.push(pageResult);
  return pageResult;
}

/**
 * Main test runner
 */
async function run() {
  init();

  let browser;
  try {
    // Launch browser
    console.log('Launching browser...');
    browser = await puppeteer.launch({
      headless: false,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--start-maximized'
      ],
      defaultViewport: null
    });

    const page = await browser.newPage();

    // Monitor console errors
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        const error = msg.text();
        consoleErrors.push(error);
        console.log(`  [Console Error] ${error}`);
      }
    });

    page.on('pageerror', error => {
      consoleErrors.push(error.toString());
      console.log(`  [Page Error] ${error.toString()}`);
    });

    // Step 1: Login
    console.log('\n==============================================');
    console.log('STEP 1: Authentication');
    console.log('==============================================');

    await page.goto(`${BASE_URL}/login`, {
      waitUntil: 'networkidle2',
      timeout: PAGE_LOAD_TIMEOUT
    });

    console.log('\n⏳ Waiting for Google OAuth login...');
    console.log('Please log in using: luk.gber@gmail.com');
    console.log(`Timeout: ${LOGIN_WAIT_TIME / 1000} seconds\n`);

    // Wait for navigation away from login page
    try {
      await page.waitForFunction(
        () => !window.location.href.includes('/login'),
        { timeout: LOGIN_WAIT_TIME }
      );

      const currentUrl = page.url();
      console.log(`✓ Login successful!`);
      console.log(`Current URL: ${currentUrl}\n`);
    } catch (error) {
      console.log('✗ Login timeout - continuing anyway...\n');
    }

    // Wait for session to stabilize
    await page.waitForTimeout(3000);

    // Step 2: Test all pages
    console.log('==============================================');
    console.log('STEP 2: Testing Pages');
    console.log('==============================================');

    for (let i = 0; i < PAGES.length; i++) {
      await testPage(page, PAGES[i], i);
      await page.waitForTimeout(1000); // Brief pause between tests
    }

    // Step 3: Generate report
    console.log('\n==============================================');
    console.log('STEP 3: Test Results');
    console.log('==============================================\n');

    console.log(`Total Pages: ${results.summary.total}`);
    console.log(`Passed: ${results.summary.passed}`);
    console.log(`Failed: ${results.summary.failed}`);
    console.log(`Skipped: ${results.summary.skipped}`);

    const passRate = ((results.summary.passed / results.summary.total) * 100).toFixed(1);
    console.log(`Pass Rate: ${passRate}%\n`);

    if (results.issues.length > 0) {
      console.log('Issues Found:');
      results.issues.forEach((issue, i) => {
        console.log(`  ${i + 1}. [${issue.severity.toUpperCase()}] ${issue.page}: ${issue.description}`);
      });
    } else {
      console.log('✓ No issues found!');
    }

    // Save results
    fs.writeFileSync(RESULTS_FILE, JSON.stringify(results, null, 2));
    console.log(`\n📄 Full results saved to: ${RESULTS_FILE}`);
    console.log(`📸 Screenshots saved to: ${SCREENSHOT_DIR}`);

    console.log('\n==============================================');
    console.log('Test Complete!');
    console.log('==============================================\n');

  } catch (error) {
    console.error('\n❌ Test suite error:', error);
    process.exit(1);
  } finally {
    if (browser) {
      console.log('Closing browser in 5 seconds...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      await browser.close();
    }
  }
}

// Run tests
run().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
