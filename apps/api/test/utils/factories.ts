/**
 * Test Data Factories
 * Generate realistic test data for entities
 *
 * Uses the Factory pattern to create consistent test data
 */

import { v4 as uuidv4 } from 'uuid';

/**
 * Organization factory
 */
export const OrganizationFactory = {
  /**
   * Build a test organization
   */
  build(overrides?: Partial<any>): any {
    return {
      id: uuidv4(),
      name: 'Test Organization GmbH',
      taxId: 'DE123456789',
      vatId: 'DE123456789',
      countryCode: 'DE',
      currency: 'EUR',
      timezone: 'Europe/Berlin',
      locale: 'de-DE',
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  },

  /**
   * Build multiple organizations
   */
  buildList(count: number, overrides?: Partial<any>): any[] {
    return Array.from({ length: count }, () => this.build(overrides));
  },
};

/**
 * User factory
 */
export const UserFactory = {
  /**
   * Build a test user
   */
  build(overrides?: Partial<any>): any {
    const id = overrides?.id || uuidv4();
    const timestamp = new Date();

    return {
      id,
      email: `user-${id.slice(0, 8)}@example.com`,
      firstName: 'Test',
      lastName: 'User',
      passwordHash: '$2b$10$test.hash.for.password',
      emailVerified: true,
      mfaEnabled: false,
      locale: 'de-DE',
      timezone: 'Europe/Berlin',
      createdAt: timestamp,
      updatedAt: timestamp,
      lastLoginAt: null,
      ...overrides,
    };
  },

  /**
   * Build multiple users
   */
  buildList(count: number, overrides?: Partial<any>): any[] {
    return Array.from({ length: count }, () => this.build(overrides));
  },
};

/**
 * Membership factory
 */
export const MembershipFactory = {
  /**
   * Build a test membership
   */
  build(overrides?: Partial<any>): any {
    return {
      id: uuidv4(),
      userId: overrides?.userId || uuidv4(),
      orgId: overrides?.orgId || uuidv4(),
      role: 'MEMBER',
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  },

  /**
   * Build multiple memberships
   */
  buildList(count: number, overrides?: Partial<any>): any[] {
    return Array.from({ length: count }, () => this.build(overrides));
  },
};

/**
 * Invoice factory
 */
export const InvoiceFactory = {
  /**
   * Build a test invoice
   */
  build(overrides?: Partial<any>): any {
    const invoiceNumber = `INV-${Date.now()}`;

    return {
      id: uuidv4(),
      orgId: overrides?.orgId || uuidv4(),
      invoiceNumber,
      status: 'DRAFT',
      issueDate: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      currency: 'EUR',
      subtotal: 10000, // 100.00 EUR in cents
      taxAmount: 1900, // 19.00 EUR (19% VAT)
      totalAmount: 11900, // 119.00 EUR
      paidAmount: 0,
      clientName: 'Test Client GmbH',
      clientEmail: 'client@example.com',
      clientVatId: 'DE987654321',
      notes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  },

  /**
   * Build multiple invoices
   */
  buildList(count: number, overrides?: Partial<any>): any[] {
    return Array.from({ length: count }, () => this.build(overrides));
  },
};

/**
 * Employee factory
 */
export const EmployeeFactory = {
  /**
   * Build a test employee
   */
  build(overrides?: Partial<any>): any {
    const id = uuidv4();

    return {
      id,
      orgId: overrides?.orgId || uuidv4(),
      employeeNumber: `EMP-${id.slice(0, 8)}`,
      firstName: 'Max',
      lastName: 'Mustermann',
      email: `max.mustermann-${id.slice(0, 8)}@example.com`,
      dateOfBirth: new Date('1990-01-15'),
      nationality: 'DE',
      taxId: 'DE123456789',
      socialSecurityNumber: '12345678901',
      status: 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  },

  /**
   * Build multiple employees
   */
  buildList(count: number, overrides?: Partial<any>): any[] {
    return Array.from({ length: count }, () => this.build(overrides));
  },
};

/**
 * Transaction factory
 */
export const TransactionFactory = {
  /**
   * Build a test transaction
   */
  build(overrides?: Partial<any>): any {
    return {
      id: uuidv4(),
      orgId: overrides?.orgId || uuidv4(),
      accountId: overrides?.accountId || uuidv4(),
      amount: -5000, // -50.00 EUR (negative = expense)
      currency: 'EUR',
      description: 'Office supplies purchase',
      merchantName: 'Office Depot',
      merchantCategory: 'OFFICE_SUPPLIES',
      date: new Date(),
      status: 'COMPLETED',
      category: null,
      isDeductible: null,
      deductionPercentage: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  },

  /**
   * Build multiple transactions
   */
  buildList(count: number, overrides?: Partial<any>): any[] {
    return Array.from({ length: count }, () => this.build(overrides));
  },
};

/**
 * Country factory
 */
export const CountryFactory = {
  /**
   * Build a test country configuration
   */
  build(overrides?: Partial<any>): any {
    return {
      id: uuidv4(),
      code: 'DE',
      name: 'Germany',
      nameLocal: 'Deutschland',
      currency: 'EUR',
      locale: 'de-DE',
      timezone: 'Europe/Berlin',
      dateFormat: 'DD.MM.YYYY',
      standardVatRate: 19.0,
      reducedVatRate: 7.0,
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  },

  /**
   * Build multiple countries
   */
  buildList(count: number, overrides?: Partial<any>): any[] {
    return Array.from({ length: count }, () => this.build(overrides));
  },

  /**
   * Build Germany country config
   */
  germany(): any {
    return this.build({
      code: 'DE',
      name: 'Germany',
      nameLocal: 'Deutschland',
      standardVatRate: 19.0,
      reducedVatRate: 7.0,
    });
  },

  /**
   * Build Austria country config
   */
  austria(): any {
    return this.build({
      code: 'AT',
      name: 'Austria',
      nameLocal: 'Österreich',
      standardVatRate: 20.0,
      reducedVatRate: 10.0,
      locale: 'de-AT',
      timezone: 'Europe/Vienna',
    });
  },

  /**
   * Build Switzerland country config
   */
  switzerland(): any {
    return this.build({
      code: 'CH',
      name: 'Switzerland',
      nameLocal: 'Schweiz',
      currency: 'CHF',
      standardVatRate: 7.7,
      reducedVatRate: 2.5,
      locale: 'de-CH',
      timezone: 'Europe/Zurich',
    });
  },
};

/**
 * JWT Token factory
 */
export const TokenFactory = {
  /**
   * Generate a test access token payload
   */
  accessTokenPayload(overrides?: Partial<any>): any {
    return {
      sub: overrides?.userId || uuidv4(),
      email: overrides?.email || 'test@example.com',
      orgId: overrides?.orgId || uuidv4(),
      role: overrides?.role || 'MEMBER',
      type: 'access',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 15 * 60, // 15 minutes
      ...overrides,
    };
  },

  /**
   * Generate a test refresh token payload
   */
  refreshTokenPayload(overrides?: Partial<any>): any {
    return {
      sub: overrides?.userId || uuidv4(),
      type: 'refresh',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 days
      ...overrides,
    };
  },
};

/**
 * Date utilities for tests
 */
export const DateFactory = {
  /**
   * Get date N days ago
   */
  daysAgo(days: number): Date {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date;
  },

  /**
   * Get date N days from now
   */
  daysFromNow(days: number): Date {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date;
  },

  /**
   * Get first day of current month
   */
  startOfMonth(): Date {
    const date = new Date();
    return new Date(date.getFullYear(), date.getMonth(), 1);
  },

  /**
   * Get last day of current month
   */
  endOfMonth(): Date {
    const date = new Date();
    return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
  },

  /**
   * Get first day of current year
   */
  startOfYear(): Date {
    const date = new Date();
    return new Date(date.getFullYear(), 0, 1);
  },

  /**
   * Get last day of current year
   */
  endOfYear(): Date {
    const date = new Date();
    return new Date(date.getFullYear(), 11, 31, 23, 59, 59, 999);
  },
};
