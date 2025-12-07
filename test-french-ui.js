const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Create screenshots directory
const screenshotsDir = path.join(__dirname, 'screenshots-french');
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
  clickableElements: []
};

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function takeScreenshot(page, name) {
  const screenshotPath = path.join(screenshotsDir, `${name}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  testResults.screenshots.push(screenshotPath);
  console.log(`📸 Screenshot saved: ${name}.png`);
  return screenshotPath;
}

async function checkForEnglishText(page) {
  // Common English words that shouldn't appear in French UI
  const englishWords = [
    'Login', 'Sign in', 'Sign up', 'Email', 'Password',
    'Dashboard', 'Settings', 'Logout', 'Welcome', 'Home',
    'Invoices', 'Transactions', 'Reports', 'Profile',
    'Save', 'Cancel', 'Submit', 'Delete', 'Edit',
    'Click here', 'Learn more', 'Get started'
  ];

  const bodyText = await page.evaluate(() => document.body.innerText);

  const found = [];
  for (const word of englishWords) {
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    if (regex.test(bodyText)) {
      found.push(word);
    }
  }

  return found;
}

async function getAllClickableElements(page) {
  return await page.evaluate(() => {
    const elements = [];

    // Get all links
    const links = document.querySelectorAll('a[href]');
    links.forEach(link => {
      const href = link.getAttribute('href');
      const text = link.innerText.trim() || link.getAttribute('aria-label') || 'No text';
      if (href && !href.startsWith('#') && !href.startsWith('javascript:')) {
        elements.push({
          type: 'link',
          href: href,
          text: text,
          selector: link.tagName + (link.id ? '#' + link.id : '') + (link.className ? '.' + link.className.split(' ').join('.') : '')
        });
      }
    });

    // Get all buttons
    const buttons = document.querySelectorAll('button, [role="button"]');
    buttons.forEach(button => {
      const text = button.innerText.trim() || button.getAttribute('aria-label') || 'No text';
      elements.push({
        type: 'button',
        text: text,
        selector: button.tagName + (button.id ? '#' + button.id : '') + (button.className ? '.' + button.className.split(' ').join('.') : '')
      });
    });

    return elements;
  });
}

async function testPage(page, url, pageName) {
  console.log(`\n🔍 Testing page: ${pageName} (${url})`);

  try {
    const response = await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    const status = response.status();
    console.log(`   Status: ${status}`);

    if (status === 404) {
      testResults.brokenLinks.push({ url, pageName, status: 404 });
      console.log(`   ❌ 404 Not Found!`);
      return false;
    }

    if (status >= 400) {
      testResults.errors.push({ url, pageName, status });
      console.log(`   ❌ Error ${status}!`);
      return false;
    }

    // Wait a bit for dynamic content
    await sleep(2000);

    // Take screenshot
    await takeScreenshot(page, pageName.replace(/[^a-z0-9]/gi, '-').toLowerCase());

    // Check for English text
    const englishWords = await checkForEnglishText(page);
    if (englishWords.length > 0) {
      console.log(`   ⚠️  Found English text: ${englishWords.join(', ')}`);
      testResults.untranslatedText.push({ page: pageName, words: englishWords });
      testResults.translationsComplete = false;
    } else {
      console.log(`   ✅ All text appears to be in French`);
    }

    testResults.testedPages.push({ url, pageName, status: 'success' });
    return true;

  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    testResults.errors.push({ url, pageName, error: error.message });
    return false;
  }
}

async function main() {
  console.log('🚀 Starting French UI Test for https://operate.guru\n');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  try {
    // Step 1: Navigate to login page
    console.log('📍 Step 1: Navigating to https://operate.guru/login');
    await page.goto('https://operate.guru/login', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    await sleep(2000);
    await takeScreenshot(page, '01-login-page-english');

    // Step 2: Find and click language switcher
    console.log('\n📍 Step 2: Looking for language switcher...');

    // Try different selectors for language switcher
    const languageSwitcherSelectors = [
      'button[aria-label*="language" i]',
      'button[aria-label*="langue" i]',
      '[data-testid="language-switcher"]',
      'button svg[data-testid="LanguageIcon"]',
      'button svg.globe-icon',
      'button:has(svg)',
      '[role="button"]:has(svg)'
    ];

    let languageSwitcher = null;
    for (const selector of languageSwitcherSelectors) {
      try {
        languageSwitcher = await page.$(selector);
        if (languageSwitcher) {
          console.log(`   Found language switcher with selector: ${selector}`);
          break;
        }
      } catch (e) {
        // Continue to next selector
      }
    }

    if (!languageSwitcher) {
      // Try to find by looking for buttons with globe/language icons
      console.log('   Trying to find globe icon button...');
      const buttons = await page.$$('button');

      for (const button of buttons) {
        const hasGlobeIcon = await button.evaluate(el => {
          const svg = el.querySelector('svg');
          if (!svg) return false;

          // Check for common globe/language icon patterns
          const svgContent = svg.outerHTML;
          return svgContent.includes('globe') ||
                 svgContent.includes('language') ||
                 svgContent.includes('M12 22C17.5228') || // Common globe icon path
                 el.getAttribute('aria-label')?.toLowerCase().includes('language');
        });

        if (hasGlobeIcon) {
          languageSwitcher = button;
          console.log('   Found globe icon button!');
          break;
        }
      }
    }

    if (!languageSwitcher) {
      console.log('   ❌ Language switcher not found! Checking all buttons...');
      const allButtons = await getAllClickableElements(page);
      console.log(`   Found ${allButtons.length} clickable elements`);
      testResults.clickableElements = allButtons;
      throw new Error('Language switcher not found');
    }

    // Click the language switcher
    console.log('   Clicking language switcher...');
    await languageSwitcher.click();
    await sleep(1000);
    await takeScreenshot(page, '02-language-menu-open');

    // Step 3: Select French
    console.log('\n📍 Step 3: Selecting French (Français)...');

    const frenchSelectors = [
      'button:has-text("Français")',
      'button:has-text("français")',
      '[role="menuitem"]:has-text("Français")',
      '[role="menuitem"]:has-text("français")',
      'li:has-text("Français")',
      'li:has-text("français")',
      'a:has-text("Français")',
      'a:has-text("français")'
    ];

    let frenchOption = null;

    // First try to find by text content
    frenchOption = await page.evaluateHandle(() => {
      const elements = Array.from(document.querySelectorAll('button, [role="menuitem"], li, a'));
      return elements.find(el =>
        el.textContent.toLowerCase().includes('français') ||
        el.textContent.toLowerCase().includes('french') ||
        el.textContent.toLowerCase().includes('fr')
      );
    });

    if (frenchOption && await frenchOption.asElement()) {
      console.log('   Found French option!');
      await frenchOption.asElement().click();
      await sleep(2000);
      testResults.languageSwitchingWorks = true;
      console.log('   ✅ Language switched to French!');
    } else {
      console.log('   ❌ French option not found in menu');
      throw new Error('French option not found');
    }

    // Step 4: Verify French language
    console.log('\n📍 Step 4: Verifying French translation...');
    await takeScreenshot(page, '03-login-page-french');

    const currentUrl = page.url();
    console.log(`   Current URL: ${currentUrl}`);

    // Check for French text
    const pageText = await page.evaluate(() => document.body.innerText);
    const hasFrenchWords = pageText.includes('Connexion') ||
                          pageText.includes('Se connecter') ||
                          pageText.includes('Mot de passe') ||
                          pageText.includes('Courriel');

    if (hasFrenchWords) {
      console.log('   ✅ French text detected on page!');
    } else {
      console.log('   ⚠️  No obvious French text detected. Checking for English...');
      const englishWords = await checkForEnglishText(page);
      if (englishWords.length > 0) {
        console.log(`   ❌ Found English text: ${englishWords.join(', ')}`);
        testResults.translationsComplete = false;
      }
    }

    // Step 5: Get all clickable elements in French
    console.log('\n📍 Step 5: Getting all clickable elements...');
    const clickableElements = await getAllClickableElements(page);
    testResults.clickableElements = clickableElements;
    console.log(`   Found ${clickableElements.length} clickable elements`);

    // Step 6: Test all internal links
    console.log('\n📍 Step 6: Testing all internal links...');
    const internalLinks = clickableElements
      .filter(el => el.type === 'link')
      .filter(el => {
        const href = el.href;
        return href.startsWith('/') || href.includes('operate.guru');
      })
      .slice(0, 20); // Limit to first 20 links to avoid timeout

    console.log(`   Testing ${internalLinks.length} internal links...`);

    for (let i = 0; i < internalLinks.length; i++) {
      const link = internalLinks[i];
      let fullUrl = link.href;

      if (fullUrl.startsWith('/')) {
        fullUrl = 'https://operate.guru' + fullUrl;
      }

      const pageName = `page-${i + 1}-${link.text.substring(0, 30)}`;
      await testPage(page, fullUrl, pageName);

      // Go back to French login page for next test
      await page.goto('https://operate.guru/login', {
        waitUntil: 'networkidle2',
        timeout: 30000
      });
      await sleep(1000);
    }

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    testResults.errors.push({ error: error.message, stack: error.stack });
    await takeScreenshot(page, 'error-state');
  } finally {
    await browser.close();
  }

  // Generate report
  console.log('\n' + '='.repeat(80));
  console.log('📊 FRENCH UI TEST REPORT');
  console.log('='.repeat(80));

  console.log('\n✅ Language Switching:');
  console.log(`   ${testResults.languageSwitchingWorks ? '✅' : '❌'} Language switcher ${testResults.languageSwitchingWorks ? 'works' : 'FAILED'}`);

  console.log('\n📝 Translation Status:');
  console.log(`   ${testResults.translationsComplete ? '✅' : '❌'} Translations ${testResults.translationsComplete ? 'complete' : 'INCOMPLETE'}`);

  if (testResults.untranslatedText.length > 0) {
    console.log('\n   Untranslated text found on:');
    testResults.untranslatedText.forEach(item => {
      console.log(`   - ${item.page}: ${item.words.join(', ')}`);
    });
  }

  console.log('\n🔗 Tested Pages:');
  console.log(`   Total pages tested: ${testResults.testedPages.length}`);
  testResults.testedPages.forEach(page => {
    console.log(`   ✅ ${page.pageName} - ${page.url}`);
  });

  console.log('\n❌ Broken Links / 404s:');
  if (testResults.brokenLinks.length === 0) {
    console.log('   ✅ No broken links found!');
  } else {
    testResults.brokenLinks.forEach(link => {
      console.log(`   ❌ ${link.pageName} - ${link.url} (Status: ${link.status})`);
    });
  }

  console.log('\n⚠️  Errors:');
  if (testResults.errors.length === 0) {
    console.log('   ✅ No errors!');
  } else {
    testResults.errors.forEach(error => {
      console.log(`   ❌ ${error.pageName || 'General'}: ${error.error || error.status}`);
    });
  }

  console.log('\n📸 Screenshots:');
  console.log(`   Total screenshots: ${testResults.screenshots.length}`);
  console.log(`   Location: ${screenshotsDir}`);

  console.log('\n🔘 Clickable Elements:');
  console.log(`   Total: ${testResults.clickableElements.length}`);
  console.log('   Sample:');
  testResults.clickableElements.slice(0, 10).forEach(el => {
    console.log(`   - ${el.type}: "${el.text}" ${el.href ? '-> ' + el.href : ''}`);
  });

  console.log('\n' + '='.repeat(80));

  // Save detailed report to file
  const reportPath = path.join(__dirname, 'french-ui-test-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2));
  console.log(`\n📄 Detailed report saved to: ${reportPath}`);

  // Exit with appropriate code
  const hasIssues = !testResults.languageSwitchingWorks ||
                    !testResults.translationsComplete ||
                    testResults.brokenLinks.length > 0 ||
                    testResults.errors.length > 0;

  process.exit(hasIssues ? 1 : 0);
}

main().catch(console.error);
