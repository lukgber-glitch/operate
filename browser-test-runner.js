const puppeteer = require('puppeteer');

const BASE_URL = 'https://operate.guru';

// Pages to test (grouped by auth requirement)
const publicPages = [
  '/login',
  '/register',
  '/forgot-password',
  '/pricing',
  '/privacy',
  '/terms',
];

const authPages = [
  '/chat',
  '/dashboard',
  '/dashboard/overview',
  '/finance',
  '/finance/invoices',
  '/finance/expenses',
  '/finance/banking',
  '/hr',
  '/hr/employees',
  '/hr/payroll',
  '/tax',
  '/tax/reports',
  '/documents',
  '/settings',
  '/settings/profile',
  '/settings/billing',
  '/crm',
  '/clients',
  '/vendors',
  '/notifications',
  '/calendar',
  '/time',
  '/mileage',
  '/contracts',
  '/intelligence',
  '/autopilot',
  '/health-score',
  '/developer',
  '/api-docs',
  '/help',
  '/feedback',
];

async function testPage(page, url, name) {
  const errors = [];
  const warnings = [];

  // Collect console errors
  const consoleHandler = msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    } else if (msg.type() === 'warning') {
      warnings.push(msg.text());
    }
  };
  page.on('console', consoleHandler);

  const errorHandler = err => {
    errors.push(err.message);
  };
  page.on('pageerror', errorHandler);

  try {
    const response = await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    const status = response.status();
    const finalUrl = page.url();

    // Wait a bit for any JS errors
    await new Promise(r => setTimeout(r, 1000));

    return {
      name,
      url,
      status,
      finalUrl,
      redirected: finalUrl !== url,
      errors: errors.slice(0, 5),
      warnings: warnings.slice(0, 3),
      success: status === 200 && errors.length === 0
    };
  } catch (err) {
    return {
      name,
      url,
      status: 0,
      error: err.message,
      success: false
    };
  } finally {
    page.off('console', consoleHandler);
    page.off('pageerror', errorHandler);
  }
}

async function run() {
  console.log('Starting browser tests...\n');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const results = { public: [], auth: [] };

  // Test public pages
  console.log('=== Testing Public Pages ===\n');
  for (const path of publicPages) {
    const page = await browser.newPage();
    const result = await testPage(page, BASE_URL + path, path);
    results.public.push(result);
    const status = result.success ? 'PASS' : 'FAIL';
    const errCount = (result.errors && result.errors.length) ? ' (errors: ' + result.errors.length + ')' : '';
    console.log(status + ' ' + path + ' - ' + result.status + errCount);
    await page.close();
  }

  // For auth pages, we need to set a cookie first
  // But since we can't easily get valid auth tokens, we'll just check they redirect to login
  console.log('\n=== Testing Auth Pages (expecting redirect to login) ===\n');
  for (const path of authPages) {
    const page = await browser.newPage();
    const result = await testPage(page, BASE_URL + path, path);
    results.auth.push(result);
    const finalUrl = result.finalUrl || '';
    const expectRedirect = finalUrl.includes('/login');
    const status = expectRedirect ? 'PASS' : 'CHECK';
    console.log(status + ' ' + path + ' - ' + result.status + ' -> ' + finalUrl.replace(BASE_URL, ''));
    await page.close();
  }

  await browser.close();

  // Summary
  console.log('\n=== SUMMARY ===\n');
  const publicErrors = results.public.filter(r => !r.success);
  const authIssues = results.auth.filter(r => !(r.finalUrl || '').includes('/login') && r.status !== 200);

  console.log('Public pages: ' + (results.public.length - publicErrors.length) + '/' + results.public.length + ' passed');
  console.log('Auth pages: ' + (results.auth.length - authIssues.length) + '/' + results.auth.length + ' properly redirect');

  if (publicErrors.length > 0) {
    console.log('\nPublic page errors:');
    publicErrors.forEach(e => console.log('  - ' + e.name + ': ' + (e.error || (e.errors ? e.errors.join(', ') : 'unknown'))));
  }

  if (authIssues.length > 0) {
    console.log('\nAuth page issues:');
    authIssues.forEach(e => console.log('  - ' + e.name + ': status=' + e.status + ', url=' + e.finalUrl));
  }

  // Output JSON for detailed analysis
  require('fs').writeFileSync('browser-test-results.json', JSON.stringify(results, null, 2));
  console.log('\nDetailed results saved to browser-test-results.json');
}

run().catch(console.error);
