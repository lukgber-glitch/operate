const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://operate.guru';
const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots-english-ui');

// Create screenshots directory
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

const results = {
  timestamp: new Date().toISOString(),
  baseUrl: BASE_URL,
  pages: [],
  brokenLinks: [],
  missingTranslations: [],
  formValidationIssues: [],
  summary: {
    totalPages: 0,
    successfulPages: 0,
    failedPages: 0,
    totalLinks: 0,
    brokenLinks: 0
  }
};

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function takeScreenshot(page, name) {
  const screenshotPath = path.join(SCREENSHOTS_DIR, `${name}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`  📸 Screenshot saved: ${name}.png`);
  return screenshotPath;
}

async function checkForTranslationKeys(page) {
  // Look for untranslated keys (e.g., "auth.login", "common.submit")
  const translationKeys = await page.evaluate(() => {
    const bodyText = document.body.innerText;
    const regex = /\b[a-z]+\.[a-zA-Z.]+\b/g;
    const matches = bodyText.match(regex) || [];
    // Filter to likely translation keys (excluding common patterns like file extensions)
    return matches.filter(m =>
      m.split('.').length >= 2 &&
      !m.endsWith('.js') &&
      !m.endsWith('.ts') &&
      !m.endsWith('.com') &&
      !m.includes('www.')
    );
  });
  return translationKeys;
}

async function getPageInfo(page) {
  return await page.evaluate(() => {
    return {
      title: document.title,
      url: window.location.href,
      hasErrors: !!document.querySelector('[class*="error"]') ||
                 !!document.querySelector('[id*="error"]'),
      text: document.body.innerText.substring(0, 500) // First 500 chars
    };
  });
}

async function getAllClickableElements(page) {
  return await page.evaluate(() => {
    const elements = [];

    // Get all links
    const links = Array.from(document.querySelectorAll('a[href]'));
    links.forEach((link, idx) => {
      const href = link.getAttribute('href');
      if (href && !href.startsWith('javascript:')) {
        elements.push({
          type: 'link',
          text: link.innerText.trim() || link.getAttribute('aria-label') || 'No text',
          href: href,
          selector: `a[href="${href}"]:nth-of-type(${idx + 1})`
        });
      }
    });

    // Get all buttons
    const buttons = Array.from(document.querySelectorAll('button:not([disabled])'));
    buttons.forEach((btn, idx) => {
      elements.push({
        type: 'button',
        text: btn.innerText.trim() || btn.getAttribute('aria-label') || 'No text',
        selector: `button:nth-of-type(${idx + 1})`,
        onclick: btn.onclick ? 'has onclick' : 'no onclick'
      });
    });

    return elements;
  });
}

async function testPage(browser, url, name) {
  console.log(`\n🔍 Testing: ${name} (${url})`);
  const page = await browser.newPage();

  const pageResult = {
    name,
    url,
    status: null,
    statusText: '',
    screenshot: null,
    translationKeys: [],
    clickableElements: [],
    errors: []
  };

  try {
    const response = await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    pageResult.status = response.status();
    pageResult.statusText = response.statusText();

    console.log(`  ✅ Status: ${pageResult.status} ${pageResult.statusText}`);

    // Wait a bit for any client-side rendering
    await delay(2000);

    // Take screenshot
    pageResult.screenshot = await takeScreenshot(page, name);

    // Check for translation keys
    const translationKeys = await checkForTranslationKeys(page);
    if (translationKeys.length > 0) {
      pageResult.translationKeys = translationKeys;
      console.log(`  ⚠️  Possible missing translations: ${translationKeys.join(', ')}`);
      results.missingTranslations.push({
        page: name,
        url,
        keys: translationKeys
      });
    }

    // Get page info
    const info = await getPageInfo(page);
    pageResult.title = info.title;
    pageResult.hasErrors = info.hasErrors;
    console.log(`  📄 Title: ${info.title}`);

    // Get all clickable elements
    const clickableElements = await getAllClickableElements(page);
    pageResult.clickableElements = clickableElements;
    console.log(`  🔗 Found ${clickableElements.length} clickable elements`);

    if (pageResult.status === 200) {
      results.summary.successfulPages++;
    } else {
      results.summary.failedPages++;
    }

  } catch (error) {
    console.log(`  ❌ Error: ${error.message}`);
    pageResult.errors.push(error.message);
    pageResult.status = 'ERROR';
    results.summary.failedPages++;

    try {
      await takeScreenshot(page, `${name}-error`);
    } catch (e) {
      console.log(`  ⚠️  Could not take error screenshot`);
    }
  } finally {
    await page.close();
  }

  results.pages.push(pageResult);
  results.summary.totalPages++;

  return pageResult;
}

async function testLinkNavigation(browser, link, fromPage) {
  console.log(`  🔗 Testing link: "${link.text}" -> ${link.href}`);
  const page = await browser.newPage();

  const linkResult = {
    from: fromPage,
    text: link.text,
    href: link.href,
    status: null,
    error: null
  };

  try {
    const response = await page.goto(link.href, {
      waitUntil: 'networkidle2',
      timeout: 15000
    });

    linkResult.status = response.status();
    linkResult.finalUrl = page.url();

    console.log(`    Status: ${linkResult.status}`);

    if (linkResult.status >= 400) {
      results.brokenLinks.push(linkResult);
      results.summary.brokenLinks++;
    }

  } catch (error) {
    console.log(`    ❌ Error: ${error.message}`);
    linkResult.error = error.message;
    linkResult.status = 'ERROR';
    results.brokenLinks.push(linkResult);
    results.summary.brokenLinks++;
  } finally {
    await page.close();
  }

  results.summary.totalLinks++;
  return linkResult;
}

async function testRegisterForm(browser) {
  console.log('\n📝 Testing /register form validation');
  const page = await browser.newPage();

  const formResult = {
    page: 'register',
    tests: []
  };

  try {
    await page.goto(`${BASE_URL}/register`, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    await delay(2000);
    await takeScreenshot(page, 'register-initial');

    // Test 1: Submit empty form
    console.log('  Test 1: Submit empty form');
    try {
      const submitButton = await page.$('button[type="submit"]');
      if (submitButton) {
        await submitButton.click();
        await delay(1000);

        const errors = await page.evaluate(() => {
          const errorElements = Array.from(document.querySelectorAll('[class*="error"], [role="alert"]'));
          return errorElements.map(el => el.innerText.trim());
        });

        formResult.tests.push({
          name: 'Empty form submission',
          passed: errors.length > 0,
          errors,
          screenshot: await takeScreenshot(page, 'register-empty-submit')
        });

        console.log(`    ${errors.length > 0 ? '✅' : '❌'} Validation errors: ${errors.join(', ')}`);
      }
    } catch (e) {
      formResult.tests.push({
        name: 'Empty form submission',
        passed: false,
        error: e.message
      });
    }

    // Test 2: Invalid email
    console.log('  Test 2: Invalid email format');
    try {
      await page.reload({ waitUntil: 'networkidle2' });
      await delay(1000);

      const emailInput = await page.$('input[type="email"], input[name*="email"]');
      if (emailInput) {
        await emailInput.type('notanemail');

        const passwordInput = await page.$('input[type="password"]');
        if (passwordInput) {
          await passwordInput.type('TestPass123!');
        }

        const submitButton = await page.$('button[type="submit"]');
        if (submitButton) {
          await submitButton.click();
          await delay(1000);

          const errors = await page.evaluate(() => {
            const errorElements = Array.from(document.querySelectorAll('[class*="error"], [role="alert"]'));
            return errorElements.map(el => el.innerText.trim());
          });

          formResult.tests.push({
            name: 'Invalid email format',
            passed: errors.some(e => e.toLowerCase().includes('email')),
            errors,
            screenshot: await takeScreenshot(page, 'register-invalid-email')
          });

          console.log(`    ${errors.length > 0 ? '✅' : '❌'} Validation errors: ${errors.join(', ')}`);
        }
      }
    } catch (e) {
      formResult.tests.push({
        name: 'Invalid email format',
        passed: false,
        error: e.message
      });
    }

    // Test 3: Password requirements
    console.log('  Test 3: Weak password');
    try {
      await page.reload({ waitUntil: 'networkidle2' });
      await delay(1000);

      const emailInput = await page.$('input[type="email"], input[name*="email"]');
      if (emailInput) {
        await emailInput.type('test@example.com');
      }

      const passwordInput = await page.$('input[type="password"]');
      if (passwordInput) {
        await passwordInput.type('123');

        const submitButton = await page.$('button[type="submit"]');
        if (submitButton) {
          await submitButton.click();
          await delay(1000);

          const errors = await page.evaluate(() => {
            const errorElements = Array.from(document.querySelectorAll('[class*="error"], [role="alert"]'));
            return errorElements.map(el => el.innerText.trim());
          });

          formResult.tests.push({
            name: 'Weak password',
            passed: errors.some(e => e.toLowerCase().includes('password')),
            errors,
            screenshot: await takeScreenshot(page, 'register-weak-password')
          });

          console.log(`    ${errors.length > 0 ? '✅' : '❌'} Validation errors: ${errors.join(', ')}`);
        }
      }
    } catch (e) {
      formResult.tests.push({
        name: 'Weak password',
        passed: false,
        error: e.message
      });
    }

  } catch (error) {
    console.log(`  ❌ Error testing form: ${error.message}`);
    formResult.error = error.message;
  } finally {
    await page.close();
  }

  results.formValidationIssues.push(formResult);
}

async function testForgotPasswordForm(browser) {
  console.log('\n📝 Testing /forgot-password form');
  const page = await browser.newPage();

  const formResult = {
    page: 'forgot-password',
    tests: []
  };

  try {
    await page.goto(`${BASE_URL}/forgot-password`, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    await delay(2000);
    await takeScreenshot(page, 'forgot-password-initial');

    // Test 1: Submit empty form
    console.log('  Test 1: Submit empty form');
    try {
      const submitButton = await page.$('button[type="submit"]');
      if (submitButton) {
        await submitButton.click();
        await delay(1000);

        const errors = await page.evaluate(() => {
          const errorElements = Array.from(document.querySelectorAll('[class*="error"], [role="alert"]'));
          return errorElements.map(el => el.innerText.trim());
        });

        formResult.tests.push({
          name: 'Empty form submission',
          passed: errors.length > 0,
          errors,
          screenshot: await takeScreenshot(page, 'forgot-password-empty-submit')
        });

        console.log(`    ${errors.length > 0 ? '✅' : '❌'} Validation errors: ${errors.join(', ')}`);
      }
    } catch (e) {
      formResult.tests.push({
        name: 'Empty form submission',
        passed: false,
        error: e.message
      });
    }

    // Test 2: Invalid email
    console.log('  Test 2: Invalid email format');
    try {
      await page.reload({ waitUntil: 'networkidle2' });
      await delay(1000);

      const emailInput = await page.$('input[type="email"], input[name*="email"]');
      if (emailInput) {
        await emailInput.type('notanemail');

        const submitButton = await page.$('button[type="submit"]');
        if (submitButton) {
          await submitButton.click();
          await delay(1000);

          const errors = await page.evaluate(() => {
            const errorElements = Array.from(document.querySelectorAll('[class*="error"], [role="alert"]'));
            return errorElements.map(el => el.innerText.trim());
          });

          formResult.tests.push({
            name: 'Invalid email format',
            passed: errors.some(e => e.toLowerCase().includes('email')),
            errors,
            screenshot: await takeScreenshot(page, 'forgot-password-invalid-email')
          });

          console.log(`    ${errors.length > 0 ? '✅' : '❌'} Validation errors: ${errors.join(', ')}`);
        }
      }
    } catch (e) {
      formResult.tests.push({
        name: 'Invalid email format',
        passed: false,
        error: e.message
      });
    }

  } catch (error) {
    console.log(`  ❌ Error testing form: ${error.message}`);
    formResult.error = error.message;
  } finally {
    await page.close();
  }

  results.formValidationIssues.push(formResult);
}

async function main() {
  console.log('🚀 Starting English UI Test for https://operate.guru\n');
  console.log('=' .repeat(60));

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    // Test main pages
    const loginPage = await testPage(browser, `${BASE_URL}/login`, 'login');
    await testPage(browser, `${BASE_URL}/register`, 'register');
    await testPage(browser, `${BASE_URL}/forgot-password`, 'forgot-password');
    await testPage(browser, `${BASE_URL}/`, 'homepage');

    // Test common routes that might exist
    await testPage(browser, `${BASE_URL}/about`, 'about');
    await testPage(browser, `${BASE_URL}/pricing`, 'pricing');
    await testPage(browser, `${BASE_URL}/contact`, 'contact');
    await testPage(browser, `${BASE_URL}/privacy`, 'privacy');
    await testPage(browser, `${BASE_URL}/terms`, 'terms');

    // Test all links from login page
    if (loginPage.clickableElements) {
      console.log('\n🔗 Testing all links from login page');
      for (const element of loginPage.clickableElements) {
        if (element.type === 'link' && element.href) {
          let fullHref = element.href;
          if (element.href.startsWith('/')) {
            fullHref = `${BASE_URL}${element.href}`;
          }
          if (element.href.startsWith('http')) {
            fullHref = element.href;
          }

          // Only test internal links
          if (fullHref.includes('operate.guru') || element.href.startsWith('/')) {
            await testLinkNavigation(browser, { ...element, href: fullHref }, 'login');
          }
        }
      }
    }

    // Test form validation
    await testRegisterForm(browser);
    await testForgotPasswordForm(browser);

    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Pages Tested: ${results.summary.totalPages}`);
    console.log(`Successful (200): ${results.summary.successfulPages}`);
    console.log(`Failed (4xx/5xx): ${results.summary.failedPages}`);
    console.log(`Total Links Tested: ${results.summary.totalLinks}`);
    console.log(`Broken Links: ${results.summary.brokenLinks}`);
    console.log(`Pages with Translation Keys: ${results.missingTranslations.length}`);

    if (results.brokenLinks.length > 0) {
      console.log('\n❌ BROKEN LINKS:');
      results.brokenLinks.forEach(link => {
        console.log(`  - "${link.text}" (${link.href}): ${link.status || link.error}`);
      });
    }

    if (results.missingTranslations.length > 0) {
      console.log('\n⚠️  MISSING TRANSLATIONS:');
      results.missingTranslations.forEach(item => {
        console.log(`  - ${item.page}: ${item.keys.join(', ')}`);
      });
    }

    // Save detailed report
    const reportPath = path.join(__dirname, 'english-ui-test-report.json');
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
