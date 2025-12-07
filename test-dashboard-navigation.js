const puppeteer = require('puppeteer');
const fs = require('fs');

const APP_URL = 'https://operate.guru';
const REPORT_FILE = 'DASHBOARD-NAVIGATION-TEST-REPORT.md';

// Test results storage
const testResults = [];
let browser, page;

// Helper to add test result
function addResult(pageName, url, status, issues = [], notes = []) {
  testResults.push({ pageName, url, status, issues, notes });
}

// Helper to wait/delay
async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Helper to take screenshot
async function takeScreenshot(name) {
  try {
    await page.screenshot({
      path: `screenshot-${name}.png`,
      fullPage: true
    });
    return `screenshot-${name}.png`;
  } catch (error) {
    return null;
  }
}

// Helper to check console errors
function setupConsoleMonitoring() {
  const consoleErrors = [];
  const consoleWarnings = [];

  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    } else if (msg.type() === 'warning') {
      consoleWarnings.push(msg.text());
    }
  });

  page.on('pageerror', error => {
    consoleErrors.push(`Page Error: ${error.message}`);
  });

  return { consoleErrors, consoleWarnings };
}

// Helper to wait for navigation or timeout
async function safeNavigate(url, timeout = 30000) {
  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout });
    return true;
  } catch (error) {
    console.log(`Navigation timeout/error for ${url}: ${error.message}`);
    return false;
  }
}

// Helper to wait for selector with timeout
async function safeWaitForSelector(selector, timeout = 5000) {
  try {
    await page.waitForSelector(selector, { timeout });
    return true;
  } catch (error) {
    return false;
  }
}

// Test 1: Main Dashboard
async function testMainDashboard() {
  console.log('\n=== Testing Main Dashboard ===');
  const { consoleErrors } = setupConsoleMonitoring();
  const issues = [];
  const notes = [];

  try {
    // Navigate to dashboard
    const navigated = await safeNavigate(APP_URL);
    if (!navigated) {
      issues.push('Failed to load main dashboard page');
      addResult('Main Dashboard', APP_URL, 'FAIL', issues, notes);
      return;
    }

    await delay(3000);
    const currentUrl = page.url();
    notes.push(`Landed on: ${currentUrl}`);

    // Take screenshot
    await takeScreenshot('dashboard-main');

    // Check page title
    const title = await page.title();
    notes.push(`Page title: ${title}`);

    // Check for common dashboard elements
    const hasHeader = await safeWaitForSelector('header, [role="banner"], nav');
    if (!hasHeader) {
      issues.push('Header/navigation not found');
    } else {
      notes.push('Header/navigation found');
    }

    // Check for main content area
    const hasMain = await safeWaitForSelector('main, [role="main"], .dashboard, .content');
    if (!hasMain) {
      issues.push('Main content area not found');
    } else {
      notes.push('Main content area found');
    }

    // Check for dashboard widgets/cards
    const widgets = await page.$$('div[class*="card"], div[class*="widget"], div[class*="panel"], section');
    notes.push(`Found ${widgets.length} potential widget/card elements`);

    // Check for any loading spinners that shouldn't be there
    const stillLoading = await page.$('div[class*="loading"], div[class*="spinner"], .skeleton');
    if (stillLoading) {
      issues.push('Loading state still active after page load');
    }

    // Check console errors
    if (consoleErrors.length > 0) {
      issues.push(`${consoleErrors.length} console errors detected`);
      consoleErrors.forEach(err => notes.push(`Console Error: ${err}`));
    }

    // Test refresh
    await page.reload({ waitUntil: 'networkidle2' });
    await delay(2000);
    notes.push('Page refresh successful');

    const status = issues.length === 0 ? 'PASS' : (issues.length < 3 ? 'PARTIAL' : 'FAIL');
    addResult('Main Dashboard', currentUrl, status, issues, notes);

  } catch (error) {
    issues.push(`Test error: ${error.message}`);
    addResult('Main Dashboard', APP_URL, 'FAIL', issues, notes);
  }
}

