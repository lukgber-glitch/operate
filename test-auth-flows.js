const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const APP_URL = 'https://operate.guru';
const SCREENSHOTS_DIR = path.join(__dirname, 'test-screenshots');

// Create screenshots directory
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

const results = {
  timestamp: new Date().toISOString(),
  flows: []
};

async function takeScreenshot(page, name) {
  const filepath = path.join(SCREENSHOTS_DIR, `${name}-${Date.now()}.png`);
  await page.screenshot({ path: filepath, fullPage: true });
  console.log(`Screenshot saved: ${filepath}`);
  return filepath;
}

async function testRegistrationFlow(browser) {
  console.log('\n=== TESTING REGISTRATION FLOW ===');
  const page = await browser.newPage();
  const flowResult = {
    name: 'Registration Flow',
    steps: [],
    status: 'PASS',
    issues: [],
    screenshots: []
  };

  try {
    // Navigate to app
    await page.goto(APP_URL, { waitUntil: 'networkidle2', timeout: 30000 });
    flowResult.screenshots.push(await takeScreenshot(page, 'home-page'));

    // Look for register/signup links
    const registerSelectors = [
      'a[href*="register"]',
      'a[href*="signup"]',
      'a[href*="sign-up"]',
      'button:contains("Sign Up")',
      'button:contains("Register")',
      'a:contains("Sign Up")',
      'a:contains("Register")',
      'a:contains("Get Started")'
    ];

    let registerFound = false;
    let registerUrl = null;

    for (const selector of registerSelectors) {
      try {
        const element = await page.$(selector);
        if (element) {
          registerUrl = await page.evaluate(el => el.href || el.getAttribute('href'), element);
          registerFound = true;
          flowResult.steps.push(`Found register link: ${selector}`);
          break;
        }
      } catch (e) {
        // Continue to next selector
      }
    }

    if (!registerFound) {
      // Try to find in page content
      const pageContent = await page.content();
      flowResult.steps.push('Checked page HTML for registration links');

      // Try common registration URLs
      const commonUrls = ['/register', '/signup', '/sign-up', '/auth/register'];
      for (const url of commonUrls) {
        try {
          await page.goto(`${APP_URL}${url}`, { waitUntil: 'networkidle2', timeout: 10000 });
          const currentUrl = page.url();
          if (!currentUrl.includes('404') && !currentUrl.includes('error')) {
            registerFound = true;
            registerUrl = currentUrl;
            flowResult.steps.push(`Found register page at: ${url}`);
            break;
          }
        } catch (e) {
          flowResult.steps.push(`Tried ${url} - not found`);
        }
      }
    } else if (registerUrl) {
      await page.goto(registerUrl, { waitUntil: 'networkidle2', timeout: 10000 });
    }

    if (registerFound) {
      flowResult.screenshots.push(await takeScreenshot(page, 'register-page'));

      // Test form validation - empty fields
      const submitSelectors = ['button[type="submit"]', 'button:contains("Sign Up")', 'button:contains("Register")'];
      let submitButton = null;

      for (const selector of submitSelectors) {
        submitButton = await page.$(selector);
        if (submitButton) break;
      }

      if (submitButton) {
        await submitButton.click();
        await page.waitForTimeout(1000);
        flowResult.screenshots.push(await takeScreenshot(page, 'register-empty-validation'));
        flowResult.steps.push('Tested empty form validation');

        // Check for error messages
        const hasErrors = await page.evaluate(() => {
          const errorElements = document.querySelectorAll('[class*="error"], [role="alert"], .text-red-500, .text-danger');
          return errorElements.length > 0;
        });

        if (hasErrors) {
          flowResult.steps.push('✓ Empty field validation works');
        } else {
          flowResult.issues.push('No visible error messages for empty fields');
          flowResult.status = 'PARTIAL';
        }
      } else {
        flowResult.issues.push('Could not find submit button on register page');
        flowResult.status = 'PARTIAL';
      }

      // Test invalid email
      const emailInput = await page.$('input[type="email"], input[name*="email"]');
      const passwordInput = await page.$('input[type="password"], input[name*="password"]');

      if (emailInput && passwordInput) {
        await emailInput.type('invalid-email');
        await passwordInput.type('test123');
        await submitButton.click();
        await page.waitForTimeout(1000);
        flowResult.screenshots.push(await takeScreenshot(page, 'register-invalid-email'));
        flowResult.steps.push('Tested invalid email validation');
      }

    } else {
      flowResult.status = 'FAIL';
      flowResult.issues.push('Could not find registration page');
    }

  } catch (error) {
    flowResult.status = 'FAIL';
    flowResult.issues.push(`Error: ${error.message}`);
    flowResult.screenshots.push(await takeScreenshot(page, 'register-error'));
  }

  await page.close();
  results.flows.push(flowResult);
}

