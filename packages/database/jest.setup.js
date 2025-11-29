/**
 * Jest Setup File
 *
 * Runs before all tests to configure the testing environment.
 */

// Set test environment variables
process.env.NODE_ENV = 'test';

// Suppress console output during tests (optional - comment out if you want logs)
// global.console = {
//   ...console,
//   log: jest.fn(),
//   debug: jest.fn(),
//   info: jest.fn(),
//   warn: jest.fn(),
// };

// Add custom matchers or global test utilities here if needed
