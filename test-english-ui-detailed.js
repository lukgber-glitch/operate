const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://operate.guru';
const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots-english-detailed');

// Create screenshots directory
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

const germanTexts = [];
const englishTexts = [];

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function takeScreenshot(page, name) {
  const screenshotPath = path.join(SCREENSHOTS_DIR, `${name}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`  📸 Screenshot: ${name}.png`);
  return screenshotPath;
}

async function checkLanguage(page, pageName) {
  const analysis = await page.evaluate(() => {
    const bodyText = document.body.innerText;

    // German indicators
    const germanWords = [
      'Willkommen',
      'Anmelden',
      'Passwort',
      'vergessen',
      'registrieren',
      'Konto erstellen',
      'Vorname',
      'Nachname',
      'E-Mail-Adresse',
      'Ich stimme',
      'Nutzungsbedingungen',
      'Datenschutzrichtlinie',
      'Melden Sie sich',
      'Geben Sie',
      'Mindestens',
      'Zeichen',
      'Sie haben'
    ];

    // English indicators
    const englishWords = [
      'Welcome',
      'Sign in',
      'Login',
      'Password',
      'Forgot',
      'Register',
      'Create account',
      'First name',
      'Last name',
      'Email address',
      'I agree',
      'Terms',
      'Privacy',
      'Enter your',
      'At least',
      'characters',
      'Already have'
    ];

    const foundGerman = germanWords.filter(word => bodyText.includes(word));
    const foundEnglish = englishWords.filter(word => bodyText.includes(word));

    return {
      bodyText: bodyText.substring(0, 1000),
      foundGerman,
      foundEnglish,
      language: foundGerman.length > foundEnglish.length ? 'German' :
                foundEnglish.length > 0 ? 'English' : 'Unknown'
    };
  });

  console.log(`  🌍 Language detected: ${analysis.language}`);
  if (analysis.foundGerman.length > 0) {
    console.log(`     German words found: ${analysis.foundGerman.join(', ')}`);
  }
  if (analysis.foundEnglish.length > 0) {
    console.log(`     English words found: ${analysis.foundEnglish.join(', ')}`);
  }

  return analysis;
}

async function switchToEnglish(page) {
  console.log('\n🔄 Attempting to switch to English...');

  try {
    // Look for language selector button
    const languageButton = await page.$('button:has-text("Select language"), button[aria-label*="language"], button[aria-label*="Language"]');

    if (!languageButton) {
      console.log('  ⚠️  Language selector button not found, trying alternative selectors...');

      // Try to find by text content
      const buttons = await page.$$('button');
      for (const button of buttons) {
        const text = await page.evaluate(el => el.innerText, button);
        if (text.toLowerCase().includes('language') || text.toLowerCase().includes('sprache')) {
          console.log(`  ✅ Found language button with text: "${text}"`);
          await button.click();
          await delay(500);

          // Take screenshot of language menu
          await takeScreenshot(page, 'language-menu');

          // Look for English option
          const englishOption = await page.$('button:has-text("English"), [role="menuitem"]:has-text("English"), a:has-text("English")');
          if (englishOption) {
            console.log('  ✅ Found English option, clicking...');
            await englishOption.click();
            await delay(1000);
            return true;
          } else {
            console.log('  ⚠️  English option not found in menu');
            // Try to find all menu items
            const menuItems = await page.$$('[role="menuitem"], .menu-item, li');
            for (const item of menuItems) {
              const text = await page.evaluate(el => el.innerText, item);
              console.log(`     Menu item: "${text}"`);
              if (text.toLowerCase().includes('english') || text === 'EN' || text === 'en') {
                console.log('  ✅ Clicking English option');
                await item.click();
                await delay(1000);
                return true;
              }
            }
          }
          break;
        }
      }
    } else {
      console.log('  ✅ Found language selector button');
      await languageButton.click();
      await delay(500);

      await takeScreenshot(page, 'language-menu');

      // Try to find English option
      await page.click('text=English').catch(() => {
        console.log('  ⚠️  Could not click English option');
      });
      await delay(1000);
      return true;
    }

    // Check if there's a locale in URL we can change
    const currentUrl = page.url();
    if (currentUrl.includes('/de/') || currentUrl.includes('?lang=de') || currentUrl.includes('&lang=de')) {
      console.log('  ✅ Found German locale in URL, attempting to change...');
      const newUrl = currentUrl
        .replace('/de/', '/en/')
        .replace('?lang=de', '?lang=en')
        .replace('&lang=de', '&lang=en');
      await page.goto(newUrl, { waitUntil: 'networkidle2' });
      await delay(1000);
      return true;
    }

    // Check localStorage for language setting
    const localeLsKey = await page.evaluate(() => {
      const keys = Object.keys(localStorage);
      const localeKey = keys.find(k =>
        k.toLowerCase().includes('locale') ||
        k.toLowerCase().includes('language') ||
        k.toLowerCase().includes('lang')
      );
      if (localeKey) {
        const value = localStorage.getItem(localeKey);
        return { key: localeKey, value };
      }
      return null;
    });

    if (localeLsKey) {
      console.log(`  ✅ Found locale in localStorage: ${localeLsKey.key} = ${localeLsKey.value}`);
      await page.evaluate((key) => {
        localStorage.setItem(key, 'en');
        localStorage.setItem(key, 'en-US');
        localStorage.setItem(key, 'English');
      }, localeLsKey.key);
      await page.reload({ waitUntil: 'networkidle2' });
      await delay(1000);
      return true;
    }

    console.log('  ❌ Could not find way to switch to English');
    return false;

  } catch (error) {
    console.log(`  ❌ Error switching language: ${error.message}`);
    return false;
  }
}

async function testPageInEnglish(browser, url, pageName) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`🔍 Testing: ${pageName}`);
  console.log(`📍 URL: ${url}`);
  console.log('='.repeat(70));

  const page = await browser.newPage();

  const result = {
    page: pageName,
    url,
    beforeSwitch: null,
    afterSwitch: null,
    switchSuccessful: false,
    screenshot: null
  };

  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    await delay(2000);

    // Check initial language
    console.log('\n📊 BEFORE language switch:');
    const beforeAnalysis = await checkLanguage(page, pageName);
    result.beforeSwitch = beforeAnalysis;
    await takeScreenshot(page, `${pageName}-before-switch`);

    // Try to switch to English
    const switched = await switchToEnglish(page);
    result.switchSuccessful = switched;

    if (switched) {
      await delay(2000);
      console.log('\n📊 AFTER language switch:');
      const afterAnalysis = await checkLanguage(page, pageName);
      result.afterSwitch = afterAnalysis;
      result.screenshot = await takeScreenshot(page, `${pageName}-after-switch`);

      if (afterAnalysis.language === 'German') {
        console.log('  ❌ STILL IN GERMAN - Language switch did not work!');
      } else if (afterAnalysis.language === 'English') {
        console.log('  ✅ Successfully switched to English!');
      }
    }

    // Get all text elements to analyze
    const allText = await page.evaluate(() => {
      const elements = document.querySelectorAll('h1, h2, h3, h4, p, button, a, label, span');
      return Array.from(elements)
        .map(el => el.innerText.trim())
        .filter(text => text.length > 0 && text.length < 100);
    });

    result.allText = allText;
    console.log(`\n📝 All UI text elements (${allText.length} items):`);
    allText.slice(0, 20).forEach(text => {
      console.log(`   - "${text}"`);
    });

  } catch (error) {
    console.log(`\n❌ Error: ${error.message}`);
    result.error = error.message;
    await takeScreenshot(page, `${pageName}-error`);
  } finally {
    await page.close();
  }

  return result;
}

async function main() {
  console.log('\n🚀 DETAILED ENGLISH UI TEST FOR https://operate.guru');
  console.log('='.repeat(70));
  console.log('Goal: Verify if UI can be switched to English and test all pages\n');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--lang=en-US']
  });

  const results = [];

  try {
    // Test main pages
    results.push(await testPageInEnglish(browser, `${BASE_URL}/login`, 'login'));
    results.push(await testPageInEnglish(browser, `${BASE_URL}/register`, 'register'));
    results.push(await testPageInEnglish(browser, `${BASE_URL}/forgot-password`, 'forgot-password'));

    console.log('\n' + '='.repeat(70));
    console.log('📊 FINAL SUMMARY');
    console.log('='.repeat(70));

    results.forEach(r => {
      console.log(`\n${r.page.toUpperCase()}:`);
      console.log(`  Before switch: ${r.beforeSwitch?.language || 'N/A'}`);
      console.log(`  After switch: ${r.afterSwitch?.language || 'N/A'}`);
      console.log(`  Switch successful: ${r.switchSuccessful ? '✅' : '❌'}`);

      if (r.afterSwitch?.language === 'German') {
        console.log(`  ⚠️  ISSUE: Page is still showing German text!`);
        console.log(`     German words: ${r.afterSwitch.foundGerman.join(', ')}`);
      }
    });

    // Save detailed report
    const reportPath = path.join(__dirname, 'english-ui-detailed-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
    console.log(`\n📄 Detailed report saved: ${reportPath}`);
    console.log(`📁 Screenshots saved in: ${SCREENSHOTS_DIR}`);

  } catch (error) {
    console.error('❌ Fatal error:', error);
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
