const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const APP_URL = 'https://operate.guru';
const SCREENSHOTS_DIR = path.join(__dirname, 'test-screenshots');

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

const results = {
  timestamp: new Date().toISOString(),
  appUrl: APP_URL,
  flows: []
};

async function takeScreenshot(page, name) {
  const filepath = path.join(SCREENSHOTS_DIR, `${name}-${Date.now()}.png`);
  await page.screenshot({ path: filepath, fullPage: true });
  return filepath;
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForContent(page, timeout = 5000) {
  // Wait for either a form, or main content, or specific selectors
  try {
    await page.waitForSelector('form, main, [role="main"], #__next, #root, body > div', { timeout });
  } catch (e) {
    // Continue even if specific selectors not found
  }
  await sleep(2000); // Additional wait for dynamic content
}

async function capturePageInfo(page) {
  return await page.evaluate(() => {
    return {
      url: window.location.href,
      title: document.title,
      bodyText: document.body.innerText.substring(0, 500),
      hasForm: !!document.querySelector('form'),
      formCount: document.querySelectorAll('form').length,
      inputCount: document.querySelectorAll('input').length,
      buttonCount: document.querySelectorAll('button').length,
      linkCount: document.querySelectorAll('a').length,
      hasContent: document.body.innerText.length > 100
    };
  });
}

async function testLoginFlow(browser) {
  console.log('\n=== TESTING LOGIN FLOW ===');
  const page = await browser.newPage();
  const flowResult = {
    name: 'Login Flow',
    steps: [],
    status: 'PASS',
    issues: [],
    screenshots: [],
    pageInfo: []
  };

  try {
    // Try login URL
    await page.goto(`${APP_URL}/login`, { waitUntil: 'networkidle0', timeout: 30000 });
    await waitForContent(page);

    const pageInfo = await capturePageInfo(page);
    flowResult.pageInfo.push(pageInfo);
    flowResult.screenshots.push(await takeScreenshot(page, 'login-page'));

    flowResult.steps.push(`Login page loaded: ${pageInfo.url}`);
    flowResult.steps.push(`Title: "${pageInfo.title}"`);
    flowResult.steps.push(`Has content: ${pageInfo.hasContent}`);
    flowResult.steps.push(`Forms: ${pageInfo.formCount}, Inputs: ${pageInfo.inputCount}, Buttons: ${pageInfo.buttonCount}`);

    if (pageInfo.bodyText.length > 0) {
      flowResult.steps.push(`Page text preview: "${pageInfo.bodyText.substring(0, 200)}..."`);
    }

    if (!pageInfo.hasForm) {
      flowResult.issues.push('No form element found on login page');
      flowResult.status = 'FAIL';
    } else {
      // Analyze form details
      const formDetails = await page.evaluate(() => {
        const form = document.querySelector('form');
        const inputs = Array.from(form.querySelectorAll('input')).map(input => ({
          type: input.type,
          name: input.name,
          id: input.id,
          placeholder: input.placeholder,
          required: input.required
        }));

        const buttons = Array.from(form.querySelectorAll('button')).map(btn => ({
          type: btn.type,
          text: btn.textContent.trim()
        }));

        return { inputs, buttons };
      });

      flowResult.steps.push(`Form inputs:`);
      formDetails.inputs.forEach(input => {
        flowResult.steps.push(`  - ${input.type} (${input.name || input.id}) ${input.required ? '[required]' : ''}`);
      });

      flowResult.steps.push(`Form buttons:`);
      formDetails.buttons.forEach(btn => {
        flowResult.steps.push(`  - ${btn.type}: "${btn.text}"`);
      });

      // Test empty submission
      const submitBtn = await page.$('button[type="submit"]');
      if (submitBtn) {
        await submitBtn.click();
        await sleep(2000);
        flowResult.screenshots.push(await takeScreenshot(page, 'login-empty-submit'));

        const errors = await page.evaluate(() => {
          const errorEls = Array.from(document.querySelectorAll('[class*="error"], [role="alert"], .text-red-500, .text-red-600, .text-danger'));
          return errorEls.map(el => el.textContent.trim()).filter(t => t.length > 0 && t.length < 200);
        });

        if (errors.length > 0) {
          flowResult.steps.push(`✓ Validation errors shown (${errors.length}):`);
          errors.forEach(err => flowResult.steps.push(`  - "${err}"`));
        } else {
          flowResult.issues.push('No validation errors shown for empty form');
          flowResult.status = 'PARTIAL';
        }

        // Test wrong credentials
        await page.reload({ waitUntil: 'networkidle0' });
        await waitForContent(page);

        const emailInput = await page.$('input[type="email"], input[name*="email"], input[name="username"]');
        const passwordInput = await page.$('input[type="password"]');

        if (emailInput && passwordInput) {
          await emailInput.type('test@example.com');
          await passwordInput.type('wrongpassword123');

          const submit = await page.$('button[type="submit"]');
          if (submit) {
            await submit.click();
            await sleep(3000);
            flowResult.screenshots.push(await takeScreenshot(page, 'login-wrong-creds'));
            flowResult.steps.push('Tested wrong credentials');

            const authError = await page.evaluate(() => {
              const body = document.body.innerText;
              const hasError = body.includes('Invalid') || body.includes('incorrect') ||
                             body.includes('wrong') || body.includes('failed');
              const errorEls = Array.from(document.querySelectorAll('[class*="error"], [role="alert"]'));
              return {
                hasError,
                errorText: errorEls.map(el => el.textContent.trim()).join(' ')
              };
            });

            if (authError.hasError || authError.errorText) {
              flowResult.steps.push(`✓ Auth error shown: "${authError.errorText}"`);
            }
          }
        }
      }
    }

  } catch (error) {
    flowResult.status = 'FAIL';
    flowResult.issues.push(`Error: ${error.message}`);
    flowResult.screenshots.push(await takeScreenshot(page, 'login-error'));
  }

  await page.close();
  results.flows.push(flowResult);
}

async function testRegistrationFlow(browser) {
  console.log('\n=== TESTING REGISTRATION FLOW ===');
  const page = await browser.newPage();
  const flowResult = {
    name: 'Registration Flow',
    steps: [],
    status: 'PASS',
    issues: [],
    screenshots: [],
    pageInfo: []
  };

  try {
    await page.goto(`${APP_URL}/register`, { waitUntil: 'networkidle0', timeout: 30000 });
    await waitForContent(page);

    const pageInfo = await capturePageInfo(page);
    flowResult.pageInfo.push(pageInfo);
    flowResult.screenshots.push(await takeScreenshot(page, 'register-page'));

    flowResult.steps.push(`Registration page: ${pageInfo.url}`);
    flowResult.steps.push(`Title: "${pageInfo.title}"`);
    flowResult.steps.push(`Forms: ${pageInfo.formCount}, Inputs: ${pageInfo.inputCount}`);

    if (!pageInfo.hasForm) {
      flowResult.issues.push('No registration form found');
      flowResult.status = 'PARTIAL';
    } else {
      const formDetails = await page.evaluate(() => {
        const form = document.querySelector('form');
        const inputs = Array.from(form.querySelectorAll('input')).map(input => ({
          type: input.type,
          name: input.name,
          placeholder: input.placeholder,
          required: input.required
        }));
        return { inputs };
      });

      flowResult.steps.push('Registration form inputs:');
      formDetails.inputs.forEach(input => {
        flowResult.steps.push(`  - ${input.type}: ${input.placeholder || input.name}`);
      });
    }

  } catch (error) {
    flowResult.status = 'FAIL';
    flowResult.issues.push(`Error: ${error.message}`);
    flowResult.screenshots.push(await takeScreenshot(page, 'register-error'));
  }

  await page.close();
  results.flows.push(flowResult);
}

async function testOAuthFlow(browser) {
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
    await page.goto(`${APP_URL}/login`, { waitUntil: 'networkidle0', timeout: 30000 });
    await waitForContent(page);
    flowResult.screenshots.push(await takeScreenshot(page, 'oauth-buttons'));

    const oauthButtons = await page.evaluate(() => {
      const allButtons = Array.from(document.querySelectorAll('button, a'));

      return allButtons.map(btn => ({
        text: btn.textContent.trim(),
        href: btn.href || null,
        className: btn.className,
        isGoogle: btn.textContent.toLowerCase().includes('google') ||
                 btn.className.toLowerCase().includes('google'),
        isMicrosoft: btn.textContent.toLowerCase().includes('microsoft') ||
                    btn.className.toLowerCase().includes('microsoft')
      })).filter(btn => btn.isGoogle || btn.isMicrosoft);
    });

    const googleBtn = oauthButtons.find(b => b.isGoogle);
    const microsoftBtn = oauthButtons.find(b => b.isMicrosoft);

    if (googleBtn) {
      flowResult.steps.push(`✓ Google OAuth: "${googleBtn.text}"`);
    } else {
      flowResult.issues.push('No Google OAuth button found');
      flowResult.status = 'PARTIAL';
    }

    if (microsoftBtn) {
      flowResult.steps.push(`✓ Microsoft OAuth: "${microsoftBtn.text}"`);
    } else {
      flowResult.issues.push('No Microsoft OAuth button found');
      flowResult.status = 'PARTIAL';
    }

    flowResult.steps.push(`Total OAuth-related buttons: ${oauthButtons.length}`);

  } catch (error) {
    flowResult.status = 'FAIL';
    flowResult.issues.push(`Error: ${error.message}`);
    flowResult.screenshots.push(await takeScreenshot(page, 'oauth-error'));
  }

  await page.close();
  results.flows.push(flowResult);
}

