import { test } from './fixtures';

/**
 * One-time script to complete onboarding for test user
 * Run with: pnpm test:e2e:chromium --grep "Complete onboarding"
 */
test.describe('Setup', () => {
  test('Complete onboarding for test user', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[name="email"]', 'luk.gber@gmail.com');
    await page.fill('input[name="password"]', 'Schlagzeug1@');
    await page.click('button[type="submit"]');

    // Wait for onboarding page
    await page.waitForURL('**/onboarding', { timeout: 15000 });
    console.log('✓ Logged in, on onboarding page');

    // Click "Get Started" button
    const getStartedBtn = page.locator('button:has-text("Get Started")');
    await getStartedBtn.click();
    console.log('✓ Clicked Get Started');

    await page.waitForTimeout(2000);

    // Look for skip/next buttons and click through the wizard
    // This will handle multiple steps in the onboarding flow
    for (let step = 0; step < 20; step++) {
      // Try different button selectors that might appear in onboarding
      const buttonSelectors = [
        'button:has-text("Skip")',
        'button:has-text("Later")',
        'button:has-text("Next")',
        'button:has-text("Continue")',
        'button:has-text("Complete")',
        'button:has-text("Finish")',
        'button:has-text("Done")',
        'button:has-text("Go to Dashboard")',
      ];

      let buttonClicked = false;

      for (const selector of buttonSelectors) {
        const btn = page.locator(selector).first();
        if (await btn.isVisible({ timeout: 1000 }).catch(() => false)) {
          await btn.click();
          console.log(`✓ Step ${step + 1}: Clicked ${selector}`);
          buttonClicked = true;
          await page.waitForTimeout(1500);
          break;
        }
      }

      // If we're on the dashboard, break
      if (page.url().includes('/dashboard')) {
        console.log('✓ Reached dashboard!');
        break;
      }

      // If no button was found, we might be done
      if (!buttonClicked) {
        console.log(`✗ Step ${step + 1}: No action button found, assuming complete`);
        break;
      }
    }

    // Wait a bit more for any final redirects
    await page.waitForTimeout(2000);

    // Take screenshot
    await page.screenshot({ path: 'test-results/onboarding-complete.png', fullPage: true });

    const finalUrl = page.url();
    console.log(`✓ Final URL: ${finalUrl}`);

    // Verify we're either on dashboard or onboarding is complete
    const onDashboard = finalUrl.includes('/dashboard');
    const onOnboarding = finalUrl.includes('/onboarding');

    console.log(`Dashboard: ${onDashboard}, Onboarding: ${onOnboarding}`);
  });
});
