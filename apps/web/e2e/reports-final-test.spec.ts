import { test, expect } from '@playwright/test';

test.describe('Reports Page - Final Test After Onboarding Fix', () => {
  test('should show reports page with correct styling after login', async ({ page }) => {
    // Step 1: Navigate to login
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');

    // Step 2: Fill email
    await page.fill('input[name="email"]', 'luk.gber@gmail.com');

    // Step 3: Fill password
    await page.fill('input[name="password"]', 'Schlagzeug1@');

    // Step 4: Click submit
    await page.click('button[type="submit"]');

    // Step 5: Wait for redirect (3 seconds)
    await page.waitForTimeout(3000);
    await page.waitForLoadState('networkidle');

    // Step 6: Navigate to reports
    await page.goto('http://localhost:3000/reports');
    await page.waitForLoadState('networkidle');

    // Step 7: Take screenshot
    await page.screenshot({
      path: '.planning/phases/20-full-app-testing/reports-final.png',
      fullPage: true
    });

    // Step 8: Verify - Page shows REPORTS interface (NOT onboarding)
    const pageContent = await page.textContent('body');

    // Should NOT contain onboarding content
    expect(pageContent).not.toContain('Welcome to Operate');
    expect(pageContent).not.toContain('Let\'s get started');
    expect(pageContent).not.toContain('Company Information');

    // SHOULD contain reports content
    const hasReportsHeading = await page.locator('h1, h2').filter({ hasText: /reports|Reports/i }).count();
    expect(hasReportsHeading).toBeGreaterThan(0);

    // Verify Geist Sans font
    const bodyFont = await page.evaluate(() => {
      return window.getComputedStyle(document.body).fontFamily;
    });
    expect(bodyFont.toLowerCase()).toContain('geist');

    // Verify blue theme colors (check for common blue values)
    const hasBlueTheme = await page.evaluate(() => {
      const allElements = document.querySelectorAll('*');
      let foundBlue = false;

      for (const el of allElements) {
        const styles = window.getComputedStyle(el);
        const bgColor = styles.backgroundColor;
        const color = styles.color;
        const borderColor = styles.borderColor;

        // Check for blue hues (rgb with blue component higher than red/green)
        const colors = [bgColor, color, borderColor];
        for (const c of colors) {
          if (c.includes('rgb')) {
            const match = c.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
            if (match) {
              const [, r, g, b] = match.map(Number);
              // Blue theme: blue component should be significant
              if (b > 100 && (b > r || b > g)) {
                foundBlue = true;
                break;
              }
            }
          }
        }
        if (foundBlue) break;
      }

      return foundBlue;
    });

    expect(hasBlueTheme).toBe(true);

    console.log('✅ Reports page test PASSED');
    console.log('- Shows REPORTS interface (not onboarding)');
    console.log('- Font is Geist Sans');
    console.log('- Blue theme colors present');
  });
});
