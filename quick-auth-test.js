/**
 * Quick Authentication Test for https://operate.guru
 * Simplified version for faster results
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const results = {
  summary: { total: 0, passed: 0, failed: 0, warnings: 0 },
  issues: []
};

async function testPage(browser, url, pageName) {
  console.log(`\nTesting: ${pageName} (${url})`);
  results.summary.total++;

  const page = await browser.newPage();
  const consoleErrors = [];

  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  page.on('pageerror', error => {
    consoleErrors.push(`Page Error: ${error.message}`);
  });

  try {
    const response = await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 15000
    });

    const status = response.status();
    console.log(`  Status: ${status}`);
    console.log(`  Final URL: ${page.url()}`);

    if (status >= 500) {
      results.issues.push({
        page: pageName,
        type: 'backend',
        severity: 'critical',
        description: `Server error: ${status}`
      });
      results.summary.failed++;
    } else if (status === 404) {
      results.issues.push({
        page: pageName,
        type: 'frontend',
        severity: 'high',
        description: 'Page not found (404)'
      });
      results.summary.failed++;
    } else if (consoleErrors.length > 0) {
      results.issues.push({
        page: pageName,
        type: 'frontend',
        severity: 'medium',
        description: `Console errors: ${consoleErrors.length}`,
        console_errors: consoleErrors
      });
      results.summary.warnings++;
      console.log(`  ⚠ Console errors: ${consoleErrors.length}`);
    } else {
      console.log(`  ✓ Page loaded successfully`);
      results.summary.passed++;
    }

    // Save screenshot
    const screenshotDir = path.join(__dirname, 'test-screenshots');
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }
    await page.screenshot({
      path: path.join(screenshotDir, `${pageName.replace('/', '-')}.png`),
      fullPage: true
    });

  } catch (error) {
    console.log(`  ✗ Error: ${error.message}`);
    results.issues.push({
      page: pageName,
      type: 'frontend',
      severity: 'critical',
      description: `Failed to load: ${error.message}`
    });
    results.summary.failed++;
  } finally {
    await page.close();
  }
}

async function runTests() {
  console.log('🚀 Quick Auth Test for https://operate.guru\n');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  try {
    // Test all authentication pages
    await testPage(browser, 'https://operate.guru/login', 'login');
    await testPage(browser, 'https://operate.guru/register', 'register');
    await testPage(browser, 'https://operate.guru/forgot-password', 'forgot-password');
    await testPage(browser, 'https://operate.guru/mfa/setup', 'mfa-setup');
    await testPage(browser, 'https://operate.guru/mfa/verify', 'mfa-verify');
    await testPage(browser, 'https://operate.guru/verify-email', 'verify-email');
    await testPage(browser, 'https://operate.guru/dashboard', 'dashboard-auth-check');

  } finally {
    await browser.close();
  }

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST RESULTS');
  console.log('='.repeat(60));
  console.log(`Total: ${results.summary.total}`);
  console.log(`Passed: ${results.summary.passed} ✓`);
  console.log(`Failed: ${results.summary.failed} ✗`);
  console.log(`Warnings: ${results.summary.warnings} ⚠`);

  if (results.issues.length > 0) {
    console.log('\n🐛 ISSUES:');
    results.issues.forEach((issue, idx) => {
      console.log(`\n${idx + 1}. [${issue.severity.toUpperCase()}] ${issue.page}`);
      console.log(`   ${issue.description}`);
      if (issue.console_errors && issue.console_errors.length > 0) {
        console.log(`   Errors: ${issue.console_errors.slice(0, 2).join(', ')}`);
      }
    });
  }

  // Save JSON report
  const reportPath = path.join(__dirname, 'quick-auth-test-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`\n📄 Report saved to: ${reportPath}`);

  process.exit(results.summary.failed > 0 ? 1 : 0);
}

runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
