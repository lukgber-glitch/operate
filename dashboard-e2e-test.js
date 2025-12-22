const puppeteer = require('puppeteer');
const fs = require('fs');

const PAGES = [
  { url: '/chat', name: 'AI Chat', priority: 'HIGH' },
  { url: '/dashboard', name: 'Dashboard', priority: 'HIGH' },
  { url: '/tasks', name: 'Tasks', priority: 'MEDIUM' },
  { url: '/documents', name: 'Documents', priority: 'MEDIUM' },
  { url: '/clients', name: 'Clients', priority: 'MEDIUM' },
  { url: '/vendors', name: 'Vendors', priority: 'MEDIUM' },
  { url: '/reports', name: 'Reports', priority: 'MEDIUM' }
];

async function run() {
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--start-maximized'],
    defaultViewport: null
  });

  const page = await browser.newPage();
  
  const results = {
    timestamp: new Date().toISOString(),
    pages: [],
    summary: {}
  };
  
  console.log('========================================');
  console.log('OPERATE DASHBOARD E2E TEST');
  console.log('========================================\n');
  console.log('MANUAL STEP REQUIRED:');
  console.log('1. Browser will open to login page');
  console.log('2. Click Google OAuth button');
  console.log('3. Login with: luk.gber@gmail.com / schlagzeug');
  console.log('4. Wait for redirect to dashboard/chat');
  console.log('5. Test will then automatically check all pages\n');
  console.log('Waiting 90 seconds for manual login...\n');
  
  try {
    await page.goto('https://operate.guru/login', { 
      waitUntil: 'domcontentloaded',
      timeout: 30000 
    });
    
    await page.waitForFunction(
      () => !window.location.href.includes('/login') && 
           !window.location.href.includes('accounts.google'),
      { timeout: 90000 }
    );
    
    console.log('Login successful! Current URL:', page.url());
    await new Promise(r => setTimeout(r, 3000));
    
    console.log('\n========================================');
    console.log('Testing Dashboard Pages');
    console.log('========================================\n');
    
    for (const pageInfo of PAGES) {
      console.log('Testing:', pageInfo.name, '(' + pageInfo.url + ')');
      
      const result = {
        url: pageInfo.url,
        name: pageInfo.name,
        priority: pageInfo.priority,
        httpStatus: null,
        finalUrl: null,
        errors: [],
        dialogs: [],
        sidebar: { visible: false, links: 0 },
        screenshot: null
      };
      
      const errors = [];
      page.on('console', msg => {
        if (msg.type() === 'error') errors.push(msg.text());
      });
      page.on('pageerror', err => errors.push(err.message));
      
      try {
        const response = await page.goto('https://operate.guru' + pageInfo.url, {
          waitUntil: 'networkidle2',
          timeout: 30000
        });
        
        result.httpStatus = response.status();
        result.finalUrl = page.url();
        await new Promise(r => setTimeout(r, 2000));
        
        const pageData = await page.evaluate(() => {
          const dialogEls = document.querySelectorAll('[role="dialog"], [class*="Dialog"], [class*="dialog"]');
          const dialogs = [];
          
          dialogEls.forEach((el, i) => {
            const rect = el.getBoundingClientRect();
            const buttons = el.querySelectorAll('button');
            dialogs.push({
              index: i,
              visible: rect.width > 0 && rect.height > 0,
              centered: Math.abs((rect.left + rect.width / 2) - window.innerWidth / 2) < 100,
              buttons: buttons.length,
              position: { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
            });
          });
          
          const sidebar = document.querySelector('nav, aside, [class*="sidebar"]');
          let sidebarInfo = { visible: false, links: 0 };
          
          if (sidebar) {
            const rect = sidebar.getBoundingClientRect();
            sidebarInfo = {
              visible: rect.width > 0 && rect.height > 0,
              links: sidebar.querySelectorAll('a, button').length
            };
          }
          
          return { dialogs, sidebar: sidebarInfo };
        });
        
        result.dialogs = pageData.dialogs;
        result.sidebar = pageData.sidebar;
        result.errors = errors.slice(0, 5);
        
        const ssPath = 'test-screenshots/' + pageInfo.name.toLowerCase().replace(/\s+/g, '-') + '.png';
        await page.screenshot({ path: ssPath, fullPage: true });
        result.screenshot = ssPath;
        
        console.log('  Status:', result.httpStatus);
        console.log('  Dialogs:', result.dialogs.length);
        if (result.dialogs.length > 0) {
          result.dialogs.forEach((d, i) => {
            console.log('    Dialog', i, '- Visible:', d.visible, 'Centered:', d.centered, 'Buttons:', d.buttons);
          });
        }
        console.log('  Sidebar:', result.sidebar.visible ? 'Visible' : 'Hidden', '(' + result.sidebar.links + ' links)');
        console.log('  Errors:', result.errors.length);
        console.log('  Screenshot:', ssPath);
        console.log('');
        
      } catch (err) {
        result.errors.push(err.message);
        console.log('  ERROR:', err.message, '\n');
      }
      
      results.pages.push(result);
    }
    
  } catch (error) {
    console.error('Test error:', error.message);
    results.error = error.message;
  }
  
  await browser.close();
  
  results.summary = {
    total: results.pages.length,
    loaded: results.pages.filter(p => p.httpStatus === 200).length,
    withDialogs: results.pages.filter(p => p.dialogs && p.dialogs.length > 0).length,
    withErrors: results.pages.filter(p => p.errors && p.errors.length > 0).length
  };
  
  const resultsFile = 'DASHBOARD_E2E_TEST_RESULTS.json';
  fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
  
  console.log('========================================');
  console.log('TEST SUMMARY');
  console.log('========================================');
  console.log('Total pages:', results.summary.total);
  console.log('Loaded successfully:', results.summary.loaded);
  console.log('Pages with dialogs:', results.summary.withDialogs);
  console.log('Pages with errors:', results.summary.withErrors);
  console.log('\nResults saved to:', resultsFile);
  console.log('========================================\n');
}

run().catch(console.error);