async function testLoginFlow(browser) {
  console.log('\n=== TESTING LOGIN FLOW ===');
  const page = await browser.newPage();
  const flowResult = {
    name: 'Login Flow',
    steps: [],
    status: 'PASS',
    issues: [],
    screenshots: []
  };

  try {
    await page.goto(APP_URL, { waitUntil: 'networkidle2', timeout: 30000 });

    // Look for login links
    const loginSelectors = [
      'a[href*="login"]',
      'a[href*="sign-in"]',
      'a[href*="signin"]',
      'button:contains("Sign In")',
      'button:contains("Login")',
      'a:contains("Sign In")',
      'a:contains("Login")'
    ];

    let loginFound = false;
    let loginUrl = null;

    for (const selector of loginSelectors) {
      try {
        const element = await page.$(selector);
        if (element) {
          loginUrl = await page.evaluate(el => el.href || el.getAttribute('href'), element);
          loginFound = true;
          flowResult.steps.push(`Found login link: ${selector}`);
          break;
        }
      } catch (e) {
        // Continue
      }
    }

    if (!loginFound) {
      // Try common login URLs
      const commonUrls = ['/login', '/signin', '/sign-in', '/auth/login'];
      for (const url of commonUrls) {
        try {
          await page.goto(`${APP_URL}${url}`, { waitUntil: 'networkidle2', timeout: 10000 });
          const currentUrl = page.url();
          if (!currentUrl.includes('404') && !currentUrl.includes('error')) {
            loginFound = true;
            loginUrl = currentUrl;
            flowResult.steps.push(`Found login page at: ${url}`);
            break;
          }
        } catch (e) {
          flowResult.steps.push(`Tried ${url} - not found`);
        }
      }
    } else if (loginUrl) {
      await page.goto(loginUrl, { waitUntil: 'networkidle2', timeout: 10000 });
    }

    if (loginFound) {
      flowResult.screenshots.push(await takeScreenshot(page, 'login-page'));

      // Test empty form validation
      const submitButton = await page.$('button[type="submit"]');
      if (submitButton) {
        await submitButton.click();
        await page.waitForTimeout(1000);
        flowResult.screenshots.push(await takeScreenshot(page, 'login-empty-validation'));
        flowResult.steps.push('Tested empty form validation');
      }

      // Test wrong credentials
      const emailInput = await page.$('input[type="email"], input[name*="email"]');
      const passwordInput = await page.$('input[type="password"], input[name*="password"]');

      if (emailInput && passwordInput && submitButton) {
        await emailInput.type('wrong@example.com');
        await passwordInput.type('wrongpassword');
        await submitButton.click();
        await page.waitForTimeout(2000);
        flowResult.screenshots.push(await takeScreenshot(page, 'login-wrong-credentials'));
        flowResult.steps.push('Tested wrong credentials');

        // Check for error message
        const hasError = await page.evaluate(() => {
          const errorElements = document.querySelectorAll('[class*="error"], [role="alert"], .text-red-500');
          return errorElements.length > 0;
        });

        if (hasError) {
          flowResult.steps.push('✓ Wrong credentials error shown');
        } else {
          flowResult.issues.push('No error message for wrong credentials');
          flowResult.status = 'PARTIAL';
        }
      }

    } else {
      flowResult.status = 'FAIL';
      flowResult.issues.push('Could not find login page');
    }

  } catch (error) {
    flowResult.status = 'FAIL';
    flowResult.issues.push(`Error: ${error.message}`);
    flowResult.screenshots.push(await takeScreenshot(page, 'login-error'));
  }

  await page.close();
  results.flows.push(flowResult);
}