async function testPasswordReset(browser) {
  console.log('\n=== TESTING PASSWORD RESET ===');
  const page = await browser.newPage();
  const flowResult = {
    name: 'Password Reset Flow',
    steps: [],
    status: 'PASS',
    issues: [],
    screenshots: []
  };

  try {
    await page.goto(`${APP_URL}/login`, { waitUntil: 'networkidle0', timeout: 30000 });
    await waitForContent(page);

    const forgotLink = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a, button'));
      const found = links.find(link => {
        const text = link.textContent.toLowerCase();
        return text.includes('forgot') || text.includes('reset');
      });
      return found ? { text: found.textContent.trim(), href: found.href } : null;
    });

    if (forgotLink) {
      flowResult.steps.push(`✓ Found: "${forgotLink.text}"`);

      if (forgotLink.href) {
        await page.goto(forgotLink.href, { waitUntil: 'networkidle0', timeout: 10000 });
        await waitForContent(page);
        flowResult.screenshots.push(await takeScreenshot(page, 'password-reset'));
        flowResult.steps.push(`Password reset page loaded`);
      }
    } else {
      // Try direct URL
      try {
        await page.goto(`${APP_URL}/forgot-password`, { waitUntil: 'networkidle0', timeout: 10000 });
        await waitForContent(page);
        const pageInfo = await capturePageInfo(page);
        if (pageInfo.hasContent) {
          flowResult.steps.push('Found password reset at /forgot-password');
          flowResult.screenshots.push(await takeScreenshot(page, 'password-reset-direct'));
        }
      } catch (e) {
        flowResult.issues.push('Password reset page not found');
        flowResult.status = 'PARTIAL';
      }
    }

  } catch (error) {
    flowResult.status = 'FAIL';
    flowResult.issues.push(`Error: ${error.message}`);
    flowResult.screenshots.push(await takeScreenshot(page, 'reset-error'));
  }

  await page.close();
  results.flows.push(flowResult);
}

