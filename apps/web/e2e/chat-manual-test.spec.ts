import { test, expect } from '@playwright/test';

/**
 * Manual Chat & AI Interface E2E Test
 * Tests the chat interface without authentication to check UI elements
 */

test.describe('Chat & AI Interface - Manual Test', () => {
  test('should navigate to login page and take screenshot', async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');

    // Take screenshot of login page
    await page.screenshot({
      path: 'test-results/screenshots/01-login-page.png',
      fullPage: true
    });

    expect(page.url()).toContain('/login');
  });

  test('should check if chat page is accessible (may redirect)', async ({ page }) => {
    await page.goto('http://localhost:3000/chat');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Take screenshot - may show login redirect or chat page
    await page.screenshot({
      path: 'test-results/screenshots/02-chat-page-unauthenticated.png',
      fullPage: true
    });

    const url = page.url();
    console.log('Current URL after navigating to /chat:', url);

    // Check if redirected to login or shows chat
    const isLoginPage = url.includes('/login');
    const isChatPage = url.includes('/chat');

    expect(isLoginPage || isChatPage).toBeTruthy();
  });

  test('should attempt login and document result', async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');

    // Fill login form
    await page.fill('input[name="email"]', 'luk.gber@gmail.com');
    await page.fill('input[name="password"]', 'Schlagzeug1@');

    // Take screenshot before submission
    await page.screenshot({
      path: 'test-results/screenshots/03-login-form-filled.png',
      fullPage: true
    });

    // Submit
    await page.click('button[type="submit"]');

    // Wait for response
    await page.waitForTimeout(3000);
    await page.waitForLoadState('networkidle');

    // Take screenshot after submission
    await page.screenshot({
      path: 'test-results/screenshots/04-after-login-submit.png',
      fullPage: true
    });

    const url = page.url();
    console.log('URL after login attempt:', url);

    // Check for error messages
    const errorSelectors = [
      '.text-red-500',
      '[role="alert"]',
      '.error',
      'text=not verified',
      'text=invalid',
    ];

    for (const selector of errorSelectors) {
      const error = page.locator(selector);
      if (await error.isVisible().catch(() => false)) {
        const errorText = await error.textContent();
        console.log('Error found:', errorText);
      }
    }
  });

  test('should check chat page structure if accessible', async ({ page }) => {
    // Try to access chat directly
    await page.goto('http://localhost:3000/chat');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const url = page.url();

    if (url.includes('/chat')) {
      // We're on the chat page, document its structure
      await page.screenshot({
        path: 'test-results/screenshots/05-chat-interface.png',
        fullPage: true
      });

      // Check for key chat elements
      const elements = {
        chatInput: await page.locator('textarea, input[type="text"]').count(),
        sendButton: await page.locator('button[type="submit"]').count(),
        suggestions: await page.locator('[data-testid*="suggestion"]').count(),
        quickActions: await page.locator('[data-testid*="action"]').count(),
        header: await page.locator('header, [data-testid="header"]').count(),
      };

      console.log('Chat page elements found:', elements);
    } else {
      console.log('Chat page not accessible, redirected to:', url);
      await page.screenshot({
        path: 'test-results/screenshots/05-chat-redirect.png',
        fullPage: true
      });
    }
  });

  test('should document dashboard structure', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await page.screenshot({
      path: 'test-results/screenshots/06-dashboard-page.png',
      fullPage: true
    });

    const url = page.url();
    console.log('Dashboard URL:', url);
  });

  test('should check for chat button in dashboard/navigation', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    // Look for chat navigation
    const chatNavSelectors = [
      'a[href*="/chat"]',
      'button:has-text("Chat")',
      '[data-testid="chat-button"]',
      'nav a:has-text("Chat")',
    ];

    let chatNavFound = false;
    for (const selector of chatNavSelectors) {
      const nav = page.locator(selector);
      if (await nav.isVisible().catch(() => false)) {
        chatNavFound = true;
        console.log('Chat navigation found with selector:', selector);

        // Highlight it in screenshot
        await nav.evaluate(el => {
          el.style.border = '3px solid red';
        });
        break;
      }
    }

    await page.screenshot({
      path: 'test-results/screenshots/07-chat-navigation.png',
      fullPage: true
    });

    console.log('Chat navigation visible:', chatNavFound);
  });
});
