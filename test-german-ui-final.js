const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

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
    timestamp: new Date().toISOString(),
    languageSwitcher: {
      exists: false,
      dropdownOpens: false,
      languagesAvailable: [],
      canSwitchToEnglish: false,
      canSwitchBackToGerman: false
    },
    translations: {
      login: { german: [], english: [], translationKeys: [] },
      register: { german: [], english: [], translationKeys: [] },
      forgotPassword: { german: [], english: [], translationKeys: [] }
    },
    pages: {
      '/login': { status: 'unknown', works: false },
      '/register': { status: 'unknown', works: false },
      '/forgot-password': { status: 'unknown', works: false }
    },
    issues: [],
    screenshots: []
  };

  try {
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║          GERMAN UI TEST - COMPREHENSIVE REPORT            ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    // TEST 1: Login Page - Initial Load
    console.log('📍 TEST 1: Loading Login Page...');
    await page.goto('https://operate.guru/login', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await wait(3000);
    await page.screenshot({ path: path.join(screenshotDir, 'final-01-login-initial.png'), fullPage: true });
    report.screenshots.push('final-01-login-initial.png');
    report.pages['/login'].status = 'loaded';
    report.pages['/login'].works = true;
    console.log('✓ Login page loaded\n');

    // TEST 2: Analyze Current Language
    console.log('📍 TEST 2: Analyzing Current Language...');
    const loginContent = await page.evaluate(() => document.body.innerText);

    const germanWords = ['Willkommen', 'Anmelden', 'Passwort', 'vergessen', 'registrieren'];
    const englishWords = ['Welcome', 'Sign in', 'Login', 'Password', 'Forgot'];
    const translationKeyPattern = /\b(auth|common|navigation)\.\w+/g;

    germanWords.forEach(word => {
      if (loginContent.includes(word)) {
        report.translations.login.german.push(word);
      }
    });

    englishWords.forEach(word => {
      if (loginContent.includes(word)) {
        report.translations.login.english.push(word);
      }
    });

    const keys = loginContent.match(translationKeyPattern);
    if (keys) {
      report.translations.login.translationKeys = [...new Set(keys)];
      report.issues.push('Login page contains translation keys: ' + keys.join(', '));
    }

    console.log('  German words found:', report.translations.login.german.join(', '));
    console.log('  English words found:', report.translations.login.english.length > 0 ? report.translations.login.english.join(', ') : 'None');
    console.log('  Translation keys:', report.translations.login.translationKeys.length > 0 ? report.translations.login.translationKeys.join(', ') : 'None');
    console.log('');

    // TEST 3: Language Switcher
    console.log('📍 TEST 3: Testing Language Switcher...');

    // Find the language button with Globe icon
    const langButton = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(b => b.querySelector('svg.lucide-globe'));
      if (btn) {
        return {
          found: true,
          text: btn.textContent.trim(),
          outerHTML: btn.outerHTML.substring(0, 200)
        };
      }
      return { found: false };
    });

    if (!langButton.found) {
      console.log('✗ Language switcher button not found');
      report.issues.push('Language switcher button not found on page');
    } else {
      console.log('✓ Language switcher found:', langButton.text);
      report.languageSwitcher.exists = true;

      // Click the button and wait for menu
      await page.click('button:has(svg.lucide-globe)');
      await wait(500);

      await page.screenshot({ path: path.join(screenshotDir, 'final-02-menu-opened.png'), fullPage: true });
      report.screenshots.push('final-02-menu-opened.png');

      // Check if dropdown menu appeared
      const menuItems = await page.evaluate(() => {
        const items = Array.from(document.querySelectorAll('[role="menuitem"]'));
        return items.map(item => ({
          text: item.textContent.trim(),
          visible: item.offsetParent !== null
        }));
      });

      if (menuItems.length > 0) {
        console.log('✓ Dropdown menu opened with', menuItems.length, 'options');
        report.languageSwitcher.dropdownOpens = true;
        report.languageSwitcher.languagesAvailable = menuItems.map(m => m.text);
        console.log('  Available languages:', menuItems.map(m => m.text).join(', '));

        // Try to switch to English
        const englishFound = menuItems.some(m => m.text.includes('English'));
        if (englishFound) {
          console.log('  Switching to English...');
          await page.evaluate(() => {
            const items = Array.from(document.querySelectorAll('[role="menuitem"]'));
            const englishItem = items.find(item => item.textContent.includes('English'));
            if (englishItem) englishItem.click();
          });
          await wait(2000);

          await page.screenshot({ path: path.join(screenshotDir, 'final-03-english.png'), fullPage: true });
          report.screenshots.push('final-03-english.png');
          report.languageSwitcher.canSwitchToEnglish = true;

          const englishContent = await page.evaluate(() => document.body.innerText);
          console.log('✓ Switched to English');
          console.log('  Page now contains:', englishContent.includes('Welcome') ? 'Welcome ✓' : 'Still German');

          // Switch back to German
          await page.click('button:has(svg.lucide-globe)');
          await wait(500);

          const germanFound = await page.evaluate(() => {
            const items = Array.from(document.querySelectorAll('[role="menuitem"]'));
            return items.some(item => item.textContent.includes('Deutsch'));
          });

          if (germanFound) {
            console.log('  Switching back to German...');
            await page.evaluate(() => {
              const items = Array.from(document.querySelectorAll('[role="menuitem"]'));
              const germanItem = items.find(item => item.textContent.includes('Deutsch'));
              if (germanItem) germanItem.click();
            });
            await wait(2000);

            await page.screenshot({ path: path.join(screenshotDir, 'final-04-german.png'), fullPage: true });
            report.screenshots.push('final-04-german.png');
            report.languageSwitcher.canSwitchBackToGerman = true;

            const germanContent = await page.evaluate(() => document.body.innerText);
            console.log('✓ Switched back to German');
            console.log('  Page now contains:', germanContent.includes('Willkommen') ? 'Willkommen ✓' : 'Still English');
          }
        }
      } else {
        console.log('✗ Dropdown menu did not appear or has no items');
        report.issues.push('Language switcher dropdown menu does not open');
      }
    }
    console.log('');

    // TEST 4: Register Page
    console.log('📍 TEST 4: Testing Register Page...');
    await page.goto('https://operate.guru/register', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await wait(2000);

    const registerUrl = await page.url();
    if (registerUrl.includes('404') || registerUrl.includes('not-found')) {
      console.log('✗ Register page returns 404');
      report.pages['/register'].status = '404';
      report.issues.push('/register page returns 404');
    } else {
      await page.screenshot({ path: path.join(screenshotDir, 'final-05-register.png'), fullPage: true });
      report.screenshots.push('final-05-register.png');
      report.pages['/register'].status = 'loaded';
      report.pages['/register'].works = true;

      const registerContent = await page.evaluate(() => document.body.innerText);

      const regGerman = ['Konto erstellen', 'Vorname', 'Nachname', 'Datenschutz'];
      regGerman.forEach(word => {
        if (registerContent.includes(word)) {
          report.translations.register.german.push(word);
        }
      });

      const regKeys = registerContent.match(translationKeyPattern);
      if (regKeys) {
        report.translations.register.translationKeys = [...new Set(regKeys)];
        report.issues.push('Register page contains translation keys: ' + regKeys.join(', '));
      }

      console.log('✓ Register page loaded');
      console.log('  German words:', report.translations.register.german.join(', '));
      console.log('  Translation keys:', report.translations.register.translationKeys.length > 0 ? report.translations.register.translationKeys.join(', ') : 'None');
    }
    console.log('');

    // TEST 5: Forgot Password Page
    console.log('📍 TEST 5: Testing Forgot Password Page...');
    await page.goto('https://operate.guru/forgot-password', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await wait(2000);

    const forgotUrl = await page.url();
    if (forgotUrl.includes('404') || forgotUrl.includes('not-found')) {
      console.log('✗ Forgot password page returns 404');
      report.pages['/forgot-password'].status = '404';
      report.issues.push('/forgot-password page returns 404');
    } else {
      await page.screenshot({ path: path.join(screenshotDir, 'final-06-forgot-password.png'), fullPage: true });
      report.screenshots.push('final-06-forgot-password.png');
      report.pages['/forgot-password'].status = 'loaded';
      report.pages['/forgot-password'].works = true;

      const forgotContent = await page.evaluate(() => document.body.innerText);

      const forgotGerman = ['Passwort vergessen', 'E-Mail', 'senden'];
      forgotGerman.forEach(word => {
        if (forgotContent.includes(word)) {
          report.translations.forgotPassword.german.push(word);
        }
      });

      const forgotKeys = forgotContent.match(translationKeyPattern);
      if (forgotKeys) {
        report.translations.forgotPassword.translationKeys = [...new Set(forgotKeys)];
        report.issues.push('Forgot password page contains translation keys: ' + forgotKeys.join(', '));
      }

      console.log('✓ Forgot password page loaded');
      console.log('  German words:', report.translations.forgotPassword.german.join(', '));
      console.log('  Translation keys:', report.translations.forgotPassword.translationKeys.length > 0 ? report.translations.forgotPassword.translationKeys.join(', ') : 'None');
    }
    console.log('');

  } catch (error) {
    console.error('❌ Test error:', error.message);
    report.issues.push('Test execution error: ' + error.message);
  } finally {
    await browser.close();

    // FINAL SUMMARY
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║                    FINAL SUMMARY                          ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    console.log('✅ PASSED:');
    if (report.languageSwitcher.exists) console.log('  - Language switcher exists');
    if (report.languageSwitcher.dropdownOpens) console.log('  - Dropdown menu opens');
    if (report.languageSwitcher.canSwitchToEnglish) console.log('  - Can switch to English');
    if (report.languageSwitcher.canSwitchBackToGerman) console.log('  - Can switch back to German');
    if (report.pages['/login'].works) console.log('  - Login page works');
    if (report.pages['/register'].works) console.log('  - Register page works');
    if (report.pages['/forgot-password'].works) console.log('  - Forgot password page works');
    if (report.translations.login.german.length > 0) console.log('  - German translations present on login');
    if (report.translations.register.german.length > 0) console.log('  - German translations present on register');
    if (report.translations.forgotPassword.german.length > 0) console.log('  - German translations present on forgot password');

    if (report.issues.length > 0) {
      console.log('\n❌ ISSUES FOUND:');
      report.issues.forEach(issue => console.log('  - ' + issue));
    } else {
      console.log('\n✓ No issues found!');
    }

    console.log('\n📸 Screenshots saved:', report.screenshots.length);
    console.log('📁 Location: ./test-screenshots/\n');

    // Save JSON report
    fs.writeFileSync(
      path.join(__dirname, 'GERMAN-UI-TEST-FINAL-REPORT.json'),
      JSON.stringify(report, null, 2)
    );

    // Save Markdown report
    const mdReport = `# German UI Test - Final Report

**Test Date:** ${report.timestamp}
**Site:** https://operate.guru

## Overall Results

${report.issues.length === 0 ? '### ✅ ALL TESTS PASSED' : '### ⚠️ ISSUES FOUND'}

## Language Switcher

- **Exists:** ${report.languageSwitcher.exists ? '✅ Yes' : '❌ No'}
- **Dropdown Opens:** ${report.languageSwitcher.dropdownOpens ? '✅ Yes' : '❌ No'}
- **Can Switch to English:** ${report.languageSwitcher.canSwitchToEnglish ? '✅ Yes' : '❌ No'}
- **Can Switch Back to German:** ${report.languageSwitcher.canSwitchBackToGerman ? '✅ Yes' : '❌ No'}

**Available Languages:**
${report.languageSwitcher.languagesAvailable.map(lang => `- ${lang}`).join('\n') || '- None detected'}

## German Translations

### Login Page
- **German Words:** ${report.translations.login.german.join(', ') || 'None'}
- **English Words:** ${report.translations.login.english.join(', ') || 'None'}
- **Translation Keys:** ${report.translations.login.translationKeys.join(', ') || 'None'}

### Register Page
- **German Words:** ${report.translations.register.german.join(', ') || 'None'}
- **Translation Keys:** ${report.translations.register.translationKeys.join(', ') || 'None'}

### Forgot Password Page
- **German Words:** ${report.translations.forgotPassword.german.join(', ') || 'None'}
- **Translation Keys:** ${report.translations.forgotPassword.translationKeys.join(', ') || 'None'}

## Page Functionality

| Page | Status | Works |
|------|--------|-------|
| /login | ${report.pages['/login'].status} | ${report.pages['/login'].works ? '✅' : '❌'} |
| /register | ${report.pages['/register'].status} | ${report.pages['/register'].works ? '✅' : '❌'} |
| /forgot-password | ${report.pages['/forgot-password'].status} | ${report.pages['/forgot-password'].works ? '✅' : '❌'} |

## Issues Found

${report.issues.length === 0 ? '✅ No issues found' : report.issues.map(issue => `- ❌ ${issue}`).join('\n')}

## Screenshots

${report.screenshots.map(s => `- ${s}`).join('\n')}

---

**Conclusion:** ${
  report.languageSwitcher.exists &&
  report.languageSwitcher.dropdownOpens &&
  report.issues.length === 0
    ? '✅ German UI is working correctly!'
    : '⚠️ Some issues need to be addressed.'
}
`;

    fs.writeFileSync(
      path.join(__dirname, 'GERMAN-UI-TEST-FINAL-REPORT.md'),
      mdReport
    );

    console.log('📄 Reports saved:');
    console.log('  - GERMAN-UI-TEST-FINAL-REPORT.json');
    console.log('  - GERMAN-UI-TEST-FINAL-REPORT.md\n');
  }
})();