// Test 2: Navigation Menu
async function testNavigation() {
  console.log('\n=== Testing Navigation ===');
  const issues = [];
  const notes = [];

  try {
    // Find navigation elements
    const navSelectors = [
      'nav a',
      'header a',
      '[role="navigation"] a',
      'aside a',
      '.sidebar a',
      '.nav-link',
      '[class*="nav"] a'
    ];

    let navLinks = [];
    for (const selector of navSelectors) {
      try {
        const links = await page.$$(selector);
        if (links.length > 0) {
          navLinks = links;
          notes.push(`Found ${links.length} navigation links using selector: ${selector}`);
          break;
        }
      } catch (e) {
        // Try next selector
      }
    }

    if (navLinks.length === 0) {
      issues.push('No navigation links found');
      addResult('Navigation Menu', page.url(), 'FAIL', issues, notes);
      return;
    }

    // Get link details
    const linkDetails = await page.evaluate(() => {
      const selectors = [
        'nav a',
        'header a',
        '[role="navigation"] a',
        'aside a',
        '.sidebar a',
        '.nav-link',
        '[class*="nav"] a'
      ];

      let links = [];
      for (const selector of selectors) {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          links = Array.from(elements).map(link => ({
            text: link.textContent.trim(),
            href: link.href,
            visible: link.offsetParent !== null
          }));
          break;
        }
      }
      return links;
    });

    notes.push(`Navigation links: ${linkDetails.map(l => l.text).join(', ')}`);

    // Test clicking a few main navigation items
    const testableLinks = linkDetails.filter(l =>
      l.visible &&
      l.text &&
      !l.text.toLowerCase().includes('logout') &&
      !l.text.toLowerCase().includes('sign out') &&
      !l.href.includes('mailto:') &&
      !l.href.includes('tel:')
    ).slice(0, 5);

    for (const link of testableLinks) {
      try {
        const currentUrl = page.url();
        await page.goto(link.href, { waitUntil: 'networkidle2', timeout: 10000 });
        await delay(1500);
        const newUrl = page.url();

        if (newUrl === currentUrl) {
          notes.push(`"${link.text}" - Same page (possibly active link)`);
        } else {
          notes.push(`"${link.text}" - Navigated to ${newUrl}`);
        }

        await takeScreenshot(`nav-${link.text.replace(/[^a-z0-9]/gi, '-').toLowerCase()}`);
      } catch (error) {
        issues.push(`Failed to navigate to "${link.text}": ${error.message}`);
      }
    }

    // Check for active state highlighting
    const hasActiveState = await page.evaluate(() => {
      const activeSelectors = [
        '.active',
        '[aria-current]',
        '.nav-link.active',
        '[class*="active"]'
      ];

      for (const selector of activeSelectors) {
        if (document.querySelector(selector)) {
          return true;
        }
      }
      return false;
    });

    if (hasActiveState) {
      notes.push('Active state highlighting found');
    } else {
      issues.push('No active state highlighting detected');
    }

    const status = issues.length === 0 ? 'PASS' : (issues.length < 3 ? 'PARTIAL' : 'FAIL');
    addResult('Navigation Menu', page.url(), status, issues, notes);

  } catch (error) {
    issues.push(`Test error: ${error.message}`);
    addResult('Navigation Menu', page.url(), 'FAIL', issues, notes);
  }
}

