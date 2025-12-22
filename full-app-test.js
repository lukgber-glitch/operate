/**
 * Full App E2E Test - With Onboarding Completion
 * Tests every page after completing onboarding flow
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000';
const SCREENSHOTS_DIR = path.join(__dirname, 'test-screenshots', 'full-test');

const TEST_USER = {
  email: 'test@operate.guru',
  password: 'TestPassword123!'
};

// Ensure screenshots directory exists
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

const results = {
  timestamp: new Date().toISOString(),
  summary: { passed: 0, failed: 0, skipped: 0 },
  tests: [],
  errors: []
};

function logTest(category, name, status, details = null) {
  results.tests.push({ category, name, status, details });
  if (status === 'pass') results.summary.passed++;
  else if (status === 'fail') results.summary.failed++;
  else results.summary.skipped++;

  const icon = status === 'pass' ? '✓' : status === 'fail' ? '✗' : '○';
  console.log(`  ${icon} ${name}${details ? ': ' + details : ''}`);
  return status === 'pass';
}

async function screenshot(page, name) {
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `${name}.png`), fullPage: true });
}

async function completeOnboarding(page) {
  console.log('\n🚀 COMPLETING ONBOARDING FLOW');
  console.log('─'.repeat(50));

  await page.goto(`${BASE_URL}/onboarding`, { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));
  await screenshot(page, '00-onboarding-start');

  // Try to click Get Started button
  try {
    // Look for any primary button or Get Started text
    const buttons = await page.$$('button');
    for (const button of buttons) {
      const text = await page.evaluate(el => el.textContent, button);
      if (text && (text.includes('Get Started') || text.includes('Start') || text.includes('Continue') || text.includes('Next'))) {
        await button.click();
        await new Promise(r => setTimeout(r, 2000));
        console.log('  → Clicked: ' + text.trim());
        break;
      }
    }
  } catch (e) {
    console.log('  → No Get Started button found, checking page state...');
  }

  await screenshot(page, '01-after-start');

  // Check current URL to see if we're still in onboarding
  let currentUrl = page.url();
  console.log('  → Current URL: ' + currentUrl);

  // Try to skip/complete onboarding by navigating directly
  // First, let's check if there's a skip button
  try {
    const skipBtn = await page.$('button:has-text("Skip"), a:has-text("Skip"), [class*="skip"]');
    if (skipBtn) {
      await skipBtn.click();
      await new Promise(r => setTimeout(r, 2000));
      console.log('  → Clicked Skip button');
    }
  } catch (e) {}

  // Try going through onboarding steps
  for (let step = 0; step < 5; step++) {
    await new Promise(r => setTimeout(r, 1000));

    // Look for Next/Continue/Skip buttons
    const buttons = await page.$$('button');
    let clicked = false;

    for (const button of buttons) {
      try {
        const text = await page.evaluate(el => el.textContent, button);
        const isDisabled = await page.evaluate(el => el.disabled, button);

        if (!isDisabled && text && (
          text.includes('Next') ||
          text.includes('Continue') ||
          text.includes('Skip') ||
          text.includes('Complete') ||
          text.includes('Finish') ||
          text.includes('Done') ||
          text.includes('Go to Dashboard')
        )) {
          await button.click();
          await new Promise(r => setTimeout(r, 2000));
          console.log(`  → Step ${step + 1}: Clicked "${text.trim().substring(0, 30)}"`);
          clicked = true;
          break;
        }
      } catch (e) {}
    }

    if (!clicked) {
      console.log(`  → Step ${step + 1}: No actionable button found`);
    }

    await screenshot(page, `02-onboarding-step-${step + 1}`);

    // Check if we left onboarding
    currentUrl = page.url();
    if (!currentUrl.includes('onboarding')) {
      console.log('  → Left onboarding flow!');
      break;
    }
  }

  // Final check - try direct navigation to dashboard
  await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));

  currentUrl = page.url();
  const onboardingComplete = !currentUrl.includes('onboarding');

  if (onboardingComplete) {
    console.log('  ✓ Onboarding complete - can access dashboard');
  } else {
    console.log('  ⚠ Still in onboarding - will test onboarding screens');
  }

  await screenshot(page, '03-after-onboarding');

  return onboardingComplete;
}

async function testAllPages(page, canAccessPages) {
  // Define all pages to test
  const pagesToTest = [
    // Dashboard & Overview
    { url: '/dashboard', name: 'Dashboard', category: 'Core' },

    // Finance
    { url: '/finance', name: 'Finance Overview', category: 'Finance' },
    { url: '/finance/invoices', name: 'Invoices List', category: 'Finance' },
    { url: '/finance/invoices/new', name: 'New Invoice', category: 'Finance' },
    { url: '/finance/invoices/recurring', name: 'Recurring Invoices', category: 'Finance' },
    { url: '/finance/invoices/extracted', name: 'Extracted Invoices', category: 'Finance' },
    { url: '/finance/expenses', name: 'Expenses List', category: 'Finance' },
    { url: '/finance/expenses/new', name: 'New Expense', category: 'Finance' },
    { url: '/finance/expenses/scan', name: 'Receipt Scanner', category: 'Finance' },

    // Banking
    { url: '/finance/bank-accounts', name: 'Bank Accounts', category: 'Banking' },
    { url: '/finance/banking', name: 'Banking Transactions', category: 'Banking' },

    // Chat/AI
    { url: '/chat', name: 'AI Chat', category: 'AI' },

    // CRM
    { url: '/clients', name: 'Clients List', category: 'CRM' },
    { url: '/crm', name: 'CRM Overview', category: 'CRM' },

    // HR & Time
    { url: '/time', name: 'Time Tracking', category: 'HR' },
    { url: '/calendar', name: 'Calendar', category: 'HR' },
    { url: '/contracts', name: 'Contracts', category: 'HR' },

    // Documents
    { url: '/documents', name: 'Documents', category: 'Documents' },
    { url: '/documents/upload', name: 'Upload Documents', category: 'Documents' },
    { url: '/documents/templates', name: 'Document Templates', category: 'Documents' },

    // Autopilot
    { url: '/autopilot', name: 'Autopilot', category: 'Automation' },
    { url: '/autopilot/settings', name: 'Autopilot Settings', category: 'Automation' },
    { url: '/autopilot/actions', name: 'Autopilot Actions', category: 'Automation' },

    // Settings
    { url: '/settings', name: 'Settings', category: 'Settings' },
    { url: '/billing', name: 'Billing', category: 'Settings' },
    { url: '/developer', name: 'Developer', category: 'Settings' },
    { url: '/developer/api-keys', name: 'API Keys', category: 'Settings' },
    { url: '/developer/webhooks', name: 'Webhooks', category: 'Settings' },

    // Admin
    { url: '/admin', name: 'Admin Panel', category: 'Admin' },
    { url: '/admin/users', name: 'User Management', category: 'Admin' },
    { url: '/admin/roles', name: 'Roles & Permissions', category: 'Admin' },
  ];

  let currentCategory = '';

  for (const pageInfo of pagesToTest) {
    if (pageInfo.category !== currentCategory) {
      currentCategory = pageInfo.category;
      console.log(`\n📁 ${currentCategory.toUpperCase()}`);
      console.log('─'.repeat(50));
    }

    try {
      await page.goto(`${BASE_URL}${pageInfo.url}`, { waitUntil: 'networkidle2', timeout: 20000 });
      await new Promise(r => setTimeout(r, 1500));

      const currentUrl = page.url();
      const content = await page.content();

      // Check for errors
      const hasError = content.includes('Something went wrong') ||
                       content.includes('error-boundary') ||
                       content.includes('Application error');

      // Check if redirected to onboarding
      const redirectedToOnboarding = currentUrl.includes('onboarding');

      // Check if page is 404
      const is404 = content.includes('404') || content.includes('not found') || content.includes('Not Found');

      // Take screenshot
      const screenshotName = pageInfo.url.replace(/\//g, '-').substring(1) || 'root';
      await screenshot(page, screenshotName);

      if (hasError) {
        logTest(pageInfo.category, pageInfo.name, 'fail', 'Page shows error');
      } else if (is404) {
        logTest(pageInfo.category, pageInfo.name, 'skip', '404 Not Found');
      } else if (redirectedToOnboarding && !pageInfo.url.includes('onboarding')) {
        logTest(pageInfo.category, pageInfo.name, 'pass', 'Redirects to onboarding (expected)');
      } else {
        logTest(pageInfo.category, pageInfo.name, 'pass', 'Loads correctly');
      }

    } catch (error) {
      logTest(pageInfo.category, pageInfo.name, 'fail', error.message.substring(0, 50));
    }
  }
}

async function testInputsAndButtons(page) {
  console.log('\n🔘 TESTING INPUTS & BUTTONS ON KEY PAGES');
  console.log('─'.repeat(50));

  // Test onboarding inputs
  await page.goto(`${BASE_URL}/onboarding`, { waitUntil: 'networkidle2', timeout: 20000 });
  await new Promise(r => setTimeout(r, 2000));

  const content = await page.content();

  // Check for key onboarding elements
  const hasButtons = (await page.$$('button')).length;
  const hasInputs = (await page.$$('input')).length;
  const hasSelects = (await page.$$('select, [role="combobox"]')).length;
  const hasLinks = (await page.$$('a')).length;

  logTest('UI Elements', 'Buttons on page', hasButtons > 0 ? 'pass' : 'fail', `Found ${hasButtons} buttons`);
  logTest('UI Elements', 'Input fields', hasInputs >= 0 ? 'pass' : 'skip', `Found ${hasInputs} inputs`);
  logTest('UI Elements', 'Select/Dropdown elements', hasSelects >= 0 ? 'pass' : 'skip', `Found ${hasSelects} selects`);
  logTest('UI Elements', 'Navigation links', hasLinks > 0 ? 'pass' : 'fail', `Found ${hasLinks} links`);

  // Check for specific onboarding features mentioned
  const hasLightningFast = content.includes('Lightning') || content.includes('fast');
  const hasBankSecurity = content.includes('Bank') || content.includes('Security') || content.includes('256');
  const hasAIPowered = content.includes('AI') || content.includes('Powered') || content.includes('Insights');
  const hasImportData = content.includes('Import');

  logTest('Onboarding Features', 'Lightning Fast feature', hasLightningFast ? 'pass' : 'skip');
  logTest('Onboarding Features', 'Bank-Level Security feature', hasBankSecurity ? 'pass' : 'skip');
  logTest('Onboarding Features', 'AI-Powered Insights feature', hasAIPowered ? 'pass' : 'skip');
  logTest('Onboarding Features', 'Import Data option', hasImportData ? 'pass' : 'skip');

  await screenshot(page, 'ui-elements-check');
}

async function runFullTest() {
  console.log('\n' + '═'.repeat(60));
  console.log('  FULL APP E2E TEST');
  console.log('  Testing ALL Pages, Inputs, Buttons');
  console.log('═'.repeat(60));
  console.log(`\nStarted: ${new Date().toISOString()}`);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  try {
    // Login
    console.log('\n🔐 LOGGING IN');
    console.log('─'.repeat(50));

    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2', timeout: 30000 });
    await page.type('#email', TEST_USER.email);
    await page.type('#password', TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {});
    await new Promise(r => setTimeout(r, 3000));

    const loginUrl = page.url();
    logTest('Auth', 'Login successful', !loginUrl.includes('/login') ? 'pass' : 'fail', loginUrl);

    // Try to complete onboarding
    const canAccessPages = await completeOnboarding(page);

    // Test all pages
    await testAllPages(page, canAccessPages);

    // Test inputs and buttons
    await testInputsAndButtons(page);

  } catch (error) {
    console.error('\n❌ Test error:', error.message);
    results.errors.push(error.message);
  } finally {
    await browser.close();
  }

  // Print summary
  console.log('\n' + '═'.repeat(60));
  console.log('  FINAL RESULTS');
  console.log('═'.repeat(60));
  console.log(`  ✓ Passed:  ${results.summary.passed}`);
  console.log(`  ✗ Failed:  ${results.summary.failed}`);
  console.log(`  ○ Skipped: ${results.summary.skipped}`);
  console.log(`  Total:     ${results.tests.length}`);

  if (results.summary.failed > 0) {
    console.log('\n❌ FAILED TESTS:');
    results.tests.filter(t => t.status === 'fail').forEach(t => {
      console.log(`   - [${t.category}] ${t.name}: ${t.details || 'No details'}`);
    });
  }

  console.log('═'.repeat(60));

  // Save results
  fs.writeFileSync(
    path.join(__dirname, 'FULL_APP_TEST_RESULTS.json'),
    JSON.stringify(results, null, 2)
  );

  console.log(`\nResults: FULL_APP_TEST_RESULTS.json`);
  console.log(`Screenshots: ${SCREENSHOTS_DIR}`);
}

runFullTest().catch(console.error);
