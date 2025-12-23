import { chromium } from 'playwright';
import fs from 'fs';

const RESULTS = {
  timestamp: new Date().toISOString(),
  pages: [],
  errors: [],
  screenshots: [],
  contrastIssues: []
};

const email = `test${Date.now()}@test.com`;
const password = 'Test1234!';

console.log('=== FULL SITE TEST ===');
console.log('Email:', email);
console.log('');

fs.mkdirSync('screenshots', { recursive: true });

const browser = await chromium.launch({ headless: false });
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });

// Helper to take screenshot
async function screenshot(name) {
  const path = `screenshots/${name}.png`;
  await page.screenshot({ path, fullPage: true });
  RESULTS.screenshots.push(path);
}

// Helper to check for contrast issues (solid white on white, etc)
async function checkContrast(pageName) {
  const issues = await page.evaluate(() => {
    const problems = [];

    // Get all text elements
    const textElements = document.querySelectorAll('p, span, h1, h2, h3, h4, h5, h6, a, button, label, div, td, th, li');

    textElements.forEach(el => {
      const style = window.getComputedStyle(el);
      const color = style.color;
      const bgColor = style.backgroundColor;
      const text = el.textContent?.trim().slice(0, 50);

      if (!text || text.length < 2) return;

      // Parse RGB and alpha values
      const parseColor = (c) => {
        const rgbaMatch = c.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
        if (rgbaMatch) {
          return {
            r: parseInt(rgbaMatch[1]),
            g: parseInt(rgbaMatch[2]),
            b: parseInt(rgbaMatch[3]),
            a: rgbaMatch[4] ? parseFloat(rgbaMatch[4]) : 1
          };
        }
        return null;
      };

      const fg = parseColor(color);
      const bg = parseColor(bgColor);

      if (!fg || !bg) return;

      // Skip semi-transparent backgrounds (they blend with dark page background)
      if (bg.a < 0.5) return;

      // Check if colors are too similar (only for solid backgrounds)
      const colorDiff = Math.abs(fg.r - bg.r) + Math.abs(fg.g - bg.g) + Math.abs(fg.b - bg.b);

      // Flag SOLID white/light backgrounds with white/light text
      const isLight = (c) => c.r > 200 && c.g > 200 && c.b > 200;

      if (isLight(fg) && isLight(bg) && bg.a > 0.8) {
        problems.push({
          text,
          fg: color,
          bg: bgColor,
          element: el.tagName.toLowerCase(),
          type: 'white-on-white'
        });
      }

      // Flag very low contrast (only solid backgrounds)
      if (colorDiff < 50 && bg.a > 0.8 && (bg.r + bg.g + bg.b) > 100) {
        problems.push({
          text,
          fg: color,
          bg: bgColor,
          element: el.tagName.toLowerCase(),
          type: 'low-contrast'
        });
      }
    });

    return problems.slice(0, 10); // Limit to 10 per page
  });

  if (issues.length > 0) {
    RESULTS.contrastIssues.push({ page: pageName, issues });
    console.log(`  ⚠️  ${issues.length} contrast issues found`);
  }

  return issues;
}

// Helper to check for errors on page
async function checkPage(pageName) {
  const check = await page.evaluate(() => {
    const errors = [];

    // Check for visible error messages
    document.querySelectorAll('[class*="error" i], [class*="Error"], .text-red-500, .text-destructive').forEach(el => {
      const text = el.textContent?.trim();
      if (text && text.length < 200 && !text.includes('No ')) errors.push(text);
    });

    // Check for dialogs that shouldn't be there
    const dialog = document.querySelector('[role="dialog"]');
    const dialogText = dialog?.textContent?.slice(0, 100) || null;

    // Check sidebar
    const sidebar = document.querySelector('aside, nav[class*="sidebar"], [class*="Sidebar"]');

    return {
      url: location.href,
      title: document.title,
      hasDialog: !!dialog,
      dialogText,
      hasSidebar: !!sidebar,
      errors
    };
  });

  if (check.hasDialog && check.dialogText?.includes('AI')) {
    RESULTS.errors.push({ page: pageName, type: 'unexpected-consent-dialog', dialog: check.dialogText });
    console.log(`  ❌ CONSENT DIALOG SHOWING!`);
  }

  return check;
}