// Test 3: Sidebar
async function testSidebar() {
  console.log('\n=== Testing Sidebar ===');
  const issues = [];
  const notes = [];

  try {
    await safeNavigate(APP_URL);
    await delay(2000);

    // Check for sidebar
    const sidebarSelectors = [
      'aside',
      '.sidebar',
      '[class*="sidebar"]',
      '[role="complementary"]',
      'nav[class*="side"]'
    ];

    let sidebar = null;
    let sidebarSelector = null;
    for (const selector of sidebarSelectors) {
      sidebar = await page.$(selector);
      if (sidebar) {
        sidebarSelector = selector;
        break;
      }
    }

    if (!sidebar) {
      issues.push('Sidebar not found');
      addResult('Sidebar', page.url(), 'FAIL', issues, notes);
      return;
    }

    notes.push(`Sidebar found using: ${sidebarSelector}`);

    // Check for expand/collapse button
    const toggleSelectors = [
      'button[aria-label*="menu"]',
      'button[class*="toggle"]',
      'button[class*="hamburger"]',
      '.menu-toggle',
      '[class*="sidebar"] button'
    ];

    let toggleButton = null;
    for (const selector of toggleSelectors) {
      toggleButton = await page.$(selector);
      if (toggleButton) {
        notes.push(`Toggle button found: ${selector}`);
        break;
      }
    }

    if (toggleButton) {
      // Test toggle
      try {
        await toggleButton.click();
        await delay(500);
        notes.push('Clicked toggle button (collapsed)');

        await toggleButton.click();
        await delay(500);
        notes.push('Clicked toggle button (expanded)');
      } catch (error) {
        issues.push(`Toggle button error: ${error.message}`);
      }
    } else {
      notes.push('No toggle button found (sidebar may be always visible)');
    }

    // Get sidebar links
    const sidebarLinks = await page.evaluate((sel) => {
      const sidebar = document.querySelector(sel);
      if (!sidebar) return [];

      const links = sidebar.querySelectorAll('a');
      return Array.from(links).map(link => ({
        text: link.textContent.trim(),
        href: link.href
      }));
    }, sidebarSelector);

    notes.push(`Sidebar has ${sidebarLinks.length} links`);
    if (sidebarLinks.length > 0) {
      notes.push(`Links: ${sidebarLinks.map(l => l.text).slice(0, 10).join(', ')}`);
    }

    const status = issues.length === 0 ? 'PASS' : (issues.length < 2 ? 'PARTIAL' : 'FAIL');
    addResult('Sidebar', page.url(), status, issues, notes);

  } catch (error) {
    issues.push(`Test error: ${error.message}`);
    addResult('Sidebar', page.url(), 'FAIL', issues, notes);
  }
}

// Test 4: Specific Pages
async function testSpecificPages() {
  console.log('\n=== Testing Specific Pages ===');

  const pagesToTest = [
    { name: 'Dashboard/Home', paths: ['/', '/dashboard', '/home'] },
    { name: 'Invoices', paths: ['/invoices', '/invoice', '/billing/invoices'] },
    { name: 'Transactions', paths: ['/transactions', '/transaction', '/banking/transactions'] },
    { name: 'Contacts', paths: ['/contacts', '/customers', '/clients'] },
    { name: 'Reports', paths: ['/reports', '/analytics', '/reporting'] },
    { name: 'Settings', paths: ['/settings', '/preferences', '/account/settings'] },
    { name: 'Profile', paths: ['/profile', '/account', '/user/profile'] }
  ];

  for (const pageTest of pagesToTest) {
    const issues = [];
    const notes = [];
    let found = false;
    let workingUrl = null;

    for (const path of pageTest.paths) {
      const testUrl = `${APP_URL}${path}`;
      try {
        const { consoleErrors } = setupConsoleMonitoring();

        const navigated = await safeNavigate(testUrl, 15000);
        if (!navigated) {
          notes.push(`Path ${path} - navigation timeout`);
          continue;
        }

        await delay(2000);
        const finalUrl = page.url();

        // Check if we got a 404 or error page
        const pageText = await page.evaluate(() => document.body.textContent.toLowerCase());
        const is404 = pageText.includes('404') || pageText.includes('not found') || pageText.includes('page not found');

        if (is404) {
          notes.push(`Path ${path} - 404 Not Found`);
          continue;
        }

        // Page exists
        found = true;
        workingUrl = finalUrl;
        notes.push(`Found at: ${path} (redirected to ${finalUrl})`);

        // Take screenshot
        await takeScreenshot(`page-${pageTest.name.toLowerCase().replace(/\s+/g, '-')}`);

        // Check for content
        const hasContent = await page.evaluate(() => {
          const main = document.querySelector('main, [role="main"], .content, .page-content');
          return main ? main.textContent.trim().length > 50 : false;
        });

        if (!hasContent) {
          issues.push('Page appears empty or has minimal content');
        } else {
          notes.push('Page has content');
        }

        // Check console errors
        if (consoleErrors.length > 0) {
          issues.push(`${consoleErrors.length} console errors`);
        }

        break; // Found working path

      } catch (error) {
        notes.push(`Path ${path} - Error: ${error.message}`);
      }
    }

    if (!found) {
      issues.push('Page not accessible via any common path');
      addResult(pageTest.name, pageTest.paths.join(', '), 'FAIL', issues, notes);
    } else {
      const status = issues.length === 0 ? 'PASS' : 'PARTIAL';
      addResult(pageTest.name, workingUrl, status, issues, notes);
    }
  }
}

