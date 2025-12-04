/**
 * Jest Test Setup
 * Global setup for API tests with database cleanup and mocking utilities
 *
 * This file runs before each test suite
 */

import { PrismaClient } from '@prisma/client';

/**
 * Set test environment variables IMMEDIATELY when this module loads
 * This ensures ConfigModule.forRoot() can access them during test setup
 */
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.DATABASE_URL_TEST || process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.JWT_ACCESS_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-key-for-testing-only';
process.env.JWT_ACCESS_EXPIRES_IN = '15m';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';
process.env.ENCRYPTION_KEY = 'test-encryption-key-32-characters';
process.env.REDIS_HOST = 'localhost';
process.env.REDIS_PORT = '6379';

// Initialize Prisma client for test database
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL_TEST || process.env.DATABASE_URL,
    },
  },
});

/**
 * Global setup - runs once before all tests
 */
beforeAll(async (): Promise<void> => {
  // Ensure database connection is established
  await prisma.$connect();
});

/**
 * Clean database between test suites
 */
beforeEach(async (): Promise<void> => {
  // Clean all tables in reverse order of dependencies
  // This prevents foreign key constraint violations

  // Disable foreign key checks (PostgreSQL specific)
  await prisma.$executeRawUnsafe('SET CONSTRAINTS ALL DEFERRED');

  // Get all table names from the database
  const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename NOT LIKE '_prisma%'
  `;

  // Truncate all tables
  for (const { tablename } of tables) {
    if (tablename !== '_prisma_migrations') {
      await prisma.$executeRawUnsafe(
        `TRUNCATE TABLE "${tablename}" RESTART IDENTITY CASCADE`,
      );
    }
  }
});

/**
 * Global teardown - runs once after all tests
 */
afterAll(async (): Promise<void> => {
  // Disconnect from database
  await prisma.$disconnect();
});

/**
 * Mock timers for consistent test results
 */
jest.setTimeout(15000);

/**
 * Mock external services
 */
jest.mock('@anthropic-ai/sdk', () => ({
  Anthropic: jest.fn().mockImplementation(() => ({
    messages: {
      create: jest.fn().mockResolvedValue({
        content: [{ text: 'Mocked AI response' }],
      }),
    },
  })),
}));

/**
 * Mock Redis for caching tests
 */
jest.mock('ioredis', () => {
  const mockRedis = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    expire: jest.fn(),
    setex: jest.fn(),
    exists: jest.fn(),
    flushall: jest.fn(),
    quit: jest.fn(),
  };
  return jest.fn(() => mockRedis);
});

/**
 * Mock BullMQ for job queue tests
 */
jest.mock('bullmq', () => ({
  Queue: jest.fn().mockImplementation(() => ({
    add: jest.fn().mockResolvedValue({ id: 'test-job-id' }),
    getJob: jest.fn(),
    removeJob: jest.fn(),
    close: jest.fn(),
  })),
  Worker: jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    close: jest.fn(),
  })),
}));

/**
 * Mock external government APIs
 */
jest.mock('@/modules/integrations/elster/elster.service', () => ({
  ElsterService: jest.fn().mockImplementation(() => ({
    submitVATReturn: jest.fn().mockResolvedValue({
      success: true,
      transferTicket: 'test-transfer-ticket',
    }),
    checkSubmissionStatus: jest.fn().mockResolvedValue({
      status: 'SUCCESS',
    }),
  })),
}));

jest.mock('@/modules/integrations/vies/vies.service', () => ({
  ViesService: jest.fn().mockImplementation(() => ({
    validateVAT: jest.fn().mockResolvedValue({
      valid: true,
      name: 'Test Company GmbH',
      address: 'Test Address 123',
    }),
  })),
}));

/**
 * Extend Jest matchers for better assertions
 */
expect.extend({
  /**
   * Custom matcher for UUID validation
   */
  toBeUUID(received: string): jest.CustomMatcherResult {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const pass = uuidRegex.test(received);
    return {
      pass,
      message: () =>
        pass
          ? `expected ${received} not to be a valid UUID`
          : `expected ${received} to be a valid UUID`,
    };
  },

  /**
   * Custom matcher for ISO date string validation
   */
  toBeISODate(received: string): jest.CustomMatcherResult {
    const date = new Date(received);
    const pass = !isNaN(date.getTime()) && received === date.toISOString();
    return {
      pass,
      message: () =>
        pass
          ? `expected ${received} not to be a valid ISO date string`
          : `expected ${received} to be a valid ISO date string`,
    };
  },
});

/**
 * Export Prisma client for use in tests
 */
export { prisma };

/**
 * Type augmentation for custom matchers
 */
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeUUID(): R;
      toBeISODate(): R;
    }
  }
}
