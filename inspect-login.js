const puppeteer = require('puppeteer');

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

(async () => {
  const browser = await puppeteer.launch({ headless: false, defaultViewport: null });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle0', timeout: 30000 });
  await wait(3000);
  
  const info = await page.evaluate(() => {
    const googleElements = Array.from(document.querySelectorAll('*')).filter(el => 
      el.textContent.toLowerCase().includes('google') || 
      el.innerHTML.toLowerCase().includes('google') ||
      el.className.toLowerCase().includes('google')
    );
    
    return {
      googleText: googleElements.map(el => ({
        tag: el.tagName,
        text: el.textContent.trim().substring(0, 100),
        class: el.className,
        onclick: !!el.onclick
      })),
      allOAuthElements: Array.from(document.querySelectorAll('[class*="oauth"], [class*="provider"], [data-provider]')).map(el => ({
        tag: el.tagName,
        text: el.textContent.trim().substring(0, 100),
        class: el.className,
        dataProvider: el.getAttribute('data-provider')
      }))
    };
  });
  
  console.log(JSON.stringify(info, null, 2));
  
  await browser.close();
})();
