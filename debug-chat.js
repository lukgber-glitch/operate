const puppeteer = require('puppeteer');

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

(async () => {
  const browser = await puppeteer.launch({ headless: false, defaultViewport: null });
  const page = await browser.newPage();
  
  console.log('\nNavigating to chat...');
  await page.goto('http://localhost:3000/chat', { waitUntil: 'networkidle0', timeout: 30000 });
  await wait(3000);
  
  console.log('\nChecking page content...');
  const pageInfo = await page.evaluate(() => {
    return {
      title: document.title,
      url: window.location.href,
      bodyText: document.body.innerText.substring(0, 500),
      hasTextarea: !!document.querySelector('textarea'),
      hasInput: !!document.querySelector('input'),
      allInputs: Array.from(document.querySelectorAll('input, textarea')).map(e => ({
        tag: e.tagName,
        type: e.type,
        placeholder: e.placeholder,
        name: e.name,
        id: e.id
      })),
      forms: Array.from(document.querySelectorAll('form')).length
    };
  });
  
  console.log(JSON.stringify(pageInfo, null, 2));
  
  await page.screenshot({ path: 'test-screenshots/chat-debug.png', fullPage: true });
  console.log('\nScreenshot saved: chat-debug.png');
  
  await browser.close();
})();
