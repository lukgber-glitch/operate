const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
  const screenshotDir = path.join(process.cwd(), 'e2e-flow-screenshots');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  const results = {
    timestamp: new Date().toISOString(),
    environment: 'https://operate.guru',
    userEmail: 'luk.gber@gmail.com',
    journeys: []
  };

  let browser;
  try {
    console.log('Launching browser...');
    browser = await puppeteer.launch({
      headless: false,
      args: ['--start-maximized', '--no-sandbox'],
      defaultViewport: { width: 1920, height: 1080 }
    });

    const page = await browser.newPage();
    await page.setDefaultTimeout(60000);
    
    // Journey 0: Login via Google OAuth
    console.log('\n=== JOURNEY 0: Google OAuth Login ===');
    const loginJourney = {
      name: 'Google OAuth Login',
      steps: [],
      status: 'IN_PROGRESS',
      duration: 0,
      frictionPoints: []
    };
    const loginStart = Date.now();

    try {
      // Step 1: Navigate to login page
      console.log('Step 1: Navigating to https://operate.guru/login');
      await page.goto('https://operate.guru/login', { waitUntil: 'networkidle2', timeout: 30000 });
      await page.screenshot({ path: path.join(screenshotDir, '01-login-page.png'), fullPage: true });
      loginJourney.steps.push({ step: 1, action: 'Navigate to login', expected: 'Login page loads', actual: 'Login page loaded', status: 'PASS' });

      // Step 2: Click Google OAuth button
      console.log('Step 2: Looking for Google sign-in button');
      await page.waitForSelector('button', { timeout: 10000 });
      
      let googleButton = null;
      const buttons = await page.$$('button, a');
      for (const btn of buttons) {
        const text = await page.evaluate(el => el.textContent, btn);
        if (text && (text.includes('Google') || text.includes('google'))) {
          googleButton = btn;
          break;
        }
      }

      if (!googleButton) {
        throw new Error('Google OAuth button not found');
      }

      await page.screenshot({ path: path.join(screenshotDir, '02-before-google-click.png'), fullPage: true });
      console.log('Clicking Google sign-in button...');
      
      await Promise.all([
        page.waitForNavigation({ timeout: 30000 }).catch(() => {}),
        googleButton.click()
      ]);
      
      await page.waitForTimeout(3000);
      await page.screenshot({ path: path.join(screenshotDir, '03-after-google-click.png'), fullPage: true });
      loginJourney.steps.push({ step: 2, action: 'Click Google OAuth', expected: 'Redirect to Google', actual: 'Redirected', status: 'PASS' });

      // Step 3: Google OAuth flow
      console.log('Step 3: Handling Google OAuth...');
      const currentUrl = page.url();
      console.log('Current URL:', currentUrl);

      if (currentUrl.includes('accounts.google.com')) {
        console.log('On Google OAuth page, entering credentials...');
        
        // Enter email
        await page.waitForSelector('input[type="email"]', { timeout: 10000 });
        await page.type('input[type="email"]', 'luk.gber@gmail.com');
        await page.screenshot({ path: path.join(screenshotDir, '04-google-email-entered.png'), fullPage: true });
        await page.keyboard.press('Enter');
        
        await page.waitForTimeout(3000);
        
        // Enter password
        await page.waitForSelector('input[type="password"]', { timeout: 10000 });
        await page.type('input[type="password"]', 'schlagzeug');
        await page.screenshot({ path: path.join(screenshotDir, '05-google-password-entered.png'), fullPage: true });
        await page.keyboard.press('Enter');
        
        await page.waitForTimeout(5000);
        loginJourney.steps.push({ step: 3, action: 'Complete Google OAuth', expected: 'Login successful', actual: 'Credentials entered', status: 'PASS' });
      }

      // Step 4: Wait for redirect back to operate.guru
      console.log('Step 4: Waiting for redirect to dashboard...');
      await page.waitForTimeout(5000);
      await page.screenshot({ path: path.join(screenshotDir, '06-after-oauth-redirect.png'), fullPage: true });
      
      const finalUrl = page.url();
      console.log('Final URL:', finalUrl);
      
      if (finalUrl.includes('operate.guru') && !finalUrl.includes('/login')) {
        loginJourney.steps.push({ step: 4, action: 'Redirect to dashboard', expected: 'Dashboard loads', actual: 'Dashboard loaded at ' + finalUrl, status: 'PASS' });
        loginJourney.status = 'PASS';
      } else {
        loginJourney.steps.push({ step: 4, action: 'Redirect to dashboard', expected: 'Dashboard loads', actual: 'Still on: ' + finalUrl, status: 'FAIL' });
        loginJourney.status = 'FAIL';
        loginJourney.frictionPoints.push('OAuth redirect did not return to dashboard');
      }

      loginJourney.duration = Date.now() - loginStart;
      results.journeys.push(loginJourney);

      // Journey 1: Invoice Creation Flow
      console.log('\n=== JOURNEY 1: Invoice Creation Flow ===');
      const invoiceJourney = {
        name: 'Create and Send Invoice',
        steps: [],
        status: 'IN_PROGRESS',
        duration: 0,
        frictionPoints: []
      };
      const invoiceStart = Date.now();

      try {
        // Navigate to invoices
        console.log('Step 1: Navigating to invoices...');
        const invoiceUrls = ['/invoices', '/billing/invoices', '/finance/invoices'];
        let invoicePageFound = false;
        
        for (const url of invoiceUrls) {
          try {
            await page.goto('https://operate.guru' + url, { waitUntil: 'networkidle2', timeout: 15000 });
            const testUrl = page.url();
            if (!testUrl.includes('404') && !testUrl.includes('error')) {
              invoicePageFound = true;
              await page.screenshot({ path: path.join(screenshotDir, '07-invoices-page.png'), fullPage: true });
              invoiceJourney.steps.push({ step: 1, action: 'Navigate to invoices', expected: 'Invoices page loads', actual: 'Loaded at ' + url, status: 'PASS' });
              break;
            }
          } catch (e) {
            console.log('Failed to load:', url);
          }
        }

        if (!invoicePageFound) {
          throw new Error('Could not find invoices page');
        }

        // Look for create invoice button
        console.log('Step 2: Looking for Create Invoice button...');
        await page.waitForTimeout(2000);
        
        let createButtonClicked = false;
        const allButtons = await page.$$('button, a');
        for (const btn of allButtons) {
          const text = await page.evaluate(el => el.textContent.toLowerCase(), btn);
          if (text.includes('create') || text.includes('new invoice')) {
            await btn.click();
            await page.waitForTimeout(3000);
            await page.screenshot({ path: path.join(screenshotDir, '08-invoice-form.png'), fullPage: true });
            invoiceJourney.steps.push({ step: 2, action: 'Click Create Invoice', expected: 'Form appears', actual: '