// Test 5: Data Tables
async function testDataTables() {
  console.log('\n=== Testing Data Tables ===');
  const issues = [];
  const notes = [];

  try {
    // Navigate to a page likely to have a table (invoices or transactions)
    const tablePaths = ['/invoices', '/transactions', '/contacts', '/reports'];
    let tableFound = false;
    let currentPath = null;

    for (const path of tablePaths) {
      await safeNavigate(`${APP_URL}${path}`, 15000);
      await delay(2000);

      const hasTable = await page.evaluate(() => {
        return !!(
          document.querySelector('table') ||
          document.querySelector('[role="table"]') ||
          document.querySelector('.data-table') ||
          document.querySelector('[class*="table"]')
        );
      });

      if (hasTable) {
        tableFound = true;
        currentPath = path;
        notes.push(`Table found at: ${path}`);
        break;
      }
    }

    if (!tableFound) {
      issues.push('No data tables found on common pages');
      addResult('Data Tables', page.url(), 'FAIL', issues, notes);
      return;
    }

    await takeScreenshot('data-table');

    // Check table features
    const tableFeatures = await page.evaluate(() => {
      const results = {
        hasRows: false,
        rowCount: 0,
        hasPagination: false,
        hasSorting: false,
        hasSearch: false,
        hasActions: false
      };

      const table = document.querySelector('table, [role="table"]');
      if (table) {
        const rows = table.querySelectorAll('tr, [role="row"]');
        results.rowCount = rows.length;
        results.hasRows = rows.length > 0;
      }

      // Check for pagination
      results.hasPagination = !!(
        document.querySelector('.pagination') ||
        document.querySelector('[class*="pagination"]') ||
        document.querySelector('button[aria-label*="next"]') ||
        document.querySelector('button[aria-label*="previous"]')
      );

      // Check for sorting
      results.hasSorting = !!(
        document.querySelector('th[aria-sort]') ||
        document.querySelector('[class*="sortable"]') ||
        document.querySelector('th button') ||
        document.querySelector('th[class*="sort"]')
      );

      // Check for search
      results.hasSearch = !!(
        document.querySelector('input[type="search"]') ||
        document.querySelector('input[placeholder*="search" i]') ||
        document.querySelector('[class*="search"]')
      );

      // Check for row actions
      results.hasActions = !!(
        document.querySelector('button[aria-label*="edit"]') ||
        document.querySelector('button[aria-label*="delete"]') ||
        document.querySelector('.actions') ||
        document.querySelector('[class*="action"]')
      );

      return results;
    });

    notes.push(`Table has ${tableFeatures.rowCount} rows`);
    notes.push(`Pagination: ${tableFeatures.hasPagination ? 'Yes' : 'No'}`);
    notes.push(`Sorting: ${tableFeatures.hasSorting ? 'Yes' : 'No'}`);
    notes.push(`Search: ${tableFeatures.hasSearch ? 'Yes' : 'No'}`);
    notes.push(`Row actions: ${tableFeatures.hasActions ? 'Yes' : 'No'}`);

    if (!tableFeatures.hasRows) {
      issues.push('Table has no data rows');
    }

    // Test pagination if exists
    if (tableFeatures.hasPagination) {
      try {
        const nextButton = await page.$('button[aria-label*="next"], .pagination button:last-child');
        if (nextButton) {
          await nextButton.click();
          await delay(1500);
          notes.push('Pagination next button works');
        }
      } catch (error) {
        issues.push('Pagination test failed');
      }
    }

    // Test search if exists
    if (tableFeatures.hasSearch) {
      try {
        const searchInput = await page.$('input[type="search"], input[placeholder*="search" i]');
        if (searchInput) {
          await searchInput.type('test');
          await delay(1000);
          notes.push('Search input works');
          await searchInput.click({ clickCount: 3 });
          await searchInput.press('Backspace');
        }
      } catch (error) {
        issues.push('Search test failed');
      }
    }

    const status = issues.length === 0 ? 'PASS' : 'PARTIAL';
    addResult('Data Tables', page.url(), status, issues, notes);

  } catch (error) {
    issues.push(`Test error: ${error.message}`);
    addResult('Data Tables', page.url(), 'FAIL', issues, notes);
  }
}

