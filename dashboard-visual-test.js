const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const PAGES = [
  '/chat',
  '/dashboard', 
  '/tasks',
  '/documents',
  '/clients',
  '/vendors',
  '/reports'
];

async function run() {
  console.log('======================================');
  console.log('DASHBOARD VISUAL TEST');
  console.log('======================================\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--start-maximized'],
    defaultViewport: null
  });

  const page = await browser.newPage();
  const results = { timestamp: new Date().toISOString(), pages: [] };
  
  console.log('STEP 1: Login via Google OAuth');
  console.log('Opening login page - PLEASE LOGIN MANUALLY');
  console.log('Email: luk.gber@gmail.com');
  console.log('Password: schlagzeug\n');
  
  await page.goto('https://operate.guru/login', { waitUntil: 'networkidle2' });
  
  console.log('Waiting for you to complete login...');
  console.log('Test will continue when you reach dashboard or chat page\n');
  
  let loginComplete = false;
  let attempts = 0;
  const maxAttempts = 60;
  
  while (!loginComplete && attempts < maxAttempts) {
    await new Promise(r => setTimeout(r, 2000));
    const url = page.url();
    
    if (!url.includes('/login') && !url.includes('accounts.google') && !url.includes('blank')) {
      console.log('Login detected! Current URL:', url);
      loginComplete = true;
    }
    
    attempts++;
    if (attempts % 5 === 0) {
      console.log('Still waiting... (' + (attempts * 2) + 's)');
    }
  }
  
  if (!loginComplete) {
    console.log('\nTimeout waiting for login. Exiting.');
    await browser.close();
    return;
  }
  
  await new Promise(r => setTimeout(r, 3000));
  
  console.log('\n======================================');
  console.log('STEP 2: Testing Pages');
  console.log('======================================\n');
  
  for (const url of PAGES) {
    console.log('Testing:', url);
    const result = { url, errors: [], dialogs: [], sidebar: {} };
    
    const errors = [];
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
    page.on('pageerror', err => errors.push(err.message));
    
    try {
      const response = await page.goto('https://operate.guru' + url, { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });
      
      result.status = response.status();
      await new Promise(r => setTimeout(r, 2000));
      
      const data = await page.evaluate(() => {
        const dialogs = [];
        document.querySelectorAll('[role="dialog"]').forEach((d, i) => {
          const r = d.getBoundingClientRect();
          dialogs.push({
            id: i,
            visible: r.width > 0,
            centered: Math.abs((r.x + r.width/2) - window.innerWidth/2) < 100,
            buttons: d.querySelectorAll('button').length
          });
        });
        
        const sb = document.querySelector('nav, aside');
        const sidebar = sb ? { 
          visible: sb.getBoundingClientRect().width > 0,
          links: sb.querySelectorAll('a, button').length 
        } : { visible: false, links: 0 };
        
        return { dialogs, sidebar, hasOverflow: document.body.scrollWidth > window.innerWidth };
      });
      
      result.dialogs = data.dialogs;
      result.sidebar = data.sidebar;
      result.hasHorizontalScroll = data.hasOverflow;
      result.errors = errors.slice(0, 3);
      
      const filename = url.replace(/\//g, '') || 'root';
      const ssPath = path.join('test-screenshots', filename + '.png');
      await page.screenshot({ path: ssPath, fullPage: true });
      result.screenshot = ssPath;
      
      console.log('  Status:', result.status);
      console.log('  Dialogs:', result.dialogs.length);
      result.dialogs.forEach(d => {
        console.log('    - Visible:', d.visible, 'Centered:', d.centered, 'Buttons:', d.buttons);
      });
      console.log('  Sidebar:', result.sidebar.visible, '(' + result.sidebar.links + ' links)');
      console.log('  H-Scroll:', result.hasHorizontalScroll);
      console.log('  Errors:', result.errors.length);
      console.log('  Screenshot:', ssPath);
      console.log('');
      
    } catch (err) {
      result.error = err.message;
      console.log('  ERROR:', err.message, '\n');
    }
    
    results.pages.push(result);
    page.removeAllListeners('console');
    page.removeAllListeners('pageerror');
  }
  
  await browser.close();
  
  const summary = {
    total: results.pages.length,
    passed: results.pages.filter(p => p.status === 200).length,
    withDialogs: results.pages.filter(p => p.dialogs && p.dialogs.length > 0).length,
    withErrors: results.pages.filter(p => p.errors && p.errors.length > 0).length
  };
  
  results.summary = summary;
  
  fs.writeFileSync('DASHBOARD_VISUAL_TEST_RESULTS.json', JSON.stringify(results, null, 2));
  
  console.log('======================================');
  console.log('SUMMARY');
  console.log('======================================');
  console.log('Total:', summary.total);
  console.log('Passed:', summary.passed);
  console.log('With Dialogs:', summary.withDialogs);
  console.log('With Errors:', summary.withErrors);
  console.log('\nResults:', 'DASHBOARD_VISUAL_TEST_RESULTS.json');
  console.log('======================================\n');
}

run().catch(console.error);
