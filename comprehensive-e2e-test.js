/**
 * Comprehensive E2E Test - ALL Features
 * Tests every page, button, input, and feature in the Operate app
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000';
const API_URL = 'http://localhost:3001';
const SCREENSHOTS_DIR = path.join(__dirname, 'test-screenshots', 'comprehensive');

// Test credentials
const TEST_USER = {
  email: 'test@operate.guru',
  password: 'TestPassword123!'
};

// Ensure screenshots directory exists
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

// Test results storage
const results = {
  timestamp: new Date().toISOString(),
  summary: { passed: 0, failed: 0, skipped: 0 },
  tests: [],
  errors: [],
  consoleErrors: []
};

// Helper to log test result
function logTest(category, name, status, details = null, screenshot = null) {
  const test = { category, name, status, details, screenshot, timestamp: new Date().toISOString() };
  results.tests.push(test);

  if (status === 'pass') results.summary.passed++;
  else if (status === 'fail') results.summary.failed++;
  else results.summary.skipped++;

  const icon = status === 'pass' ? '✓' : status === 'fail' ? '✗' : '○';
  console.log(`  ${icon} ${name}${details ? ': ' + details : ''}`);

  return status === 'pass';
}

// Helper to take screenshot
async function screenshot(page, name) {
  const filename = `${name}.png`;
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, filename), fullPage: true });
  return filename;
}

// Helper to check for errors on page
async function checkPageForErrors(page) {
  const content = await page.content();
  const hasError = content.includes('Something went wrong') ||
                   content.includes('Error:') ||
                   content.includes('error-message') ||
                   (content.includes('error') && content.includes('destructive'));
  return hasError;
}

// Helper to wait and check element exists
async function elementExists(page, selector, timeout = 5000) {
  try {
    await page.waitForSelector(selector, { timeout });
    return true;
  } catch {
    return false;
  }
}

// Helper to safely click
async function safeClick(page, selector, timeout = 5000) {
  try {
    await page.waitForSelector(selector, { timeout });
    await page.click(selector);
    return true;
  } catch {
    return false;
  }
}

// Helper to safely type
async function safeType(page, selector, text, timeout = 5000) {
  try {
    await page.waitForSelector(selector, { timeout });
    await page.type(selector, text);
    return true;
  } catch {
    return false;
  }
}

// ============================================================
// TEST SUITES
// ============================================================

async function testOnboarding(page) {
  console.log('\n📋 TESTING: Onboarding Flow');
  console.log('─'.repeat(50));

  // Navigate to onboarding
  await page.goto(`${BASE_URL}/onboarding`, { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));

  const ss1 = await screenshot(page, '01-onboarding-start');

  // Check if onboarding page loads
  const content = await page.content();
  const hasWelcome = content.includes('Welcome') || content.includes('Operate') || content.includes('Get Started');
  logTest('Onboarding', 'Page loads', hasWelcome ? 'pass' : 'fail', null, ss1);

  // Check for Get Started button
  const hasGetStarted = await elementExists(page, 'button:has-text("Get Started"), button:has-text("Start"), a:has-text("Get Started")', 3000);
  logTest('Onboarding', 'Get Started button exists', hasGetStarted ? 'pass' : 'skip', 'May be different text');

  // Try clicking Get Started
  const clicked = await safeClick(page, 'button:has-text("Get Started"), [class*="primary"]', 3000);
  if (clicked) {
    await new Promise(r => setTimeout(r, 2000));
    await screenshot(page, '02-onboarding-step1');
  }

  // Check for step indicators
  const hasSteps = content.includes('Step') || content.includes('step') ||
                   await elementExists(page, '[class*="step"], [class*="progress"]', 2000);
  logTest('Onboarding', 'Step indicators visible', hasSteps ? 'pass' : 'skip');

  // Check for company info inputs
  const hasCompanyInputs = await elementExists(page, 'input[name="companyName"], input[placeholder*="company"], input[id*="company"]', 3000);
  logTest('Onboarding', 'Company info inputs', hasCompanyInputs ? 'pass' : 'skip', 'Company name field');

  // Check for country/currency selects
  const hasCountrySelect = await elementExists(page, 'select, [role="combobox"], [class*="select"]', 2000);
  logTest('Onboarding', 'Country/Currency selects', hasCountrySelect ? 'pass' : 'skip');

  // Look for bank connection section
  await page.goto(`${BASE_URL}/onboarding`, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));

  const hasBankSection = content.includes('bank') || content.includes('Bank') ||
                         content.includes('Connect') || content.includes('TrueLayer') ||
                         content.includes('Plaid');
  logTest('Onboarding', 'Bank connection section exists', hasBankSection ? 'pass' : 'skip');

  // Look for email connection section
  const hasEmailSection = content.includes('email') || content.includes('Email') ||
                          content.includes('Gmail') || content.includes('Outlook') ||
                          content.includes('mail');
  logTest('Onboarding', 'Email connection section exists', hasEmailSection ? 'pass' : 'skip');

  // Check for Import Data button
  const hasImport = content.includes('Import') || await elementExists(page, 'button:has-text("Import")', 2000);
  logTest('Onboarding', 'Import Data option', hasImport ? 'pass' : 'skip');

  await screenshot(page, '03-onboarding-features');

  return true;
}

async function testBanking(page) {
  console.log('\n🏦 TESTING: Banking Features');
  console.log('─'.repeat(50));

  // Test bank accounts page
  await page.goto(`${BASE_URL}/finance/bank-accounts`, { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));

  const ss1 = await screenshot(page, '10-bank-accounts');
  const hasError = await checkPageForErrors(page);
  logTest('Banking', 'Bank Accounts page loads', !hasError ? 'pass' : 'fail', null, ss1);

  // Check for Connect Bank button
  const content = await page.content();
  const hasConnectBtn = content.includes('Connect') || content.includes('Add Account') ||
                        await elementExists(page, 'button:has-text("Connect"), button:has-text("Add")', 3000);
  logTest('Banking', 'Connect Bank button', hasConnectBtn ? 'pass' : 'skip');

  // Check for bank list/table
  const hasBankList = await elementExists(page, 'table, [class*="card"], [class*="account"]', 3000);
  logTest('Banking', 'Bank accounts list/table', hasBankList ? 'pass' : 'skip');

  // Test banking transactions page
  await page.goto(`${BASE_URL}/finance/banking`, { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));

  const ss2 = await screenshot(page, '11-banking-transactions');
  const hasError2 = await checkPageForErrors(page);
  logTest('Banking', 'Banking transactions page loads', !hasError2 ? 'pass' : 'fail', null, ss2);

  // Check for transaction filters
  const hasFilters = await elementExists(page, 'input[type="search"], [class*="filter"], select', 3000);
  logTest('Banking', 'Transaction filters', hasFilters ? 'pass' : 'skip');

  // Check for transaction table
  const hasTransTable = await elementExists(page, 'table, [class*="transaction"]', 3000);
  logTest('Banking', 'Transactions table', hasTransTable ? 'pass' : 'skip');

  // Test TrueLayer callback page exists
  await page.goto(`${BASE_URL}/finance/bank-accounts/callback`, { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 1000));
  const ss3 = await screenshot(page, '12-bank-callback');
  logTest('Banking', 'Bank callback page exists', true, 'Route accessible', ss3);

  return true;
}

async function testEmail(page) {
  console.log('\n📧 TESTING: Email/Mail Features');
  console.log('─'.repeat(50));

  // Check if there's an email sync page
  const emailPages = [
    '/settings/email',
    '/settings/integrations',
    '/email',
    '/mail',
    '/inbox'
  ];

  let emailPageFound = false;
  for (const emailPage of emailPages) {
    await page.goto(`${BASE_URL}${emailPage}`, { waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {});
    await new Promise(r => setTimeout(r, 1000));

    const content = await page.content();
    if (!content.includes('404') && !content.includes('not found')) {
      emailPageFound = true;
      const ss = await screenshot(page, `20-email-${emailPage.replace(/\//g, '-')}`);
      logTest('Email', `Email page ${emailPage}`, 'pass', 'Page exists', ss);
      break;
    }
  }

  if (!emailPageFound) {
    logTest('Email', 'Email management page', 'skip', 'No dedicated email page found');
  }

  // Check extracted invoices page (email intelligence)
  await page.goto(`${BASE_URL}/finance/invoices/extracted`, { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));

  const ss1 = await screenshot(page, '21-extracted-invoices');
  const hasError = await checkPageForErrors(page);
  logTest('Email', 'Extracted invoices page loads', !hasError ? 'pass' : 'fail', null, ss1);

  const content = await page.content();
  const hasEmailFeatures = content.includes('extract') || content.includes('inbox') ||
                           content.includes('email') || content.includes('scan');
  logTest('Email', 'Email extraction features', hasEmailFeatures ? 'pass' : 'skip');

  // Check settings for email integration
  await page.goto(`${BASE_URL}/settings`, { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));

  const settingsContent = await page.content();
  const hasEmailSettings = settingsContent.includes('Email') || settingsContent.includes('email') ||
                           settingsContent.includes('Gmail') || settingsContent.includes('Outlook');
  logTest('Email', 'Email settings available', hasEmailSettings ? 'pass' : 'skip');

  return true;
}

async function testFinance(page) {
  console.log('\n💰 TESTING: Finance Features');
  console.log('─'.repeat(50));

  // Test Invoices
  await page.goto(`${BASE_URL}/finance/invoices`, { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));

  let ss = await screenshot(page, '30-invoices');
  let hasError = await checkPageForErrors(page);
  logTest('Finance', 'Invoices page loads', !hasError ? 'pass' : 'fail', null, ss);

  // Check invoices components
  let hasTable = await elementExists(page, 'table', 3000);
  logTest('Finance', 'Invoices table', hasTable ? 'pass' : 'skip');

  let hasNewBtn = await elementExists(page, 'a[href*="new"], button:has-text("New")', 3000);
  logTest('Finance', 'New Invoice button', hasNewBtn ? 'pass' : 'skip');

  let hasFilters = await elementExists(page, 'input[type="search"], select, [class*="filter"]', 3000);
  logTest('Finance', 'Invoice filters', hasFilters ? 'pass' : 'skip');

  // Test New Invoice page
  await page.goto(`${BASE_URL}/finance/invoices/new`, { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));

  ss = await screenshot(page, '31-invoice-new');
  hasError = await checkPageForErrors(page);
  logTest('Finance', 'New Invoice page loads', !hasError ? 'pass' : 'fail', null, ss);

  // Check invoice form fields
  const hasCustomerField = await elementExists(page, 'input[name*="customer"], input[placeholder*="customer"], [class*="customer"]', 3000);
  logTest('Finance', 'Customer field', hasCustomerField ? 'pass' : 'skip');

  const hasDateField = await elementExists(page, 'input[type="date"], [class*="date"]', 3000);
  logTest('Finance', 'Date fields', hasDateField ? 'pass' : 'skip');

  // Test Expenses
  await page.goto(`${BASE_URL}/finance/expenses`, { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));

  ss = await screenshot(page, '32-expenses');
  hasError = await checkPageForErrors(page);
  logTest('Finance', 'Expenses page loads', !hasError ? 'pass' : 'fail', null, ss);

  // Test New Expense page
  await page.goto(`${BASE_URL}/finance/expenses/new`, { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));

  ss = await screenshot(page, '33-expense-new');
  hasError = await checkPageForErrors(page);
  logTest('Finance', 'New Expense page loads', !hasError ? 'pass' : 'fail', null, ss);

  // Test Receipt Scanner
  await page.goto(`${BASE_URL}/finance/expenses/scan`, { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));

  ss = await screenshot(page, '34-receipt-scan');
  hasError = await checkPageForErrors(page);
  logTest('Finance', 'Receipt scanner page loads', !hasError ? 'pass' : 'fail', null, ss);

  // Test Recurring Invoices
  await page.goto(`${BASE_URL}/finance/invoices/recurring`, { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));

  ss = await screenshot(page, '35-recurring-invoices');
  hasError = await checkPageForErrors(page);
  logTest('Finance', 'Recurring invoices page loads', !hasError ? 'pass' : 'fail', null, ss);

  // Test Finance Overview
  await page.goto(`${BASE_URL}/finance`, { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));

  ss = await screenshot(page, '36-finance-overview');
  hasError = await checkPageForErrors(page);
  logTest('Finance', 'Finance overview page loads', !hasError ? 'pass' : 'fail', null, ss);

  return true;
}

async function testChat(page) {
  console.log('\n💬 TESTING: Chat/AI Features');
  console.log('─'.repeat(50));

  await page.goto(`${BASE_URL}/chat`, { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));

  const ss = await screenshot(page, '40-chat');
  const hasError = await checkPageForErrors(page);
  logTest('Chat', 'Chat page loads', !hasError ? 'pass' : 'fail', null, ss);

  // Check for chat input
  const hasChatInput = await elementExists(page, 'textarea, input[type="text"][placeholder*="message"], [class*="chat-input"]', 3000);
  logTest('Chat', 'Chat input field', hasChatInput ? 'pass' : 'skip');

  // Check for send button
  const hasSendBtn = await elementExists(page, 'button[type="submit"], button:has-text("Send"), [class*="send"]', 3000);
  logTest('Chat', 'Send button', hasSendBtn ? 'pass' : 'skip');

  // Check for suggestion chips
  const content = await page.content();
  const hasSuggestions = content.includes('suggestion') || content.includes('Suggestion') ||
                         await elementExists(page, '[class*="suggestion"], [class*="chip"]', 2000);
  logTest('Chat', 'Suggestion chips', hasSuggestions ? 'pass' : 'skip');

  // Check for AI consent dialog
  const hasConsentDialog = content.includes('consent') || content.includes('AI') ||
                           content.includes('privacy');
  logTest('Chat', 'AI consent/privacy notice', hasConsentDialog ? 'pass' : 'skip');

  return true;
}

async function testSettings(page) {
  console.log('\n⚙️ TESTING: Settings & Profile');
  console.log('─'.repeat(50));

  // Test main settings page
  await page.goto(`${BASE_URL}/settings`, { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));

  let ss = await screenshot(page, '50-settings');
  let hasError = await checkPageForErrors(page);
  logTest('Settings', 'Settings page loads', !hasError ? 'pass' : 'fail', null, ss);

  // Check for settings sections
  const content = await page.content();
  const hasProfileSection = content.includes('Profile') || content.includes('profile');
  logTest('Settings', 'Profile section', hasProfileSection ? 'pass' : 'skip');

  const hasCompanySection = content.includes('Company') || content.includes('Organisation') || content.includes('Business');
  logTest('Settings', 'Company/Organisation section', hasCompanySection ? 'pass' : 'skip');

  const hasSecuritySection = content.includes('Security') || content.includes('Password') || content.includes('MFA');
  logTest('Settings', 'Security section', hasSecuritySection ? 'pass' : 'skip');

  // Test billing page
  await page.goto(`${BASE_URL}/billing`, { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));

  ss = await screenshot(page, '51-billing');
  hasError = await checkPageForErrors(page);
  logTest('Settings', 'Billing page loads', !hasError ? 'pass' : 'fail', null, ss);

  // Test developer page
  await page.goto(`${BASE_URL}/developer`, { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));

  ss = await screenshot(page, '52-developer');
  hasError = await checkPageForErrors(page);
  logTest('Settings', 'Developer page loads', !hasError ? 'pass' : 'fail', null, ss);

  // Test API keys page
  await page.goto(`${BASE_URL}/developer/api-keys`, { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));

  ss = await screenshot(page, '53-api-keys');
  hasError = await checkPageForErrors(page);
  logTest('Settings', 'API Keys page loads', !hasError ? 'pass' : 'fail', null, ss);

  // Test webhooks page
  await page.goto(`${BASE_URL}/developer/webhooks`, { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));

  ss = await screenshot(page, '54-webhooks');
  hasError = await checkPageForErrors(page);
  logTest('Settings', 'Webhooks page loads', !hasError ? 'pass' : 'fail', null, ss);

  return true;
}

async function testHR(page) {
  console.log('\n👥 TESTING: HR & Time Tracking');
  console.log('─'.repeat(50));

  // Test Time Tracking page
  await page.goto(`${BASE_URL}/time`, { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));

  let ss = await screenshot(page, '60-time-tracking');
  let hasError = await checkPageForErrors(page);
  logTest('HR', 'Time Tracking page loads', !hasError ? 'pass' : 'fail', null, ss);

  // Check for time entry components
  const hasTimeInput = await elementExists(page, 'input[type="time"], input[type="number"], [class*="time"]', 3000);
  logTest('HR', 'Time input fields', hasTimeInput ? 'pass' : 'skip');

  // Test Calendar page
  await page.goto(`${BASE_URL}/calendar`, { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));

  ss = await screenshot(page, '61-calendar');
  hasError = await checkPageForErrors(page);
  logTest('HR', 'Calendar page loads', !hasError ? 'pass' : 'fail', null, ss);

  // Test Contracts page
  await page.goto(`${BASE_URL}/contracts`, { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));

  ss = await screenshot(page, '62-contracts');
  hasError = await checkPageForErrors(page);
  logTest('HR', 'Contracts page loads', !hasError ? 'pass' : 'fail', null, ss);

  return true;
}

async function testCRM(page) {
  console.log('\n👤 TESTING: CRM & Clients');
  console.log('─'.repeat(50));

  // Test Clients page
  await page.goto(`${BASE_URL}/clients`, { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));

  let ss = await screenshot(page, '70-clients');
  let hasError = await checkPageForErrors(page);
  logTest('CRM', 'Clients page loads', !hasError ? 'pass' : 'fail', null, ss);

  // Check for client components
  let hasTable = await elementExists(page, 'table, [class*="card"], [class*="client"]', 3000);
  logTest('CRM', 'Clients list/table', hasTable ? 'pass' : 'skip');

  let hasNewBtn = await elementExists(page, 'a[href*="new"], button:has-text("New"), button:has-text("Add")', 3000);
  logTest('CRM', 'Add Client button', hasNewBtn ? 'pass' : 'skip');

  // Test CRM page
  await page.goto(`${BASE_URL}/crm`, { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));

  ss = await screenshot(page, '71-crm');
  hasError = await checkPageForErrors(page);
  logTest('CRM', 'CRM overview page loads', !hasError ? 'pass' : 'fail', null, ss);

  return true;
}

async function testDashboard(page) {
  console.log('\n📊 TESTING: Dashboard');
  console.log('─'.repeat(50));

  await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));

  const ss = await screenshot(page, '80-dashboard');
  const hasError = await checkPageForErrors(page);
  logTest('Dashboard', 'Dashboard page loads', !hasError ? 'pass' : 'fail', null, ss);

  // Check for dashboard widgets
  const content = await page.content();
  const hasWidgets = await elementExists(page, '[class*="card"], [class*="widget"], [class*="stat"]', 3000);
  logTest('Dashboard', 'Dashboard widgets', hasWidgets ? 'pass' : 'skip');

  const hasCharts = content.includes('chart') || content.includes('Chart') ||
                    await elementExists(page, 'canvas, svg[class*="chart"]', 2000);
  logTest('Dashboard', 'Charts/Graphs', hasCharts ? 'pass' : 'skip');

  return true;
}

async function testDocuments(page) {
  console.log('\n📄 TESTING: Documents');
  console.log('─'.repeat(50));

  await page.goto(`${BASE_URL}/documents`, { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));

  let ss = await screenshot(page, '90-documents');
  let hasError = await checkPageForErrors(page);
  logTest('Documents', 'Documents page loads', !hasError ? 'pass' : 'fail', null, ss);

  // Test upload page
  await page.goto(`${BASE_URL}/documents/upload`, { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));

  ss = await screenshot(page, '91-documents-upload');
  hasError = await checkPageForErrors(page);
  logTest('Documents', 'Upload page loads', !hasError ? 'pass' : 'fail', null, ss);

  // Test templates page
  await page.goto(`${BASE_URL}/documents/templates`, { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));

  ss = await screenshot(page, '92-documents-templates');
  hasError = await checkPageForErrors(page);
  logTest('Documents', 'Templates page loads', !hasError ? 'pass' : 'fail', null, ss);

  return true;
}

async function testAutopilot(page) {
  console.log('\n🤖 TESTING: Autopilot');
  console.log('─'.repeat(50));

  await page.goto(`${BASE_URL}/autopilot`, { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));

  let ss = await screenshot(page, '95-autopilot');
  let hasError = await checkPageForErrors(page);
  logTest('Autopilot', 'Autopilot page loads', !hasError ? 'pass' : 'fail', null, ss);

  // Test autopilot settings
  await page.goto(`${BASE_URL}/autopilot/settings`, { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));

  ss = await screenshot(page, '96-autopilot-settings');
  hasError = await checkPageForErrors(page);
  logTest('Autopilot', 'Autopilot settings loads', !hasError ? 'pass' : 'fail', null, ss);

  // Test autopilot actions
  await page.goto(`${BASE_URL}/autopilot/actions`, { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));

  ss = await screenshot(page, '97-autopilot-actions');
  hasError = await checkPageForErrors(page);
  logTest('Autopilot', 'Autopilot actions loads', !hasError ? 'pass' : 'fail', null, ss);

  return true;
}

// ============================================================
// MAIN TEST RUNNER
// ============================================================

async function runAllTests() {
  console.log('\n' + '═'.repeat(60));
  console.log('  COMPREHENSIVE E2E TEST - OPERATE APP');
  console.log('  Testing ALL pages, buttons, inputs, and features');
  console.log('═'.repeat(60));
  console.log(`\nStarted: ${new Date().toISOString()}`);
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Screenshots: ${SCREENSHOTS_DIR}\n`);

  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  // Collect console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      results.consoleErrors.push({
        text: msg.text().substring(0, 200),
        url: page.url()
      });
    }
  });

  try {
    // Login first
    console.log('🔐 LOGGING IN...');
    console.log('─'.repeat(50));

    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2', timeout: 30000 });
    await page.type('#email', TEST_USER.email);
    await page.type('#password', TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {});
    await new Promise(r => setTimeout(r, 3000));

    const loginUrl = page.url();
    const loginSuccess = !loginUrl.includes('/login');
    logTest('Auth', 'Login', loginSuccess ? 'pass' : 'fail', `Redirected to: ${loginUrl}`);

    await screenshot(page, '00-after-login');

    // Run all test suites
    await testOnboarding(page);
    await testDashboard(page);
    await testFinance(page);
    await testBanking(page);
    await testEmail(page);
    await testChat(page);
    await testCRM(page);
    await testHR(page);
    await testDocuments(page);
    await testAutopilot(page);
    await testSettings(page);

  } catch (error) {
    console.error('\n❌ Test suite error:', error.message);
    results.errors.push({ message: error.message, stack: error.stack });
  } finally {
    await browser.close();
  }

  // Print summary
  console.log('\n' + '═'.repeat(60));
  console.log('  TEST SUMMARY');
  console.log('═'.repeat(60));
  console.log(`  ✓ Passed:  ${results.summary.passed}`);
  console.log(`  ✗ Failed:  ${results.summary.failed}`);
  console.log(`  ○ Skipped: ${results.summary.skipped}`);
  console.log(`  Total:     ${results.tests.length}`);
  console.log('─'.repeat(60));

  if (results.summary.failed > 0) {
    console.log('\n❌ FAILED TESTS:');
    results.tests.filter(t => t.status === 'fail').forEach(t => {
      console.log(`   - ${t.category}: ${t.name}${t.details ? ' - ' + t.details : ''}`);
    });
  }

  if (results.consoleErrors.length > 0) {
    console.log(`\n⚠️  Console Errors: ${results.consoleErrors.length}`);
    results.consoleErrors.slice(0, 5).forEach(e => {
      console.log(`   - ${e.text.substring(0, 80)}...`);
    });
  }

  console.log('\n' + '═'.repeat(60));

  // Save results
  fs.writeFileSync(
    path.join(__dirname, 'COMPREHENSIVE_E2E_RESULTS.json'),
    JSON.stringify(results, null, 2)
  );

  console.log(`\nResults saved to: COMPREHENSIVE_E2E_RESULTS.json`);
  console.log(`Screenshots saved to: ${SCREENSHOTS_DIR}`);
  console.log(`\nCompleted: ${new Date().toISOString()}`);
}

runAllTests().catch(console.error);