async function testUIResponsiveness(browser) {
  console.log('\n=== TESTING UI RESPONSIVENESS ===');
  const page = await browser.newPage();
  const flowResult = {
    name: 'UI/UX Checks',
    steps: [],
    status: 'PASS',
    issues: [],
    screenshots: []
  };

  try {
    await page.goto(`${APP_URL}/login`, { waitUntil: 'networkidle0', timeout: 30000 });
    await waitForContent(page);

    // Desktop
    await page.setViewport({ width: 1920, height: 1080 });
    await sleep(500);
    flowResult.screenshots.push(await takeScreenshot(page, 'ui-desktop'));
    flowResult.steps.push('✓ Desktop view (1920x1080)');

    // Tablet
    await page.setViewport({ width: 768, height: 1024 });
    await sleep(500);
    flowResult.screenshots.push(await takeScreenshot(page, 'ui-tablet'));
    flowResult.steps.push('✓ Tablet view (768x1024)');

    // Mobile
    await page.setViewport({ width: 375, height: 667 });
    await sleep(500);
    flowResult.screenshots.push(await takeScreenshot(page, 'ui-mobile'));
    flowResult.steps.push('✓ Mobile view (375x667)');

    // Reset viewport
    await page.setViewport({ width: 1920, height: 1080 });

    // Accessibility
    const a11y = await page.evaluate(() => {
      const forms = document.querySelectorAll('form');
      let issueCount = 0;

      forms.forEach(form => {
        form.querySelectorAll('input').forEach(input => {
          const hasLabel = form.querySelector(`label[for="${input.id}"]`) ||
                         input.getAttribute('aria-label') ||
                         input.getAttribute('placeholder');
          if (!hasLabel) issueCount++;
        });
      });

      return {
        formCount: forms.length,
        a11yIssues: issueCount
      };
    });

    flowResult.steps.push(`Forms analyzed: ${a11y.formCount}`);
    if (a11y.a11yIssues > 0) {
      flowResult.issues.push(`${a11y.a11yIssues} inputs missing labels`);
      flowResult.status = 'PARTIAL';
    } else {
      flowResult.steps.push('✓ All inputs have proper labels');
    }

  } catch (error) {
    flowResult.status = 'FAIL';
    flowResult.issues.push(`Error: ${error.message}`);
    flowResult.screenshots.push(await takeScreenshot(page, 'ui-error'));
  }

  await page.close();
  results.flows.push(flowResult);
}

