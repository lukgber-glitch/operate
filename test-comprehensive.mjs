import { chromium } from 'playwright';
import fs from 'fs';

const RESULTS = {
  timestamp: new Date().toISOString(),
  pages: [],
  errors: [],
  screenshots: [],
  dataChecks: []
};

const browser = await chromium.launch({ headless: false });
const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
const page = await context.newPage();

// All pages to test
const PAGES = [
  '/dashboard',
  '/chat',
  '/finance',
  '/finance/invoices',
  '/finance/expenses',
  '/finance/banking',
  '/finance/reconciliation',
  '/clients',
  '/vendors',
  '/quotes',
  '/contracts',
  '/hr',
  '/hr/employees',
  '/hr/leave',
  '/hr/payroll',
  '/tax',
  '/tax/vat',
  '/tax/deductions',
  '/tax/filing',
  '/reports',
  '/calendar',
  '/tasks',
  '/documents',
  '/settings',
  '/settings/profile',
  '/settings/ai',
  '/settings/email',
  '/settings/billing',
  '/settings/security',
  '/notifications',
  '/inbox',
  '/autopilot',
  '/intelligence',
  '/mileage',
  '/time',
  '/crm',
  '/insurance',
];

console.log('=== COMPREHENSIVE SITE TEST ===\n');
console.log('This test will:');
console.log('1. Login with Google OAuth (manual step)');
console.log('2. Visit EVERY page and take screenshots');
console.log('3. Check for errors, missing elements');
console.log('4. Verify data persistence');
console.log('5. Generate a full report\n');

// Step 1: Go to login
await page.goto('https://operate.guru/login');
await page.waitForTimeout(2000);
await page.screenshot({ path: 'screenshots/00-login.png', fullPage: true });

console.log('>>> MANUAL STEP: Please login with Google in the browser window');
console.log('>>> Waiting up to 2 minutes for you to complete login...\n');

// Wait for login to complete (check for redirect away from login)
let loggedIn = false;
for (let i = 0; i < 120; i++) {
  await page.waitForTimeout(1000);
  const url = page.url();
  if (!url.includes('/login') && !url.includes('accounts.google.com')) {
    loggedIn = true;
    console.log('Login detected! Current URL:', url);
    break;
  }
  if (i % 10 === 0) console.log(`Waiting for login... ${120-i}s remaining`);
}

if (!loggedIn) {
  console.log('ERROR: Login timeout');
  RESULTS.errors.push({ type: 'login', error: 'Login timeout after 2 minutes' });
  await browser.close();
  process.exit(1);
}

await page.waitForTimeout(3000);

// Step 2: Check consent status
console.log('\n=== CHECKING CONSENT STATUS ===');
const consentCheck = await page.evaluate(() => ({
  direct: localStorage.getItem('ai_consent_data'),
  secure: localStorage.getItem('secure_token.ai_consent_data'),
  url: location.href
}));
console.log('Consent data:', consentCheck);
RESULTS.dataChecks.push({ name: 'consent', data: consentCheck });

// Check if consent dialog is showing (it shouldn't for onboarded user)
const hasConsentDialog = await page.$('[role="dialog"]:has-text("AI Assistant")');
if (hasConsentDialog) {
  RESULTS.errors.push({
    type: 'consent',
    error: 'Consent dialog showing for already-onboarded user!',
    page: page.url()
  });
  console.log('ERROR: Consent dialog is showing but user already completed onboarding!');
  await page.screenshot({ path: 'screenshots/ERROR-consent-dialog.png', fullPage: true });
}

// Step 3: Create screenshots directory
fs.mkdirSync('screenshots', { recursive: true });

