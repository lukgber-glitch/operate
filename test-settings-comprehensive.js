const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  console.log('=== OPERATE SETTINGS TEST REPORT ===\n');
  console.log('Generated:', new Date().toISOString());
  console.log('App URL: https://operate.guru\n');

  const results = [];

  try {
    // Navigate to login page
    console.log('Navigating to login page...');
    await page.goto('https://operate.guru/login', { waitUntil: 'networkidle2', timeout: 30000 });
    await page.screenshot({ path: 'settings-test-01-login.png' });

    // Check if already logged in (redirect to dashboard)
    const currentUrl = page.url();
    console.log('Current URL after navigation:', currentUrl);

    if (currentUrl.includes('/dashboard') || currentUrl.includes('/chat')) {
      console.log('✓ Already logged in, redirected to:', currentUrl);
      results.push({
        section: 'Authentication',
        status: 'INFO',
        message: 'Already logged in - session active'
      });
    } else {
      console.log('Login page loaded, checking for login form...');

      // Look for login elements
      const pageContent = await page.content();
      const hasGoogleButton = pageContent.includes('Google') || pageContent.includes('google');
      const hasEmailInput = await page.$('input[type="email"]') !== null;

      console.log('Has Google OAuth button:', hasGoogleButton);
      console.log('Has email input:', hasEmailInput);

      results.push({
        section: 'Authentication',
        status: 'INFO',
        message: 'Not logged in - requires authentication'
      });
    }

    // Try to find settings/profile links in navigation
    console.log('\nLooking for settings/profile navigation...');

    // Check for common settings paths
    const settingsPaths = [
      '/settings',
      '/profile',
      '/account',
      '/settings/profile',
      '/settings/account',
      '/user/settings',
      '/dashboard/settings',
      '/settings/password',
      '/settings/security',
      '/settings/notifications',
      '/settings/organization',
      '/settings/integrations',
      '/settings/billing',
      '/settings/privacy'
    ];

    let settingsFound = false;
    let settingsUrl = '';

    for (const path of settingsPaths) {
      try {
        console.log(`\nTrying path: ${path}`);
        await page.goto('https://operate.guru' + path, { waitUntil: 'networkidle2', timeout: 10000 });
        const url = page.url();
        const title = await page.title();
        console.log('  - URL:', url);
        console.log('  - Title:', title);

        if (!url.includes('/login')) {
          console.log('  ✓ Settings page found!');
          settingsFound = true;
          settingsUrl = url;
          const screenshotPath = `settings-test-02-${path.replace(/\//g, '-')}.png`;
          await page.screenshot({ path: screenshotPath });

          results.push({
            section: 'Settings Navigation',
            url: path,
            status: 'PASS',
            message: `Settings page accessible at ${path}`
          });
          break;
        } else {
          results.push({
            section: 'Settings Navigation',
            url: path,
            status: 'REDIRECT',
            message: 'Redirects to login - authentication required'
          });
        }
      } catch (e) {
        console.log('  - Path not accessible:', e.message);
        results.push({
          section: 'Settings Navigation',
          url: path,
          status: 'FAIL',
          message: `Path not accessible: ${e.message}`
        });
      }
    }

    if (settingsFound) {
      // Get page content to analyze structure
      const bodyText = await page.evaluate(() => document.body.innerText);
      console.log('\nPage content preview (first 500 chars):');
      console.log(bodyText.substring(0, 500));

      // Look for settings-related text
      const settingsKeywords = ['Settings', 'Profile', 'Account', 'Password', 'Security', 'Notifications', 'Billing', 'Privacy', 'Organization', 'Integrations'];
      console.log('\nSettings keywords found on page:');
      settingsKeywords.forEach(keyword => {
        if (bodyText.includes(keyword)) {
          console.log('  ✓', keyword);
        }
      });

      // Try to find specific settings sections
      const sections = await page.evaluate(() => {
        const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4'));
        return headings.map(h => h.textContent.trim());
      });

      console.log('\nSection headings found:');
      sections.forEach(s => console.log('  -', s));

      // Look for forms
      const forms = await page.evaluate(() => {
        const allForms = Array.from(document.querySelectorAll('form'));
        return allForms.length;
      });
      console.log('\nForms found:', forms);

      // Look for input fields
      const inputs = await page.evaluate(() => {
        const allInputs = Array.from(document.querySelectorAll('input'));
        return allInputs.map(input => ({
          type: input.type,
          name: input.name,
          placeholder: input.placeholder,
          id: input.id
        }));
      });

      console.log('\nInput fields found:');
      inputs.forEach(input => {
        console.log('  -', input.type, input.name || input.id, input.placeholder);
      });

      // Look for buttons
      const buttons = await page.evaluate(() => {
        const allButtons = Array.from(document.querySelectorAll('button'));
        return allButtons.map(btn => btn.textContent.trim());
      });

      console.log('\nButtons found:');
      buttons.forEach(btn => console.log('  -', btn));
    }

    // Try to access dashboard/main page to look for settings menu
    console.log('\n\nChecking main dashboard for settings menu...');
    try {
      await page.goto('https://operate.guru/dashboard', { waitUntil: 'networkidle2', timeout: 10000 });
      const dashUrl = page.url();
      console.log('Dashboard URL:', dashUrl);

      if (!dashUrl.includes('/login')) {
        await page.screenshot({ path: 'settings-test-03-dashboard.png' });

        // Look for user menu / settings links
        const links = await page.evaluate(() => {
          const allLinks = Array.from(document.querySelectorAll('a'));
          return allLinks.map(link => ({
            text: link.textContent.trim(),
            href: link.href
          })).filter(link =>
            link.text.toLowerCase().includes('setting') ||
            link.text.toLowerCase().includes('profile') ||
            link.text.toLowerCase().includes('account') ||
            link.href.includes('setting') ||
            link.href.includes('profile') ||
            link.href.includes('account')
          );
        });

        console.log('\nSettings-related links found on dashboard:');
        links.forEach(link => {
          console.log(`  - ${link.text} -> ${link.href}`);
        });

        results.push({
          section: 'Dashboard Navigation',
          status: links.length > 0 ? 'PASS' : 'PARTIAL',
          message: `Found ${links.length} settings-related links`
        });
      }
    } catch (e) {
      console.log('Dashboard not accessible:', e.message);
    }

    // Summary
    console.log('\n\n=== TEST SUMMARY ===\n');
    results.forEach(result => {
      console.log(`[${result.status}] ${result.section}`);
      if (result.url) console.log(`  URL: ${result.url}`);
      console.log(`  ${result.message}`);
      console.log('');
    });

  } catch (error) {
    console.error('Error during settings test:', error.message);
    console.error(error.stack);
    await page.screenshot({ path: 'settings-test-error.png' });
  } finally {
    await browser.close();
  }
})();
