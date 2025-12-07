const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const screenshotDir = path.join(__dirname, 'test-screenshots');
if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

let screenshotCounter = 0;

async function takeScreenshot(page, name) {
  screenshotCounter++;
  const filename = `${screenshotCounter.toString().padStart(3, '0')}-${name}.png`;
  await page.screenshot({ path: path.join(screenshotDir, filename), fullPage: true });
  console.log(`Screenshot saved: ${filename}`);
  return filename;
}

async function waitForSelector(page, selector, timeout = 5000) {
  try {
    await page.waitForSelector(selector, { timeout });
    return true;
  } catch (e) {
    return false;
  }
}

async function runTests() {
  const browser = await puppeteer.connect({
    browserURL: 'http://localhost:9222',
    defaultViewport: { width: 1920, height: 1080 }
  });

  const page = await browser.newPage();

  console.log('\n=== OPERATE CHAT & SETTINGS TEST REPORT ===\n');

  try {
    // Navigate to the app
    console.log('Navigating to https://operate.guru...');
    await page.goto('https://operate.guru', { waitUntil: 'networkidle2', timeout: 30000 });
    await page.waitForTimeout(2000);
    await takeScreenshot(page, 'home-page');

    // Check if user is logged in
    const isLoginPage = await page.evaluate(() => {
      return document.body.innerText.includes('Sign in') ||
             document.body.innerText.includes('Log in') ||
             document.querySelector('input[type="email"]') !== null;
    });

    if (isLoginPage) {
      console.log('❌ User is not logged in. Please log in first.');
      return;
    }

    console.log('✅ User appears to be logged in\n');

    // === CHAT INTERFACE TESTS ===
    console.log('\n=== TESTING CHAT INTERFACE ===\n');

    // Check for floating chat button
    let chatButtonFound = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.some(btn =>
        btn.innerText.toLowerCase().includes('chat') ||
        btn.querySelector('svg') && btn.className.includes('chat')
      );
    });

    if (chatButtonFound) {
      console.log('WORKING: Chat - Floating chat button found on homepage');
      await takeScreenshot(page, 'chat-button-found');
    } else {
      console.log('ISSUE: [P1] [Chat] No floating chat button found on homepage');
      console.log('- Expected: A visible chat button/widget on the main page');
      console.log('- Actual: No chat button visible');
    }

    // Try navigating to /chat route
    console.log('\nTrying /chat route...');
    await page.goto('https://operate.guru/chat', { waitUntil: 'networkidle2', timeout: 30000 });
    await page.waitForTimeout(2000);
    await takeScreenshot(page, 'chat-route');

    const chatPageExists = await page.evaluate(() => {
      return !document.body.innerText.includes('404') &&
             !document.body.innerText.includes('Not Found');
    });

    if (chatPageExists) {
      console.log('WORKING: Chat - /chat route exists and loads');

      // Test chat interface elements
      const chatElements = await page.evaluate(() => {
        const results = {
          messageInput: null,
          sendButton: null,
          voiceButton: null,
          suggestionCards: null,
          messageHistory: null
        };

        // Look for message input
        const inputs = Array.from(document.querySelectorAll('input[type="text"], textarea'));
        results.messageInput = inputs.some(input =>
          input.placeholder && (
            input.placeholder.toLowerCase().includes('message') ||
            input.placeholder.toLowerCase().includes('ask') ||
            input.placeholder.toLowerCase().includes('type')
          )
        );

        // Look for send button
        const buttons = Array.from(document.querySelectorAll('button'));
        results.sendButton = buttons.some(btn =>
          btn.innerText.toLowerCase().includes('send') ||
          btn.querySelector('svg') && btn.type === 'submit'
        );

        // Look for voice button
        results.voiceButton = buttons.some(btn =>
          btn.getAttribute('aria-label')?.toLowerCase().includes('voice') ||
          btn.title?.toLowerCase().includes('voice') ||
          btn.innerText.toLowerCase().includes('voice')
        );

        // Look for suggestion cards
        results.suggestionCards = document.querySelectorAll('[class*="suggestion"], [class*="card"]').length > 0;

        // Look for message history/container
        results.messageHistory = document.querySelectorAll('[class*="message"], [class*="chat"]').length > 0;

        return results;
      });

      if (chatElements.messageInput) {
        console.log('WORKING: Chat - Message input field found');
      } else {
        console.log('ISSUE: [P0] [Chat] Message input field not found');
        console.log('- Expected: Text input or textarea for typing messages');
        console.log('- Actual: No message input field visible');
      }

      if (chatElements.sendButton) {
        console.log('WORKING: Chat - Send button found');
      } else {
        console.log('ISSUE: [P0] [Chat] Send button not found');
        console.log('- Expected: Button to send messages');
        console.log('- Actual: No send button visible');
      }

      if (chatElements.voiceButton) {
        console.log('WORKING: Chat - Voice input button found');
      } else {
        console.log('ISSUE: [P2] [Chat] Voice input button not found');
        console.log('- Expected: Button for voice input');
        console.log('- Actual: No voice button visible');
      }

      if (chatElements.suggestionCards) {
        console.log('WORKING: Chat - Suggestion cards found');
      } else {
        console.log('ISSUE: [P2] [Chat] No suggestion cards visible');
        console.log('- Expected: Cards with suggested actions/questions');
        console.log('- Actual: No suggestion cards visible');
      }

      // Test sending a message
      if (chatElements.messageInput && chatElements.sendButton) {
        console.log('\nTesting message sending...');
        try {
          await page.type('input[type="text"], textarea', 'Hello, this is a test message');
          await page.waitForTimeout(500);
          await takeScreenshot(page, 'chat-message-typed');

          await page.click('button[type="submit"]');
          await page.waitForTimeout(2000);
          await takeScreenshot(page, 'chat-message-sent');

          const messageAppeared = await page.evaluate(() => {
            return document.body.innerText.includes('Hello, this is a test message');
          });

          if (messageAppeared) {
            console.log('WORKING: Chat - Message sending works');
          } else {
            console.log('ISSUE: [P0] [Chat] Message not appearing after send');
            console.log('- Steps: Type message and click send');
            console.log('- Expected: Message appears in chat history');
            console.log('- Actual: Message not visible after sending');
          }
        } catch (e) {
          console.log(`ISSUE: [P0] [Chat] Error sending message: ${e.message}`);
        }
      }

    } else {
      console.log('ISSUE: [P0] [Chat] /chat route shows 404 or does not exist');
      console.log('- Expected: Chat interface at /chat');
      console.log('- Actual: 404 or page not found');
    }

    // === SETTINGS TESTS ===
    console.log('\n\n=== TESTING SETTINGS PAGES ===\n');

    // Navigate to settings
    await page.goto('https://operate.guru/settings', { waitUntil: 'networkidle2', timeout: 30000 });
    await page.waitForTimeout(2000);
    await takeScreenshot(page, 'settings-page');

    const settingsExists = await page.evaluate(() => {
      return !document.body.innerText.includes('404') &&
             !document.body.innerText.includes('Not Found');
    });

    if (settingsExists) {
      console.log('WORKING: Settings - /settings route exists and loads');

      // Check for settings navigation/tabs
      const settingsTabs = await page.evaluate(() => {
        const tabs = [];
        const links = Array.from(document.querySelectorAll('a, button, [role="tab"]'));

        links.forEach(link => {
          const text = link.innerText.toLowerCase();
          if (text.includes('general')) tabs.push('general');
          if (text.includes('connection') || text.includes('integration')) tabs.push('connections');
          if (text.includes('email')) tabs.push('email');
          if (text.includes('tax')) tabs.push('tax');
          if (text.includes('export')) tabs.push('export');
          if (text.includes('notification')) tabs.push('notifications');
        });

        return [...new Set(tabs)];
      });

      console.log(`Settings tabs found: ${settingsTabs.join(', ')}`);

      // Test General Settings
      if (settingsTabs.includes('general')) {
        console.log('\n--- Testing General Settings ---');
        await page.evaluate(() => {
          const links = Array.from(document.querySelectorAll('a, button'));
          const generalLink = links.find(link => link.innerText.toLowerCase().includes('general'));
          if (generalLink) generalLink.click();
        });
        await page.waitForTimeout(1500);
        await takeScreenshot(page, 'settings-general');

        const generalInputs = await page.evaluate(() => {
          const inputs = document.querySelectorAll('input, select, textarea');
          return inputs.length;
        });

        console.log(`WORKING: Settings/General - Found ${generalInputs} input fields`);
      } else {
        console.log('ISSUE: [P1] [Settings] General settings tab not found');
      }

      // Test Connections/Integrations
      if (settingsTabs.includes('connections')) {
        console.log('\n--- Testing Connections/Integrations ---');
        await page.evaluate(() => {
          const links = Array.from(document.querySelectorAll('a, button'));
          const connLink = links.find(link =>
            link.innerText.toLowerCase().includes('connection') ||
            link.innerText.toLowerCase().includes('integration')
          );
          if (connLink) connLink.click();
        });
        await page.waitForTimeout(1500);
        await takeScreenshot(page, 'settings-connections');

        const integrations = await page.evaluate(() => {
          const text = document.body.innerText.toLowerCase();
          return {
            stripe: text.includes('stripe'),
            plaid: text.includes('plaid'),
            tink: text.includes('tink'),
            truelayer: text.includes('truelayer') || text.includes('true layer'),
            google: text.includes('google')
          };
        });

        console.log('WORKING: Settings/Connections - Page accessible');
        console.log(`Integrations visible: ${Object.entries(integrations).filter(([k,v]) => v).map(([k]) => k).join(', ')}`);
      } else {
        console.log('ISSUE: [P1] [Settings] Connections/Integrations tab not found');
      }

      // Test Email Settings
      if (settingsTabs.includes('email')) {
        console.log('\n--- Testing Email Settings ---');
        await page.evaluate(() => {
          const links = Array.from(document.querySelectorAll('a, button'));
          const emailLink = links.find(link => link.innerText.toLowerCase().includes('email'));
          if (emailLink) emailLink.click();
        });
        await page.waitForTimeout(1500);
        await takeScreenshot(page, 'settings-email');
        console.log('WORKING: Settings/Email - Page accessible');
      } else {
        console.log('ISSUE: [P2] [Settings] Email settings tab not found');
      }

      // Test Tax Settings
      if (settingsTabs.includes('tax')) {
        console.log('\n--- Testing Tax Settings ---');
        await page.evaluate(() => {
          const links = Array.from(document.querySelectorAll('a, button'));
          const taxLink = links.find(link => link.innerText.toLowerCase().includes('tax'));
          if (taxLink) taxLink.click();
        });
        await page.waitForTimeout(1500);
        await takeScreenshot(page, 'settings-tax');
        console.log('WORKING: Settings/Tax - Page accessible');
      } else {
        console.log('ISSUE: [P2] [Settings] Tax settings tab not found');
      }

      // Test Export Settings
      if (settingsTabs.includes('export')) {
        console.log('\n--- Testing Export Settings ---');
        await page.evaluate(() => {
          const links = Array.from(document.querySelectorAll('a, button'));
          const exportLink = links.find(link => link.innerText.toLowerCase().includes('export'));
          if (exportLink) exportLink.click();
        });
        await page.waitForTimeout(1500);
        await takeScreenshot(page, 'settings-export');
        console.log('WORKING: Settings/Export - Page accessible');
      } else {
        console.log('ISSUE: [P3] [Settings] Export settings tab not found');
      }

      // Test Notifications
      if (settingsTabs.includes('notifications')) {
        console.log('\n--- Testing Notifications Settings ---');
        await page.evaluate(() => {
          const links = Array.from(document.querySelectorAll('a, button'));
          const notifLink = links.find(link => link.innerText.toLowerCase().includes('notification'));
          if (notifLink) notifLink.click();
        });
        await page.waitForTimeout(1500);
        await takeScreenshot(page, 'settings-notifications');
        console.log('WORKING: Settings/Notifications - Page accessible');
      } else {
        console.log('ISSUE: [P3] [Settings] Notifications settings tab not found');
      }

      // Test language switching
      console.log('\n--- Testing Language Switching ---');
      const languageSwitcher = await page.evaluate(() => {
        const selects = Array.from(document.querySelectorAll('select'));
        const langSelect = selects.find(s =>
          s.id?.toLowerCase().includes('lang') ||
          s.name?.toLowerCase().includes('lang') ||
          Array.from(s.options).some(opt => opt.value === 'en' || opt.value === 'de')
        );
        return langSelect !== undefined;
      });

      if (languageSwitcher) {
        console.log('WORKING: Settings - Language switcher found');
        await takeScreenshot(page, 'language-switcher');
      } else {
        console.log('ISSUE: [P2] [Settings] Language switcher not found');
        console.log('- Expected: Dropdown or toggle for language selection');
        console.log('- Actual: No language switcher visible');
      }

    } else {
      console.log('ISSUE: [P0] [Settings] /settings route shows 404 or does not exist');
      console.log('- Expected: Settings page at /settings');
      console.log('- Actual: 404 or page not found');
    }

    // Test all interactive elements
    console.log('\n--- Testing All Interactive Elements ---');
    const interactiveElements = await page.evaluate(() => {
      const buttons = document.querySelectorAll('button');
      const inputs = document.querySelectorAll('input');
      const selects = document.querySelectorAll('select');
      const textareas = document.querySelectorAll('textarea');
      const toggles = document.querySelectorAll('[role="switch"], input[type="checkbox"]');

      return {
        buttons: buttons.length,
        inputs: inputs.length,
        selects: selects.length,
        textareas: textareas.length,
        toggles: toggles.length
      };
    });

    console.log(`\nInteractive elements on current page:`);
    console.log(`- Buttons: ${interactiveElements.buttons}`);
    console.log(`- Inputs: ${interactiveElements.inputs}`);
    console.log(`- Dropdowns: ${interactiveElements.selects}`);
    console.log(`- Textareas: ${interactiveElements.textareas}`);
    console.log(`- Toggles: ${interactiveElements.toggles}`);

    console.log('\n=== TEST SUMMARY ===');
    console.log(`Screenshots saved to: ${screenshotDir}`);
    console.log('Total screenshots taken:', screenshotCounter);

  } catch (error) {
    console.error('Error during testing:', error);
    await takeScreenshot(page, 'error-state');
  }

  await browser.disconnect();
  console.log('\nTesting complete!');
}

runTests().catch(console.error);