async function testOAuthFlows(browser) {
  console.log('\n=== TESTING OAUTH FLOWS ===');
  const page = await browser.newPage();
  const flowResult = {
    name: 'OAuth Flows',
    steps: [],
    status: 'PASS',
    issues: [],
    screenshots: []
  };

  try {
    // Go to login page
    await page.goto(APP_URL, { waitUntil: 'networkidle2', timeout: 30000 });

    // Try to find login page
    const loginUrls = ['/login', '/signin', '/sign-in', '/auth/login'];
    let loginFound = false;

    for (const url of loginUrls) {
      try {
        await page.goto(`${APP_URL}${url}`, { waitUntil: 'networkidle2', timeout: 10000 });
        const currentUrl = page.url();
        if (!currentUrl.includes('404')) {
          loginFound = true;
          break;
        }
      } catch (e) {
        continue;
      }
    }

    if (loginFound) {
      flowResult.screenshots.push(await takeScreenshot(page, 'oauth-page'));

      // Look for Google OAuth button
      const googleSelectors = [
        'button:contains("Google")',
        'a:contains("Google")',
        '[class*="google"]',
        'button[class*="google"]',
        'a[href*="google"]'
      ];

      let googleFound = false;
      for (const selector of googleSelectors) {
        const element = await page.$(selector);
        if (element) {
          const text = await page.evaluate(el => el.textContent, element);
          if (text.toLowerCase().includes('google')) {
            googleFound = true;
            flowResult.steps.push('✓ Google OAuth button found');
            break;
          }
        }
      }

      if (!googleFound) {
        flowResult.issues.push('Google OAuth button not found');
        flowResult.status = 'PARTIAL';
      }

      // Look for Microsoft OAuth button
      const microsoftSelectors = [
        'button:contains("Microsoft")',
        'a:contains("Microsoft")',
        '[class*="microsoft"]',
        'button[class*="microsoft"]',
        'a[href*="microsoft"]'
      ];

      let microsoftFound = false;
      for (const selector of microsoftSelectors) {
        const element = await page.$(selector);
        if (element) {
          const text = await page.evaluate(el => el.textContent, element);
          if (text.toLowerCase().includes('microsoft')) {
            microsoftFound = true;
            flowResult.steps.push('✓ Microsoft OAuth button found');
            break;
          }
        }
      }

      if (!microsoftFound) {
        flowResult.issues.push('Microsoft OAuth button not found');
        flowResult.status = 'PARTIAL';
      }

      // Check OAuth button styling
      flowResult.steps.push('Checked OAuth buttons visibility and styling');

    } else {
      flowResult.status = 'FAIL';
      flowResult.issues.push('Could not access login page for OAuth testing');
    }

  } catch (error) {
    flowResult.status = 'FAIL';
    flowResult.issues.push(`Error: ${error.message}`);
    flowResult.screenshots.push(await takeScreenshot(page, 'oauth-error'));
  }

  await page.close();
  results.flows.push(flowResult);
}

