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

async function findElementByText(page, text, tags = ['a', 'button']) {
  return await page.evaluateHandle((text, tags) => {
    for (const tag of tags) {
      const elements = Array.from(document.querySelectorAll(tag));
      const found = elements.find(el =>
        el.textContent.toLowerCase().includes(text.toLowerCase())
      );
      if (found) return found;
    }
    return null;
  }, text, tags);
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

    // Try to find register page
    const commonUrls = ['/register', '/signup', '/sign-up', '/auth/register'];
    let registerFound = false;

    for (const url of commonUrls) {
      try {
        const response = await page.goto(`${APP_URL}${url}`, { waitUntil: 'networkidle2', timeout: 10000 });
        const currentUrl = page.url();

        if (response.status() < 400) {
          registerFound = true;
          flowResult.steps.push(`Found register page at: ${url} (HTTP ${response.status()})`);
          flowResult.screenshots.push(await takeScreenshot(page, 'register-page'));
          break;
        }
      } catch (e) {
        flowResult.steps.push(`Tried ${url} - error: ${e.message}`);
      }
    }

    if (registerFound) {
      // Test form validation - look for form elements
      const formElements = await page.evaluate(() => {
        const form = document.querySelector('form');
        if (!form) return null;

        return {
          hasForm: true,
          emailInput: !!form.querySelector('input[type="email"], input[name*="email"]'),
          passwordInput: !!form.querySelector('input[type="password"], input[name*="password"]'),
          submitButton: !!form.querySelector('button[type="submit"], button[type="button"]'),
          inputCount: form.querySelectorAll('input').length
        };
      });

      if (formElements && formElements.hasForm) {
        flowResult.steps.push(`Form found with ${formElements.inputCount} inputs`);
        flowResult.steps.push(`Email input: ${formElements.emailInput ? 'Yes' : 'No'}`);
        flowResult.steps.push(`Password input: ${formElements.passwordInput ? 'Yes' : 'No'}`);
        flowResult.steps.push(`Submit button: ${formElements.submitButton ? 'Yes' : 'No'}`);

        // Test empty form submission
        const submitButton = await page.$('button[type="submit"]');
        if (submitButton) {
          await submitButton.click();
          await page.waitForTimeout(2000);
          flowResult.screenshots.push(await takeScreenshot(page, 'register-empty-validation'));

          // Check for error messages
          const errorMessages = await page.evaluate(() => {
            const errors = Array.from(document.querySelectorAll('[class*="error"], [role="alert"], .text-red-500, .text-red-600, .text-danger'));
            return errors.map(e => e.textContent.trim()).filter(t => t.length > 0);
          });

          if (errorMessages.length > 0) {
            flowResult.steps.push(`✓ Validation errors shown: ${errorMessages.length} messages`);
            errorMessages.forEach(msg => {
              if (msg.length < 100) flowResult.steps.push(`  - "${msg}"`);
            });
          } else {
            flowResult.issues.push('No visible error messages for empty form submission');
            flowResult.status = 'PARTIAL';
          }

          // Test invalid email
          await page.reload({ waitUntil: 'networkidle2' });
          const emailInput = await page.$('input[type="email"], input[name*="email"]');
          const passwordInput = await page.$('input[type="password"]');

          if (emailInput && passwordInput) {
            await emailInput.type('invalid-email');
            await passwordInput.type('test123');
            const submitBtn = await page.$('button[type="submit"]');
            if (submitBtn) {
              await submitBtn.click();
              await page.waitForTimeout(2000);
              flowResult.screenshots.push(await takeScreenshot(page, 'register-invalid-email'));
              flowResult.steps.push('Tested invalid email format');
            }
          }
        }
      } else {
        flowResult.issues.push('No form found on registration page');
        flowResult.status = 'PARTIAL';
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

    // Try common login URLs
    const loginUrls = ['/login', '/signin', '/sign-in', '/auth/login'];
    let loginFound = false;

    for (const url of loginUrls) {
      try {
        const response = await page.goto(`${APP_URL}${url}`, { waitUntil: 'networkidle2', timeout: 10000 });

        if (response.status() < 400) {
          loginFound = true;
          flowResult.steps.push(`Found login page at: ${url} (HTTP ${response.status()})`);
          flowResult.screenshots.push(await takeScreenshot(page, 'login-page'));
          break;
        }
      } catch (e) {
        flowResult.steps.push(`Tried ${url} - not found`);
      }
    }

    if (loginFound) {
      // Analyze login form
      const formDetails = await page.evaluate(() => {
        const form = document.querySelector('form');
        if (!form) return null;

        const emailInput = form.querySelector('input[type="email"], input[name*="email"], input[name*="username"]');
        const passwordInput = form.querySelector('input[type="password"]');
        const submitButton = form.querySelector('button[type="submit"]');

        return {
          hasForm: true,
          hasEmail: !!emailInput,
          hasPassword: !!passwordInput,
          hasSubmit: !!submitButton,
          emailPlaceholder: emailInput?.placeholder || '',
          passwordPlaceholder: passwordInput?.placeholder || ''
        };
      });

      if (formDetails && formDetails.hasForm) {
        flowResult.steps.push(`Login form structure:`);
        flowResult.steps.push(`  - Email input: ${formDetails.hasEmail ? '✓' : '✗'}`);
        flowResult.steps.push(`  - Password input: ${formDetails.hasPassword ? '✓' : '✗'}`);
        flowResult.steps.push(`  - Submit button: ${formDetails.hasSubmit ? '✓' : '✗'}`);

        // Test empty form submission
        const submitButton = await page.$('button[type="submit"]');
        if (submitButton) {
          await submitButton.click();
          await page.waitForTimeout(2000);
          flowResult.screenshots.push(await takeScreenshot(page, 'login-empty-validation'));
          flowResult.steps.push('Tested empty form validation');

          // Check for validation errors
          const hasErrors = await page.evaluate(() => {
            const errors = document.querySelectorAll('[class*="error"], [role="alert"], .text-red-500, .text-red-600');
            return errors.length > 0;
          });

          if (hasErrors) {
            flowResult.steps.push('✓ Empty field validation works');
          } else {
            flowResult.issues.push('No validation errors shown for empty fields');
            flowResult.status = 'PARTIAL';
          }

          // Test with wrong credentials
          await page.reload({ waitUntil: 'networkidle2' });
          const emailInput = await page.$('input[type="email"], input[name*="email"], input[name*="username"]');
          const passwordInput = await page.$('input[type="password"]');

          if (emailInput && passwordInput) {
            await emailInput.type('wrong@example.com');
            await passwordInput.type('wrongpassword123');

            const submitBtn = await page.$('button[type="submit"]');
            if (submitBtn) {
              await submitBtn.click();
              await page.waitForTimeout(3000);
              flowResult.screenshots.push(await takeScreenshot(page, 'login-wrong-credentials'));
              flowResult.steps.push('Tested wrong credentials');

              // Check for error message
              const errorMessage = await page.evaluate(() => {
                const errors = Array.from(document.querySelectorAll('[class*="error"], [role="alert"], .text-red-500'));
                return errors.map(e => e.textContent.trim()).join(' ');
              });

              if (errorMessage) {
                flowResult.steps.push(`✓ Error shown: "${errorMessage.substring(0, 100)}"`);
              } else {
                flowResult.issues.push('No error message shown for wrong credentials');
                flowResult.status = 'PARTIAL';
              }
            }
          }
        }
      } else {
        flowResult.issues.push('No login form found on page');
        flowResult.status = 'FAIL';
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
    // Navigate to login page
    await page.goto(`${APP_URL}/login`, { waitUntil: 'networkidle2', timeout: 30000 });
    flowResult.screenshots.push(await takeScreenshot(page, 'oauth-check'));

    // Look for OAuth buttons
    const oauthButtons = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button, a'));

      const google = buttons.find(btn =>
        btn.textContent.toLowerCase().includes('google') ||
        btn.className.toLowerCase().includes('google')
      );

      const microsoft = buttons.find(btn =>
        btn.textContent.toLowerCase().includes('microsoft') ||
        btn.className.toLowerCase().includes('microsoft')
      );

      const github = buttons.find(btn =>
        btn.textContent.toLowerCase().includes('github') ||
        btn.className.toLowerCase().includes('github')
      );

      return {
        google: google ? {
          text: google.textContent.trim(),
          href: google.href || null,
          visible: google.offsetParent !== null
        } : null,
        microsoft: microsoft ? {
          text: microsoft.textContent.trim(),
          href: microsoft.href || null,
          visible: microsoft.offsetParent !== null
        } : null,
        github: github ? {
          text: github.textContent.trim(),
          href: github.href || null,
          visible: github.offsetParent !== null
        } : null
      };
    });

    if (oauthButtons.google) {
      flowResult.steps.push(`✓ Google OAuth found: "${oauthButtons.google.text}"`);
      flowResult.steps.push(`  - Visible: ${oauthButtons.google.visible}`);
      if (oauthButtons.google.href) {
        flowResult.steps.push(`  - URL: ${oauthButtons.google.href}`);
      }
    } else {
      flowResult.issues.push('Google OAuth button not found');
      flowResult.status = 'PARTIAL';
    }

    if (oauthButtons.microsoft) {
      flowResult.steps.push(`✓ Microsoft OAuth found: "${oauthButtons.microsoft.text}"`);
      flowResult.steps.push(`  - Visible: ${oauthButtons.microsoft.visible}`);
    } else {
      flowResult.issues.push('Microsoft OAuth button not found');
      flowResult.status = 'PARTIAL';
    }

    if (oauthButtons.github) {
      flowResult.steps.push(`✓ GitHub OAuth found: "${oauthButtons.github.text}"`);
    }

    // Check button styling
    const styling = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button, a')).filter(btn =>
        btn.textContent.toLowerCase().includes('google') ||
        btn.textContent.toLowerCase().includes('microsoft')
      );

      return buttons.map(btn => {
        const styles = window.getComputedStyle(btn);
        return {
          text: btn.textContent.trim().substring(0, 30),
          backgroundColor: styles.backgroundColor,
          color: styles.color,
          padding: styles.padding,
          borderRadius: styles.borderRadius
        };
      });
    });

    if (styling.length > 0) {
      flowResult.steps.push(`OAuth button styling: ${styling.length} buttons styled`);
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
    // Go to login page
    await page.goto(`${APP_URL}/login`, { waitUntil: 'networkidle2', timeout: 30000 });
    flowResult.screenshots.push(await takeScreenshot(page, 'password-reset-start'));

    // Look for forgot password link
    const forgotPasswordLink = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a, button'));
      const found = links.find(link => {
        const text = link.textContent.toLowerCase();
        return text.includes('forgot') || text.includes('reset');
      });

      if (found) {
        return {
          text: found.textContent.trim(),
          href: found.href || found.getAttribute('href'),
          tag: found.tagName.toLowerCase()
        };
      }
      return null;
    });

    if (forgotPasswordLink) {
      flowResult.steps.push(`✓ Found password reset link: "${forgotPasswordLink.text}"`);

      if (forgotPasswordLink.href) {
        await page.goto(forgotPasswordLink.href, { waitUntil: 'networkidle2', timeout: 10000 });
        flowResult.screenshots.push(await takeScreenshot(page, 'password-reset-page'));
        flowResult.steps.push(`Navigated to: ${forgotPasswordLink.href}`);

        // Check for email input
        const hasEmailInput = await page.evaluate(() => {
          return !!document.querySelector('input[type="email"], input[name*="email"]');
        });

        if (hasEmailInput) {
          flowResult.steps.push('✓ Password reset form has email input');
        } else {
          flowResult.issues.push('Password reset page missing email input');
          flowResult.status = 'PARTIAL';
        }
      }
    } else {
      // Try direct URLs
      const resetUrls = ['/forgot-password', '/reset-password', '/auth/forgot-password', '/auth/reset'];
      let found = false;

      for (const url of resetUrls) {
        try {
          const response = await page.goto(`${APP_URL}${url}`, { waitUntil: 'networkidle2', timeout: 10000 });
          if (response.status() < 400) {
            found = true;
            flowResult.steps.push(`Found password reset at: ${url}`);
            flowResult.screenshots.push(await takeScreenshot(page, 'password-reset-direct'));
            break;
          }
        } catch (e) {
          // Continue
        }
      }

      if (!found) {
        flowResult.status = 'FAIL';
        flowResult.issues.push('Could not find password reset functionality');
      }
    }

  } catch (error) {
    flowResult.status = 'FAIL';
    flowResult.issues.push(`Error: ${error.message}`);
    flowResult.screenshots.push(await takeScreenshot(page, 'password-reset-error'));
  }

  await page.close();
  results.flows.push(flowResult);
}

