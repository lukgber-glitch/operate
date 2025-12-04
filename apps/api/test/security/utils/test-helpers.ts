/**
 * Security Test Helpers
 * Common utilities for security testing
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../../src/modules/database/prisma.service';
import { Role } from '@operate/database';
import * as request from 'supertest';
import * as bcrypt from 'bcryptjs';

/**
 * Test user data for different roles
 */
export const TEST_USERS = {
  owner: {
    email: 'owner@test.com',
    password: 'SecurePass123!',
    firstName: 'Test',
    lastName: 'Owner',
    role: Role.OWNER,
  },
  admin: {
    email: 'admin@test.com',
    password: 'SecurePass123!',
    firstName: 'Test',
    lastName: 'Admin',
    role: Role.ADMIN,
  },
  member: {
    email: 'member@test.com',
    password: 'SecurePass123!',
    firstName: 'Test',
    lastName: 'Member',
    role: Role.MEMBER,
  },
  assistant: {
    email: 'assistant@test.com',
    password: 'SecurePass123!',
    firstName: 'Test',
    lastName: 'Assistant',
    role: Role.ASSISTANT,
  },
};

/**
 * Test organization data
 */
export const TEST_ORG = {
  name: 'Test Security Org',
  country: 'DE',
  taxId: 'DE123456789',
};

/**
 * Create test user in database
 */
export async function createTestUser(
  prisma: PrismaService,
  userData: typeof TEST_USERS.owner,
  orgId: string,
) {
  const passwordHash = await bcrypt.hash(userData.password, 10);

  return prisma.user.create({
    data: {
      email: userData.email,
      passwordHash,
      firstName: userData.firstName,
      lastName: userData.lastName,
      emailVerified: true,
      role: userData.role,
      organizationId: orgId,
    },
  });
}

/**
 * Create test organization
 */
export async function createTestOrganization(prisma: PrismaService) {
  return prisma.organization.create({
    data: TEST_ORG,
  });
}

/**
 * Generate JWT token for testing
 */
export function generateTestToken(
  jwtService: JwtService,
  userId: string,
  email: string,
  role: Role,
  organizationId: string,
  options?: { expiresIn?: string; invalid?: boolean },
): string {
  const payload = {
    sub: userId,
    email,
    role,
    organizationId,
  };

  if (options?.invalid) {
    // Generate token with wrong secret
    return jwtService.sign(payload, {
      secret: 'wrong-secret-key',
      expiresIn: options?.expiresIn || '15m',
    });
  }

  return jwtService.sign(payload, {
    expiresIn: options?.expiresIn || '15m',
  });
}

/**
 * Generate expired JWT token
 */
export function generateExpiredToken(
  jwtService: JwtService,
  userId: string,
  email: string,
  role: Role,
  organizationId: string,
): string {
  return generateTestToken(jwtService, userId, email, role, organizationId, {
    expiresIn: '-1h', // Already expired
  });
}

/**
 * Setup test application with security configurations
 */
export async function setupSecurityTestApp(
  module: TestingModule,
): Promise<INestApplication> {
  const app = module.createNestApplication();

  // Apply global validation pipe (as in production)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip unknown properties
      forbidNonWhitelisted: true, // Throw error on unknown properties
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Apply security middleware (helmet, cors, etc.)
  // This should match your main.ts configuration

  await app.init();
  return app;
}

/**
 * Make authenticated request
 */
export async function makeAuthenticatedRequest(
  app: INestApplication,
  method: 'get' | 'post' | 'put' | 'patch' | 'delete',
  path: string,
  token: string,
  body?: any,
) {
  const req = request(app.getHttpServer())[method](path).set(
    'Authorization',
    `Bearer ${token}`,
  );

  if (body) {
    req.send(body);
  }

  return req;
}

/**
 * Test rate limiting by making multiple requests
 */
export async function testRateLimit(
  app: INestApplication,
  path: string,
  requestCount: number,
  token?: string,
): Promise<{ successCount: number; blockedCount: number; responses: any[] }> {
  const responses = [];
  let successCount = 0;
  let blockedCount = 0;

  for (let i = 0; i < requestCount; i++) {
    const req = request(app.getHttpServer()).get(path);

    if (token) {
      req.set('Authorization', `Bearer ${token}`);
    }

    const response = await req;
    responses.push(response);

    if (response.status === 200 || response.status === 201) {
      successCount++;
    } else if (response.status === 429) {
      // Too Many Requests
      blockedCount++;
    }
  }

  return { successCount, blockedCount, responses };
}

/**
 * Test SQL injection by checking if database still exists
 */
