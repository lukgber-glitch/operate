const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const pages = [
  { path: '/finance', name: 'Finance Dashboard' },
  { path: '/finance/invoices', name: 'Invoices' },
  { path: '/finance/invoices/new', name: 'New Invoice' },
  { path: '/finance/invoices/recurring', name: 'Recurring Invoices' },
  { path: '/finance/expenses', name: 'Expenses' },
  { path: '/finance/expenses/new', name: 'New Expense' },
  { path: '/finance/expenses/scan', name: 'Scan Receipt' },
  { path: '/finance/transactions', name: 'Transactions' },
  { path: '/finance/banking', name: 'Banking' },
  { path: '/finance/bank-accounts', name: 'Bank Accounts' },
  { path: '/finance/reconciliation', name: 'Reconciliation' },
  { path: '/finance/accounts', name: 'Chart of Accounts' }
];

async function runTest() {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  const results = [];

  console.log('Logging in...');
  await page.goto('https://operate.guru/login');
  await page.waitForSelector('input[type="email"]');
  await page.type('input[type="email"]', 'test@operate.guru');
  await page.type('input[type="password"]', 'TestPassword123!');
  await Promise.all([page.waitForNavigation(), page.click('button[type="submit"]')]);
  
  const loginUrl = page.url();
  console.log('Logged in at:', loginUrl);
  await page.screenshot({ path: path.join('test-screenshots', 'finance-pages', '00-login.png'), fullPage: true });

  for (let i = 0; i < pages.length; i++) {
    const pg = pages[i];
    const url = 'https://operate.guru' + pg.path;
    const num = String(i+1).padStart(2,'0');
    console.log(num + '/' + pages.length + ' ' + pg.name);
    
    const errors = [];
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    
    try {
      await page.goto(url, { timeout: 30000 });
      const finalUrl = page.url();
      const redirected = finalUrl !== url;
      await page.screenshot({ 
        path: path.join('test-screenshots', 'finance-pages', num + '-' + pg.name.replace(/ /g, '-') + '.png'), 
        fullPage: true 
      });
      
      let status = 'PASS';
      if (redirected && finalUrl.includes('/onboarding')) status = 'FAIL';
      else if (errors.length > 0) status = 'WARN';
      
      results.push({ num, name: pg.name, url, finalUrl, redirected, status, errors: errors.slice(0,2) });
      console.log('  ' + status);
    } catch (e) {
      results.push({ num, name: pg.name, url, status: 'FAIL', errors: [e.message] });
      console.log('  FAIL');
    }
  }

  const lines = [];
  lines.push('# BROWSER-FINANCE Test Report');
  lines.push('');
  lines.push('**Date**: ' + new Date().toISOString());
  lines.push('**Login URL**: ' + loginUrl);
  lines.push('');
  lines.push('## Results');
  lines.push('');
  lines.push('| # | Page | URL | Status | Redirected | Errors |');
  lines.push('|---|------|-----|--------|------------|--------|');
  
  results.forEach(r => {
    const redir = r.redirected ? r.finalUrl : 'No';
    const errs = r.errors && r.errors.length > 0 ? r.errors.join('; ') : 'None';
    lines.push('| ' + r.num + ' | ' + r.name + ' | ' + r.url + ' | **' + r.status + '** | ' + redir + ' | ' + errs + ' |');
  });

  fs.writeFileSync('BROWSER_TEST_FINANCE_FINAL.md', lines.join('\n'));
  fs.writeFileSync('BROWSER_TEST_FINANCE_FINAL.json', JSON.stringify({ loginUrl, results }, null, 2));
  console.log('\nReport saved to BROWSER_TEST_FINANCE_FINAL.md');
  await browser.close();
}

runTest().catch(console.error);