async function testLogoutFlow(browser) {
  console.log('\n=== TESTING LOGOUT FLOW ===');
  const page = await browser.newPage();
  const flowResult = {
    name: 'Logout Flow',
    steps: [],
    status: 'PASS',
    issues: [],
    screenshots: []
  };

  try {
    await page.goto(APP_URL, { waitUntil: 'networkidle2', timeout: 30000 });
    flowResult.screenshots.push(await takeScreenshot(page, 'logout-check'));

    // Look for logout button (would need to be logged in)
    const logoutButton = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button, a'));
      const found = buttons.find(btn => {
        const text = btn.textContent.toLowerCase();
        return text.includes('logout') || text.includes('sign out') || text.includes('log out');
      });
      return found ? found.textContent.trim() : null;
    });

    if (logoutButton) {
      flowResult.steps.push(`✓ Logout button found: "${logoutButton}"`);
    } else {
      flowResult.steps.push('No logout button visible (user not logged in - expected)');
    }

    // Check for protected routes redirect
    const protectedUrls = ['/dashboard', '/app', '/workspace', '/home'];
    for (const url of protectedUrls) {
      try {
        await page.goto(`${APP_URL}${url}`, { waitUntil: 'networkidle2', timeout: 10000 });
        const currentUrl = page.url();

        if (currentUrl.includes('login') || currentUrl.includes('signin')) {
          flowResult.steps.push(`✓ ${url} redirects to login (protected)`);
        } else if (currentUrl.includes('404')) {
          flowResult.steps.push(`${url} - not found (404)`);
        } else {
          flowResult.steps.push(`${url} - accessible without auth`);
        }
      } catch (e) {
        // Page not found
      }
    }

  } catch (error) {
    flowResult.status = 'FAIL';
    flowResult.issues.push(`Error: ${error.message}`);
    flowResult.screenshots.push(await takeScreenshot(page, 'logout-error'));
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

    // Check for session storage/cookies
    const sessionInfo = await page.evaluate(() => {
      return {
        cookies: document.cookie,
        localStorage: Object.keys(localStorage),
        sessionStorage: Object.keys(sessionStorage),
        hasAuthToken: !!(localStorage.getItem('token') || localStorage.getItem('accessToken') || localStorage.getItem('auth_token'))
      };
    });

    flowResult.steps.push(`LocalStorage keys: ${sessionInfo.localStorage.length}`);
    flowResult.steps.push(`SessionStorage keys: ${sessionInfo.sessionStorage.length}`);
    flowResult.steps.push(`Has cookies: ${sessionInfo.cookies.length > 0 ? 'Yes' : 'No'}`);
    flowResult.steps.push(`Auth token found: ${sessionInfo.hasAuthToken ? 'Yes' : 'No'}`);

    if (sessionInfo.localStorage.length > 0) {
      flowResult.steps.push(`LocalStorage items: ${sessionInfo.localStorage.join(', ')}`);
    }

    // Test page refresh
    await page.reload({ waitUntil: 'networkidle2' });
    flowResult.steps.push('Page refreshed successfully');
    flowResult.screenshots.push(await takeScreenshot(page, 'session-after-refresh'));

    // Check if session persists
    const sessionAfterRefresh = await page.evaluate(() => {
      return {
        localStorage: Object.keys(localStorage),
        sessionStorage: Object.keys(sessionStorage)
      };
    });

    const localStorageMatches = JSON.stringify(sessionInfo.localStorage) === JSON.stringify(sessionAfterRefresh.localStorage);

    if (localStorageMatches) {
      flowResult.steps.push('✓ Session data persists after refresh');
    } else {
      flowResult.issues.push('Session data changed after refresh');
      flowResult.status = 'PARTIAL';
    }

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
    // Test login page at different viewports
    await page.goto(`${APP_URL}/login`, { waitUntil: 'networkidle2', timeout: 30000 });

    // Desktop view
    await page.setViewport({ width: 1920, height: 1080 });
    await page.waitForTimeout(500);
    flowResult.screenshots.push(await takeScreenshot(page, 'ui-desktop'));
    flowResult.steps.push('✓ Desktop view (1920x1080) captured');

    // Tablet view
    await page.setViewport({ width: 768, height: 1024 });
    await page.waitForTimeout(500);
    flowResult.screenshots.push(await takeScreenshot(page, 'ui-tablet'));
    flowResult.steps.push('✓ Tablet view (768x1024) captured');

    // Mobile view
    await page.setViewport({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    flowResult.screenshots.push(await takeScreenshot(page, 'ui-mobile'));
    flowResult.steps.push('✓ Mobile view (375x667) captured');

    // Reset to desktop for accessibility checks
    await page.setViewport({ width: 1920, height: 1080 });

    // Accessibility checks
    const a11yChecks = await page.evaluate(() => {
      const results = {
        forms: [],
        issues: []
      };

      document.querySelectorAll('form').forEach((form, idx) => {
        const formInfo = {
          index: idx,
          inputs: [],
          hasLabels: true
        };

        form.querySelectorAll('input').forEach(input => {
          const inputInfo = {
            type: input.type,
            id: input.id,
            name: input.name,
            hasLabel: false,
            hasAriaLabel: !!input.getAttribute('aria-label'),
            hasPlaceholder: !!input.placeholder
          };

          // Check for associated label
          if (input.id) {
            const label = form.querySelector(`label[for="${input.id}"]`);
            inputInfo.hasLabel = !!label;
          }

          if (!inputInfo.hasLabel && !inputInfo.hasAriaLabel) {
            formInfo.hasLabels = false;
            results.issues.push(`Input ${input.type} (name: ${input.name}) has no label`);
          }

          formInfo.inputs.push(inputInfo);
        });

        results.forms.push(formInfo);
      });

      // Check for loading states
      const hasLoadingIndicators = !!document.querySelector('[class*="loading"], [class*="spinner"], [role="progressbar"]');
      results.hasLoadingIndicators = hasLoadingIndicators;

      // Check for error message containers
      const errorContainers = document.querySelectorAll('[role="alert"], [class*="error"]');
      results.errorContainerCount = errorContainers.length;

      return results;
    });

    flowResult.steps.push(`Found ${a11yChecks.forms.length} form(s) on page`);

    a11yChecks.forms.forEach((form, idx) => {
      flowResult.steps.push(`Form ${idx + 1}: ${form.inputs.length} inputs`);
      if (!form.hasLabels) {
        flowResult.issues.push(`Form ${idx + 1} has inputs without labels`);
        flowResult.status = 'PARTIAL';
      }
    });

    if (a11yChecks.issues.length > 0) {
      flowResult.steps.push(`Accessibility issues: ${a11yChecks.issues.length}`);
    } else {
      flowResult.steps.push('✓ All form inputs have proper labels or aria-labels');
    }

    flowResult.steps.push(`Error containers found: ${a11yChecks.errorContainerCount}`);

    // Check loading states
    if (a11yChecks.hasLoadingIndicators) {
      flowResult.steps.push('✓ Loading indicators present');
    }

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
  console.log(`Testing: ${APP_URL}\n`);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-web-security'
    ]
  });

  try {
    await testLoginFlow(browser);
    await testRegistrationFlow(browser);
    await testOAuthFlows(browser);
    await testPasswordResetFlow(browser);
    await testLogoutFlow(browser);
    await testSessionPersistence(browser);
    await testUIUX(browser);

    // Calculate summary
    const summary = {
      total: results.flows.length,
      passed: results.flows.filter(f => f.status === 'PASS').length,
      partial: results.flows.filter(f => f.status === 'PARTIAL').length,
      failed: results.flows.filter(f => f.status === 'FAIL').length,
      totalIssues: results.flows.reduce((sum, f) => sum + f.issues.length, 0)
    };

    results.summary = summary;

    // Save results
    const reportPath = path.join(__dirname, 'AUTH_FLOW_TEST_REPORT.json');
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
    console.log(`\n✓ Test results saved to: ${reportPath}`);

    // Generate markdown report
    const markdownReport = generateMarkdownReport(results);
    const mdPath = path.join(__dirname, 'AUTH_FLOW_TEST_REPORT.md');
    fs.writeFileSync(mdPath, markdownReport);
    console.log(`✓ Markdown report saved to: ${mdPath}`);

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Flows: ${summary.total}`);
    console.log(`Passed: ${summary.passed} | Partial: ${summary.partial} | Failed: ${summary.failed}`);
    console.log(`Total Issues: ${summary.totalIssues}`);
    console.log('='.repeat(60));

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

  if (results.summary) {
    md += `## Test Summary\n\n`;
    md += `- **Total Flows Tested:** ${results.summary.total}\n`;
    md += `- **Passed:** ${results.summary.passed}\n`;
    md += `- **Partial Pass:** ${results.summary.partial}\n`;
    md += `- **Failed:** ${results.summary.failed}\n`;
    md += `- **Total Issues Found:** ${results.summary.totalIssues}\n\n`;
  }

  md += `## Flow Results\n\n`;
  md += `| Flow | Status | Issues | Screenshots |\n`;
  md += `|------|--------|--------|-------------|\n`;

  results.flows.forEach(flow => {
    const statusEmoji = flow.status === 'PASS' ? '✅' : flow.status === 'PARTIAL' ? '⚠️' : '❌';
    md += `| ${flow.name} | ${statusEmoji} ${flow.status} | ${flow.issues.length} | ${flow.screenshots.length} |\n`;
  });

  md += `\n---\n\n`;

  results.flows.forEach(flow => {
    const statusEmoji = flow.status === 'PASS' ? '✅' : flow.status === 'PARTIAL' ? '⚠️' : '❌';
    md += `## ${statusEmoji} ${flow.name}\n\n`;
    md += `**STATUS:** ${flow.status}\n\n`;

    if (flow.steps.length > 0) {
      md += `### Steps Tested\n\n`;
      flow.steps.forEach(step => {
        md += `- ${step}\n`;
      });
      md += `\n`;
    }

    if (flow.issues.length > 0) {
      md += `### ❌ Issues Found\n\n`;
      flow.issues.forEach(issue => {
        md += `- ${issue}\n`;
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

  md += `## Recommendations\n\n`;

  const allIssues = results.flows.flatMap(f => f.issues);
  if (allIssues.length === 0) {
    md += `✅ No critical issues found. All authentication flows are working as expected.\n\n`;
  } else {
    md += `Based on the test results, here are the recommended actions:\n\n`;

    const failedFlows = results.flows.filter(f => f.status === 'FAIL');
    if (failedFlows.length > 0) {
      md += `### Critical Issues\n\n`;
      failedFlows.forEach(flow => {
        md += `**${flow.name}:**\n`;
        flow.issues.forEach(issue => {
          md += `- ${issue}\n`;
        });
        md += `\n`;
      });
    }

    const partialFlows = results.flows.filter(f => f.status === 'PARTIAL');
    if (partialFlows.length > 0) {
      md += `### Improvements Needed\n\n`;
      partialFlows.forEach(flow => {
        md += `**${flow.name}:**\n`;
        flow.issues.forEach(issue => {
          md += `- ${issue}\n`;
        });
        md += `\n`;
      });
    }
  }

  md += `---\n\n`;
  md += `*Report generated by PRISM agent - Browser Testing Suite*\n`;

  return md;
}

runAllTests().catch(console.error);
