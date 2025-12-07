import { test as base, expect, Page } from '@playwright/test';

/**
 * Test user credentials for E2E testing
 */
export type TestUser = {
  email: string;
  password: string;
  name?: string;
};

/**
 * Extended test fixtures with authentication helpers
 */
type TestFixtures = {
  authenticatedPage: Page;
  testUser: TestUser;
  germanUser: TestUser;
};

/**
 * Extended Playwright test with custom fixtures
 */
export const test = base.extend<TestFixtures>({
  /**
   * Default test user credentials
   */
  testUser: async ({}, use) => {
    await use({
      email: process.env.TEST_USER_EMAIL || 'test@operate.guru',
      password: process.env.TEST_USER_PASSWORD || 'TestPassword123!',
      name: 'Test User',
    });
  },

  /**
   * German test user for locale-specific tests
   */
  germanUser: async ({}, use) => {
    await use({
      email: process.env.TEST_GERMAN_USER_EMAIL || 'test.de@operate.guru',
      password: process.env.TEST_GERMAN_USER_PASSWORD || 'TestPassword123!',
      name: 'Test Benutzer',
    });
  },

  /**
   * Pre-authenticated page fixture
   * Automatically logs in before each test
   */
  authenticatedPage: async ({ page, testUser }, use) => {
    // Navigate to login page
    await page.goto('/login');

    // Wait for page to be ready
    await page.waitForLoadState('networkidle');

    // Check if already logged in (session exists)
    const currentUrl = page.url();
    if (!currentUrl.includes('/login')) {
      // Already authenticated, use the page as-is
      await use(page);
      return;
    }

    // Fill in login form
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);

    // Submit login form
    await page.click('button[type="submit"]');

    // Wait for navigation to dashboard
    await page.waitForURL('**/dashboard', { timeout: 15000 });

    // Wait for dashboard to be fully loaded
    await page.waitForLoadState('networkidle');

    // Verify we're logged in by checking for user menu or dashboard element
    await expect(page.locator('[data-testid="user-menu"], [data-testid="dashboard"]')).toBeVisible({
      timeout: 10000,
    });

    // Use the authenticated page
    await use(page);

    // Cleanup: logout after test
    try {
      const userMenu = page.locator('[data-testid="user-menu"]');
      if (await userMenu.isVisible()) {
        await userMenu.click();
        await page.locator('[data-testid="logout"]').click();
        await page.waitForURL('**/login', { timeout: 5000 });
      }
    } catch (error) {
      // Ignore logout errors in cleanup
      console.log('Cleanup logout failed:', error);
    }
  },
});

/**
 * Helper function to wait for API response
 */
export async function waitForApiResponse(
  page: Page,
  urlPattern: string | RegExp,
  timeout: number = 10000
) {
  return page.waitForResponse(
    (response) => {
      const url = response.url();
      if (typeof urlPattern === 'string') {
        return url.includes(urlPattern);
      }
      return urlPattern.test(url);
    },
    { timeout }
  );
}

/**
 * Helper function to wait for toast message
 */
export async function waitForToast(page: Page, type: 'success' | 'error' | 'info' = 'success') {
  const toastSelector = `[data-testid="toast-${type}"], .toast-${type}, [role="status"]`;
  await expect(page.locator(toastSelector).first()).toBeVisible({ timeout: 10000 });
}

/**
 * Helper function to fill form fields
 */
export async function fillForm(page: Page, fields: Record<string, string>) {
  for (const [name, value] of Object.entries(fields)) {
    const input = page.locator(`input[name="${name}"], textarea[name="${name}"], select[name="${name}"]`);
    await input.fill(value);
  }
}

/**
 * Helper function to select dropdown option
 */
export async function selectOption(page: Page, selector: string, value: string) {
  await page.click(selector);
  await page.click(`[data-value="${value}"]`);
}

/**
 * Helper function to upload file
 */
export async function uploadFile(page: Page, selector: string, filePath: string) {
  const fileInput = page.locator(selector);
  await fileInput.setInputFiles(filePath);
}

/**
 * Helper function to wait for loading to complete
 */
export async function waitForLoadingComplete(page: Page) {
  // Wait for any loading spinners to disappear
  const loadingSelectors = [
    '[data-testid="loading"]',
    '[data-testid="spinner"]',
    '.loading',
    '.spinner',
    '[aria-label="Loading"]',
  ];

  for (const selector of loadingSelectors) {
    const loader = page.locator(selector);
    if (await loader.isVisible().catch(() => false)) {
      await loader.waitFor({ state: 'hidden', timeout: 30000 });
    }
  }
}

/**
 * Helper function to take screenshot with timestamp
 */
export async function takeTimestampedScreenshot(page: Page, name: string) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  await page.screenshot({ path: `test-results/screenshots/${name}-${timestamp}.png`, fullPage: true });
}

/**
 * Helper to check if element exists
 */
export async function elementExists(page: Page, selector: string): Promise<boolean> {
  try {
    const element = page.locator(selector);
    return await element.count() > 0;
  } catch {
    return false;
  }
}

/**
 * Helper to scroll element into view
 */
export async function scrollIntoView(page: Page, selector: string) {
  await page.locator(selector).scrollIntoViewIfNeeded();
}

/**
 * Re-export expect for convenience
 */
export { expect };
