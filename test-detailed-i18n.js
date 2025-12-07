const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  console.log('=== DETAILED I18N ANALYSIS ===\n');

  // Test with URL-based locale switching (if supported)
  const testCases = [
    { name: 'English (default)', url: 'https://operate.guru/login' },
    { name: 'German (cookie)', url: 'https://operate.guru/login', cookie: 'de' },
    { name: 'German (URL)', url: 'https://operate.guru/de/login' },
    { name: 'Arabic (cookie)', url: 'https://operate.guru/login', cookie: 'ar' },
    { name: 'Arabic (URL)', url: 'https://operate.guru/ar/login' },
    { name: 'Spanish (cookie)', url: 'https://operate.guru/login', cookie: 'es' },
  ];

  for (const test of testCases) {
    const page = await browser.newPage();

    try {
      console.log(`\n--- ${test.name} ---`);

      if (test.cookie) {
        await page.setCookie({
          name: 'NEXT_LOCALE',
          value: test.cookie,
          domain: 'operate.guru',
          path: '/'
        });
      }

      const response = await page.goto(test.url, {
        waitUntil: 'networkidle2',
        timeout: 30000
      });

      await new Promise(resolve => setTimeout(resolve, 1000));

      const pageData = await page.evaluate(() => {
        return {
          url: window.location.href,
          htmlDir: document.documentElement.dir,
          htmlLang: document.documentElement.lang,
          title: document.title,
          h1Text: document.querySelector('h1')?.innerText || 'NO H1',
          h2Text: document.querySelector('h2')?.innerText || 'NO H2',
          firstButton: document.querySelector('button')?.innerText.trim() || 'NO BUTTON',
          hasRTLClass: document.body.classList.contains('rtl'),
          bodyDirection: window.getComputedStyle(document.body).direction,
        };
      });

      console.log(`URL: ${pageData.url}`);
      console.log(`Status: ${response.status()}`);
      console.log(`HTML dir: "${pageData.htmlDir}"`);
      console.log(`HTML lang: "${pageData.htmlLang}"`);
      console.log(`Body direction: ${pageData.bodyDirection}`);
      console.log(`Has RTL class: ${pageData.hasRTLClass}`);
      console.log(`Title: ${pageData.title}`);
      console.log(`H1: ${pageData.h1Text}`);
      console.log(`H2: ${pageData.h2Text}`);
      console.log(`First button: ${pageData.firstButton}`);

    } catch (error) {
      console.log(`Error: ${error.message}`);
    }

    await page.close();
  }

  await browser.close();
  console.log('\n=== TEST COMPLETE ===');
})();
