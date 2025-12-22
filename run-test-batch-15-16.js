const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const PAGES = [
  { batch: 15, route: '/settings', name: 'Settings Overview' },
  { batch: 15, route: '/settings/profile', name: 'Profile Settings' },
  { batch: 15, route: '/settings/ai', name: 'AI Settings' },
  { batch: 15, route: '/settings/automation', name: 'Automation Settings' },
  { batch: 15, route: '/settings/billing', name: 'Billing Settings' },
  { batch: 15, route: '/settings/connections', name: 'Connections Settings' },
  { batch: 15, route: '/settings/email', name: 'Email Settings' },
  { batch: 15, route: '/settings/exports', name: 'Export Settings' },
  { batch: 15, route: '/settings/notifications', name: 'Notification Settings' },
  { batch: 15, route: '/settings/security', name: 'Security Settings' },
  { batch: 15, route: '/settings/tax', name: 'Tax Settings' },
  { batch: 15, route: '/settings/tax/exemptions', name: 'Tax Exemptions' },
  { batch: 15, route: '/settings/tax/nexus', name: 'Tax Nexus' },
  { batch: 15, route: '/settings/verification', name: 'Verification Settings' },
  { batch: 15, route: '/settings/verification/start', name: 'Start Verification' },
  { batch: 16, route: '/admin', name: 'Admin Dashboard' },
  { batch: 16, route: '/admin/users', name: 'Admin Users' },
  { batch: 16, route: '/admin/roles', name: 'Admin Roles' },
  { batch: 16, route: '/admin/subscriptions', name: 'Admin Subscriptions' },
  { batch: 16, route: '/developer', name: 'Developer Dashboard' },
  { batch: 16, route: '/developer/api-keys', name: 'API Keys' },
  { batch: 16, route: '/developer/webhooks', name: 'Webhooks' },
  { batch: 16, route: '/developer/logs', name: 'Developer Logs' },
  { batch: 16, route: '/api-docs', name: 'API Documentation' },
  { batch: 16, route: '/help', name: 'Help Center' }
];

const screenshotDir = path.join(__dirname, 'test-screenshots', 'batch-15-16');
if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

async function testPage(browser, pageConfig, index) {
  const page = await browser.newPage();
  const result = {
    batch: pageConfig.batch,
    route: pageConfig.route,
    name: pageConfig.name,
    status: null,
    passed: false,
    redirected: false,
    finalUrl: null,
    screenshot: null,
    consoleErrors: [],
    apiErrors: [],
    timing: null
  };

  try {
    const startTime = Date.now();
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        result.consoleErrors.push(msg.text());
      }
    });

    page.on('requestfailed', request => {
      result.apiErrors.push({
        url: request.url(),
        failure: request.failure().errorText
      });
    });

    const url = 'https://operate.guru' + pageConfig.route;
    console.log('[' + (index + 1) + '/' + BATCH_12_13_14_PAGES.length + '] Testing: ' + url);
    
    const response = await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    const endTime = Date.now();
    result.timing = (endTime - startTime) + 'ms';
    result.finalUrl = page.url();
    result.status = response.status();

    if (result.finalUrl.includes('/login')) {
      result.redirected = true;
      result.passed = false;
      console.log('FAILED: Redirected to login');
    } else if (result.finalUrl.includes('/onboarding')) {
      result.redirected = true;
      result.passed = false;
      console.log('FAILED: Redirected to onboarding');
    } else if (result.status === 200) {
      result.passed = true;
      console.log('PASSED: Status ' + result.status);
    } else {
      result.passed = false;
      console.log('FAILED: Status ' + result.status);
    }

    const screenshotPath = path.join(
      screenshotDir,
      String(index + 1).padStart(2, '0') + '-' + pageConfig.route.replace(///g, '-').substring(1) + '.png'
    );
    await page.screenshot({ path: screenshotPath, fullPage: true });
    result.screenshot = screenshotPath;
    console.log('Screenshot: ' + screenshotPath);

    if (result.consoleErrors.length > 0) {
      console.log('Console Errors: ' + result.consoleErrors.length);
    }
    if (result.apiErrors.length > 0) {
      console.log('API Errors: ' + result.apiErrors.length);
    }

  } catch (error) {
    result.passed = false;
    result.error = error.message;
    console.log('ERROR: ' + error.message);
  } finally {
    await page.close();
  }

  return result;
}

