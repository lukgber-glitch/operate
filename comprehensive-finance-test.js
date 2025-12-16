const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

(async () => {
  const browser = await puppeteer.launch({ 
    headless: false,
    args: ['--start-maximized']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  
  const results = {
    timestamp: new Date().toISOString(),
    pages: [],
    consoleErrors: [],
    pageErrors: [],
    summary: {}
  };
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      results.consoleErrors.push({
        text: msg.text(),
        timestamp: new Date().toISOString()
      });
    }
  });
  
  page.on('pageerror', error => {
    results.pageErrors.push({
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  });
  
  try {
    console.log('Starting comprehensive finance testing...');
    
    await page.goto('https://operate.guru/login', { waitUntil: 'networkidle2', timeout: 30000 });
    await page.screenshot({ path: path.join(__dirname, 'test-screenshots', 'finance-01-login.png'), fullPage: true });
    console.log('Login page loaded');
    
    await delay(2000);
    
    const googleButtonExists = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.some(b => b.textContent.includes('Google'));
    });
    
    if (googleButtonExists) {
      console.log('Clicking Google OAuth...');
      
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const btn = buttons.find(b => b.textContent.includes('Google'));
        if (btn) btn.click();
      });
      
      await delay(5000);
      const currentUrl = page.url();
      
      if (currentUrl.includes('accounts.google.com')) {
        console.log('Handling Google OAuth...');
        await page.waitForSelector('input[type="email"]', { timeout: 10000 });
        await page.type('input[type="email"]', 'luk.gber@gmail.com', { delay: 100 });
        await page.click('#identifierNext');
        
        await delay(3000);
        await page.waitForSelector('input[type="password"]', { visible: true, timeout: 10000 });
        await page.type('input[type="password"]', 'schlagzeug', { delay: 100 });
        await page.click('#passwordNext');
        
        await delay(10000);
      }
    }
    
    console.log('Verifying login...');
    await delay(5000);
    await page.screenshot({ path: path.join(__dirname, 'test-screenshots', 'finance-02-after-login.png'), fullPage: true });
    
    const financePages = [
      { path: '/dashboard', name: 'Dashboard', file: 'finance-03-dashboard.png' },
      { path: '/invoices', name: 'Invoices', file: 'finance-04-invoices.png' },
      { path: '/invoices/new', name: 'New Invoice', file: 'finance-05-invoice-new.png' },
      { path: '/transactions', name: 'Transactions', file: 'finance-06-transactions.png' },
      { path: '/banking', name: 'Banking', file: 'finance-07-banking.png' },
      { path: '/reports', name: 'Reports', file: 'finance-08-reports.png' },
      { path: '/expenses', name: 'Expenses', file: 'finance-09-expenses.png' },
      { path: '/bills', name: 'Bills', file: 'finance-10-bills.png' },
      { path: '/tax', name: 'Tax', file: 'finance-11-tax.png' },
      { path: '/cash-flow', name: 'Cash Flow', file: 'finance-12-cashflow.png' }
    ];
    
    console.log('Testing finance pages...');
    
    for (const testPage of financePages) {
      console.log(`Testing: ${testPage.name}`);
      
      const pageResult = {
        name: testPage.name,
        path: testPage.path,
        status: 'UNKNOWN',
        loadTime: 0,
        errors: [],
        notes: []
      };
      
      try {
        const startTime = Date.now();
        await page.goto(`https://operate.guru${testPage.path}`, { waitUntil: 'networkidle2', timeout: 30000 });
        await delay(3000);
        pageResult.loadTime = Date.now() - startTime;
        
        await page.screenshot({ path: path.join(__dirname, 'test-screenshots', testPage.file), fullPage: true });
        
        const pageAnalysis = await page.evaluate(() => {
          const analysis = { title: document.title, errors: [], dataLoaded: false };
          
          const errorSelectors = ['.text-red-500', '.text-red-600', '[role="alert"]'];
          errorSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
              const text = el.textContent.trim();
              if (text && text.length > 0) {
                analysis.errors.push({ selector, text });
              }
            });
          });
          
          const bodyText = document.body.textContent;
          if (bodyText.includes('TypeError') || bodyText.includes('is not a function')) {
            analysis.errors.push({ type: 'RUNTIME_ERROR', text: 'Runtime error detected' });
          }
          
          const tables = document.querySelectorAll('table');
          const lists = document.querySelectorAll('ul, ol');
          if (tables.length > 0 || lists.length > 0) {
            analysis.dataLoaded = true;
          }
          
          return analysis;
        });
        
        pageResult.notes.push(`Title: ${pageAnalysis.title}`);
        pageResult.notes.push(`Data: ${pageAnalysis.dataLoaded}`);
        
        if (pageAnalysis.errors.length > 0) {
          pageResult.errors = pageAnalysis.errors;
          pageResult.status = 'FAIL';
        } else {
          pageResult.status = 'PASS';
        }
        
        console.log(`  Status: ${pageResult.status}, Time: ${pageResult.loadTime}ms`);
        
      } catch (error) {
        pageResult.status = 'ERROR';
        pageResult.errors.push({ message: error.message });
        console.log(`  ERROR: ${error.message}`);
      }
      
      results.pages.push(pageResult);
    }
    
    results.summary = {
      total: results.pages.length,
      passed: results.pages.filter(p => p.status === 'PASS').length,
      failed: results.pages.filter(p => p.status === 'FAIL').length,
      errors: results.pages.filter(p => p.status === 'ERROR').length,
      consoleErrors: results.consoleErrors.length,
      pageErrors: results.pageErrors.length
    };
    
    fs.writeFileSync(
      path.join(__dirname, 'COMPREHENSIVE-FINANCE-TEST-REPORT.json'),
      JSON.stringify(results, null, 2)
    );
    
    console.log('\n=== SUMMARY ===');
    console.log(`Total: ${results.summary.total}`);
    console.log(`Passed: ${results.summary.passed}`);
    console.log(`Failed: ${results.summary.failed}`);
    console.log(`Errors: ${results.summary.errors}`);
    console.log(`Console Errors: ${results.summary.consoleErrors}`);
    
    await delay(2000);
    await browser.close();
    
  } catch (error) {
    console.error('Fatal error:', error);
    await browser.close();
    process.exit(1);
  }
})();
