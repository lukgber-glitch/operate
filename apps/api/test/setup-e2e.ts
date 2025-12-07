/**
 * E2E Test Setup
 * Runs before all E2E tests
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.test if exists
const envPath = resolve(__dirname, '../../../.env.test');
config({ path: envPath });

// Set test environment defaults
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-for-e2e-testing';
process.env.DATABASE_URL =
  process.env.DATABASE_URL || 'postgresql://operate:operate_test@localhost:5432/operate_test';
process.env.REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Increase Jest timeout for E2E tests
jest.setTimeout(30000);

// Global test user credentials
global.testUser = {
  email: process.env.TEST_USER_EMAIL || 'test@operate.guru',
  password: process.env.TEST_USER_PASSWORD || 'TestPassword123!',
};

// Mock external services if needed
if (process.env.MOCK_EXTERNAL_SERVICES === 'true') {
  // Mock email service
  jest.mock('@sendgrid/mail', () => ({
    setApiKey: jest.fn(),
    send: jest.fn().mockResolvedValue([{ statusCode: 202 }]),
  }));

  // Mock Stripe
  jest.mock('stripe', () => {
    return jest.fn().mockImplementation(() => ({
      customers: {
        create: jest.fn().mockResolvedValue({ id: 'cus_test' }),
        retrieve: jest.fn().mockResolvedValue({ id: 'cus_test' }),
      },
      invoices: {
        create: jest.fn().mockResolvedValue({ id: 'inv_test' }),
      },
    }));
  });

  // Mock banking providers
  jest.mock('truelayer-client', () => ({
    AuthAPIClient: jest.fn(),
    DataAPIClient: jest.fn(),
  }));

  jest.mock('plaid', () => ({
    PlaidApi: jest.fn(),
    Configuration: jest.fn(),
    PlaidEnvironments: { sandbox: 'sandbox' },
  }));
}

// Global cleanup
afterAll(async () => {
  // Close database connections
  // Close Redis connections
  // Any other cleanup needed
});

// Console log configuration
if (process.env.SILENT_TESTS === 'true') {
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  };
}

export {};
