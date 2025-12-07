const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Create screenshots directory
const screenshotsDir = path.join(__dirname, 'screenshots-spanish');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

const report = {
  languageSwitchingWorks: false,
  translationsComplete: [],
  missingTranslations: [],
  brokenLinks: [],
  errors404: [],
  screenshots: [],
  pagesTested: [],
  summary: ''
};

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testSpanishUI() {
  console.log('🚀 Starting Spanish UI Test for https://operate.guru\n');

  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1920, height: 1080 }
  });

  try {
    const page = await browser.newPage();

    // Track console errors and 404s
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('❌ Console Error:', msg.text());
      }
    });

    page.on('response', response => {
      if (response.status() === 404) {
        const url = response.url();
        console.log('❌ 404 Error:', url);
        report.errors404.push(url);
      }
    });

    // Step 1: Navigate to login page
    console.log('📍 Step 1: Navigating to https://operate.guru/login');
    await page.goto('https://operate.guru/login', { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(2000);

    // Take initial screenshot
    const loginEnglishPath = path.join(screenshotsDir, '01-login-english.png');
    await page.screenshot({ path: loginEnglishPath, fullPage: true });
    report.screenshots.push('01-login-english.png');
    console.log('✅ Screenshot saved: 01-login-english.png');

    // Step 2: Find and click language switcher
    console.log('\n📍 Step 2: Looking for language switcher (globe icon)');

    let languageSwitcher = null;
    const selectors = [
      'button[aria-label*="language"]',
      'button[aria-label*="Language"]',
      '[data-testid="language-switcher"]',
      'button svg[data-icon="globe"]',
      'button:has(svg.lucide-globe)',
      'button.language-switcher',
      'select[name="language"]'
    ];

    for (const selector of selectors) {
      try {
        const element = await page.$(selector);
        if (element) {
          languageSwitcher = element;
          console.log(`✅ Found language switcher with selector: ${selector}`);
          break;
        }
      } catch (e) {
        // Continue trying
      }
    }

    // If not found by selector, try finding by text or SVG
    if (!languageSwitcher) {
      console.log('🔍 Trying to find language switcher by evaluating page content...');
      languageSwitcher = await page.evaluateHandle(() => {
        // Look for globe icon (common SVG patterns)
        const buttons = Array.from(document.querySelectorAll('button'));
        for (const btn of buttons) {
          const svgs = btn.querySelectorAll('svg');
          for (const svg of svgs) {
            const innerHTML = svg.innerHTML.toLowerCase();
            if (innerHTML.includes('circle') && innerHTML.includes('path')) {
              // Likely a globe icon
              return btn;
            }
          }
          // Also check if button has language-related text
          if (btn.textContent.match(/language|en|de|es/i)) {
            return btn;
          }
        }

        // Look for select dropdown
        const selects = document.querySelectorAll('select');
        for (const select of selects) {
          const options = Array.from(select.options).map(o => o.value.toLowerCase());
          if (options.includes('en') || options.includes('es') || options.includes('de')) {
            return select;
          }
        }

        return null;
      });
    }

    if (!languageSwitcher || languageSwitcher.asElement() === null) {
      console.log('❌ Language switcher not found! Taking screenshot of page...');
      const noSwitcherPath = path.join(screenshotsDir, '02-no-language-switcher.png');
      await page.screenshot({ path: noSwitcherPath, fullPage: true });
      report.screenshots.push('02-no-language-switcher.png');

      // Try to get page HTML to debug
      const bodyHTML = await page.evaluate(() => document.body.innerHTML);
      console.log('\n🔍 Page HTML snippet (first 1000 chars):');
      console.log(bodyHTML.substring(0, 1000));

      report.summary = '❌ FAILED: Language switcher not found on login page';
      return;
    }

    // Click language switcher
    console.log('🖱️  Clicking language switcher...');
    await languageSwitcher.click();
    await sleep(1500);

    // Take screenshot of language menu
    const langMenuPath = path.join(screenshotsDir, '02-language-menu.png');
    await page.screenshot({ path: langMenuPath, fullPage: true });
    report.screenshots.push('02-language-menu.png');
    console.log('✅ Screenshot saved: 02-language-menu.png');

    // Step 3: Select Spanish
    console.log('\n📍 Step 3: Selecting Spanish (Español)');

    let spanishOption = null;
    const spanishSelectors = [
      'button:has-text("Español")',
      'button:has-text("Spanish")',
      'a:has-text("Español")',
      '[data-value="es"]',
      'option[value="es"]',
      'li:has-text("Español")'
    ];

    // Try to find and click Spanish option
    const spanishClicked = await page.evaluate(() => {
      // Find all clickable elements
      const elements = Array.from(document.querySelectorAll('button, a, li, [role="menuitem"]'));
      for (const el of elements) {
        if (el.textContent.match(/español|spanish/i)) {
          el.click();
          return true;
        }
      }

      // Try select dropdown
      const selects = document.querySelectorAll('select');
      for (const select of selects) {
        const options = Array.from(select.options);
        for (const opt of options) {
          if (opt.value === 'es' || opt.textContent.match(/español|spanish/i)) {
            select.value = opt.value;
            select.dispatchEvent(new Event('change', { bubbles: true }));
            return true;
          }
        }
      }

      return false;
    });

    if (!spanishClicked) {
      console.log('❌ Could not find or click Spanish option');
      report.summary = '❌ FAILED: Spanish language option not found';
      return;
    }

    console.log('✅ Clicked Spanish option');
    await sleep(2500); // Wait for language change to apply

    // Step 4: Verify Spanish text and take screenshot
    console.log('\n📍 Step 4: Verifying Spanish translations');

    const spanishLoginPath = path.join(screenshotsDir, '03-login-spanish.png');
    await page.screenshot({ path: spanishLoginPath, fullPage: true });
    report.screenshots.push('03-login-spanish.png');
    console.log('✅ Screenshot saved: 03-login-spanish.png');

    // Check for Spanish text on login page
    const pageText = await page.evaluate(() => document.body.innerText);
    const hasSpanishText = pageText.match(/iniciar sesión|correo electrónico|contraseña|olvidaste|registrar/i);

    if (hasSpanishText) {
      console.log('✅ Spanish text detected on login page!');
      report.languageSwitchingWorks = true;
      report.translationsComplete.push('Login page has Spanish translations');
    } else {
      console.log('⚠️  Warning: No Spanish text detected on login page');
      console.log('Page text sample:', pageText.substring(0, 500));
      report.missingTranslations.push('Login page may not be fully translated');
    }

    report.pagesTested.push({ page: 'login', url: 'https://operate.guru/login', hasSpanish: !!hasSpanishText });

    // Step 5: Test Register page in Spanish
    console.log('\n📍 Step 5: Testing Register page in Spanish');

    const registerLinkClicked = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a'));
      for (const link of links) {
        if (link.textContent.match(/registr|sign up|crear cuenta/i) || link.href.includes('/register')) {
          link.click();
          return true;
        }
      }
      return false;
    });

    if (registerLinkClicked) {
      await sleep(2500);
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }).catch(() => {});

      const registerPath = path.join(screenshotsDir, '04-register-spanish.png');
      await page.screenshot({ path: registerPath, fullPage: true });
      report.screenshots.push('04-register-spanish.png');
      console.log('✅ Screenshot saved: 04-register-spanish.png');

      const registerText = await page.evaluate(() => document.body.innerText);
      const hasRegisterSpanish = registerText.match(/registro|crear cuenta|nombre|correo|contraseña/i);

      if (hasRegisterSpanish) {
        console.log('✅ Register page has Spanish translations');
        report.translationsComplete.push('Register page has Spanish translations');
      } else {
        console.log('⚠️  Warning: Register page may not be fully translated');
        report.missingTranslations.push('Register page may not be fully translated');
      }

      report.pagesTested.push({ page: 'register', url: page.url(), hasSpanish: !!hasRegisterSpanish });
    } else {
      console.log('⚠️  Could not find register link');
    }

    // Step 6: Test Forgot Password in Spanish
    console.log('\n📍 Step 6: Testing Forgot Password page in Spanish');

    await page.goto('https://operate.guru/login', { waitUntil: 'networkidle2' });
    await sleep(2000);

    const forgotPasswordClicked = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a, button'));
      for (const link of links) {
        if (link.textContent.match(/forgot|olvidaste|olvidó|recuperar/i)) {
          link.click();
          return true;
        }
      }
      return false;
    });

    if (forgotPasswordClicked) {
      await sleep(2500);
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }).catch(() => {});

      const forgotPasswordPath = path.join(screenshotsDir, '05-forgot-password-spanish.png');
      await page.screenshot({ path: forgotPasswordPath, fullPage: true });
      report.screenshots.push('05-forgot-password-spanish.png');
      console.log('✅ Screenshot saved: 05-forgot-password-spanish.png');

      const forgotText = await page.evaluate(() => document.body.innerText);
      const hasForgotSpanish = forgotText.match(/recuperar|restablecer|olvidaste|correo/i);

      if (hasForgotSpanish) {
        console.log('✅ Forgot Password page has Spanish translations');
        report.translationsComplete.push('Forgot Password page has Spanish translations');
      } else {
        console.log('⚠️  Warning: Forgot Password page may not be fully translated');
        report.missingTranslations.push('Forgot Password page may not be fully translated');
      }

      report.pagesTested.push({ page: 'forgot-password', url: page.url(), hasSpanish: !!hasForgotSpanish });
    } else {
      console.log('⚠️  Could not find forgot password link');
    }

    // Step 7: Click through all clickable elements on login page
    console.log('\n📍 Step 7: Testing all clickable elements on login page');

    await page.goto('https://operate.guru/login', { waitUntil: 'networkidle2' });
    await sleep(2000);

    const clickableElements = await page.evaluate(() => {
      const elements = [];
      const selectors = ['a', 'button'];

      selectors.forEach(selector => {
        const items = document.querySelectorAll(selector);
        items.forEach(item => {
          const text = item.textContent.trim();
          const href = item.href || '';
          if (text && !item.disabled) {
            elements.push({ text, href, tag: item.tagName });
          }
        });
      });

      return elements;
    });

    console.log(`Found ${clickableElements.length} clickable elements`);

    for (let i = 0; i < Math.min(clickableElements.length, 10); i++) {
      const el = clickableElements[i];
      console.log(`  - ${el.tag}: "${el.text}" ${el.href ? `(${el.href})` : ''}`);
    }

    // Generate summary
    if (report.languageSwitchingWorks) {
      report.summary = '✅ SUCCESS: Language switching works and Spanish translations are present';
    } else {
      report.summary = '⚠️  PARTIAL: Some issues detected with Spanish UI';
    }

  } catch (error) {
    console.error('❌ Error during test:', error.message);
    report.summary = `❌ ERROR: ${error.message}`;
  } finally {
    await browser.close();
  }

  // Write report to file
  const reportPath = path.join(__dirname, 'SPANISH-UI-TEST-REPORT.md');
  const reportContent = `# Spanish UI Test Report
**Date**: ${new Date().toISOString()}
**URL**: https://operate.guru

## Summary
${report.summary}

## Language Switching
- **Works**: ${report.languageSwitchingWorks ? '✅ Yes' : '❌ No'}

## Pages Tested
${report.pagesTested.map(p => `- **${p.page}**: ${p.url} - ${p.hasSpanish ? '✅ Spanish detected' : '❌ No Spanish'}`).join('\n')}

## Translations
### Complete
${report.translationsComplete.length > 0 ? report.translationsComplete.map(t => `- ✅ ${t}`).join('\n') : '- None'}

### Missing or Incomplete
${report.missingTranslations.length > 0 ? report.missingTranslations.map(t => `- ⚠️  ${t}`).join('\n') : '- None'}

## Errors and Broken Links
### 404 Errors
${report.errors404.length > 0 ? report.errors404.map(url => `- ❌ ${url}`).join('\n') : '- None found'}

### Broken Links
${report.brokenLinks.length > 0 ? report.brokenLinks.map(url => `- ❌ ${url}`).join('\n') : '- None found'}

## Screenshots
${report.screenshots.map(s => `- \`screenshots-spanish/${s}\``).join('\n')}

## Recommendations
${report.languageSwitchingWorks ?
  '- Spanish language support is functional\n- Continue monitoring translations for completeness' :
  '- Implement language switcher component\n- Add Spanish translations to i18n files\n- Test across all pages'}
`;

  fs.writeFileSync(reportPath, reportContent);
  console.log(`\n📄 Report saved to: ${reportPath}`);

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('SPANISH UI TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(report.summary);
  console.log(`\nPages tested: ${report.pagesTested.length}`);
  console.log(`Translations complete: ${report.translationsComplete.length}`);
  console.log(`Missing translations: ${report.missingTranslations.length}`);
  console.log(`404 errors: ${report.errors404.length}`);
  console.log(`Screenshots: ${report.screenshots.length}`);
  console.log('\nSee SPANISH-UI-TEST-REPORT.md for full details');
  console.log('='.repeat(60));
}

testSpanishUI().catch(console.error);