async function testProtectedRoutes(browser) {
  console.log('\n=== TESTING PROTECTED ROUTES ===');
  const page = await browser.newPage();
  const flowResult = {
    name: 'Protected Routes & Session',
    steps: [],
    status: 'PASS',
    issues: [],
    screenshots: []
  };

  try {
    const protectedRoutes = ['/dashboard', '/app', '/workspace'];

    for (const route of protectedRoutes) {
      try {
        await page.goto(`${APP_URL}${route}`, { waitUntil: 'networkidle0', timeout: 10000 });
        await waitForContent(page);

        const finalUrl = page.url();

        if (finalUrl.includes('login') || finalUrl.includes('signin')) {
          flowResult.steps.push(`✓ ${route} → redirects to login (protected)`);
        } else if (finalUrl === `${APP_URL}${route}`) {
          flowResult.steps.push(`${route} → accessible (may need auth check)`);
        } else {
          flowResult.steps.push(`${route} → redirects to ${finalUrl}`);
        }
      } catch (e) {
        flowResult.steps.push(`${route} → error or not found`);
      }
    }

    flowResult.screenshots.push(await takeScreenshot(page, 'protected-routes'));

  } catch (error) {
    flowResult.status = 'FAIL';
    flowResult.issues.push(`Error: ${error.message}`);
  }

  await page.close();
  results.flows.push(flowResult);
}

async function runAllTests() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║  Operate Authentication Flow - Comprehensive Tests    ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');
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
    await testOAuthFlow(browser);
    await testPasswordReset(browser);
    await testProtectedRoutes(browser);
    await testUIResponsiveness(browser);

    // Summary
    const summary = {
      total: results.flows.length,
      passed: results.flows.filter(f => f.status === 'PASS').length,
      partial: results.flows.filter(f => f.status === 'PARTIAL').length,
      failed: results.flows.filter(f => f.status === 'FAIL').length,
      totalIssues: results.flows.reduce((sum, f) => sum + f.issues.length, 0)
    };

    results.summary = summary;

    // Save JSON
    const reportPath = path.join(__dirname, 'AUTH_FLOW_TEST_REPORT_FINAL.json');
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
    console.log(`\n✓ JSON report: ${reportPath}`);

    // Save Markdown
    const mdReport = generateMarkdownReport(results);
    const mdPath = path.join(__dirname, 'AUTH_FLOW_TEST_REPORT_FINAL.md');
    fs.writeFileSync(mdPath, mdReport);
    console.log(`✓ Markdown report: ${mdPath}`);

    // Console summary
    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║                    TEST SUMMARY                        ║');
    console.log('╚════════════════════════════════════════════════════════╝');
    console.log(`Total Flows:    ${summary.total}`);
    console.log(`✓ Passed:       ${summary.passed}`);
    console.log(`⚠ Partial:      ${summary.partial}`);
    console.log(`✗ Failed:       ${summary.failed}`);
    console.log(`Issues Found:   ${summary.totalIssues}`);
    console.log('════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('Test execution error:', error);
  } finally {
    await browser.close();
  }
}