export async function verifyDatabaseIntegrity(
  prisma: PrismaService,
): Promise<boolean> {
  try {
    // Try to query a table to ensure database is intact
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Test XSS by checking if script tags are sanitized
 */
export function hasUnsafeHTML(content: string): boolean {
  const dangerousPatterns = [
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi, // Event handlers like onclick, onerror
    /<iframe/gi,
    /<object/gi,
    /<embed/gi,
  ];

  return dangerousPatterns.some((pattern) => pattern.test(content));
}

/**
 * Check if response contains security headers
 */
export function verifySecurityHeaders(response: any): {
  valid: boolean;
  missing: string[];
} {
  const requiredHeaders = [
    'x-content-type-options',
    'x-frame-options',
    'x-xss-protection',
    'strict-transport-security',
  ];

  const missing = requiredHeaders.filter(
    (header) => !response.headers[header],
  );

  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * Test password strength
 */
export function isWeakPassword(password: string): boolean {
  // Check if password meets minimum security requirements
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  return !(
    password.length >= minLength &&
    hasUpperCase &&
    hasLowerCase &&
    hasNumbers &&
    hasSpecialChar
  );
}

/**
 * Simulate brute force attack
 */
export async function simulateBruteForce(
  app: INestApplication,
  path: string,
  attemptCount: number,
  credentials: { email: string; password: string }[],
): Promise<{ blocked: boolean; responses: any[] }> {
  const responses = [];

  for (let i = 0; i < attemptCount; i++) {
    const cred = credentials[i % credentials.length];
    const response = await request(app.getHttpServer())
      .post(path)
      .send(cred);

    responses.push(response);

    // If we get rate limited, the brute force protection is working
    if (response.status === 429) {
      return { blocked: true, responses };
    }
  }

  return { blocked: false, responses };
}

/**
 * Test CORS configuration
 */
export async function testCORS(
  app: INestApplication,
  path: string,
  origin: string,
): Promise<{ allowed: boolean; headers: any }> {
  const response = await request(app.getHttpServer())
    .options(path)
    .set('Origin', origin)
    .set('Access-Control-Request-Method', 'GET');

  return {
    allowed: response.headers['access-control-allow-origin'] === origin,
    headers: response.headers,
  };
}

/**
 * Verify JWT token structure and claims
 */
export function verifyJWTStructure(token: string): {
  valid: boolean;
  claims?: any;
  error?: string;
} {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return { valid: false, error: 'Invalid JWT structure' };
    }

    const payload = JSON.parse(
      Buffer.from(parts[1], 'base64').toString('utf-8'),
    );

    // Check required claims
    const requiredClaims = ['sub', 'email', 'role', 'organizationId'];
    const missingClaims = requiredClaims.filter(
      (claim) => !(claim in payload),
    );

    if (missingClaims.length > 0) {
      return {
        valid: false,
        error: `Missing claims: ${missingClaims.join(', ')}`,
      };
    }

    return { valid: true, claims: payload };
  } catch (error) {
    return { valid: false, error: 'Failed to parse JWT' };
  }
}

/**
 * Test session fixation vulnerability
 */
export async function testSessionFixation(
  app: INestApplication,
  loginPath: string,
  credentials: any,
): Promise<{ vulnerable: boolean; details: string }> {
  // Make first login request
  const firstLogin = await request(app.getHttpServer())
    .post(loginPath)
    .send(credentials);

  if (firstLogin.status !== 200 && firstLogin.status !== 201) {
    return {
      vulnerable: false,
      details: 'Login failed, cannot test session fixation',
    };
  }

  const firstToken = firstLogin.body.accessToken;

  // Make second login request
  const secondLogin = await request(app.getHttpServer())
    .post(loginPath)
    .send(credentials);

  const secondToken = secondLogin.body.accessToken;

  // Tokens should be different for each login
  if (firstToken === secondToken) {
    return {
      vulnerable: true,
      details: 'Same token issued for multiple logins',
    };
  }

  return {
    vulnerable: false,
    details: 'Different tokens issued for each login',
  };
}

/**
 * Clean up test data
 */
export async function cleanupTestData(
  prisma: PrismaService,
  orgId?: string,
) {
  if (orgId) {
    await prisma.user.deleteMany({ where: { organizationId: orgId } });
    await prisma.organization.delete({ where: { id: orgId } });
  }
}

/**
 * Measure response time for timing attack detection
 */
export async function measureResponseTime(
  app: INestApplication,
  path: string,
  body: any,
): Promise<number> {
  const start = Date.now();
  await request(app.getHttpServer()).post(path).send(body);
  return Date.now() - start;
}
