const puppeteer = require('puppeteer-core');
const fs = require('fs');

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const report = {
  issues: [],
  working: [],
  testResults: []
};

function addIssue(priority, area, description, steps, expected, actual, file = null) {
  report.issues.push({ priority, area, description, steps, expected, actual, file });
}

function addWorking(area, feature) {
  report.working.push({ area, feature });
}

function addTestResult(name, status, details) {
  report.testResults.push({ name, status, details });
}

(async () => {
  let browser, page;

  try {
    browser = await puppeteer.connect({
      browserURL: 'http://localhost:9222',
      defaultViewport: { width: 1920, height: 1080 }
    });

    const pages = await browser.pages();
    page = pages[0] || await browser.newPage();

    console.log('=== OPERATE.GURU COMPREHENSIVE TEST SUITE ===\n');

    // TEST 0: Check authentication status
    console.log('TEST 0: Authentication Status');
    await page.goto('https://operate.guru', { waitUntil: 'networkidle2', timeout: 30000 });
    await page.screenshot({ path: 'sc-00-auth-check.png', fullPage: true });

    const initialUrl = await page.url();
    const pageText = await page.evaluate(() => document.body.innerText);
    const isLoginPage = pageText.includes('Willkommen bei Operate') || pageText.includes('Anmelden') || initialUrl.includes('/login') || initialUrl.includes('/signin');
    const isOnboarding = initialUrl.includes('/onboarding');

    console.log('Initial URL:', initialUrl);
    console.log('Is Login Page:', isLoginPage);
    console.log('Is Onboarding:', isOnboarding);

    if (isLoginPage) {
      addIssue('P0', 'Authentication', 'User is not logged in',
        'Open https://operate.guru',
        'User should be logged in and see dashboard or onboarding',
        'Shows login page - user needs to authenticate first',
        'apps/web/app/page.tsx or middleware'
      );
      addTestResult('Authentication Check', 'FAILED', 'User not logged in - cannot test HR/Tax modules');

      // Check if login form elements exist
      const hasEmailField = await page.$('input[type="email"]') !== null;
      const hasPasswordField = await page.$('input[type="password"]') !== null;
      const hasLoginButton = pageText.includes('Anmelden');
      const hasGoogleOAuth = pageText.includes('Google');
      const hasMicrosoftOAuth = pageText.includes('Microsoft');

      console.log('Login Form Elements:');
      console.log('  Email field:', hasEmailField);
      console.log('  Password field:', hasPasswordField);
      console.log('  Login button:', hasLoginButton);
      console.log('  Google OAuth:', hasGoogleOAuth);
      console.log('  Microsoft OAuth:', hasMicrosoftOAuth);

      if (hasEmailField && hasPasswordField && hasLoginButton) {
        addWorking('Auth', 'Login form rendered with email/password fields');
      }
      if (hasGoogleOAuth) {
        addWorking('Auth', 'Google OAuth button present');
      }
      if (hasMicrosoftOAuth) {
        addWorking('Auth', 'Microsoft OAuth button present');
      }

    } else if (isOnboarding) {
      addWorking('Auth', 'User authenticated and redirected to onboarding');
      addTestResult('Authentication Check', 'PASSED', 'User authenticated but in onboarding flow');
    } else {
      addWorking('Auth', 'User is logged in');
      addTestResult('Authentication Check', 'PASSED', 'User authenticated');
    }

    // TEST 1: HR Module Access
    console.log('\nTEST 1: HR Module Access');
    await page.goto('https://operate.guru/hr', { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(2000);
    await page.screenshot({ path: 'sc-01-hr.png', fullPage: true });

    const hrUrl = await page.url();
    const hrText = await page.evaluate(() => document.body.innerText);
    console.log('HR URL:', hrUrl);

    if (hrUrl.includes('/login') || hrUrl.includes('/signin')) {
      addIssue('P0', 'HR Module', 'HR module redirects to login',
        'Navigate to https://operate.guru/hr',
        'Show HR dashboard or employees page',
        'Redirects to login page',
        'apps/web/middleware.ts or apps/web/app/hr/layout.tsx'
      );
      addTestResult('HR Module Access', 'BLOCKED', 'Requires authentication');
    } else if (hrUrl.includes('/onboarding')) {
      addIssue('P1', 'HR Module', 'HR module redirects to onboarding',
        'Navigate to https://operate.guru/hr while logged in',
        'Show HR dashboard',
        'Redirects to onboarding - blocks access until setup complete',
        'apps/web/middleware.ts'
      );
      addTestResult('HR Module Access', 'BLOCKED', 'Onboarding required');
    } else if (hrUrl.includes('/hr')) {
      addWorking('HR Module', 'HR route accessible');
      addTestResult('HR Module Access', 'PASSED', 'HR module loads');

      // Check for HR-specific content
      if (hrText.toLowerCase().includes('employee') || hrText.toLowerCase().includes('mitarbeiter')) {
        addWorking('HR Module', 'Shows employee-related content');
      }
    } else {
      addIssue('P2', 'HR Module', 'Unexpected redirect from HR module',
        'Navigate to /hr',
        'Stay on /hr route',
        'Redirected to: ' + hrUrl,
        'apps/web/app/hr/page.tsx'
      );
      addTestResult('HR Module Access', 'FAILED', 'Unexpected redirect to ' + hrUrl);
    }

    // TEST 2: HR Sub-routes
    const hrRoutes = [
      { path: '/hr/employees', name: 'Employees List' },
      { path: '/hr/contracts', name: 'Contracts' },
      { path: '/hr/leave', name: 'Leave Management' },
      { path: '/hr/payroll', name: 'Payroll' },
      { path: '/hr/benefits', name: 'Benefits' }
    ];

    for (const route of hrRoutes) {
      console.log('\nTEST: HR -', route.name);
      await page.goto('https://operate.guru' + route.path, { waitUntil: 'networkidle2', timeout: 30000 });
      await sleep(2000);
      const routeUrl = await page.url();
      console.log('URL:', routeUrl);

      if (routeUrl.includes(route.path)) {
        addWorking('HR Module', route.name + ' route accessible');
        addTestResult('HR - ' + route.name, 'PASSED', 'Route loads');
      } else if (routeUrl.includes('/login')) {
        addTestResult('HR - ' + route.name, 'BLOCKED', 'Requires authentication');
      } else if (routeUrl.includes('/onboarding')) {
        addTestResult('HR - ' + route.name, 'BLOCKED', 'Onboarding required');
      } else {
        addIssue('P2', 'HR Module', route.name + ' route not working',
          'Navigate to ' + route.path,
          'Load ' + route.name + ' page',
          'Redirects to ' + routeUrl,
          'apps/web/app' + route.path + '/page.tsx'
        );
        addTestResult('HR - ' + route.name, 'FAILED', 'Redirects to ' + routeUrl);
      }
    }

    // TEST 3: Tax Module Access
    console.log('\nTEST 3: Tax Module Access');
    await page.goto('https://operate.guru/tax', { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(2000);
    await page.screenshot({ path: 'sc-02-tax.png', fullPage: true });

    const taxUrl = await page.url();
    const taxText = await page.evaluate(() => document.body.innerText);
    console.log('Tax URL:', taxUrl);

    if (taxUrl.includes('/login') || taxUrl.includes('/signin')) {
      addIssue('P0', 'Tax Module', 'Tax module redirects to login',
        'Navigate to https://operate.guru/tax',
        'Show tax dashboard',
        'Redirects to login page',
        'apps/web/middleware.ts'
      );
      addTestResult('Tax Module Access', 'BLOCKED', 'Requires authentication');
    } else if (taxUrl.includes('/onboarding')) {
      addIssue('P1', 'Tax Module', 'Tax module redirects to onboarding',
        'Navigate to https://operate.guru/tax while logged in',
        'Show tax dashboard',
        'Redirects to onboarding',
        'apps/web/middleware.ts'
      );
      addTestResult('Tax Module Access', 'BLOCKED', 'Onboarding required');
    } else if (taxUrl.includes('/tax')) {
      addWorking('Tax Module', 'Tax route accessible');
      addTestResult('Tax Module Access', 'PASSED', 'Tax module loads');

      if (taxText.toLowerCase().includes('tax') || taxText.toLowerCase().includes('steuer') || taxText.toLowerCase().includes('vat')) {
        addWorking('Tax Module', 'Shows tax-related content');
      }
    } else {
      addIssue('P2', 'Tax Module', 'Unexpected redirect from Tax module',
        'Navigate to /tax',
        'Stay on /tax route',
        'Redirected to: ' + taxUrl,
        'apps/web/app/tax/page.tsx'
      );
      addTestResult('Tax Module Access', 'FAILED', 'Unexpected redirect to ' + taxUrl);
    }

    // TEST 4: Tax Sub-routes
    const taxRoutes = [
      { path: '/tax/germany', name: 'Germany ELSTER' },
      { path: '/tax/austria', name: 'Austria FinanzOnline' },
      { path: '/tax/uk', name: 'UK HMRC' },
      { path: '/tax/vat', name: 'VAT Returns' },
      { path: '/tax/calendar', name: 'Tax Calendar' }
    ];

    for (const route of taxRoutes) {
      console.log('\nTEST: Tax -', route.name);
      await page.goto('https://operate.guru' + route.path, { waitUntil: 'networkidle2', timeout: 30000 });
      await sleep(2000);
      const routeUrl = await page.url();
      console.log('URL:', routeUrl);

      if (routeUrl.includes(route.path)) {
        addWorking('Tax Module', route.name + ' route accessible');
        addTestResult('Tax - ' + route.name, 'PASSED', 'Route loads');
      } else if (routeUrl.includes('/login')) {
        addTestResult('Tax - ' + route.name, 'BLOCKED', 'Requires authentication');
      } else if (routeUrl.includes('/onboarding')) {
        addTestResult('Tax - ' + route.name, 'BLOCKED', 'Onboarding required');
      } else {
        addIssue('P2', 'Tax Module', route.name + ' route not working',
          'Navigate to ' + route.path,
          'Load ' + route.name + ' page',
          'Redirects to ' + routeUrl,
          'apps/web/app' + route.path + '/page.tsx'
        );
        addTestResult('Tax - ' + route.name, 'FAILED', 'Redirects to ' + routeUrl);
      }
    }

    // Generate Report
    console.log('\n=== GENERATING REPORT ===');

    const timestamp = new Date().toISOString();
    let reportText = '====================================\n';
    reportText += 'OPERATE.GURU TEST REPORT\n';
    reportText += '====================================\n';
    reportText += 'Generated: ' + timestamp + '\n';
    reportText += 'Total Tests: ' + report.testResults.length + '\n\n';

    // Test Summary
    const passed = report.testResults.filter(t => t.status === 'PASSED').length;
    const failed = report.testResults.filter(t => t.status === 'FAILED').length;
    const blocked = report.testResults.filter(t => t.status === 'BLOCKED').length;

    reportText += 'TEST SUMMARY:\n';
    reportText += '  PASSED:  ' + passed + '\n';
    reportText += '  FAILED:  ' + failed + '\n';
    reportText += '  BLOCKED: ' + blocked + '\n\n';

    // Issues
    reportText += '====================================\n';
    reportText += 'ISSUES FOUND: ' + report.issues.length + '\n';
    reportText += '====================================\n\n';

    report.issues.forEach((issue, i) => {
      reportText += (i + 1) + '. ISSUE: [' + issue.priority + '] [' + issue.area + '] ' + issue.description + '\n';
      reportText += '   Steps to reproduce: ' + issue.steps + '\n';
      reportText += '   Expected behavior: ' + issue.expected + '\n';
      reportText += '   Actual behavior: ' + issue.actual + '\n';
      if (issue.file) {
        reportText += '   File location: ' + issue.file + '\n';
      }
      reportText += '\n';
    });

    // Working Features
    reportText += '====================================\n';
    reportText += 'WORKING FEATURES: ' + report.working.length + '\n';
    reportText += '====================================\n\n';

    report.working.forEach((w, i) => {
      reportText += (i + 1) + '. WORKING: [' + w.area + '] ' + w.feature + '\n';
    });

    // Detailed Test Results
    reportText += '\n====================================\n';
    reportText += 'DETAILED TEST RESULTS\n';
    reportText += '====================================\n\n';

    report.testResults.forEach((test, i) => {
      reportText += (i + 1) + '. ' + test.name + ': ' + test.status + '\n';
      reportText += '   ' + test.details + '\n\n';
    });

    reportText += '\n====================================\n';
    reportText += 'Screenshots saved to current directory (sc-*.png)\n';
    reportText += '====================================\n';

    fs.writeFileSync('test-report.txt', reportText);
    console.log('\nREPORT SAVED: test-report.txt');
    console.log('\nTEST COMPLETE');
    console.log('Issues:', report.issues.length);
    console.log('Working:', report.working.length);

  } catch (error) {
    console.error('TEST ERROR:', error.message);
    console.error(error.stack);
    if (page) {
      await page.screenshot({ path: 'sc-error.png', fullPage: true });
    }
  }
})();
