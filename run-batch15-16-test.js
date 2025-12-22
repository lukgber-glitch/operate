const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const BATCH_12_13_14_PAGES = [
  // BATCH 12 - CRM/Clients
  { batch: 12, route: '/crm', name: 'CRM Dashboard' },
  { batch: 12, route: '/clients', name: 'Clients List' },
  { batch: 12, route: '/vendors', name: 'Vendors List' },
  { batch: 12, route: '/vendors/new', name: 'New Vendor Form' },
  
  // BATCH 13 - Contracts/Quotes
  { batch: 13, route: '/contracts', name: 'Contracts List' },
  { batch: 13, route: '/contracts/new', name: 'New Contract Form' },
  { batch: 13, route: '/contracts/templates', name: 'Contract Templates' },
  { batch: 13, route: '/quotes', name: 'Quotes List' },
  { batch: 13, route: '/quotes/new', name: 'New Quote Form' },
  
  // BATCH 14 - Documents
  { batch: 14, route: '/documents', name: 'Documents List' },
  { batch: 14, route: '/documents/upload', name: 'Document Upload' },
  { batch: 14, route: '/documents/templates', name: 'Document Templates' }
];

const screenshotDir = path.join(__dirname, 'test-screenshots', 'batch-12-14');
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
  console.log('BROWSER E2E TEST - BATCH 12-14: CRM, CONTRACTS, DOCUMENTS');
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

    const batch12Results = results.filter(r => r.batch === 12);
    const batch13Results = results.filter(r => r.batch === 13);
    const batch14Results = results.filter(r => r.batch === 14);

    console.log('BATCH 12 - CRM/Clients: ' + batch12Results.filter(r => r.passed).length + '/' + batch12Results.length + ' passed');
    batch12Results.forEach(r => {
      console.log('  ' + (r.passed ? 'PASS' : 'FAIL') + ' ' + r.route + ' - ' + r.name);
    });

    console.log('BATCH 13 - Contracts/Quotes: ' + batch13Results.filter(r => r.passed).length + '/' + batch13Results.length + ' passed');
    batch13Results.forEach(r => {
      console.log('  ' + (r.passed ? 'PASS' : 'FAIL') + ' ' + r.route + ' - ' + r.name);
    });

    console.log('BATCH 14 - Documents: ' + batch14Results.filter(r => r.passed).length + '/' + batch14Results.length + ' passed');
    batch14Results.forEach(r => {
      console.log('  ' + (r.passed ? 'PASS' : 'FAIL') + ' ' + r.route + ' - ' + r.name);
    });

    const totalPassed = results.filter(r => r.passed).length;
    const totalTests = results.length;
    console.log('='.repeat(60));
    console.log('OVERALL: ' + totalPassed + '/' + totalTests + ' tests passed (' + Math.round(totalPassed/totalTests*100) + '%)');
    console.log('='.repeat(60));

    const outputData = {
      batch: '12-14',
      timestamp: new Date().toISOString(),
      summary: {
        total: totalTests,
        passed: totalPassed,
        failed: totalTests - totalPassed,
        batch12: {
          total: batch12Results.length,
          passed: batch12Results.filter(r => r.passed).length
        },
        batch13: {
          total: batch13Results.length,
          passed: batch13Results.filter(r => r.passed).length
        },
        batch14: {
          total: batch14Results.length,
          passed: batch14Results.filter(r => r.passed).length
        }
      },
      pages: results
    };

    const jsonPath = path.join(__dirname, 'BATCH_12_14_TEST_RESULTS.json');
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
