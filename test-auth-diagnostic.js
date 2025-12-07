const puppeteer = require('puppeteer');

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function diagnosticTest() {
  console.log('Running diagnostic test on https://operate.guru...\n');

  const browser = await puppeteer.launch({
    headless: false, // Run with browser visible
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // Enable console logging
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  page.on('response', response => {
    if (response.status() >= 400) {
      console.log('HTTP ERROR:', response.status(), response.url());
    }
  });

  try {
    console.log('1. Testing root URL...');
    await page.goto('https://operate.guru', { waitUntil: 'networkidle0', timeout: 30000 });
    await sleep(3000);

    let info = await page.evaluate(() => ({
      url: window.location.href,
      title: document.title,
      bodyHTML: document.body.innerHTML.substring(0, 1000),
      bodyText: document.body.innerText.substring(0, 500),
      scripts: Array.from(document.querySelectorAll('script')).length,
      hasReact: !!document.querySelector('[data-reactroot], #__next, #root'),
      hasNextJS: !!document.querySelector('#__next')
    }));

    console.log('\nRoot URL Info:');
    console.log('  Final URL:', info.url);
    console.log('  Title:', info.title || '(empty)');
    console.log('  Body text:', info.bodyText || '(empty)');
    console.log('  Scripts:', info.scripts);
    console.log('  Has React/Next:', info.hasReact, '/', info.hasNextJS);
    console.log('  HTML Preview:', info.bodyHTML.substring(0, 200));

    // Test with German locale
    console.log('\n2. Testing /de/login...');
    await page.goto('https://operate.guru/de/login', { waitUntil: 'networkidle0', timeout: 30000 });
    await sleep(3000);

    info = await page.evaluate(() => ({
      url: window.location.href,
      title: document.title,
      bodyText: document.body.innerText.substring(0, 500),
      hasForm: !!document.querySelector('form'),
      inputCount: document.querySelectorAll('input').length,
      buttonCount: document.querySelectorAll('button').length,
      bodyHTML: document.body.innerHTML.substring(0, 1000)
    }));

    console.log('\n/de/login Info:');
    console.log('  Final URL:', info.url);
    console.log('  Title:', info.title || '(empty)');
    console.log('  Body text:', info.bodyText || '(empty)');
    console.log('  Has form:', info.hasForm);
    console.log('  Inputs:', info.inputCount);
    console.log('  Buttons:', info.buttonCount);
    console.log('  HTML Preview:', info.bodyHTML.substring(0, 300));

    // Test English locale
    console.log('\n3. Testing /en/login...');
    await page.goto('https://operate.guru/en/login', { waitUntil: 'networkidle0', timeout: 30000 });
    await sleep(3000);

    info = await page.evaluate(() => ({
      url: window.location.href,
      title: document.title,
      bodyText: document.body.innerText.substring(0, 500),
      hasForm: !!document.querySelector('form'),
      inputCount: document.querySelectorAll('input').length,
      buttonCount: document.querySelectorAll('button').length
    }));

    console.log('\n/en/login Info:');
    console.log('  Final URL:', info.url);
    console.log('  Title:', info.title || '(empty)');
    console.log('  Body text:', info.bodyText || '(empty)');
    console.log('  Has form:', info.hasForm);
    console.log('  Inputs:', info.inputCount);
    console.log('  Buttons:', info.buttonCount);

    // Wait to inspect manually
    console.log('\nBrowser will stay open for 30 seconds for manual inspection...');
    await sleep(30000);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
}

diagnosticTest().catch(console.error);
