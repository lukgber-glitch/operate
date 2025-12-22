const puppeteer = require('puppeteer');
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

(async () => {
  const browser = await puppeteer.launch({ headless: false, defaultViewport: null });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle0', timeout: 30000 });
  await wait(3000);
  
  const links = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('a')).map(a => ({
      text: a.textContent.trim().substring(0, 50),
      href: a.href,
      ariaLabel: a.getAttribute('aria-label'),
      class: a.className.substring(0, 80)
    }));
  });
  
  console.log('All links on login page:');
  console.log(JSON.stringify(links, null, 2));
  
  await browser.close();
})();
