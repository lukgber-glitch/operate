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
    languageSwitching: {
      works: false,
      details: '',
      menuOpened: false,
      optionsFound: []
    },
    translations: {
      complete: true,
      issues: [],
      germanWordsFound: {},
      englishWordsFound: {}
    },
    brokenLinks: [],
    screenshots: [],
    pageTests: {},
    clickableElements: []
  };

  try {
    console.log('=== STEP 1: Navigate to Login Page ===');
    await page.goto('https://operate.guru/login', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await wait(3000);
    await page.screenshot({ path: path.join(screenshotDir, '01-login-initial.png'), fullPage: true });
    report.screenshots.push('01-login-initial.png - Initial login page');
    console.log('✓ Login page loaded');

    // Get initial page text
    const initialContent = await page.evaluate(() => document.body.innerText);
    console.log('Initial page language detected...');

    console.log('\n=== STEP 2: Analyze Language Switcher ===');
    await wait(2000);

    // Find and analyze language switcher
    const languageInfo = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const langButton = buttons.find(btn => {
        const hasGlobe = btn.querySelector('svg.lucide-globe, [class*="globe"]');
        const text = btn.textContent.toLowerCase();
        return hasGlobe || text.includes('language') || text.includes('select');
      });

      if (langButton) {
        const rect = langButton.getBoundingClientRect();
        return {
          found: true,
          text: langButton.textContent.trim(),
          position: { x: rect.x, y: rect.y },
          visible: rect.width > 0 && rect.height > 0
        };
      }
      return { found: false };
    });

    console.log('Language switcher:', languageInfo);

    if (!languageInfo.found) {
      report.languageSwitching.details = 'Language switcher not found';
      console.log('✗ Language switcher not found');
    } else {
      console.log('✓ Language switcher found:', languageInfo.text);

      // Click the language switcher
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const langButton = buttons.find(btn => {
          const hasGlobe = btn.querySelector('svg.lucide-globe, [class*="globe"]');
          return hasGlobe;
        });
        if (langButton) langButton.click();
      });

      await wait(1000);
      await page.screenshot({ path: path.join(screenshotDir, '02-language-menu-open.png'), fullPage: true });
      report.screenshots.push('02-language-menu-open.png - Language menu opened');

      // Find all language options
      const languageOptions = await page.evaluate(() => {
        const elements = Array.from(document.querySelectorAll('[role="menuitem"], [role="option"], button, a'));
        return elements
          .map(el => ({
            text: el.textContent.trim(),
            visible: el.offsetParent !== null,
            tag: el.tagName
          }))
          .filter(el => el.visible && el.text && el.text.length < 50);
      });

      console.log('Available language options:', languageOptions);
      report.languageSwitching.optionsFound = languageOptions.map(o => o.text);
      report.languageSwitching.menuOpened = true;

      console.log('\n=== STEP 3: Switch to English (then back to German) ===');

      // Try to switch to English
      const englishSelected = await page.evaluate(() => {
        const elements = Array.from(document.querySelectorAll('[role="menuitem"], [role="option"], button, a'));
        const englishOption = elements.find(el => {
          const text = el.textContent.toLowerCase();
          return text.includes('english') || text === 'en';
        });

        if (englishOption) {
          englishOption.click();
          return { found: true, text: englishOption.textContent };
        }
        return { found: false };
      });

      if (englishSelected.found) {
        console.log('✓ English option clicked:', englishSelected.text);
        await wait(2000);
        await page.screenshot({ path: path.join(screenshotDir, '03-login-english.png'), fullPage: true });
        report.screenshots.push('03-login-english.png - Login page in English');

        // Now switch back to German
        await page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          const langButton = buttons.find(btn => btn.querySelector('svg.lucide-globe, [class*="globe"]'));
          if (langButton) langButton.click();
        });
        await wait(1000);

        const germanSelected = await page.evaluate(() => {
          const elements = Array.from(document.querySelectorAll('[role="menuitem"], [role="option"], button, a'));
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

        if (germanSelected.found) {
          console.log('✓ German option clicked:', germanSelected.text);
          await wait(2000);
          await page.screenshot({ path: path.join(screenshotDir, '04-login-german.png'), fullPage: true });
          report.screenshots.push('04-login-german.png - Login page switched to German');
          report.languageSwitching.works = true;
          report.languageSwitching.details = 'Language switching works between English and German';
        }
      } else {
        console.log('ℹ English option not found, page may already be in German by default');
        report.languageSwitching.details = 'Page appears to be German by default, English option not found';
      }
    }

    console.log('\n=== STEP 4: Verify German Translations on Login ===');
    const loginContent = await page.evaluate(() => document.body.innerText);

    // Check for translation keys
    const translationKeyPattern = /\b(auth|common|navigation|error|success|form|validation)\.[\w.]+\b/g;
    const foundKeys = loginContent.match(translationKeyPattern);
    if (foundKeys) {
      report.translations.complete = false;
      report.translations.issues.push('Login - Translation keys: ' + [...new Set(foundKeys)].join(', '));
    }

    // Check for German words
    const germanWords = ['Willkommen', 'Anmelden', 'Passwort', 'vergessen', 'registrieren', 'Konto'];
    germanWords.forEach(word => {
      if (loginContent.includes(word)) {
        report.translations.germanWordsFound['login'] = report.translations.germanWordsFound['login'] || [];
        report.translations.germanWordsFound['login'].push(word);
      }
    });

    // Check for English that shouldn't be there
    const unexpectedEnglish = ['Sign in', 'Log in', 'Welcome to Operate', 'Forgot your password'];
    unexpectedEnglish.forEach(word => {
      if (loginContent.includes(word)) {
        report.translations.englishWordsFound['login'] = report.translations.englishWordsFound['login'] || [];
        report.translations.englishWordsFound['login'].push(word);
      }
    });

    console.log('German words found on login:', report.translations.germanWordsFound['login']);

    console.log('\n=== STEP 5: Test Register Page ===');
    await page.goto('https://operate.guru/register', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await wait(2000);

    const registerStatus = await page.evaluate(() => ({
      title: document.title,
      url: window.location.href,
      bodyText: document.body.innerText.substring(0, 500)
    }));

    if (registerStatus.url.includes('404') || registerStatus.bodyText.includes('404')) {
      report.brokenLinks.push('/register - 404');
      report.pageTests['/register'] = 'BROKEN - 404';
    } else {
      await page.screenshot({ path: path.join(screenshotDir, '05-register-german.png'), fullPage: true });
      report.screenshots.push('05-register-german.png - Register page');
      report.pageTests['/register'] = 'OK';

      const registerContent = await page.evaluate(() => document.body.innerText);

      // Check for translation keys
      const keys = registerContent.match(translationKeyPattern);
      if (keys) {
        report.translations.issues.push('Register - Translation keys: ' + [...new Set(keys)].join(', '));
      }

      // Check German words
      const regGermanWords = ['Konto erstellen', 'Vorname', 'Nachname', 'Passwort', 'bestätigen', 'Nutzungsbedingungen', 'Datenschutz'];
      regGermanWords.forEach(word => {
        if (registerContent.includes(word)) {
          report.translations.germanWordsFound['register'] = report.translations.germanWordsFound['register'] || [];
          report.translations.germanWordsFound['register'].push(word);
        }
      });

      console.log('✓ Register page OK - German words:', report.translations.germanWordsFound['register']);
    }

    console.log('\n=== STEP 6: Test Forgot Password Page ===');
    await page.goto('https://operate.guru/forgot-password', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await wait(2000);

    const forgotStatus = await page.evaluate(() => ({
      title: document.title,
      url: window.location.href,
      bodyText: document.body.innerText.substring(0, 500)
    }));

    if (forgotStatus.url.includes('404') || forgotStatus.bodyText.includes('404')) {
      report.brokenLinks.push('/forgot-password - 404');
      report.pageTests['/forgot-password'] = 'BROKEN - 404';
    } else {
      await page.screenshot({ path: path.join(screenshotDir, '06-forgot-password-german.png'), fullPage: true });
      report.screenshots.push('06-forgot-password-german.png - Forgot password page');
      report.pageTests['/forgot-password'] = 'OK';

      const forgotContent = await page.evaluate(() => document.body.innerText);

      const keys = forgotContent.match(translationKeyPattern);
      if (keys) {
        report.translations.issues.push('Forgot Password - Translation keys: ' + [...new Set(keys)].join(', '));
      }

      const forgotGermanWords = ['Passwort vergessen', 'E-Mail', 'Link', 'senden', 'Zurücksetzen'];
      forgotGermanWords.forEach(word => {
        if (forgotContent.includes(word)) {
          report.translations.germanWordsFound['forgot-password'] = report.translations.germanWordsFound['forgot-password'] || [];
          report.translations.germanWordsFound['forgot-password'].push(word);
        }
      });

      console.log('✓ Forgot password page OK - German words:', report.translations.germanWordsFound['forgot-password']);
    }

    console.log('\n=== STEP 7: Test All Clickable Elements ===');
    await page.goto('https://operate.guru/login', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await wait(2000);

    const clickableElements = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('a, button'));
      return elements
        .filter(el => el.offsetParent !== null)
        .map(el => ({
          tag: el.tagName,
          text: el.textContent.trim().substring(0, 100),
          href: el.href || '',
          id: el.id,
          ariaLabel: el.getAttribute('aria-label')
        }))
        .filter(el => el.text || el.ariaLabel);
    });

    console.log('Found', clickableElements.length, 'clickable elements');
    report.clickableElements = clickableElements;

    // Test links
    const linksToTest = clickableElements.filter(el =>
      el.href &&
      el.href.startsWith('http') &&
      !el.href.includes('#') &&
      !el.href.includes('google') &&
      !el.href.includes('microsoft')
    );

    for (const link of linksToTest.slice(0, 5)) {
      console.log('Testing link:', link.text, '->', link.href);
      try {
        const response = await page.goto(link.href, { waitUntil: 'domcontentloaded', timeout: 15000 });
        await wait(1000);
        if (response.status() === 404) {
          report.brokenLinks.push(link.href + ' - 404');
          console.log('✗ 404:', link.href);
        } else {
          console.log('✓ OK:', link.href);
        }
      } catch (err) {
        report.brokenLinks.push(link.href + ' - Error: ' + err.message);
        console.log('✗ Error:', link.href, err.message);
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

    // Create detailed markdown report
    const mdReport = `# German UI Test Report - Comprehensive

**Test Date:** ${new Date().toISOString()}
**Site:** https://operate.guru

## Summary

- Language Switching: ${report.languageSwitching.works ? '✓ WORKING' : '✗ NOT WORKING'}
- Translations Complete: ${report.translations.complete ? '✓ YES' : '✗ NO (issues found)'}
- Broken Links: ${report.brokenLinks.length === 0 ? '✓ NONE' : '✗ ' + report.brokenLinks.length + ' found'}
- Pages Tested: ${Object.keys(report.pageTests).length}

## Language Switching

**Status:** ${report.languageSwitching.works ? 'WORKING' : 'NOT WORKING'}
**Details:** ${report.languageSwitching.details}
**Menu Opened:** ${report.languageSwitching.menuOpened ? 'Yes' : 'No'}

**Language Options Found:**
${report.languageSwitching.optionsFound.map(opt => `- ${opt}`).join('\n') || 'None'}

## Translation Quality

**Overall Status:** ${report.translations.complete ? 'COMPLETE' : 'INCOMPLETE'}

### German Words Found (Proof of Translation)

${Object.entries(report.translations.germanWordsFound).map(([page, words]) =>
  `**${page}:**\n${words.map(w => `- ${w}`).join('\n')}`
).join('\n\n') || 'None detected'}

### Translation Issues

${report.translations.issues.length === 0 ? '✓ No translation keys or issues found' :
  report.translations.issues.map(issue => `- ✗ ${issue}`).join('\n')}

### Unexpected English Text

${Object.keys(report.translations.englishWordsFound).length === 0 ?
  '✓ No unexpected English text found - all properly translated' :
  Object.entries(report.translations.englishWordsFound).map(([page, words]) =>
    `**${page}:** ${words.join(', ')}`
  ).join('\n')}

## Page Tests

${Object.entries(report.pageTests).map(([page, status]) =>
  `- ${status === 'OK' ? '✓' : '✗'} **${page}**: ${status}`
).join('\n') || 'None'}

## Broken Links / 404s

${report.brokenLinks.length === 0 ?
  '✓ All links working correctly' :
  report.brokenLinks.map(link => `- ✗ ${link}`).join('\n')}

## Clickable Elements Analysis

**Total Elements Found:** ${report.clickableElements.length}

**Sample Elements:**
${report.clickableElements.slice(0, 10).map(el =>
  `- [${el.tag}] "${el.text}" ${el.href ? '→ ' + el.href : ''}`
).join('\n')}

## Screenshots

${report.screenshots.map(s => `- ${s}`).join('\n')}

## Test Execution

**Error:** ${report.error || 'None'}

---

## Recommendations

${report.translations.complete && report.brokenLinks.length === 0 && report.languageSwitching.works ?
  '✓ **All tests passed!** German UI is working correctly.' :
  '### Issues to Address:\n' +
  (!report.languageSwitching.works ? '- Fix language switching functionality\n' : '') +
  (!report.translations.complete ? '- Complete missing translations\n' : '') +
  (report.brokenLinks.length > 0 ? '- Fix broken links\n' : '')
}
`;

    fs.writeFileSync(
      path.join(__dirname, 'GERMAN-UI-TEST-REPORT-COMPLETE.md'),
      mdReport
    );

    console.log('\nReport saved to GERMAN-UI-TEST-REPORT-COMPLETE.md');
  }
})();