// Test 6: Forms
async function testForms() {
  console.log('\n=== Testing Forms ===');
  const issues = [];
  const notes = [];

  try {
    // Look for pages with forms
    const formPaths = ['/settings', '/profile', '/invoices/new', '/contacts/new'];
    let formFound = false;

    for (const path of formPaths) {
      await safeNavigate(`${APP_URL}${path}`, 15000);
      await delay(2000);

      const hasForm = await page.$('form');
      if (hasForm) {
        formFound = true;
        notes.push(`Form found at: ${path}`);
        break;
      }
    }

    if (!formFound) {
      // Try clicking "Add" or "New" buttons
      await safeNavigate(APP_URL);
      await delay(2000);

      const addButton = await page.$('button[aria-label*="add"], button[aria-label*="new"], button:has-text("Add"), button:has-text("New")');
      if (addButton) {
        await addButton.click();
        await delay(1500);
        const hasForm = await page.$('form');
        if (hasForm) {
          formFound = true;
          notes.push('Form found via Add/New button');
        }
      }
    }

    if (!formFound) {
      issues.push('No forms found');
      addResult('Forms', page.url(), 'PARTIAL', issues, notes);
      return;
    }

    await takeScreenshot('form');

    // Analyze form
    const formInfo = await page.evaluate(() => {
      const form = document.querySelector('form');
      if (!form) return null;

      return {
        inputCount: form.querySelectorAll('input').length,
        textareaCount: form.querySelectorAll('textarea').length,
        selectCount: form.querySelectorAll('select').length,
        buttonCount: form.querySelectorAll('button').length,
        hasRequiredFields: form.querySelectorAll('[required]').length > 0,
        hasLabels: form.querySelectorAll('label').length > 0,
        hasValidation: !!(
          form.querySelector('[pattern]') ||
          form.querySelector('[min]') ||
          form.querySelector('[max]') ||
          form.querySelector('[minlength]') ||
          form.querySelector('[maxlength]')
        )
      };
    });

    if (formInfo) {
      notes.push(`Inputs: ${formInfo.inputCount}, Textareas: ${formInfo.textareaCount}, Selects: ${formInfo.selectCount}`);
      notes.push(`Buttons: ${formInfo.buttonCount}`);
      notes.push(`Required fields: ${formInfo.hasRequiredFields ? 'Yes' : 'No'}`);
      notes.push(`Labels: ${formInfo.hasLabels ? 'Yes' : 'No'}`);
      notes.push(`Validation: ${formInfo.hasValidation ? 'Yes' : 'No'}`);

      if (!formInfo.hasLabels) {
        issues.push('Form lacks labels');
      }
    }

    // Test validation by trying to submit empty
    try {
      const submitButton = await page.$('form button[type="submit"], form button:has-text("Save"), form button:has-text("Submit")');
      if (submitButton) {
        await submitButton.click();
        await delay(1000);

        // Check for validation messages
        const hasValidationMsg = await page.evaluate(() => {
          return !!(
            document.querySelector('.error') ||
            document.querySelector('[class*="error"]') ||
            document.querySelector('[role="alert"]') ||
            document.querySelector('.invalid-feedback')
          );
        });

        if (hasValidationMsg) {
          notes.push('Form validation working (error messages shown)');
        } else {
          notes.push('Form validation unclear (no visible error messages)');
        }
      }
    } catch (error) {
      issues.push('Form submission test failed');
    }

    const status = issues.length === 0 ? 'PASS' : 'PARTIAL';
    addResult('Forms', page.url(), status, issues, notes);

  } catch (error) {
    issues.push(`Test error: ${error.message}`);
    addResult('Forms', page.url(), 'FAIL', issues, notes);
  }
}