// Step 4: Visit every page
console.log('\n=== TESTING ALL PAGES ===');
for (const path of PAGES) {
  const fullUrl = `https://operate.guru${path}`;
  console.log(`Testing: ${path}`);

  try {
    await page.goto(fullUrl, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1500);

    const currentUrl = page.url();
    const screenshotName = `screenshots/${path.replace(/\//g, '-').slice(1) || 'root'}.png`;

    // Take screenshot
    await page.screenshot({ path: screenshotName, fullPage: true });
    RESULTS.screenshots.push(screenshotName);

    // Check for errors on page
    const pageCheck = await page.evaluate(() => {
      const errors = [];

      // Check for error messages
      const errorElements = document.querySelectorAll('[class*="error"], [class*="Error"], .text-red-500, .text-destructive');
      errorElements.forEach(el => {
        if (el.textContent.trim()) errors.push(el.textContent.trim().slice(0, 100));
      });

      // Check for "not found" or "404"
      if (document.body.innerText.includes('not found') || document.body.innerText.includes('404')) {
        errors.push('Page contains "not found" or "404"');
      }

      // Check sidebar exists
      const sidebar = document.querySelector('nav, [class*="sidebar"], aside');

      // Check main content exists
      const mainContent = document.querySelector('main, [class*="content"], [class*="container"]');

      return {
        title: document.title,
        hasErrors: errors.length > 0,
        errors,
        hasSidebar: !!sidebar,
        hasMainContent: !!mainContent,
        bodyLength: document.body.innerText.length
      };
    });

    // Check if redirected to login (session issue)
    if (currentUrl.includes('/login')) {
      RESULTS.errors.push({ type: 'redirect', page: path, error: 'Redirected to login - session lost?' });
      console.log(`  ERROR: Redirected to login!`);
    }

    // Check for page errors
    if (pageCheck.hasErrors) {
      RESULTS.errors.push({ type: 'page-error', page: path, errors: pageCheck.errors });
      console.log(`  ERROR: ${pageCheck.errors.join(', ')}`);
    }

    // Check for missing sidebar
    if (!pageCheck.hasSidebar) {
      RESULTS.errors.push({ type: 'missing-sidebar', page: path });
      console.log(`  ERROR: Missing sidebar!`);
    }

    RESULTS.pages.push({
      path,
      url: currentUrl,
      status: 'loaded',
      ...pageCheck
    });

    console.log(`  OK - ${pageCheck.title}`);

  } catch (error) {
    RESULTS.errors.push({ type: 'navigation', page: path, error: error.message });
    RESULTS.pages.push({ path, status: 'error', error: error.message });
    console.log(`  FAILED: ${error.message}`);
  }
}

// Step 5: Test sidebar navigation by clicking links
console.log('\n=== TESTING SIDEBAR LINKS ===');
await page.goto('https://operate.guru/dashboard');
await page.waitForTimeout(2000);

const sidebarLinks = await page.evaluate(() => {
  const links = [];
  document.querySelectorAll('nav a, aside a, [class*="sidebar"] a').forEach(a => {
    if (a.href && a.href.includes('operate.guru')) {
      links.push({ href: a.href, text: a.textContent.trim() });
    }
  });
  return links;
});

console.log(`Found ${sidebarLinks.length} sidebar links`);
RESULTS.dataChecks.push({ name: 'sidebar-links', count: sidebarLinks.length, links: sidebarLinks.slice(0, 20) });

// Step 6: Go back to chat and verify NO consent dialog
console.log('\n=== FINAL CONSENT CHECK ===');
await page.goto('https://operate.guru/chat');
await page.waitForTimeout(3000);

const finalConsentDialog = await page.$('[role="dialog"]:has-text("AI Assistant")');
if (finalConsentDialog) {
  RESULTS.errors.push({ type: 'consent-final', error: 'Consent dialog STILL showing on chat page!' });
  console.log('ERROR: Consent dialog still showing!');
  await page.screenshot({ path: 'screenshots/ERROR-final-consent.png', fullPage: true });
} else {
  console.log('OK: No consent dialog on chat page');
}

await page.screenshot({ path: 'screenshots/final-chat.png', fullPage: true });

// Step 7: Generate report
console.log('\n\n========================================');
console.log('           TEST RESULTS SUMMARY          ');
console.log('========================================\n');

console.log(`Pages tested: ${RESULTS.pages.length}`);
console.log(`Errors found: ${RESULTS.errors.length}`);
console.log(`Screenshots: ${RESULTS.screenshots.length}`);

if (RESULTS.errors.length > 0) {
  console.log('\n--- ERRORS ---');
  RESULTS.errors.forEach((e, i) => {
    console.log(`${i+1}. [${e.type}] ${e.page || ''}: ${e.error || e.errors?.join(', ')}`);
  });
}

// Save full report
fs.writeFileSync('TEST_REPORT.json', JSON.stringify(RESULTS, null, 2));
console.log('\nFull report saved to TEST_REPORT.json');
console.log('Screenshots saved to screenshots/ folder');

console.log('\nBrowser will stay open for 30 seconds for manual inspection...');
await page.waitForTimeout(30000);
await browser.close();
