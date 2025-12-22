const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const PAGES = [
  { batch: 15, route: '/settings', name: 'settings' },
  { batch: 15, route: '/settings/profile', name: 'settings-profile' },
  { batch: 15, route: '/settings/ai', name: 'settings-ai' },
  { batch: 15, route: '/settings/automation', name: 'settings-automation' },
  { batch: 15, route: '/settings/billing', name: 'settings-billing' },
  { batch: 15, route: '/settings/connections', name: 'settings-connections' },
  { batch: 15, route: '/settings/email', name: 'settings-email' },
  { batch: 15, route: '/settings/exports', name: 'settings-exports' },
  { batch: 15, route: '/settings/notifications', name: 'settings-notifications' },
  { batch: 15, route: '/settings/security', name: 'settings-security' },
  { batch: 15, route: '/settings/tax', name: 'settings-tax' },
  { batch: 15, route: '/settings/tax/exemptions', name: 'settings-tax-exemptions' },
  { batch: 15, route: '/settings/tax/nexus', name: 'settings-tax-nexus' },
  { batch: 15, route: '/settings/verification', name: 'settings-verification' },
  { batch: 15, route: '/settings/verification/start', name: 'settings-verification-start' },
  { batch: 16, route: '/admin', name: 'admin' },
  { batch: 16, route: '/admin/users', name: 'admin-users' },
  { batch: 16, route: '/admin/roles', name: 'admin-roles' },
  { batch: 16, route: '/admin/subscriptions', name: 'admin-subscriptions' },
  { batch: 16, route: '/developer', name: 'developer' },
  { batch: 16, route: '/developer/api-keys', name: 'developer-api-keys' },
  { batch: 16, route: '/developer/webhooks', name: 'developer-webhooks' },
  { batch: 16, route: '/developer/logs', name: 'developer-logs' },
  { batch: 16, route: '/api-docs', name: 'api-docs' },
  { batch: 16, route: '/help', name: 'help' }
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
    hasH1: false,
    h1Text: null,
    screenshot: null,
    issues: [],
    consoleErrors: [],
    timing: null
  };

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  try {
    const startTime = Date.now();
    const url = 'https://operate.guru' + pageConfig.route;
    console.log('[' + (index + 1) + '/' + PAGES.length + '] Testing: ' + url);
    
    const response = await page.goto(url, {
      waitUntil: 'networkidle0',
      timeout: 30000
    });

    result.status = response.status();
    result.timing = (Date.now() - startTime) + 'ms';
    console.log('Status: ' + result.status);

    if (result.status !== 200) {
      result.issues.push('HTTP ' + result.status + ' - Expected 200');
    }

    await page.waitForTimeout(2000);

    const h1Element = await page.$('h1');
    if (h1Element) {
      result.hasH1 = true;
      result.h1Text = await page.evaluate(el => el.textContent, h1Element);
      console.log('H1: ' + result.h1Text);
    } else {
      result.issues.push('No h1 heading found');
      console.log('No h1 found');
    }

    const screenshotPath = path.join(
      screenshotDir,
      String(index + 1).padStart(2, '0') + '-' + pageConfig.name + '.png'
    );
    await page.screenshot({ 
      path: screenshotPath,
      fullPage: true 
    });
    result.screenshot = screenshotPath;
    console.log('Screenshot saved');

    if (consoleErrors.length > 0) {
      const uniqueErrors = [...new Set(consoleErrors)];
      result.consoleErrors = uniqueErrors;
      result.issues.push('Console errors: ' + uniqueErrors.length + ' errors');
      console.log('Console errors: ' + uniqueErrors.length);
    }

    result.passed = result.status === 200 && result.hasH1 && consoleErrors.length === 0;

  } catch (error) {
    result.issues.push('Error: ' + error.message);
    console.log('Error: ' + error.message);
  } finally {
    await page.close();
  }

  return result;
}

async function runTests() {
  console.log('='.repeat(60));
  console.log('BROWSER E2E TEST - BATCH 02: PUBLIC PAGES');
  console.log('='.repeat(60));
  console.log('Testing ' + PAGES.length + ' public pages (no auth required)');
  console.log('Connecting to Chrome at debug port 9222...');

  let browser;
  try {
    browser = await puppeteer.connect({
      browserURL: 'http://127.0.0.1:9222',
      defaultViewport: { width: 1920, height: 1080 }
    });

    console.log('Connected to Chrome');

    const results = [];
    
    for (let i = 0; i < PAGES.length; i++) {
      const result = await testPage(browser, PAGES[i], i);
      results.push(result);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('='.repeat(60));
    console.log('TEST SUMMARY');
    console.log('='.repeat(60));

    const passed = results.filter(r => r.passed).length;
    const total = results.length;

    results.forEach(r => {
      const status = r.passed ? 'PASS' : 'FAIL';
      console.log(status.padEnd(6) + ' | ' + r.route.padEnd(20) + ' | HTTP ' + (r.status || 'N/A') + ' | H1: ' + (r.hasH1 ? 'Yes' : 'No'));
    });

    console.log('='.repeat(60));
    console.log('OVERALL: ' + passed + '/' + total + ' tests passed (' + Math.round(passed/total*100) + '%)');
    console.log('='.repeat(60));

    const outputData = {
      batch: '15-16',
      timestamp: new Date().toISOString(),
      summary: {
        total: total,
        passed: passed,
        failed: total - passed
      },
      pages: results
    };

    const jsonPath = path.join(__dirname, 'BATCH_15_16_TEST_RESULTS.json');
    fs.writeFileSync(jsonPath, JSON.stringify(outputData, null, 2));
    console.log('Results saved: ' + jsonPath);

    await browser.disconnect();
    process.exit(passed === total ? 0 : 1);

  } catch (error) {
    console.error('Fatal Error:', error.message);
    if (browser) await browser.disconnect();
    process.exit(1);
  }
}

runTests();
