const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const results = [];
  const locales = ['en', 'de', 'es', 'fr', 'it', 'nl', 'sv', 'ja', 'ar', 'hi'];

  console.log('Testing i18n for all supported languages...\n');

  for (const locale of locales) {
    console.log(`Testing ${locale}...`);
    const page = await browser.newPage();

    try {
      // Set locale cookie before navigating
      await page.setCookie({
        name: 'NEXT_LOCALE',
        value: locale,
        domain: 'operate.guru',
        path: '/'
      });

      // Navigate to login page
      await page.goto('https://operate.guru/login', {
        waitUntil: 'networkidle2',
        timeout: 30000
      });

      // Wait for content
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Get page direction and language
      const pageInfo = await page.evaluate(() => {
        return {
          dir: document.documentElement.dir,
          lang: document.documentElement.lang,
          title: document.title
        };
      });

      // Get button text samples
      const buttonTexts = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        return buttons.slice(0, 5).map(b => b.innerText.trim()).filter(t => t);
      });

      // Get heading text
      const headings = await page.evaluate(() => {
        const h1 = document.querySelector('h1');
        const h2 = document.querySelector('h2');
        return {
          h1: h1 ? h1.innerText : '',
          h2: h2 ? h2.innerText : ''
        };
      });

      // Get form labels
      const formLabels = await page.evaluate(() => {
        const labels = Array.from(document.querySelectorAll('label'));
        return labels.map(l => l.innerText.trim()).filter(t => t);
      });

      // Check for untranslated keys (e.g., "auth.login", "common.save")
      const hasTranslationKeys = await page.evaluate(() => {
        const bodyText = document.body.innerText;
        const keyPattern = /\b(auth|common|nav|dashboard|settings|validation|errors)\.[a-zA-Z]+\b/;
        return keyPattern.test(bodyText);
      });

      // Check for English text in non-English locales
      const sampleText = await page.evaluate(() => {
        return document.body.innerText.substring(0, 1000);
      });

      results.push({
        locale,
        success: true,
        pageInfo,
        buttonTexts,
        headings,
        formLabels: formLabels.slice(0, 5),
        hasTranslationKeys,
        sampleText: sampleText.substring(0, 200)
      });

    } catch (error) {
      results.push({
        locale,
        success: false,
        error: error.message
      });
    }

    await page.close();
  }

  await browser.close();

  // Generate report
  console.log('\n=== I18N TEST RESULTS ===\n');

  for (const result of results) {
    if (result.success) {
      console.log(`\nLANGUAGE: ${result.locale}`);
      console.log(`Direction: ${result.pageInfo.dir}`);
      console.log(`Lang attr: ${result.pageInfo.lang}`);
      console.log(`Title: ${result.pageInfo.title}`);
      console.log(`Headings: ${result.headings.h1}, ${result.headings.h2}`);
      console.log(`Sample buttons: ${result.buttonTexts.join(', ')}`);
      console.log(`Sample labels: ${result.formLabels.join(', ')}`);
      console.log(`Has translation keys: ${result.hasTranslationKeys ? 'YES (PROBLEM!)' : 'No'}`);
      console.log(`Sample text: ${result.sampleText.substring(0, 100)}...`);
    } else {
      console.log(`\nLANGUAGE: ${result.locale} - FAILED`);
      console.log(`Error: ${result.error}`);
    }
  }

  // Save detailed results
  fs.writeFileSync('i18n-test-results.json', JSON.stringify(results, null, 2));
  console.log('\n\nDetailed results saved to i18n-test-results.json');
})();