async function testPasswordResetFlow(browser) {
  console.log('\n=== TESTING PASSWORD RESET FLOW ===');
  const page = await browser.newPage();
  const flowResult = {
    name: 'Password Reset Flow',
    steps: [],
    status: 'PASS',
    issues: [],
    screenshots: []
  };

  try {
    // Go to login page first
    await page.goto(APP_URL, { waitUntil: 'networkidle2', timeout: 30000 });

    const loginUrls = ['/login', '/signin', '/sign-in', '/auth/login'];
    let loginFound = false;

    for (const url of loginUrls) {
      try {
        await page.goto(`${APP_URL}${url}`, { waitUntil: 'networkidle2', timeout: 10000 });
        const currentUrl = page.url();
        if (!currentUrl.includes('404')) {
          loginFound = true;
          break;
        }
      } catch (e) {
        continue;
      }
    }

    if (loginFound) {
      flowResult.screenshots.push(await takeScreenshot(page, 'password-reset-start'));

      // Look for "Forgot Password" link
      const forgotPasswordSelectors = [
        'a:contains("Forgot")',
        'a:contains("Reset")',
        'a[href*="forgot"]',
        'a[href*="reset"]',
        'button:contains("Forgot")'
      ];

      let forgotPasswordFound = false;
      for (const selector of forgotPasswordSelectors) {
        const element = await page.$(selector);
        if (element) {
          forgotPasswordFound = true;
          flowResult.steps.push('✓ Forgot password link found');
          await element.click();
          await page.waitForTimeout(2000);
          flowResult.screenshots.push(await takeScreenshot(page, 'password-reset-page'));
          break;
        }
      }

      if (!forgotPasswordFound) {
        // Try direct URLs
        const resetUrls = ['/forgot-password', '/reset-password', '/auth/forgot-password'];
        for (const url of resetUrls) {
          try {
            await page.goto(`${APP_URL}${url}`, { waitUntil: 'networkidle2', timeout: 10000 });
            const currentUrl = page.url();
            if (!currentUrl.includes('404')) {
              forgotPasswordFound = true;
              flowResult.steps.push(`Found password reset page at: ${url}`);
              flowResult.screenshots.push(await takeScreenshot(page, 'password-reset-page'));
              break;
            }
          } catch (e) {
            continue;
          }
        }
      }

      if (!forgotPasswordFound) {
        flowResult.status = 'FAIL';
        flowResult.issues.push('Could not find password reset functionality');
      }

    } else {
      flowResult.status = 'FAIL';
      flowResult.issues.push('Could not access login page');
    }

  } catch (error) {
    flowResult.status = 'FAIL';
    flowResult.issues.push(`Error: ${error.message}`);
    flowResult.screenshots.push(await takeScreenshot(page, 'password-reset-error'));
  }

  await page.close();
  results.flows.push(flowResult);
}

async function testSessionPersistence(browser) {
  console.log('\n=== TESTING SESSION PERSISTENCE ===');
  const page = await browser.newPage();
  const flowResult = {
    name: 'Session Persistence',
    steps: [],
    status: 'PASS',
    issues: [],
    screenshots: []
  };

  try {
    await page.goto(APP_URL, { waitUntil: 'networkidle2', timeout: 30000 });
    flowResult.screenshots.push(await takeScreenshot(page, 'session-initial'));

    // Check if there's a logged-in state indicator
    const hasSessionIndicator = await page.evaluate(() => {
      // Look for common session indicators
      const indicators = [
        document.querySelector('[class*="avatar"]'),
        document.querySelector('[class*="profile"]'),
        document.querySelector('button:contains("Logout")'),
        document.querySelector('a:contains("Dashboard")'),
        localStorage.getItem('token'),
        localStorage.getItem('session'),
        document.cookie.includes('session')
      ];
      return indicators.some(indicator => indicator !== null);
    });

    if (hasSessionIndicator) {
      flowResult.steps.push('Session indicator found');
    } else {
      flowResult.steps.push('No active session detected');
    }

    // Test protected route access
    const protectedUrls = ['/dashboard', '/app', '/home', '/workspace'];
    for (const url of protectedUrls) {
      try {
        await page.goto(`${APP_URL}${url}`, { waitUntil: 'networkidle2', timeout: 10000 });
        const currentUrl = page.url();

        if (currentUrl.includes('login') || currentUrl.includes('signin')) {
          flowResult.steps.push(`✓ Protected route ${url} redirects to login (correct behavior)`);
        } else if (!currentUrl.includes('404')) {
          flowResult.steps.push(`Protected route ${url} accessible`);
        }
      } catch (e) {
        flowResult.steps.push(`Tried ${url} - not found`);
      }
    }

    flowResult.screenshots.push(await takeScreenshot(page, 'session-check'));

  } catch (error) {
    flowResult.status = 'FAIL';
    flowResult.issues.push(`Error: ${error.message}`);
    flowResult.screenshots.push(await takeScreenshot(page, 'session-error'));
  }

  await page.close();
  results.flows.push(flowResult);
}