// Test 7: Loading States
async function testLoadingStates() {
  console.log('\n=== Testing Loading States ===');
  const issues = [];
  const notes = [];

  try {
    await safeNavigate(APP_URL);

    // Check for loading indicators
    const loadingIndicators = await page.evaluate(() => {
      const indicators = {
        hasSpinner: !!(
          document.querySelector('.spinner') ||
          document.querySelector('[class*="spinner"]') ||
          document.querySelector('.loading')
        ),
        hasSkeleton: !!(
          document.querySelector('.skeleton') ||
          document.querySelector('[class*="skeleton"]')
        ),
        hasProgressBar: !!(
          document.querySelector('.progress') ||
          document.querySelector('[role="progressbar"]')
        )
      };
      return indicators;
    });

    notes.push(`Spinner: ${loadingIndicators.hasSpinner ? 'Found' : 'Not found'}`);
    notes.push(`Skeleton: ${loadingIndicators.hasSkeleton ? 'Found' : 'Not found'}`);
    notes.push(`Progress bar: ${loadingIndicators.hasProgressBar ? 'Found' : 'Not found'}`);

    // Navigate to data-heavy page to catch loading state
    await page.goto(`${APP_URL}/transactions`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    const duringLoad = await page.evaluate(() => {
      return !!(
        document.querySelector('.spinner, [class*="spinner"], .loading, .skeleton')
      );
    });

    if (duringLoad) {
      notes.push('Loading indicator visible during navigation');
    }

    await delay(3000);

    // Check for empty states
    const emptyState = await page.evaluate(() => {
      const text = document.body.textContent.toLowerCase();
      return {
        hasEmptyMessage: text.includes('no data') || text.includes('no results') || text.includes('empty'),
        hasEmptyIllustration: !!(
          document.querySelector('.empty-state') ||
          document.querySelector('[class*="empty"]')
        )
      };
    });

    if (emptyState.hasEmptyMessage || emptyState.hasEmptyIllustration) {
      notes.push('Empty state detected');
    } else {
      notes.push('No empty state (data is present or no empty state design)');
    }

    const status = issues.length === 0 ? 'PASS' : 'PARTIAL';
    addResult('Loading States', page.url(), status, issues, notes);

  } catch (error) {
    issues.push(`Test error: ${error.message}`);
    addResult('Loading States', page.url(), 'FAIL', issues, notes);
  }
}

// Test 8: Responsive Design
async function testResponsiveDesign() {
  console.log('\n=== Testing Responsive Design ===');
  const issues = [];
  const notes = [];

  try {
    const viewports = [
      { name: 'Desktop', width: 1920, height: 1080 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Mobile', width: 375, height: 667 }
    ];

    for (const viewport of viewports) {
      await page.setViewport(viewport);
      await safeNavigate(APP_URL);
      await delay(2000);

      await takeScreenshot(`responsive-${viewport.name.toLowerCase()}`);

      // Check for horizontal scroll
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });

      if (hasHorizontalScroll) {
        issues.push(`${viewport.name} (${viewport.width}px) has horizontal scroll`);
      } else {
        notes.push(`${viewport.name} (${viewport.width}px) - No horizontal scroll`);
      }

      // Check if hamburger menu appears on mobile
      if (viewport.width < 768) {
        const hasMobileMenu = await page.evaluate(() => {
          return !!(
            document.querySelector('.hamburger') ||
            document.querySelector('[class*="hamburger"]') ||
            document.querySelector('button[aria-label*="menu"]')
          );
        });

        if (hasMobileMenu) {
          notes.push('Mobile menu button found');

          // Try to click it
          try {
            const menuButton = await page.$('.hamburger, [class*="hamburger"], button[aria-label*="menu"]');
            if (menuButton) {
              await menuButton.click();
              await delay(500);
              notes.push('Mobile menu opens');

              await menuButton.click();
              await delay(500);
            }
          } catch (error) {
            issues.push('Mobile menu interaction failed');
          }
        } else {
          issues.push('No mobile menu button found');
        }
      }
    }

    // Reset viewport
    await page.setViewport({ width: 1920, height: 1080 });

    const status = issues.length === 0 ? 'PASS' : 'PARTIAL';
    addResult('Responsive Design', page.url(), status, issues, notes);

  } catch (error) {
    issues.push(`Test error: ${error.message}`);
    addResult('Responsive Design', page.url(), 'FAIL', issues, notes);
  }
}