try {
  // === STEP 1: REGISTER ===
  console.log('\n[1] REGISTERING NEW USER');
  await page.goto('https://operate.guru/register');
  await page.waitForTimeout(2000);
  await screenshot('01-register');

  await page.fill('input[name="firstName"]', 'Test');
  await page.fill('input[name="lastName"]', 'User');
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.fill('input[name="confirmPassword"]', password);
  await page.click('[role="checkbox"]');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(5000);

  console.log('  URL:', page.url());
  await screenshot('02-after-register');

  // === STEP 2: ONBOARDING ===
  if (page.url().includes('onboarding')) {
    console.log('\n[2] COMPLETING ONBOARDING');

    await page.click('button:has-text("Get Started")');
    await page.waitForTimeout(2000);

    // Fill company info
    await page.fill('input[name="companyInfo.name"]', 'Test Company GmbH');
    await page.fill('input[name="companyInfo.taxId"]', 'ATU12345678');
    await page.fill('input[name="companyInfo.address.street"]', 'Teststrasse');
    await page.fill('input[name="companyInfo.address.streetNumber"]', '42');
    await page.fill('input[name="companyInfo.address.postalCode"]', '1010');
    await page.fill('input[name="companyInfo.address.city"]', 'Vienna');
    await page.fill('input[name="companyInfo.businessEmail"]', 'test@company.at');
    await page.fill('input[name="companyInfo.businessPhone"]', '+43123456789');

    // Select dropdowns
    const dropdowns = ['country', 'legalForm', 'industry', 'businessModel', 'currency', 'fiscalYearStart'];
    const values = ['Austria', 'GmbH', 'Technology', 'B2B', 'Euro', 'January'];

    for (let i = 0; i < dropdowns.length; i++) {
      await page.click(`#${dropdowns[i]}`);
      await page.waitForTimeout(300);
      await page.click(`[role="option"]:has-text("${values[i]}")`);
      await page.waitForTimeout(200);
    }

    await page.click('button:has-text("Next")');
    await page.waitForTimeout(2000);

    // Skip through remaining steps
    for (let step = 0; step < 10 && page.url().includes('onboarding'); step++) {
      const clicked = await page.evaluate(() => {
        const btns = [...document.querySelectorAll('button')];
        let btn = btns.find(b => b.innerText.trim() === 'Skip');
        if (!btn) btn = btns.find(b => b.innerText.includes('Go to Dashboard'));
        if (!btn) btn = btns.find(b => b.innerText.includes('Next') && !b.disabled);
        if (btn) { btn.click(); return true; }
        return false;
      });
      if (!clicked) break;
      await page.waitForTimeout(2000);
    }

    console.log('  Final URL:', page.url());
  }

  // === STEP 3: TEST ALL PAGES WITH CONTRAST CHECK ===
  console.log('\n[3] TESTING ALL PAGES (with contrast check)');

  const PAGES = [
    'dashboard', 'chat',
    'finance', 'finance/invoices', 'finance/expenses', 'finance/banking',
    'finance/reconciliation', 'finance/payments',
    'clients', 'vendors', 'quotes', 'contracts',
    'hr', 'hr/employees', 'hr/leave', 'hr/payroll',
    'tax', 'tax/vat', 'tax/deductions', 'tax/filing', 'tax/austria',
    'reports', 'calendar', 'tasks', 'documents',
    'settings', 'settings/profile', 'settings/ai', 'settings/email',
    'settings/billing', 'settings/security', 'settings/automation',
    'notifications', 'inbox', 'autopilot', 'intelligence',
    'mileage', 'time', 'crm', 'insurance', 'health-score'
  ];

  for (const p of PAGES) {
    process.stdout.write(`  /${p} `);

    try {
      await page.goto(`https://operate.guru/${p}`, { timeout: 20000 });
      await page.waitForTimeout(1500);

      const check = await checkPage(p);
      const contrastIssues = await checkContrast(p);

      if (check.url.includes('/login')) {
        console.log('❌ REDIRECTED TO LOGIN');
        RESULTS.errors.push({ page: p, type: 'auth-redirect' });
      } else if (contrastIssues.length > 0) {
        console.log(`⚠️  ${contrastIssues.length} contrast issues`);
      } else {
        console.log('✓');
      }

      await screenshot(p.replace(/\//g, '-'));
      RESULTS.pages.push({ path: p, status: 'ok', ...check });

    } catch (err) {
      console.log('❌ ERROR:', err.message.slice(0, 50));
      RESULTS.errors.push({ page: p, type: 'load-error', error: err.message });
    }
  }

  // === STEP 4: CONSENT PERSISTENCE TEST ===
  console.log('\n[4] CONSENT PERSISTENCE TEST');
  await page.goto('https://operate.guru/dashboard');
  await page.waitForTimeout(1500);
  await page.goto('https://operate.guru/chat');
  await page.waitForTimeout(2000);

  const chatCheck = await checkPage('chat-final');
  if (chatCheck.hasDialog) {
    console.log('  ❌ FAIL: Consent dialog appeared!');
    RESULTS.errors.push({ type: 'consent-not-persisting' });
    await screenshot('ERROR-consent-dialog');
  } else {
    console.log('  ✓ OK: No consent dialog');
  }

} catch (err) {
  console.log('\n❌ FATAL:', err.message);
  RESULTS.errors.push({ type: 'fatal', error: err.message });
}

// === REPORT ===
console.log('\n========================================');
console.log('           TEST RESULTS                 ');
console.log('========================================');
console.log(`Pages: ${RESULTS.pages.length}`);
console.log(`Errors: ${RESULTS.errors.length}`);
console.log(`Contrast issues: ${RESULTS.contrastIssues.length} pages affected`);

if (RESULTS.errors.length > 0) {
  console.log('\n--- ERRORS ---');
  RESULTS.errors.forEach((e, i) => {
    console.log(`${i+1}. [${e.type}] ${e.page || ''}`);
  });
}

if (RESULTS.contrastIssues.length > 0) {
  console.log('\n--- CONTRAST ISSUES (blue on blue, etc) ---');
  RESULTS.contrastIssues.forEach(ci => {
    console.log(`\n/${ci.page}:`);
    ci.issues.forEach(i => {
      console.log(`  "${i.text}" - ${i.element} (fg: ${i.fg}, bg: ${i.bg})`);
    });
  });
}

fs.writeFileSync('TEST_REPORT.json', JSON.stringify(RESULTS, null, 2));
console.log('\n✓ Report: TEST_REPORT.json');
console.log('✓ Screenshots: screenshots/');

console.log('\nBrowser open for 60s...');
await page.waitForTimeout(60000);
await browser.close();
