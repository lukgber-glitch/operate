// Simple test using Chrome DevTools Protocol
const CDP = require('chrome-remote-interface');

async function runTests() {
  let client;

  try {
    client = await CDP({ port: 9222 });
    const { Network, Page, Runtime, DOM } = client;

    await Network.enable();
    await Page.enable();
    await Runtime.enable();
    await DOM.enable();

    console.log('\n=== OPERATE CHAT & SETTINGS TEST REPORT ===\n');

    // Navigate to home page
    console.log('Navigating to https://operate.guru...');
    await Page.navigate({ url: 'https://operate.guru' });
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Check if logged in
    const loginCheck = await Runtime.evaluate({
      expression: `document.body.innerText.includes('Sign in') || document.body.innerText.includes('Log in')`
    });

    if (loginCheck.result.value) {
      console.log('❌ User is not logged in. Please log in first.');
      return;
    }

    console.log('✅ User appears to be logged in\n');

    // Test chat button on home page
    console.log('=== TESTING CHAT INTERFACE ===\n');
    const chatButton = await Runtime.evaluate({
      expression: `Array.from(document.querySelectorAll('button')).some(btn => btn.innerText.toLowerCase().includes('chat'))`
    });

    if (chatButton.result.value) {
      console.log('WORKING: Chat - Floating chat button found on homepage');
    } else {
      console.log('ISSUE: [P1] [Chat] No floating chat button found on homepage');
      console.log('- Expected: A visible chat button/widget on the main page');
      console.log('- Actual: No chat button visible');
    }

    // Navigate to /chat
    console.log('\nTesting /chat route...');
    await Page.navigate({ url: 'https://operate.guru/chat' });
    await new Promise(resolve => setTimeout(resolve, 3000));

    const is404 = await Runtime.evaluate({
      expression: `document.body.innerText.includes('404') || document.body.innerText.includes('Not Found')`
    });

    if (!is404.result.value) {
      console.log('WORKING: Chat - /chat route exists and loads');

      // Test chat elements
      const chatElements = await Runtime.evaluate({
        expression: `({
          messageInput: Array.from(document.querySelectorAll('input[type="text"], textarea')).some(input =>
            input.placeholder && (
              input.placeholder.toLowerCase().includes('message') ||
              input.placeholder.toLowerCase().includes('ask') ||
              input.placeholder.toLowerCase().includes('type')
            )
          ),
          sendButton: Array.from(document.querySelectorAll('button')).some(btn =>
            btn.innerText.toLowerCase().includes('send') ||
            (btn.querySelector('svg') && btn.type === 'submit')
          ),
          voiceButton: Array.from(document.querySelectorAll('button')).some(btn =>
            btn.getAttribute('aria-label')?.toLowerCase().includes('voice') ||
            btn.title?.toLowerCase().includes('voice')
          ),
          suggestionCards: document.querySelectorAll('[class*="suggestion"], [class*="card"]').length > 0
        })`
      });

      const elements = chatElements.result.value;

      if (elements.messageInput) {
        console.log('WORKING: Chat - Message input field found');
      } else {
        console.log('ISSUE: [P0] [Chat] Message input field not found');
      }

      if (elements.sendButton) {
        console.log('WORKING: Chat - Send button found');
      } else {
        console.log('ISSUE: [P0] [Chat] Send button not found');
      }

      if (elements.voiceButton) {
        console.log('WORKING: Chat - Voice input button found');
      } else {
        console.log('ISSUE: [P2] [Chat] Voice input button not found');
      }

      if (elements.suggestionCards) {
        console.log('WORKING: Chat - Suggestion cards found');
      } else {
        console.log('ISSUE: [P2] [Chat] No suggestion cards visible');
      }

    } else {
      console.log('ISSUE: [P0] [Chat] /chat route shows 404 or does not exist');
    }

    // Test Settings
    console.log('\n\n=== TESTING SETTINGS PAGES ===\n');
    await Page.navigate({ url: 'https://operate.guru/settings' });
    await new Promise(resolve => setTimeout(resolve, 3000));

    const settings404 = await Runtime.evaluate({
      expression: `document.body.innerText.includes('404') || document.body.innerText.includes('Not Found')`
    });

    if (!settings404.result.value) {
      console.log('WORKING: Settings - /settings route exists and loads');

      // Check for settings tabs
      const settingsTabs = await Runtime.evaluate({
        expression: `(() => {
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
        })()`
      });

      const tabs = settingsTabs.result.value;
      console.log(`Settings tabs found: ${tabs.join(', ')}`);

      if (tabs.includes('general')) {
        console.log('WORKING: Settings/General - Tab found');
      } else {
        console.log('ISSUE: [P1] [Settings] General settings tab not found');
      }

      if (tabs.includes('connections')) {
        console.log('WORKING: Settings/Connections - Tab found');
      } else {
        console.log('ISSUE: [P1] [Settings] Connections/Integrations tab not found');
      }

      if (tabs.includes('email')) {
        console.log('WORKING: Settings/Email - Tab found');
      } else {
        console.log('ISSUE: [P2] [Settings] Email settings tab not found');
      }

      if (tabs.includes('tax')) {
        console.log('WORKING: Settings/Tax - Tab found');
      } else {
        console.log('ISSUE: [P2] [Settings] Tax settings tab not found');
      }

      if (tabs.includes('export')) {
        console.log('WORKING: Settings/Export - Tab found');
      } else {
        console.log('ISSUE: [P3] [Settings] Export settings tab not found');
      }

      if (tabs.includes('notifications')) {
        console.log('WORKING: Settings/Notifications - Tab found');
      } else {
        console.log('ISSUE: [P3] [Settings] Notifications settings tab not found');
      }

      // Test language switcher
      const languageSwitcher = await Runtime.evaluate({
        expression: `Array.from(document.querySelectorAll('select')).some(s =>
          s.id?.toLowerCase().includes('lang') ||
          s.name?.toLowerCase().includes('lang') ||
          Array.from(s.options).some(opt => opt.value === 'en' || opt.value === 'de')
        )`
      });

      if (languageSwitcher.result.value) {
        console.log('WORKING: Settings - Language switcher found');
      } else {
        console.log('ISSUE: [P2] [Settings] Language switcher not found');
      }

      // Count interactive elements
      const interactiveElements = await Runtime.evaluate({
        expression: `({
          buttons: document.querySelectorAll('button').length,
          inputs: document.querySelectorAll('input').length,
          selects: document.querySelectorAll('select').length,
          textareas: document.querySelectorAll('textarea').length,
          toggles: document.querySelectorAll('[role="switch"], input[type="checkbox"]').length
        })`
      });

      const interactive = interactiveElements.result.value;
      console.log(`\nInteractive elements on settings page:`);
      console.log(`- Buttons: ${interactive.buttons}`);
      console.log(`- Inputs: ${interactive.inputs}`);
      console.log(`- Dropdowns: ${interactive.selects}`);
      console.log(`- Textareas: ${interactive.textareas}`);
      console.log(`- Toggles: ${interactive.toggles}`);

    } else {
      console.log('ISSUE: [P0] [Settings] /settings route shows 404 or does not exist');
    }

    console.log('\n=== TEST COMPLETE ===\n');

  } catch (error) {
    console.error('Error during testing:', error.message);
  } finally {
    if (client) {
      await client.close();
    }
  }
}

runTests().catch(console.error);