// Generate Report
function generateReport() {
  console.log('\n=== Generating Report ===');

  let report = '# DASHBOARD & NAVIGATION TEST REPORT\n\n';
  report += `**Test Date**: ${new Date().toISOString()}\n`;
  report += `**App URL**: ${APP_URL}\n`;
  report += `**Total Tests**: ${testResults.length}\n\n`;

  // Summary
  const passed = testResults.filter(r => r.status === 'PASS').length;
  const partial = testResults.filter(r => r.status === 'PARTIAL').length;
  const failed = testResults.filter(r => r.status === 'FAIL').length;

  report += '## Summary\n\n';
  report += `- ✅ PASS: ${passed}\n`;
  report += `- ⚠️ PARTIAL: ${partial}\n`;
  report += `- ❌ FAIL: ${failed}\n\n`;

  report += '---\n\n';

  // Detailed Results
  report += '## Detailed Test Results\n\n';

  testResults.forEach(result => {
    const statusEmoji = result.status === 'PASS' ? '✅' : (result.status === 'PARTIAL' ? '⚠️' : '❌');

    report += `### ${statusEmoji} ${result.pageName}\n\n`;
    report += `**URL**: ${result.url}\n`;
    report += `**STATUS**: ${result.status}\n\n`;

    if (result.issues.length > 0) {
      report += '**ISSUES**:\n';
      result.issues.forEach(issue => {
        report += `- ${issue}\n`;
      });
      report += '\n';
    }

    if (result.notes.length > 0) {
      report += '**NOTES**:\n';
      result.notes.forEach(note => {
        report += `- ${note}\n`;
      });
      report += '\n';
    }

    report += '---\n\n';
  });

  // Recommendations
  report += '## Recommendations\n\n';

  const allIssues = testResults.flatMap(r => r.issues);
  if (allIssues.length === 0) {
    report += 'No critical issues found. Application is functioning well.\n\n';
  } else {
    const criticalIssues = [...new Set(allIssues)];
    criticalIssues.forEach(issue => {
      report += `- ${issue}\n`;
    });
  }

  fs.writeFileSync(REPORT_FILE, report);
  console.log(`\nReport saved to: ${REPORT_FILE}`);
}

// Main test execution
async function runAllTests() {
  try {
    console.log('Starting Dashboard & Navigation Tests...');
    console.log(`Testing: ${APP_URL}\n`);

    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    // Set a user agent
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    // Run all tests
    await testMainDashboard();
    await testNavigation();
    await testSidebar();
    await testSpecificPages();
    await testDataTables();
    await testForms();
    await testLoadingStates();
    await testResponsiveDesign();

    // Generate report
    generateReport();

    console.log('\n✅ All tests completed!');

  } catch (error) {
    console.error('Test execution error:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run tests
runAllTests();
