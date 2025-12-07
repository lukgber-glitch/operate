const puppeteer = require('puppeteer-core');
const fs = require('fs');

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const report = {
  issues: [],
  working: [],
  formTests: []
};

function addIssue(priority, area, description, steps, expected, actual, file = null) {
  report.issues.push({ priority, area, description, steps, expected, actual, file });
}

function addWorking(area, feature) {
  report.working.push({ area, feature });
}

function addFormTest(fieldName, testType, result, details) {
  report.formTests.push({ fieldName, testType, result, details });
}

(async () => {
  let browser, page;

  try {
    browser = await puppeteer.connect({
      browserURL: 'http://localhost:9222',
      defaultViewport: { width: 1920, height: 1080 }
    });

    const pages = await browser.pages();
    page = pages[0] || await browser.newPage();

    console.log('=== ONBOARDING FORM TESTING ===\n');

    await page.goto('https://operate.guru/onboarding', { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(2000);
    await page.screenshot({ path: 'test-onboarding-01.png', fullPage: true });

    const url = await page.url();
    console.log('URL:', url);

    if (!url.includes('/onboarding')) {
      console.log('Not on onboarding page, cannot test forms');
      process.exit(0);
    }

    console.log('\n=== STEP 2: COMPANY INFO FORM ===');

    // Check if we can see the Company Info form
    const companyFormVisible = await page.evaluate(() => {
      const text = document.body.innerText;
      return text.includes('Company Information') || text.includes('Company Name');
    });

    console.log('Company form visible:', companyFormVisible);

    if (!companyFormVisible) {
      addIssue('P2', 'Onboarding', 'Company Information form not visible on step 2',
        'Navigate to /onboarding step 2',
        'Show Company Information form',
        'Form not visible',
        'apps/web/src/components/onboarding/steps/CompanyInfoStep.tsx'
      );
    } else {
      addWorking('Onboarding', 'Company Information form renders');

      // Test 1: Check all required fields exist
      const fields = await page.evaluate(() => {
        const inputs = document.querySelectorAll('input, select, textarea');
        return Array.from(inputs).map(input => ({
          name: input.name || input.id,
          type: input.type || input.tagName.toLowerCase(),
          placeholder: input.placeholder,
          required: input.hasAttribute('required') || input.getAttribute('aria-required') === 'true'
        }));
      });

      console.log('Form fields found:', fields.length);
      fields.forEach(f => {
        console.log(`  - ${f.name} (${f.type})${f.required ? ' *required' : ''}`);
      });

      // Test 2: Check validation - try submitting empty form
      const nextButton = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const nextBtn = buttons.find(b => b.innerText.includes('Next') || b.innerText.includes('Weiter'));
        return nextBtn ? nextBtn.innerText : null;
      });

      console.log('Next button text:', nextButton);

      if (nextButton) {
        addWorking('Onboarding', 'Next button exists in form');

        // Click Next without filling form
        await page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          const nextBtn = buttons.find(b => b.innerText.includes('Next') || b.innerText.includes('Weiter'));
          if (nextBtn) nextBtn.click();
        });

        await sleep(1000);
        await page.screenshot({ path: 'test-onboarding-02-validation.png', fullPage: true });

        // Check if validation errors appear
        const validationErrors = await page.evaluate(() => {
          const errors = document.querySelectorAll('[role="alert"], .error, .text-red-500, .text-destructive');
          return Array.from(errors).map(e => e.innerText);
        });

        console.log('Validation errors shown:', validationErrors.length);
        if (validationErrors.length > 0) {
          addWorking('Onboarding', 'Form validation works - shows errors for empty required fields');
          addFormTest('Required fields', 'Empty submission', 'PASS', validationErrors.length + ' validation errors shown');
          console.log('Validation messages:', validationErrors);
        } else {
          addIssue('P2', 'Onboarding', 'No validation errors shown for empty required fields',
            'Click Next without filling required fields',
            'Show validation error messages',
            'No errors displayed',
            'apps/web/src/components/onboarding/steps/CompanyInfoStep.tsx'
          );
          addFormTest('Required fields', 'Empty submission', 'FAIL', 'No validation errors shown');
        }

        // Test 3: Fill in Company Name field
        const companyNameInput = await page.$('input[name*="company" i], input[placeholder*="company" i], input[placeholder*="Acme" i]');
        if (companyNameInput) {
          await companyNameInput.click({ clickCount: 3 });
          await companyNameInput.type('Test Company GmbH');
          await sleep(500);

          addWorking('Onboarding', 'Company Name field accepts text input');
          addFormTest('Company Name', 'Text entry', 'PASS', 'Accepts text input');
        } else {
          addIssue('P1', 'Onboarding', 'Cannot find Company Name input field',
            'Look for company name input',
            'Input field should be findable',
            'Field not found in DOM',
            'apps/web/src/components/onboarding/steps/CompanyInfoStep.tsx'
          );
          addFormTest('Company Name', 'Field existence', 'FAIL', 'Input not found');
        }

        // Test 4: Test Country dropdown
        const countrySelect = await page.$('select[name*="country" i]');
        if (countrySelect) {
          const options = await page.evaluate((sel) => {
            const select = sel;
            return Array.from(select.options).map(o => o.value);
          }, countrySelect);

          console.log('Country options:', options.length);
          if (options.length > 0) {
            addWorking('Onboarding', 'Country dropdown has options: ' + options.length);
            addFormTest('Country', 'Dropdown options', 'PASS', options.length + ' countries available');
          } else {
            addIssue('P2', 'Onboarding', 'Country dropdown has no options',
              'Check country dropdown',
              'Should have list of countries',
              'Dropdown is empty',
              'apps/web/src/components/onboarding/steps/CompanyInfoStep.tsx'
            );
            addFormTest('Country', 'Dropdown options', 'FAIL', 'No options available');
          }
        }

        // Test 5: Test Tax ID field
        const taxIdInput = await page.$('input[name*="tax" i], input[placeholder*="DE123" i]');
        if (taxIdInput) {
          await taxIdInput.click();
          await taxIdInput.type('DE123456789');
          await sleep(500);

          const value = await taxIdInput.evaluate(el => el.value);
          if (value.includes('DE123456789')) {
            addWorking('Onboarding', 'Tax ID field accepts input');
            addFormTest('Tax ID', 'Text entry', 'PASS', 'Accepts tax ID format');
          }
        }

        // Test 6: Test Industry dropdown
        const industrySelect = await page.$('select[name*="industry" i]');
        if (industrySelect) {
          const options = await page.evaluate((sel) => {
            return Array.from(sel.options).map(o => ({ value: o.value, text: o.innerText }));
          }, industrySelect);

          console.log('Industry options:', options.length);
          if (options.length > 0) {
            addWorking('Onboarding', 'Industry dropdown populated');
            addFormTest('Industry', 'Dropdown options', 'PASS', options.length + ' industries');
          }
        }

        // Test 7: Test Back button
        const backButton = await page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          const backBtn = buttons.find(b => b.innerText.includes('Back') || b.innerText.includes('Zurück'));
          return !!backBtn;
        });

        if (backButton) {
          addWorking('Onboarding', 'Back button exists');
        } else {
          addIssue('P3', 'Onboarding', 'No Back button on Company Info step',
            'Look for Back button',
            'Should have Back button to return to previous step',
            'Back button not found',
            'apps/web/src/components/onboarding/steps/CompanyInfoStep.tsx'
          );
        }
      }
    }

    // Test 8: Check step indicator/progress
    const stepIndicator = await page.evaluate(() => {
      const text = document.body.innerText;
      const hasSteps = text.match(/Step \d+ of \d+|Schritt \d+ von \d+|\d+\/\d+/);
      return hasSteps ? hasSteps[0] : null;
    });

    console.log('Step indicator:', stepIndicator);
    if (stepIndicator) {
      addWorking('Onboarding', 'Progress indicator shows: ' + stepIndicator);
    } else {
      addIssue('P3', 'Onboarding', 'No step progress indicator visible',
        'Check onboarding page',
        'Should show step progress (e.g., "Step 2 of 8")',
        'No progress indicator found',
        'apps/web/src/components/onboarding/OnboardingWizard.tsx'
      );
    }

    // Generate Report
    console.log('\n=== GENERATING REPORT ===');

    const timestamp = new Date().toISOString();
    let reportText = '====================================\n';
    reportText += 'ONBOARDING FORM TEST REPORT\n';
    reportText += '====================================\n';
    reportText += 'Generated: ' + timestamp + '\n\n';

    reportText += '====================================\n';
    reportText += 'FORM TESTS: ' + report.formTests.length + '\n';
    reportText += '====================================\n\n';

    const passedTests = report.formTests.filter(t => t.result === 'PASS').length;
    const failedTests = report.formTests.filter(t => t.result === 'FAIL').length;

    reportText += 'PASSED: ' + passedTests + '\n';
    reportText += 'FAILED: ' + failedTests + '\n\n';

    report.formTests.forEach((test, i) => {
      reportText += (i + 1) + '. [' + test.result + '] ' + test.fieldName + ' - ' + test.testType + '\n';
      reportText += '   ' + test.details + '\n\n';
    });

    reportText += '====================================\n';
    reportText += 'ISSUES FOUND: ' + report.issues.length + '\n';
    reportText += '====================================\n\n';

    report.issues.forEach((issue, i) => {
      reportText += (i + 1) + '. ISSUE: [' + issue.priority + '] [' + issue.area + '] ' + issue.description + '\n';
      reportText += '   Steps: ' + issue.steps + '\n';
      reportText += '   Expected: ' + issue.expected + '\n';
      reportText += '   Actual: ' + issue.actual + '\n';
      if (issue.file) {
        reportText += '   File: ' + issue.file + '\n';
      }
      reportText += '\n';
    });

    reportText += '====================================\n';
    reportText += 'WORKING FEATURES: ' + report.working.length + '\n';
    reportText += '====================================\n\n';

    report.working.forEach((w, i) => {
      reportText += (i + 1) + '. WORKING: [' + w.area + '] ' + w.feature + '\n';
    });

    fs.writeFileSync('test-onboarding-report.txt', reportText);
    console.log('\nREPORT SAVED: test-onboarding-report.txt');
    console.log('Issues:', report.issues.length);
    console.log('Working:', report.working.length);
    console.log('Form tests:', report.formTests.length);

  } catch (error) {
    console.error('TEST ERROR:', error.message);
    console.error(error.stack);
    if (page) {
      await page.screenshot({ path: 'test-onboarding-error.png', fullPage: true });
    }
  }
})();
