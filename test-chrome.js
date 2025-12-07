const CDP = require('chrome-remote-interface');

async function navigateAndScreenshot() {
  let client;
  try {
    // Connect to Chrome
    client = await CDP({ port: 9222 });

    const { Network, Page, Runtime, Emulation } = client;

    // Enable necessary domains
    await Network.enable();
    await Page.enable();
    await Runtime.enable();

    console.log('Navigating to https://operate.guru...');
    await Page.navigate({ url: 'https://operate.guru' });

    // Wait for page load
    await Page.loadEventFired();

    // Wait a bit more for rendering
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Get page info
    const { result } = await Runtime.evaluate({
      expression: 'document.title'
    });
    console.log('Page title:', result.value);

    // Take screenshot
    const screenshot = await Page.captureScreenshot({ format: 'png' });
    const fs = require('fs');
    fs.writeFileSync('C:\\Users\\grube\\op\\operate-fresh\\screenshot.png', Buffer.from(screenshot.data, 'base64'));
    console.log('Screenshot saved to screenshot.png');

    // Get console logs/errors
    const { result: consoleErrors } = await Runtime.evaluate({
      expression: `
        (function() {
          const errors = [];
          const originalError = console.error;
          console.error = function(...args) {
            errors.push(args.join(' '));
            originalError.apply(console, args);
          };
          return errors;
        })()
      `
    });

    console.log('Console errors:', consoleErrors);

  } catch (err) {
    console.error('Error:', err);
  } finally {
    if (client) {
      await client.close();
    }
  }
}

navigateAndScreenshot();