async function runTests() {
  console.log('='.repeat(60));
  console.log('BROWSER E2E TEST - BATCH 15-16: SETTINGS AND ADMIN');
  console.log('='.repeat(60));
  console.log('Testing ' + BATCH_12_13_14_PAGES.length + ' pages');
  console.log('Connecting to Chrome at debug port 9222...');

  let browser;
  try {
    browser = await puppeteer.connect({
      browserURL: 'http://127.0.0.1:9222',
      defaultViewport: { width: 1920, height: 1080 }
    });

    console.log('Connected to Chrome');

    const results = [];
    
    for (let i = 0; i < BATCH_12_13_14_PAGES.length; i++) {
      const result = await testPage(browser, BATCH_12_13_14_PAGES[i], i);
      results.push(result);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('='.repeat(60));
    console.log('TEST SUMMARY');
    console.log('='.repeat(60));

    const batch15Results = results.filter(r => r.batch === 15);
    const batch16Results = results.filter(r => r.batch === 16);
    const batch17Results = results.filter(r => r.batch === 17);

    console.log('BATCH 15 - Settings: ' + batch15Results.filter(r => r.passed).length + '/' + batch15Results.length + ' passed');
    batch15Results.forEach(r => {
      console.log('  ' + (r.passed ? 'PASS' : 'FAIL') + ' ' + r.route + ' - ' + r.name);
    });

    console.log('BATCH 16 - Admin/Developer: ' + batch16Results.filter(r => r.passed).length + '/' + batch16Results.length + ' passed');
    batch16Results.forEach(r => {
      console.log('  ' + (r.passed ? 'PASS' : 'FAIL') + ' ' + r.route + ' - ' + r.name);
    });

    console.log('BATCH 17 - (unused): ' + batch17Results.filter(r => r.passed).length + '/' + batch17Results.length + ' passed');
    batch17Results.forEach(r => {
      console.log('  ' + (r.passed ? 'PASS' : 'FAIL') + ' ' + r.route + ' - ' + r.name);
    });

    const totalPassed = results.filter(r => r.passed).length;
    const totalTests = results.length;
    console.log('='.repeat(60));
    console.log('OVERALL: ' + totalPassed + '/' + totalTests + ' tests passed (' + Math.round(totalPassed/totalTests*100) + '%)');
    console.log('='.repeat(60));

    const outputData = {
      batch: '15-16',
      timestamp: new Date().toISOString(),
      summary: {
        total: totalTests,
        passed: totalPassed,
        failed: totalTests - totalPassed,
        batch15: {
          total: batch15Results.length,
          passed: batch15Results.filter(r => r.passed).length
        },
        batch16: {
          total: batch16Results.length,
          passed: batch16Results.filter(r => r.passed).length
        },
        batch17: {
          total: batch17Results.length,
          passed: batch17Results.filter(r => r.passed).length
        }
      },
      pages: results
    };

    const jsonPath = path.join(__dirname, 'BATCH_15_16_TEST_RESULTS.json');
    fs.writeFileSync(jsonPath, JSON.stringify(outputData, null, 2));
    console.log('Results saved: ' + jsonPath);

    await browser.disconnect();
    process.exit(totalPassed === totalTests ? 0 : 1);

  } catch (error) {
    console.error('Fatal Error:', error.message);
    if (browser) await browser.disconnect();
    process.exit(1);
  }
}

runTests();
