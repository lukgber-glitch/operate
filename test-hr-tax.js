const puppeteer = require('puppeteer-core');
const fs = require('fs');

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const report = {
  issues: [],
  working: []
};

function addIssue(priority, area, description, steps, expected, actual, file = null) {
  report.issues.push({ priority, area, description, steps, expected, actual, file });
}

function addWorking(area, feature) {
  report.working.push({ area, feature });
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

    console.log('=== OPERATE.GURU TEST SUITE ===');

    await page.goto('https://operate.guru', { waitUntil: 'networkidle2', timeout: 30000 });
    await page.screenshot({ path: 'sc-01-initial.png', fullPage: true });

    const initialUrl = await page.url();
    console.log('Initial URL:', initialUrl);

    if (initialUrl.includes('/onboarding')) {
      console.log('On onboarding - attempting HR direct access...');
      addWorking('Auth', 'Redirects to onboarding for new users');

      await page.goto('https://operate.guru/hr', { waitUntil: 'networkidle2', timeout: 30000 });
      await sleep(2000);
      await page.screenshot({ path: 'sc-02-hr-direct.png', fullPage: true });

      const hrUrl = await page.url();
      if (hrUrl.includes('/onboarding')) {
        addIssue('P1', 'Navigation', 'Cannot access HR - redirects to onboarding',
          'Navigate to /hr',
          'HR dashboard',
          'Onboarding page',
          'apps/web/middleware'
        );
      }
    }

    console.log('HR TESTS');
    await page.goto('https://operate.guru/hr', { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(2000);
    await page.screenshot({ path: 'sc-03-hr.png', fullPage: true });
    console.log('HR URL:', await page.url());

    await page.goto('https://operate.guru/hr/employees', { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(2000);
    await page.screenshot({ path: 'sc-04-employees.png', fullPage: true });
    console.log('Employees URL:', await page.url());

    await page.goto('https://operate.guru/hr/contracts', { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(2000);
    await page.screenshot({ path: 'sc-05-contracts.png', fullPage: true });
    console.log('Contracts URL:', await page.url());

    await page.goto('https://operate.guru/hr/leave', { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(2000);
    await page.screenshot({ path: 'sc-06-leave.png', fullPage: true });
    console.log('Leave URL:', await page.url());

    await page.goto('https://operate.guru/hr/payroll', { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(2000);
    await page.screenshot({ path: 'sc-07-payroll.png', fullPage: true });
    console.log('Payroll URL:', await page.url());

    await page.goto('https://operate.guru/hr/benefits', { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(2000);
    await page.screenshot({ path: 'sc-08-benefits.png', fullPage: true });
    console.log('Benefits URL:', await page.url());

    console.log('TAX TESTS');
    await page.goto('https://operate.guru/tax', { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(2000);
    await page.screenshot({ path: 'sc-09-tax.png', fullPage: true });
    console.log('Tax URL:', await page.url());

    await page.goto('https://operate.guru/tax/germany', { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(2000);
    await page.screenshot({ path: 'sc-10-germany.png', fullPage: true });
    console.log('Germany URL:', await page.url());

    await page.goto('https://operate.guru/tax/austria', { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(2000);
    await page.screenshot({ path: 'sc-11-austria.png', fullPage: true });
    console.log('Austria URL:', await page.url());

    await page.goto('https://operate.guru/tax/uk', { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(2000);
    await page.screenshot({ path: 'sc-12-uk.png', fullPage: true });
    console.log('UK URL:', await page.url());

    await page.goto('https://operate.guru/tax/vat', { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(2000);
    await page.screenshot({ path: 'sc-13-vat.png', fullPage: true });
    console.log('VAT URL:', await page.url());

    await page.goto('https://operate.guru/tax/calendar', { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(2000);
    await page.screenshot({ path: 'sc-14-calendar.png', fullPage: true });
    console.log('Calendar URL:', await page.url());

    const timestamp = new Date().toISOString();
    const reportText = 'OPERATE.GURU TEST REPORT\nGenerated: ' + timestamp + '\n\nISSUES FOUND: ' + report.issues.length + '\n' +
      report.issues.map((issue, i) => i + 1 + '. ISSUE: [' + issue.priority + '] [' + issue.area + '] ' + issue.description + '\n   Steps: ' + issue.steps + '\n   Expected: ' + issue.expected + '\n   Actual: ' + issue.actual + '\n   ' + (issue.file ? 'File: ' + issue.file : '')).join('\n') +
      '\n\nWORKING FEATURES: ' + report.working.length + '\n' +
      report.working.map((w, i) => i + 1 + '. WORKING: [' + w.area + '] ' + w.feature).join('\n');

    fs.writeFileSync('test-report.txt', reportText);
    console.log('TEST COMPLETE');

  } catch (error) {
    console.error('ERROR:', error.message);
    if (page) {
      await page.screenshot({ path: 'sc-error.png', fullPage: true });
    }
  }
})();
