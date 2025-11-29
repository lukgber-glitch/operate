/**
 * Playwright E2E Testing Configuration
 * Enterprise-grade end-to-end testing setup
 *
 * @see https://playwright.dev/docs/test-configuration
 */

import { defineConfig, devices } from '@playwright/test';

/**
 * Environment variables for test configuration
 */
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const API_URL = process.env.API_URL || 'http://localhost:3001';
const CI = !!process.env.CI;

export default defineConfig({
  // Test directory
  testDir: './tests/e2e',

  // Test file patterns
  testMatch: '**/*.spec.ts',

  // Folder for test artifacts
  outputDir: './test-results',

  // Maximum time one test can run
  timeout: 30 * 1000,

  // Expect timeout
  expect: {
    timeout: 5000,
  },

  // Run tests in files in parallel
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: CI,

  // Retry on CI only
  retries: CI ? 2 : 0,

  // Opt out of parallel tests on CI
  workers: CI ? 1 : undefined,

  // Reporter to use
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['list'],
    ...(CI ? [['github'] as const] : []),
  ],

  // Shared settings for all the projects below
  use: {
    // Base URL to use in actions like `await page.goto('/')`
    baseURL: BASE_URL,

    // Collect trace on test failure in CI
    trace: CI ? 'on-first-retry' : 'retain-on-failure',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Video on failure
    video: 'retain-on-failure',

    // Viewport size
    viewport: { width: 1280, height: 720 },

    // Maximum time for each action
    actionTimeout: 10000,

    // Navigation timeout
    navigationTimeout: 30000,

    // Browser context options
    ignoreHTTPSErrors: true,

    // Extra HTTP headers
    extraHTTPHeaders: {
      'Accept-Language': 'en-US',
    },
  },

  // Configure projects for major browsers
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    // Mobile testing
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },

    // Tablet testing
    {
      name: 'iPad',
      use: { ...devices['iPad Pro'] },
    },
  ],

  // Run your local dev server before starting the tests
  webServer: [
    {
      command: 'npm run dev:web',
      url: BASE_URL,
      timeout: 120 * 1000,
      reuseExistingServer: !CI,
      stdout: 'ignore',
      stderr: 'pipe',
    },
    {
      command: 'npm run dev:api',
      url: `${API_URL}/health`,
      timeout: 120 * 1000,
      reuseExistingServer: !CI,
      stdout: 'ignore',
      stderr: 'pipe',
    },
  ],

  // Global setup/teardown
  globalSetup: undefined,
  globalTeardown: undefined,
});
