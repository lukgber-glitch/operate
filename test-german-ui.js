const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Helper function to wait
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  const screenshotDir = path.join(__dirname, 'test-screenshots');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  const report = {
    languageSwitching: { works: false, details: '' },
    translations: { complete: true, issues: [] },
    brokenLinks: [],
    screenshots: [],
    englishText: [],
    pageTests: {}
  };

  try {
    console.log('=== STEP 1: Navigate to Login Page ===');
    await page.goto('https://operate.guru/login', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await wait(3000); // Wait for page to fully render
    await page.screenshot({ path: path.join(screenshotDir, '01-login-english.png'), fullPage: true });
    report.screenshots.push('01-login-english.png - Initial login page');
    console.log('✓ Login page loaded');

    console.log('\n=== STEP 2: Find Language Switcher ===');
    // Wait a bit for page to fully render
    await wait(2000);

    // Try to find and click language switcher
    const languageSwitcher = await page.evaluate(() => {
      // Look for globe icon or language button
      const buttons = Array.from(document.querySelectorAll('button'));
      const langButton = buttons.find(btn => {
        const text = btn.textContent.toLowerCase();
        const hasGlobe = btn.querySelector('svg.lucide-globe, [class*="globe"]');
        const ariaLabel = (btn.getAttribute('aria-label') || '').toLowerCase();
        return hasGlobe || text.includes('language') || ariaLabel.includes('language') || text === 'en' || text === 'de';
      });

      if (langButton) {
        langButton.click();
        return { found: true, text: langButton.textContent };
      }
      return { found: false };
    });

    if (!languageSwitcher.found) {
      report.languageSwitching.details = 'Language switcher button not found on page';
      console.log('✗ Language switcher not found');
    } else {
      console.log('✓ Language switcher found:', languageSwitcher.text);
      await wait(1000);

      console.log('\n=== STEP 3: Switch to German ===');
      // Look for German option in dropdown/menu
      const germanSelected = await page.evaluate(() => {
        const elements = Array.from(document.querySelectorAll('button, a, [role="menuitem"], [role="option"]'));
        const germanOption = elements.find(el => {
          const text = el.textContent.toLowerCase();
          return text.includes('deutsch') || text.includes('german') || text === 'de';
        });

        if (germanOption) {
          germanOption.click();
          return { found: true, text: germanOption.textContent };
        }
        return { found: false };
      });

      if (!germanSelected.found) {
        report.languageSwitching.details = 'German language option not found in menu';
        console.log('✗ German option not found');
      } else {
        console.log('✓ German option clicked:', germanSelected.text);
        await wait(2000); // Wait for language change

        console.log('\n=== STEP 4: Take Screenshot After Language Switch ===');
        await page.screenshot({ path: path.join(screenshotDir, '02-login-german.png'), fullPage: true });
        report.screenshots.push('02-login-german.png - Login page in German');

        report.languageSwitching.works = true;
        report.languageSwitching.details = 'Language switcher works, German selected';

        console.log('\n=== STEP 5: Verify German Text ===');
        const pageContent = await page.evaluate(() => document.body.innerText);

        // Check for translation keys (e.g., auth.login, common.submit)
        const translationKeyPattern = /\b(auth|common|navigation|error|success|form|validation)\.[\w.]+\b/g;
        const foundKeys = pageContent.match(translationKeyPattern);
        if (foundKeys) {
          report.translations.complete = false;
          report.translations.issues.push('Translation keys found: ' + [...new Set(foundKeys)].join(', '));
          console.log('✗ Translation keys found:', foundKeys);
        }

        // Check for common English words that should be German
        const englishWords = ['Login', 'Email', 'Password', 'Sign in', 'Register', 'Forgot password', 'Welcome', 'Submit'];
        const foundEnglish = [];
        englishWords.forEach(word => {
          const regex = new RegExp('\\b' + word + '\\b', 'i');
          if (regex.test(pageContent)) {
            foundEnglish.push(word);
          }
        });

        if (foundEnglish.length > 0) {
          report.englishText = foundEnglish;
          console.log('⚠ English words found that might need translation:', foundEnglish);
        }

        // Check for German words (positive verification)
        const germanWords = ['Anmelden', 'Passwort', 'Registrieren', 'Vergessen', 'Willkommen'];
        const foundGerman = [];
        germanWords.forEach(word => {
          if (pageContent.includes(word)) {
            foundGerman.push(word);
          }
        });
        console.log('✓ German words found:', foundGerman);
      }
    }

    console.log('\n=== STEP 6: Test Register Page ===');
    await page.goto('https://operate.guru/register', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await wait(2000);
    const registerStatus = await page.evaluate(() => ({
      title: document.title,
      url: window.location.href,
      bodyText: document.body.innerText.substring(0, 500)
    }));

    if (registerStatus.url.includes('404') || registerStatus.bodyText.includes('404') || registerStatus.bodyText.includes('Not Found')) {
      report.brokenLinks.push('/register - Returns 404 or not found');
      console.log('✗ /register returns 404');
    } else {
      await page.screenshot({ path: path.join(screenshotDir, '03-register-german.png'), fullPage: true });
      report.screenshots.push('03-register-german.png - Register page in German');
      report.pageTests['/register'] = 'OK';
      console.log('✓ /register page loaded');

      // Check for translation keys on register page
      const registerContent = await page.evaluate(() => document.body.innerText);
      const translationKeyPattern = /\b(auth|common|navigation|error|success|form|validation)\.[\w.]+\b/g;
      const foundKeys = registerContent.match(translationKeyPattern);
      if (foundKeys) {
        report.translations.issues.push('Register page - Translation keys found: ' + [...new Set(foundKeys)].join(', '));
        console.log('✗ Register page translation keys found:', foundKeys);
      }
    }

    console.log('\n=== STEP 7: Test Forgot Password Page ===');
    await page.goto('https://operate.guru/forgot-password', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await wait(2000);
    const forgotStatus = await page.evaluate(() => ({
      title: document.title,
      url: window.location.href,
      bodyText: document.body.innerText.substring(0, 500)
    }));

    if (forgotStatus.url.includes('404') || forgotStatus.bodyText.includes('404') || forgotStatus.bodyText.includes('Not Found')) {
      report.brokenLinks.push('/forgot-password - Returns 404 or not found');
      console.log('✗ /forgot-password returns 404');
    } else {
      await page.screenshot({ path: path.join(screenshotDir, '04-forgot-password-german.png'), fullPage: true });
      report.screenshots.push('04-forgot-password-german.png - Forgot password page in German');
      report.pageTests['/forgot-password'] = 'OK';
      console.log('✓ /forgot-password page loaded');

      // Check for translation keys on forgot password page
      const forgotContent = await page.evaluate(() => document.body.innerText);
      const translationKeyPattern = /\b(auth|common|navigation|error|success|form|validation)\.[\w.]+\b/g;
      const foundKeys = forgotContent.match(translationKeyPattern);
      if (foundKeys) {
        report.translations.issues.push('Forgot password page - Translation keys found: ' + [...new Set(foundKeys)].join(', '));
        console.log('✗ Forgot password page translation keys found:', foundKeys);
      }
    }

    console.log('\n=== STEP 8: Test All Clickable Links ===');
    await page.goto('https://operate.guru/login', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await wait(2000);

    const clickableElements = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('a, button'));
      return elements
        .filter(el => el.offsetParent !== null) // visible elements
        .map(el => ({
          tag: el.tagName,
          text: el.textContent.trim().substring(0, 50),
          href: el.href || '',
          id: el.id,
          className: el.className
        }))
        .filter(el => el.text && !el.text.includes('svg')); // filter out icon-only buttons
    });

    console.log('Found clickable elements:', clickableElements.length);

    // Test each link
    for (let i = 0; i < Math.min(clickableElements.length, 10); i++) {
      const el = clickableElements[i];
      if (el.href && el.href.startsWith('http')) {
        console.log('Testing link:', el.text, '->', el.href);
        try {
          const response = await page.goto(el.href, { waitUntil: 'domcontentloaded', timeout: 15000 });
          await wait(1000);
          if (response.status() === 404) {
            report.brokenLinks.push(el.href + ' - 404');
            console.log('✗ 404:', el.href);
          }
        } catch (err) {
          report.brokenLinks.push(el.href + ' - Error: ' + err.message);
          console.log('✗ Error loading:', el.href);
        }
      }
    }

  } catch (error) {
    console.error('Test error:', error.message);
    console.error(error.stack);
    report.error = error.message;
  } finally {
    await browser.close();

    console.log('\n\n=== FINAL REPORT ===');
    console.log(JSON.stringify(report, null, 2));

    // Save report to file
    fs.writeFileSync(
      path.join(__dirname, 'GERMAN-UI-TEST-REPORT.md'),
      `# German UI Test Report

## Language Switching
- **Works**: ${report.languageSwitching.works ? 'YES' : 'NO'}
- **Details**: ${report.languageSwitching.details}

## Translations
- **Complete**: ${report.translations.complete ? 'YES' : 'NO'}
- **Issues**: ${report.translations.issues.length === 0 ? 'None' : '\n  - ' + report.translations.issues.join('\n  - ')}

## English Text Found
${report.englishText.length === 0 ? 'None - All text properly translated' : '- ' + report.englishText.join('\n- ')}

## Broken Links / 404s
${report.brokenLinks.length === 0 ? 'None - All links working' : '- ' + report.brokenLinks.join('\n- ')}

## Page Tests
${Object.entries(report.pageTests).map(([page, status]) => `- ${page}: ${status}`).join('\n')}

## Screenshots
${report.screenshots.map(s => `- ${s}`).join('\n')}

## Error
${report.error || 'None'}
`
    );

    console.log('\nReport saved to GERMAN-UI-TEST-REPORT.md');
  }
})();