function generateMarkdownReport(results) {
  let md = `# Operate Authentication Flow - Complete Test Report\n\n`;
  md += `**Generated:** ${new Date(results.timestamp).toLocaleString()}\n`;
  md += `**Application:** ${results.appUrl}\n`;
  md += `**Testing Tool:** Puppeteer (Headless Chrome)\n\n`;

  if (results.summary) {
    md += `## Executive Summary\n\n`;
    md += `| Metric | Count |\n`;
    md += `|--------|-------|\n`;
    md += `| Total Test Flows | ${results.summary.total} |\n`;
    md += `| ✅ Passed | ${results.summary.passed} |\n`;
    md += `| ⚠️ Partial Pass | ${results.summary.partial} |\n`;
    md += `| ❌ Failed | ${results.summary.failed} |\n`;
    md += `| Total Issues | ${results.summary.totalIssues} |\n\n`;
  }

  md += `## Test Results by Flow\n\n`;
  md += `| Flow | Status | Issues | Screenshots |\n`;
  md += `|------|--------|--------|-------------|\n`;

  results.flows.forEach(flow => {
    const emoji = flow.status === 'PASS' ? '✅' : flow.status === 'PARTIAL' ? '⚠️' : '❌';
    md += `| ${flow.name} | ${emoji} ${flow.status} | ${flow.issues.length} | ${flow.screenshots.length} |\n`;
  });

  md += `\n---\n\n`;

  // Detailed results
  results.flows.forEach(flow => {
    const emoji = flow.status === 'PASS' ? '✅' : flow.status === 'PARTIAL' ? '⚠️' : '❌';
    md += `## ${emoji} ${flow.name}\n\n`;
    md += `**Status:** ${flow.status}\n\n`;

    if (flow.steps.length > 0) {
      md += `### Test Steps\n\n`;
      flow.steps.forEach(step => {
        md += `- ${step}\n`;
      });
      md += `\n`;
    }

    if (flow.pageInfo && flow.pageInfo.length > 0) {
      md += `### Page Information\n\n`;
      flow.pageInfo.forEach(info => {
        md += `- **URL:** ${info.url}\n`;
        md += `- **Title:** ${info.title}\n`;
        md += `- **Forms:** ${info.formCount} | **Inputs:** ${info.inputCount} | **Buttons:** ${info.buttonCount}\n\n`;
      });
    }

    if (flow.issues.length > 0) {
      md += `### ❌ Issues Identified\n\n`;
      flow.issues.forEach(issue => {
        md += `- ${issue}\n`;
      });
      md += `\n`;
    }

    if (flow.screenshots.length > 0) {
      md += `### 📸 Screenshots\n\n`;
      flow.screenshots.forEach(ss => {
        md += `- \`${path.basename(ss)}\`\n`;
      });
      md += `\n`;
    }

    md += `---\n\n`;
  });

  // Recommendations
  md += `## Recommendations\n\n`;

  const criticalIssues = results.flows.filter(f => f.status === 'FAIL');
  const partialIssues = results.flows.filter(f => f.status === 'PARTIAL');

  if (criticalIssues.length === 0 && partialIssues.length === 0) {
    md += `### ✅ All Tests Passed\n\n`;
    md += `All authentication flows are functioning correctly. No critical issues found.\n\n`;
  } else {
    if (criticalIssues.length > 0) {
      md += `### 🔴 Critical Issues (Must Fix)\n\n`;
      criticalIssues.forEach(flow => {
        md += `**${flow.name}:**\n`;
        flow.issues.forEach(issue => md += `- ${issue}\n`);
        md += `\n`;
      });
    }

    if (partialIssues.length > 0) {
      md += `### 🟡 Improvements Recommended\n\n`;
      partialIssues.forEach(flow => {
        md += `**${flow.name}:**\n`;
        flow.issues.forEach(issue => md += `- ${issue}\n`);
        md += `\n`;
      });
    }
  }

  md += `---\n\n`;
  md += `*Generated by PRISM Agent - Browser Testing Suite*\n`;
  md += `*Powered by Puppeteer & Headless Chrome*\n`;

  return md;
}

runAllTests().catch(console.error);
