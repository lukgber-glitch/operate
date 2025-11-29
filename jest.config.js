/**
 * Root Jest Configuration
 * Multi-project setup for monorepo testing
 *
 * @see https://jestjs.io/docs/configuration
 */

module.exports = {
  projects: [
    '<rootDir>/apps/api/jest.config.js',
    '<rootDir>/apps/web/jest.config.js',
  ],

  // Coverage collection across all projects
  collectCoverageFrom: [
    'apps/*/src/**/*.{ts,tsx}',
    '!apps/*/src/**/*.d.ts',
    '!apps/*/src/**/*.spec.ts',
    '!apps/*/src/**/*.test.ts',
    '!apps/*/src/**/index.ts',
  ],

  // Coverage thresholds (RULES.md requirement: 80% minimum)
  coverageThresholds: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    // Critical modules require 100% coverage
    'apps/api/src/modules/auth/**/*.ts': {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
    'apps/api/src/modules/tax/**/*.ts': {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
    'apps/api/src/modules/finance/**/*.ts': {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
  },

  // Coverage directory
  coverageDirectory: '<rootDir>/coverage',

  // Coverage reporters
  coverageReporters: [
    'text',
    'text-summary',
    'html',
    'lcov',
    'json',
  ],

  // Test timeout (30 seconds)
  testTimeout: 30000,

  // Verbose output
  verbose: true,
};
