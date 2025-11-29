/**
 * Jest Configuration for API Application
 * NestJS-specific test configuration
 *
 * @see https://jestjs.io/docs/configuration
 */

module.exports = {
  displayName: 'api',
  preset: 'ts-jest',
  testEnvironment: 'node',

  // Root directory for tests
  rootDir: '.',

  // Test match patterns
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.spec.ts',
    '<rootDir>/test/**/*.spec.ts',
    '<rootDir>/src/**/*.spec.ts',
  ],

  // Module paths
  modulePaths: ['<rootDir>'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@common/(.*)$': '<rootDir>/src/common/$1',
    '^@modules/(.*)$': '<rootDir>/src/modules/$1',
    '^@config/(.*)$': '<rootDir>/src/config/$1',
    '^@test/(.*)$': '<rootDir>/test/$1',
  },

  // Transform files
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.json',
        isolatedModules: true,
      },
    ],
  },

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],

  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.spec.ts',
    '!src/**/*.interface.ts',
    '!src/**/index.ts',
    '!src/main.ts',
  ],

  // Coverage directory
  coverageDirectory: '<rootDir>/coverage',

  // Coverage reporters
  coverageReporters: ['text', 'lcov', 'html'],

  // Files to ignore
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/coverage/',
  ],

  // Module file extensions
  moduleFileExtensions: ['js', 'json', 'ts'],

  // Clear mocks between tests
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,

  // Detect open handles and async operations
  detectOpenHandles: true,
  forceExit: false,

  // Test timeout (15 seconds for unit/integration tests)
  testTimeout: 15000,

  // Global setup/teardown
  globalSetup: undefined,
  globalTeardown: undefined,

  // Verbose output
  verbose: true,

  // Maximum workers for parallel execution
  maxWorkers: '50%',
};
