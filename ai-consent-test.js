const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function testAIConsentFlow() {
  console.log('=== AI CONSENT FLOW TEST ===\n');
  
  const dir = path.join(__dirname, 'test-screenshots', 'ai-consent');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  
  const results = { steps: [], passed: 0, failed: 0 };
  
  const log = (step, desc, status, note) => {
    results.steps.push({ step, desc, status, note });
    if (status === 'PASS') results.passed++;
    if (status === 'FAIL') results.failed++;
    const icon = status === 'PASS' ? '✓' : '✗';
    console.log(`${icon} ${step}: ${desc} - ${status}`);
    if (note) console.log(`  ${note}`);
  };
  
  const browser = await puppeteer.launch({ headless: false, args: ['--start-maximized'] });
  const page = await browser.newPage();
  
  try {
    console.log('Step 1: Navigate to login...');
    await page.goto('https://operate.guru/login', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await delay(2000);
    await page.screenshot({ path: path.join(dir, '01-login.png'), fullPage: true });
    log(1, 'Navigate to login', 'PASS');
    
    console.log('Step 2: Wait for Google OAuth button...');
    const btn = await page.waitForSelector('button[name="provider"][value="google"]', { timeout: 10000 });
    if (btn) {
      log(2, 'Found Google OAuth button', 'PASS');
      console.log('Step 3: Click Google OAuth...');
      await btn.click();
      await delay(3000);
      log(3, 'Click Google OAuth', 'PASS');
    } else {
      log(2, 'Find Google OAuth button', 'FAIL', 'Button not found');
    }
    
    console.log('Step 4: Check current URL...');
    const url = page.url();
    console.log('  Current URL:', url);
    
    if (url.includes('accounts.google.com')) {
      console.log('Step 5: On Google login page, entering credentials...');
      await page.waitForSelector('input[type="email"]', { timeout: 10000 });
      await page.type('input[type="email"]', 'luk.gber@gmail.com', { delay: 50 });
      await page.keyboard.press('Enter');
      await delay(3000);
      
      await page.waitForSelector('input[type="password"]', { timeout: 10000 });
      await page.type('input[type="password"]', 'schlagzeug', { delay: 50 });
      await page.keyboard.press('Enter');
      await delay(7000);
      log(4, 'Complete Google OAuth', 'PASS');
    } else {
      log(4, 'Already authenticated', 'PASS');
    }
    
    console.log('Step 6: Navigate to chat...');
    await page.goto('https://operate.guru/chat', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await delay(2000);
    await page.screenshot({ path: path.join(dir, '02-chat.png'), fullPage: true });
    log(5, 'Navigate to chat', 'PASS');
    
    console.log('Step 7: Check for consent dialog...');
    const html = await page.content();
    const hasAccept = html.includes('Accept');
    const hasDecline = html.includes('Decline');
    const hasConsent = html.toLowerCase().includes('consent');
    
    console.log(`  Has "Accept": ${hasAccept}`);
    console.log(`  Has "Decline": ${hasDecline}`);
    console.log(`  Has "consent": ${hasConsent}`);
    
    if (hasAccept && hasDecline) {
      log(6, 'AI Consent Dialog found', 'PASS', 'Dialog contains Accept and Decline buttons');
      await page.screenshot({ path: path.join(dir, '03-dialog-found.png'), fullPage: true });
      
      console.log('Step 8: Click Accept button...');
      await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const accept = btns.find(b => b.textContent.includes('Accept'));
        if (accept) {
          console.log('Clicking accept button');
          accept.click();
        }
      });
      await delay(2000);
      await page.screenshot({ path: path.join(dir, '04-after-accept.png'), fullPage: true });
      log(7, 'Click Accept button', 'PASS');
      
      console.log('Step 9: Check chat input...');
      const inputStatus = await page.evaluate(() => {
        const textarea = document.querySelector('textarea');
        const input = document.querySelector('input[type="text"]');
        const el = textarea || input;
        
        if (el) {
          return {
            found: true,
            disabled: el.disabled || false,
            readonly: el.readOnly || false,
            placeholder: el.placeholder || ''
          };
        }
        return { found: false };
      });
      
      console.log('  Input status:', JSON.stringify(inputStatus));
      
      if (inputStatus.found && !inputStatus.disabled && !inputStatus.readonly) {
        log(8, 'Chat input enabled', 'PASS', 'Input is enabled and ready for typing');
        
        console.log('Step 10: Type test message...');
        await page.click('textarea, input[type="text"]');
        await page.type('textarea, input[type="text"]', 'Test message for verification', { delay: 30 });
        await delay(1000);
        await page.screenshot({ path: path.join(dir, '05-typing.png'), fullPage: true });
        log(9, 'Type in chat input', 'PASS');
      } else {
        log(8, 'Chat input enabled', 'FAIL', JSON.stringify(inputStatus));
      }
    } else {
      log(6, 'AI Consent Dialog found', 'FAIL', `Accept: ${hasAccept}, Decline: ${hasDecline}`);
      
      console.log('Checking if chat is directly accessible...');
      const directInput = await page.evaluate(() => {
        const textarea = document.querySelector('textarea');
        const input = document.querySelector('input[type="text"]');
        return !!(textarea || input);
      });
      
      if (directInput) {
        log(7, 'Direct chat access', 'INFO', 'Chat input accessible without dialog - consent may have been previously given');
      }
    }
    
    await page.screenshot({ path: path.join(dir, '06-final.png'), fullPage: true });
    
  } catch (err) {
    console.error('\nError:', err.message);
    results.error = err.message;
    try {
      await page.screenshot({ path: path.join(dir, 'error.png'), fullPage: true });
    } catch (e) {}
  } finally {
    await browser.close();
  }
  
  const outputPath = path.join(__dirname, 'AI_CONSENT_TEST_RESULTS.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  
  console.log('\n' + '='.repeat(60));
  console.log('TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`Passed: ${results.passed}`);
  console.log(`Failed: ${results.failed}`);
  console.log(`Total: ${results.steps.length}`);
  console.log('\nResults saved to:', outputPath);
  console.log('Screenshots saved to:', dir);
  console.log('='.repeat(60));
}

testAIConsentFlow();