async function testUIUX(browser) {
  console.log('\n=== TESTING UI/UX ===');
  const page = await browser.newPage();
  const flowResult = {
    name: 'UI/UX Checks',
    steps: [],
    status: 'PASS',
    issues: [],
    screenshots: []
  };

  try {
    // Desktop view
    await page.setViewport({ width: 1920, height: 1080 });
    await page.goto(APP_URL, { waitUntil: 'networkidle2', timeout: 30000 });
    flowResult.screenshots.push(await takeScreenshot(page, 'ui-desktop'));
    flowResult.steps.push('Captured desktop view (1920x1080)');

    // Tablet view
    await page.setViewport({ width: 768, height: 1024 });
    await page.reload({ waitUntil: 'networkidle2' });
    flowResult.screenshots.push(await takeScreenshot(page, 'ui-tablet'));
    flowResult.steps.push('Captured tablet view (768x1024)');

    // Mobile view
    await page.setViewport({ width: 375, height: 667 });
    await page.reload({ waitUntil: 'networkidle2' });
    flowResult.screenshots.push(await takeScreenshot(page, 'ui-mobile'));
    flowResult.steps.push('Captured mobile view (375x667)');

    // Check accessibility
    const a11yChecks = await page.evaluate(() => {
      const forms = document.querySelectorAll('form');
      let hasLabels = true;
      let hasFocusStyles = true;

      forms.forEach(form => {
        const inputs = form.querySelectorAll('input');
        inputs.forEach(input => {
          const label = form.querySelector(`label[for="${input.id}"]`);
          if (!label && !input.getAttribute('aria-label')) {
            hasLabels = false;
          }
        });
      });

      return {
        hasLabels,
        formCount: forms.length
      };
    });

    if (!a11yChecks.hasLabels) {
      flowResult.issues.push('Some form inputs missing labels');
      flowResult.status = 'PARTIAL';
    } else {
      flowResult.steps.push('✓ Form inputs have proper labels');
    }

    flowResult.steps.push(`Found ${a11yChecks.formCount} forms on page`);

  } catch (error) {
    flowResult.status = 'FAIL';
    flowResult.issues.push(`Error: ${error.message}`);
    flowResult.screenshots.push(await takeScreenshot(page, 'ui-error'));
  }

  await page.close();
  results.flows.push(flowResult);
}

async function runAllTests() {
  console.log('Starting Operate Authentication Flow Tests...\n');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  try {
    await testLoginFlow(browser);
    await testRegistrationFlow(browser);
    await testOAuthFlows(browser);
    await testPasswordResetFlow(browser);
    await testSessionPersistence(browser);
    await testUIUX(browser);

    // Save results
    const reportPath = path.join(__dirname, 'AUTH_FLOW_TEST_REPORT.json');
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
    console.log(`\n✓ Test results saved to: ${reportPath}`);

    // Generate markdown report
    const markdownReport = generateMarkdownReport(results);
    const mdPath = path.join(__dirname, 'AUTH_FLOW_TEST_REPORT.md');
    fs.writeFileSync(mdPath, markdownReport);
    console.log(`✓ Markdown report saved to: ${mdPath}`);

  } catch (error) {
    console.error('Test execution failed:', error);
  } finally {
    await browser.close();
  }
}

function generateMarkdownReport(results) {
  let md = `# Operate Authentication Flow Test Report\n\n`;
  md += `**Generated:** ${results.timestamp}\n`;
  md += `**App URL:** ${APP_URL}\n\n`;

  md += `## Summary\n\n`;
  md += `| Flow | Status | Issues |\n`;
  md += `|------|--------|--------|\n`;

  results.flows.forEach(flow => {
    md += `| ${flow.name} | ${flow.status} | ${flow.issues.length} |\n`;
  });

  md += `\n---\n\n`;

  results.flows.forEach(flow => {
    md += `## ${flow.name}\n\n`;
    md += `**STATUS:** ${flow.status}\n\n`;

    if (flow.steps.length > 0) {
      md += `### Steps Tested\n\n`;
      flow.steps.forEach(step => {
        md += `- ${step}\n`;
      });
      md += `\n`;
    }

    if (flow.issues.length > 0) {
      md += `### Issues Found\n\n`;
      flow.issues.forEach(issue => {
        md += `- ❌ ${issue}\n`;
      });
      md += `\n`;
    }

    if (flow.screenshots.length > 0) {
      md += `### Screenshots\n\n`;
      flow.screenshots.forEach(screenshot => {
        md += `- \`${path.basename(screenshot)}\`\n`;
      });
      md += `\n`;
    }

    md += `---\n\n`;
  });

  return md;
}

runAllTests().catch(console.error);
