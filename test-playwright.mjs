import { chromium } from 'playwright';

const email = `test${Date.now()}@test.com`;
console.log('Email:', email);

const browser = await chromium.launch({ headless: false });
const page = await browser.newPage();

// Register
await page.goto('https://operate.guru/register');
await page.waitForTimeout(2000);

await page.fill('input[name="firstName"]', 'Test');
await page.fill('input[name="lastName"]', 'User');
await page.fill('input[name="email"]', email);
await page.fill('input[name="password"]', 'Test1234!');
await page.fill('input[name="confirmPassword"]', 'Test1234!');
await page.click('[role="checkbox"]');
await page.click('button[type="submit"]');
await page.waitForTimeout(5000);

console.log('After register:', page.url());

if (page.url().includes('onboarding')) {
  // Get Started
  await page.click('button:has-text("Get Started")');
  await page.waitForTimeout(2000);

  // Fill text inputs
  await page.fill('input[name="companyInfo.name"]', 'Test GmbH');
  await page.fill('input[name="companyInfo.taxId"]', 'ATU12345678');
  await page.fill('input[name="companyInfo.address.street"]', 'Teststrasse');
  await page.fill('input[name="companyInfo.address.streetNumber"]', '42');
  await page.fill('input[name="companyInfo.address.postalCode"]', '1010');
  await page.fill('input[name="companyInfo.address.city"]', 'Vienna');
  await page.fill('input[name="companyInfo.businessEmail"]', 'test@company.at');
  await page.fill('input[name="companyInfo.businessPhone"]', '+43123456789');

  console.log('Filled text fields');

  // Handle Radix Select dropdowns with Playwright's better event handling
  const selectDropdown = async (triggerId, optionText) => {
    console.log(`Selecting ${triggerId} -> ${optionText}`);
    await page.click(`#${triggerId}`);
    await page.waitForTimeout(500);
    await page.click(`[role="option"]:has-text("${optionText}")`);
    await page.waitForTimeout(300);
  };

  await selectDropdown('country', 'Austria');
  await selectDropdown('legalForm', 'GmbH');
  await selectDropdown('industry', 'Technology');
  await selectDropdown('businessModel', 'B2B');

  await page.evaluate(() => window.scrollTo(0, 500));
  await page.waitForTimeout(300);

  await selectDropdown('currency', 'Euro');
  await selectDropdown('fiscalYearStart', 'January');

  await page.screenshot({ path: 'playwright-filled.png' });

  // Check errors
  const errors = await page.evaluate(() =>
    [...document.querySelectorAll('p')].filter(p => p.textContent.includes('required')).map(p => p.textContent)
  );
  console.log('Errors:', errors);

  // Click Next
  await page.click('button:has-text("Next")');
  await page.waitForTimeout(3000);
  console.log('After Next:', page.url());

  // Skip remaining steps
  for (let i = 0; i < 15 && page.url().includes('onboarding'); i++) {
    // Check current step
    const stepInfo = await page.evaluate(() => {
      const h1 = document.querySelector('h1');
      const step = document.body.innerText.match(/Step (\d+) of (\d+)/);
      return { title: h1?.innerText, step: step?.[0] };
    });
    console.log('Step', i + 1, '-', stepInfo.step || '', stepInfo.title || '');

    // Priority: Navigation bar "Skip" button (actually advances step)
    // The "Skip for now" inside steps only sets form values without advancing
    const clicked = await page.evaluate(() => {
      const buttons = [...document.querySelectorAll('button')];

      // Find exact "Skip" (nav bar) - it's in the navigation section at bottom
      let btn = buttons.find(b => b.innerText.trim() === 'Skip');

      // Then other advancing buttons
      if (!btn) btn = buttons.find(b => b.innerText.toLowerCase().includes('go to dashboard'));
      if (!btn) btn = buttons.find(b => b.innerText.toLowerCase().includes('finish'));
      if (!btn) btn = buttons.find(b => b.innerText.toLowerCase().includes('complete setup'));
      if (!btn) btn = buttons.find(b => b.innerText.toLowerCase().includes('next') && !b.disabled);

      if (btn) { btn.click(); return btn.innerText.trim(); }
      return null;
    });
    console.log('  Clicked:', clicked);
    await page.waitForTimeout(2500);

    if (!clicked) {
      console.log('  No button found - taking screenshot');
      await page.screenshot({ path: `step-${i}.png` });
      break;
    }
  }
  console.log('Final:', page.url());
}

// Test consent
if (!page.url().includes('onboarding')) {
  console.log('\n=== CONSENT TEST ===');

  // Go to dashboard first, clear ALL consent storage, then navigate fresh to chat
  await page.goto('https://operate.guru/dashboard');
  await page.waitForTimeout(2000);

  const beforeClear = await page.evaluate(() => ({
    direct: localStorage.getItem('ai_consent_data'),
    secure: localStorage.getItem('secure_token.ai_consent_data'),
  }));
  console.log('Before clear:', beforeClear);

  // Clear BOTH consent storage locations
  await page.evaluate(() => {
    localStorage.removeItem('ai_consent_data');
    localStorage.removeItem('secure_token.ai_consent_data');
  });
  console.log('Cleared both consent locations');

  // Navigate to chat fresh
  await page.goto('https://operate.guru/chat');
  await page.waitForTimeout(4000);

  const hasDialog = await page.$('[role="dialog"]');
  console.log('Dialog:', hasDialog ? 'YES' : 'NO');

  if (hasDialog) {
    // Use JavaScript click to bypass viewport issues (dialog sizing bug on production)
    await page.evaluate(() => {
      const checkbox = document.querySelector('[role="dialog"] [role="checkbox"]');
      if (checkbox) checkbox.click();
    });
    await page.waitForTimeout(200);
    await page.evaluate(() => {
      const btn = [...document.querySelectorAll('[role="dialog"] button')]
        .find(b => b.textContent.toLowerCase().includes('accept'));
      if (btn) btn.click();
    });
    await page.waitForTimeout(2000);

    // Persistence test
    await page.goto('https://operate.guru/dashboard');
    await page.waitForTimeout(1500);
    await page.goto('https://operate.guru/chat');
    await page.waitForTimeout(3000);

    const dialogBack = await page.$('[role="dialog"]');
    console.log('Dialog returned:', dialogBack ? 'YES' : 'NO');
    console.log('\nRESULT:', dialogBack ? 'FAIL' : 'PASS');
  }
} else {
  console.log('\nStuck on onboarding');
  await page.screenshot({ path: 'stuck.png' });
}

await page.waitForTimeout(15000);
await browser.close();
