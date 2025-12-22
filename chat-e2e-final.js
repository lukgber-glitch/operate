const puppeteer = require('puppeteer');

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

(async () => {
  const browser = await puppeteer.launch({ headless: false, defaultViewport: null });
  const page = await browser.newPage();
  
  console.log('\nNavigating to chat...');
  await page.goto('http://localhost:3000/chat', { waitUntil: 'networkidle0', timeout: 30000 });
  await wait(3000);
  await page.screenshot({ path: 'test-screenshots/chat-01.png', fullPage: true });
  console.log('Screenshot 1: chat-01.png');
  
  console.log('\nLooking for input...');
  const input = await page.$('textarea');
  if (!input) {
    console.log('ERROR: No textarea found');
    await browser.close();
    return;
  }
  
  console.log('Found textarea, typing message...');
  await input.click();
  await wait(500);
  await input.type('Hello, what can you help me with?', { delay: 50 });
  await wait(1000);
  await page.screenshot({ path: 'test-screenshots/chat-02.png', fullPage: true });
  console.log('Screenshot 2: chat-02.png');
  
  console.log('\nSending message...');
  const btn = await page.$('button[type="submit"]');
  if (btn) {
    await btn.click();
    console.log('Clicked send button');
  } else {
    await input.press('Enter');
    console.log('Pressed Enter');
  }
  
  await wait(1000);
  await page.screenshot({ path: 'test-screenshots/chat-03.png', fullPage: true });
  console.log('Screenshot 3: chat-03.png');
  
  console.log('\nWaiting 10 seconds for response...');
  await wait(10000);
  await page.screenshot({ path: 'test-screenshots/chat-04.png', fullPage: true });
  console.log('Screenshot 4: chat-04.png');
  
  const msgs = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('[role="article"], .message')).map(e => e.textContent.trim().substring(0, 100));
  });
  
  console.log('\nMessages found:', msgs.length);
  msgs.forEach((m, i) => console.log(` ${i+1}. ${m}`));
  
  await browser.close();
})();
