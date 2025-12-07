const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const screenshotsDir = path.join(__dirname, 'screenshots-french-comprehensive');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir);
}

const testResults = {
  languageSwitchingWorks: false,
  translationsComplete: true,
  brokenLinks: [],
  errors: [],
  screenshots: [],
  testedPages: [],
  untranslatedText: [],
  issues: []
};

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function takeScreenshot(page, name) {
  const screenshotPath = path.join(screenshotsDir, `${name}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  testResults.screenshots.push(screenshotPath);
  console.log(`📸 Screenshot: ${name}.png`);
  return screenshotPath;
}

async function checkForEnglishOrGerman(page) {
  const englishWords = [
    'Login', 'Sign in', 'Sign up', 'Email', 'Password',
    'Dashboard', 'Settings', 'Logout', 'Welcome', 'Home',
    'Forgot password', 'Remember me', 'Create account'
  ];

  const germanWords = [
    'Willkommen', 'Anmelden', 'Passwort', 'E-Mail',
    'Registrieren', 'Konto', 'vergessen'
  ];

  const bodyText = await page.evaluate(() => document.body.innerText);

  const foundEnglish = [];
  const foundGerman = [];

  for (const word of englishWords) {
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    if (regex.test(bodyText)) {
      foundEnglish.push(word);
    }
  }

  for (const word of germanWords) {
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    if (regex.test(bodyText)) {
      foundGerman.push(word);
    }
  }

  return { english: foundEnglish, german: foundGerman };
}

async function switchToFrench(page) {
  console.log('🔄 Switching to French...');

  // Find and click language switcher
  const languageSwitcherSelectors = [
    'button:has(svg)',
    'button[aria-label*="language" i]',
    '[data-testid="language-switcher"]'
  ];

  let clicked = false;
  for (const selector of languageSwitcherSelectors) {
    try {
      const button = await page.$(selector);
      if (button) {
        const hasGlobe = await button.evaluate(el => {
          const svg = el.querySelector('svg');
          return svg !== null;
        });

        if (hasGlobe) {
          await button.click();
          await sleep(1000);
          clicked = true;
          break;
        }
      }
    } catch (e) {
      // Continue
    }
  }

  if (!clicked) {
    throw new Error('Could not find language switcher');
  }

  // Select French
  const frenchOption = await page.evaluateHandle(() => {
    const elements = Array.from(document.querySelectorAll('button, [role="menuitem"], li, a'));
    return elements.find(el =>
      el.textContent.toLowerCase().includes('français') ||
      el.textContent.toLowerCase().includes('french')
    );
  });

  if (frenchOption && await frenchOption.asElement()) {
    await frenchOption.asElement().click();
    await sleep(2000);
    testResults.languageSwitchingWorks = true;
    console.log('✅ Switched to French');
    return true;
  }

  throw new Error('Could not find French option');
}

async function testPage(page, url, pageName) {
  console.log(`\n🔍 Testing: ${pageName}`);
  console.log(`   URL: ${url}`);

  try {
    const response = await page.goto(url, {
      waitUntil: 'networkidle0',
      timeout: 45000
    });

    const status = response.status();

    if (status === 404) {
      testResults.brokenLinks.push({ url, pageName, status: 404 });
      console.log(`   ❌ 404 Not Found`);
      await takeScreenshot(page, `404-${pageName.replace(/[^a-z0-9]/gi, '-')}`);
      return false;
    }

    if (status >= 400) {
      testResults.errors.push({ url, pageName, status });
      console.log(`   ❌ Error ${status}`);
      await takeScreenshot(page, `error-${status}-${pageName.replace(/[^a-z0-9]/gi, '-')}`);
      return false;
    }

    console.log(`   ✅ Status: ${status}`);
    await sleep(3000);

    // Switch to French if not already
    await switchToFrench(page);
    await sleep(2000);

    await takeScreenshot(page, pageName.replace(/[^a-z0-9]/gi, '-').toLowerCase());

    // Check for English/German text
    const { english, german } = await checkForEnglishOrGerman(page);

    if (english.length > 0) {
      console.log(`   ⚠️  English text found: ${english.join(', ')}`);
      testResults.untranslatedText.push({ page: pageName, type: 'English', words: english });
      testResults.translationsComplete = false;
    }

    if (german.length > 0) {
      console.log(`   ⚠️  German text found: ${german.join(', ')}`);
      testResults.untranslatedText.push({ page: pageName, type: 'German', words: german });
      testResults.translationsComplete = false;
    }

    if (english.length === 0 && german.length === 0) {
      console.log(`   ✅ All text in French`);
    }

    testResults.testedPages.push({ url, pageName, status: 'success', statusCode: status });
    return true;

  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    testResults.errors.push({ url, pageName, error: error.message });

    try {
      await takeScreenshot(page, `error-${pageName.replace(/[^a-z0-9]/gi, '-')}`);
    } catch (e) {
      // Ignore screenshot errors
    }

    return false;
  }
}

async function main() {
  console.log('🚀 Comprehensive French UI Test for https://operate.guru\n');
  console.log('=' .repeat(80));

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  try {
    // Test key pages
    const pagesToTest = [
      { url: 'https://operate.guru/login', name: 'Login Page' },
      { url: 'https://operate.guru/register', name: 'Register Page' },
      { url: 'https://operate.guru/forgot-password', name: 'Forgot Password' },
      { url: 'https://operate.guru/', name: 'Home Page' },
      { url: 'https://operate.guru/dashboard', name: 'Dashboard' },
      { url: 'https://operate.guru/settings', name: 'Settings' },
      { url: 'https://operate.guru/onboarding', name: 'Onboarding' },
      { url: 'https://operate.guru/chat', name: 'Chat' },
      { url: 'https://operate.guru/invoices', name: 'Invoices' },
      { url: 'https://operate.guru/transactions', name: 'Transactions' }
    ];

    for (const pageInfo of pagesToTest) {
      await testPage(page, pageInfo.url, pageInfo.name);
      await sleep(1000);
    }

  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    testResults.issues.push({ type: 'Fatal Error', message: error.message, stack: error.stack });
    await takeScreenshot(page, 'fatal-error');
  } finally {
    await browser.close();
  }

  // Generate report
  console.log('\n' + '='.repeat(80));
  console.log('📊 COMPREHENSIVE FRENCH UI TEST REPORT');
  console.log('='.repeat(80));

  console.log('\n🌍 Language Switching:');
  console.log(`   ${testResults.languageSwitchingWorks ? '✅' : '❌'} Language switcher ${testResults.languageSwitchingWorks ? 'works' : 'FAILED'}`);

  console.log('\n📝 Translation Completeness:');
  console.log(`   ${testResults.translationsComplete ? '✅' : '⚠️ '} Translations ${testResults.translationsComplete ? 'complete' : 'INCOMPLETE'}`);

  if (testResults.untranslatedText.length > 0) {
    console.log('\n   Issues found:');
    testResults.untranslatedText.forEach(item => {
      console.log(`   - ${item.page} (${item.type}): ${item.words.join(', ')}`);
    });
  }

  console.log('\n✅ Successfully Tested Pages:');
  if (testResults.testedPages.length === 0) {
    console.log('   None');
  } else {
    testResults.testedPages.forEach(page => {
      console.log(`   ✅ ${page.pageName} (${page.statusCode})`);
    });
  }

  console.log('\n❌ Broken Links / 404s:');
  if (testResults.brokenLinks.length === 0) {
    console.log('   ✅ None found');
  } else {
    testResults.brokenLinks.forEach(link => {
      console.log(`   ❌ ${link.pageName} - ${link.url}`);
    });
  }

  console.log('\n⚠️  Errors:');
  if (testResults.errors.length === 0) {
    console.log('   ✅ None');
  } else {
    testResults.errors.forEach(error => {
      console.log(`   ❌ ${error.pageName || 'General'}: ${error.error || error.status}`);
    });
  }

  console.log('\n📸 Screenshots:');
  console.log(`   Total: ${testResults.screenshots.length}`);
  console.log(`   Location: ${screenshotsDir}`);

  console.log('\n' + '='.repeat(80));

  // Save report
  const reportPath = path.join(__dirname, 'french-ui-comprehensive-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2));
  console.log(`\n📄 Full report: ${reportPath}\n`);

  const hasIssues = !testResults.languageSwitchingWorks ||
                    !testResults.translationsComplete ||
                    testResults.brokenLinks.length > 0 ||
                    testResults.errors.length > 0;

  process.exit(hasIssues ? 1 : 0);
}

main().catch(console.error);
