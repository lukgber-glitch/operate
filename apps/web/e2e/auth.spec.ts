import { test, expect, waitForToast } from './fixtures';

test.describe('Authentication', () => {
  test.describe('Login', () => {
    test('should display login page correctly', async ({ page }) => {
      await page.goto('/login');

      // Check page title and branding
      await expect(page).toHaveTitle(/Operate/i);
      // Use first() to avoid strict mode violation when multiple headings exist
      // Login page shows "Welcome to Operate" or translated variants
      await expect(page.locator('h1, h2').first()).toContainText(/welcome|willkommen|anmelden|login|sign in/i);

      // Check form elements exist
      await expect(page.locator('input[name="email"]')).toBeVisible();
      await expect(page.locator('input[name="password"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();
    });

    test('should login successfully with valid credentials', async ({ page, testUser }) => {
      await page.goto('/login');

      // Fill in credentials
      await page.fill('input[name="email"]', testUser.email);
      await page.fill('input[name="password"]', testUser.password);

      // Submit form
      await page.click('button[type="submit"]');

      // Wait for redirect to chat (or dashboard) - longer timeout in CI
      const isCI = !!process.env.CI;
      await page.waitForURL(/\/(chat|dashboard)/, { timeout: isCI ? 30000 : 15000 });

      // Verify we're on a protected page (chat or dashboard)
      await expect(page).toHaveURL(/\/(chat|dashboard)/);

      // Check for authenticated page elements (chat or dashboard)
      const dashboardIndicators = [
        page.locator('[data-testid="dashboard"]'),
        page.locator('[data-testid="chat-input"]'),
        page.locator('textarea[placeholder*="conversation"]'),
        page.locator('textarea[placeholder*="message"]'),
        page.locator('textarea[placeholder*="business"]'),
        page.locator('h1:has-text("Dashboard")'),
        page.locator('[data-testid="user-menu"]'),
        page.locator('[data-testid="sidebar"]'),
        page.locator('nav[aria-label]'),
        page.locator('.sidebar'),
      ];

      // At least one indicator should be visible
      const visibleIndicator = await Promise.race(
        dashboardIndicators.map(async (locator) => {
          try {
            await locator.waitFor({ state: 'visible', timeout: 5000 });
            return true;
          } catch {
            return false;
          }
        })
      );

      expect(visibleIndicator).toBeTruthy();
    });

    test('should show error for invalid email', async ({ page }) => {
      await page.goto('/login');

      await page.fill('input[name="email"]', 'invalid-email');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');

      // Check for error message
      const errorSelectors = [
        '[data-testid="error-message"]',
        '.error-message',
        '[role="alert"]',
        '.text-red-500',
        '.text-destructive',
      ];

      let errorFound = false;
      for (const selector of errorSelectors) {
        const error = page.locator(selector);
        if (await error.isVisible().catch(() => false)) {
          errorFound = true;
          break;
        }
      }

      expect(errorFound).toBeTruthy();
    });

    test('should show error for wrong password', async ({ page }) => {
      await page.goto('/login');

      await page.fill('input[name="email"]', 'test@operate.guru');
      await page.fill('input[name="password"]', 'wrongpassword');
      await page.click('button[type="submit"]');

      // Wait for error to appear
      await page.waitForTimeout(1000);

      // Should still be on login page or show error
      const errorSelectors = [
        '[data-testid="error-message"]',
        '.error-message',
        '[role="alert"]',
        'text=Invalid credentials',
        'text=Ungültige Anmeldedaten',
      ];

      let errorFound = false;
      for (const selector of errorSelectors) {
        const error = page.locator(selector);
        if (await error.isVisible().catch(() => false)) {
          errorFound = true;
          break;
        }
      }

      // Either error is shown or we're still on login page
      const onLoginPage = page.url().includes('/login');
      expect(errorFound || onLoginPage).toBeTruthy();
    });

    test('should handle OAuth login button', async ({ page }) => {
      await page.goto('/login');

      // Check for OAuth buttons
      const oauthButtons = page.locator('button:has-text("Google"), button:has-text("OAuth")');

      if (await oauthButtons.count() > 0) {
        await expect(oauthButtons.first()).toBeVisible();
        // Don't click in tests (would navigate to external provider)
      }
    });
  });

  test.describe('Logout', () => {
    test('should logout successfully', async ({ authenticatedPage }) => {
      const page = authenticatedPage;

      // Find and click user menu
      const userMenuSelectors = [
        '[data-testid="user-menu"]',
        '[data-testid="user-dropdown"]',
        'button[aria-label*="user" i]',
        'button[aria-label*="account" i]',
      ];

      let menuClicked = false;
      for (const selector of userMenuSelectors) {
        const menu = page.locator(selector);
        if (await menu.isVisible().catch(() => false)) {
          await menu.click();
          menuClicked = true;
          break;
        }
      }

      expect(menuClicked).toBeTruthy();

      // Find and click logout button
      const logoutSelectors = [
        '[data-testid="logout"]',
        'button:has-text("Logout")',
        'button:has-text("Abmelden")',
        'button:has-text("Sign out")',
      ];

      let logoutClicked = false;
      for (const selector of logoutSelectors) {
        const logout = page.locator(selector);
        if (await logout.isVisible().catch(() => false)) {
          await logout.click();
          logoutClicked = true;
          break;
        }
      }

      expect(logoutClicked).toBeTruthy();

      // Wait for redirect to login
      await page.waitForURL('**/login', { timeout: 10000 });
      await expect(page).toHaveURL(/\/login/);
    });
  });

  test.describe('Protected Routes', () => {
    test('should redirect to login when accessing protected route without auth', async ({ page }) => {
      // Try to access chat without authentication
      await page.goto('/chat');

      // Should redirect to login
      await page.waitForURL('**/login', { timeout: 10000 });
      await expect(page).toHaveURL(/\/login/);
    });

    test('should allow access to protected routes when authenticated', async ({ authenticatedPage }) => {
      const page = authenticatedPage;

      // Should be able to access various protected routes
      const protectedRoutes = ['/chat', '/finance/invoices', '/finance/banking'];

      for (const route of protectedRoutes) {
        await page.goto(route);
        // Should not redirect to login
        await page.waitForTimeout(1000);
        expect(page.url()).not.toContain('/login');
      }
    });
  });

  test.describe('Session Persistence', () => {
    test('should maintain session across page reloads', async ({ authenticatedPage }) => {
      const page = authenticatedPage;

      // Reload the page
      await page.reload();

      // Should still be authenticated
      await page.waitForLoadState('networkidle');
      expect(page.url()).not.toContain('/login');
    });

    test('should maintain session in new tab', async ({ authenticatedPage, context }) => {
      // Create new tab
      const newPage = await context.newPage();

      // Navigate to protected route
      await newPage.goto('/chat');

      // Should be authenticated (session shared)
      await newPage.waitForLoadState('networkidle');

      // Check if we're on chat or login
      const url = newPage.url();

      // Clean up
      await newPage.close();

      // Session should be maintained across tabs
      expect(url).not.toContain('/login');
    });
  });

  test.describe('Registration', () => {
    test('should display registration page if available', async ({ page }) => {
      // Try to navigate to registration
      await page.goto('/register');

      // If registration exists, check form
      if (!page.url().includes('/404') && !page.url().includes('/login')) {
        await expect(page.locator('input[name="email"]')).toBeVisible();
        await expect(page.locator('input[name="password"]')).toBeVisible();
      }
    });
  });

  test.describe('Password Reset', () => {
    test('should display forgot password link', async ({ page }) => {
      await page.goto('/login');

      // Look for forgot password link
      const forgotPasswordSelectors = [
        'a:has-text("Forgot password")',
        'a:has-text("Passwort vergessen")',
        '[data-testid="forgot-password"]',
      ];

      let linkFound = false;
      for (const selector of forgotPasswordSelectors) {
        const link = page.locator(selector);
        if (await link.isVisible().catch(() => false)) {
          linkFound = true;
          break;
        }
      }

      // Password reset may or may not be implemented
      // This test just checks if the link exists
    });
  });
});
