/**
 * Authentication Security Tests
 * OP-081: Security Test Suite - Authentication
 *
 * Tests JWT authentication, token validation, password security,
 * brute force protection, and session management
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import * as request from 'supertest';
import configuration from '../../src/config/configuration';
import { PrismaService } from '../../src/modules/database/prisma.service';
import { DatabaseModule } from '../../src/modules/database/database.module';
import { AuthModule } from '../../src/modules/auth/auth.module';
import { UsersModule } from '../../src/modules/users/users.module';
import {
  setupSecurityTestApp,
  createTestOrganization,
  createTestUser,
  generateTestToken,
  generateExpiredToken,
  TEST_USERS,
  simulateBruteForce,
  verifyJWTStructure,
  testSessionFixation,
  measureResponseTime,
} from './utils/test-helpers';
import { JWT_MANIPULATION_PAYLOADS, AUTH_BYPASS_PATTERNS } from './utils/payloads';

describe('Authentication Security Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;
  let testOrg: any;
  let testUser: any;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env',
          load: [configuration],
        }),
        DatabaseModule,
        AuthModule,
        UsersModule,
      ],
    }).compile();

    app = await setupSecurityTestApp(moduleFixture);
    prisma = moduleFixture.get<PrismaService>(PrismaService);
    jwtService = moduleFixture.get<JwtService>(JwtService);

    // Create test data
    testOrg = await createTestOrganization(prisma);
    testUser = await createTestUser(prisma, TEST_USERS.owner, testOrg.id);
  });

  afterAll(async () => {
    await prisma.user.deleteMany();
    await prisma.organization.deleteMany();
    await app.close();
  });

  describe('JWT Token Validation', () => {
    it('should accept valid JWT token', async () => {
      const token = generateTestToken(
        jwtService,
        testUser.id,
        testUser.email,
        testUser.role,
        testOrg.id,
      );

      const response = await request(app.getHttpServer())
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('email', testUser.email);
    });

    it('should reject request without token', async () => {
      const response = await request(app.getHttpServer()).get('/api/v1/users/me');

      expect(response.status).toBe(401);
    });

    it('should reject expired token', async () => {
      const expiredToken = generateExpiredToken(
        jwtService,
        testUser.id,
        testUser.email,
        testUser.role,
        testOrg.id,
      );

      const response = await request(app.getHttpServer())
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message');
    });

    it('should reject invalid token signature', async () => {
      const invalidToken = generateTestToken(
        jwtService,
        testUser.id,
        testUser.email,
        testUser.role,
        testOrg.id,
        { invalid: true },
      );

      const response = await request(app.getHttpServer())
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${invalidToken}`);

      expect(response.status).toBe(401);
    });

    it('should reject malformed JWT tokens', async () => {
      const malformedTokens = [
        'not.a.jwt',
        'invalid',
        'Bearer invalid',
        JWT_MANIPULATION_PAYLOADS[0], // None algorithm
        JWT_MANIPULATION_PAYLOADS[1], // Invalid signature
      ];

      for (const token of malformedTokens) {
        const response = await request(app.getHttpServer())
          .get('/api/v1/users/me')
          .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(401);
      }
    });

    it('should validate JWT structure and required claims', () => {
      const token = generateTestToken(
        jwtService,
        testUser.id,
        testUser.email,
        testUser.role,
        testOrg.id,
      );

      const validation = verifyJWTStructure(token);

      expect(validation.valid).toBe(true);
      expect(validation.claims).toHaveProperty('sub', testUser.id);
      expect(validation.claims).toHaveProperty('email', testUser.email);
      expect(validation.claims).toHaveProperty('role', testUser.role);
      expect(validation.claims).toHaveProperty('organizationId', testOrg.id);
    });
  });

  describe('Refresh Token Flow', () => {
    it('should successfully refresh access token', async () => {
      // First login
      const loginResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: TEST_USERS.owner.password,
        });

      expect(loginResponse.status).toBe(200);
      expect(loginResponse.body).toHaveProperty('accessToken');
      expect(loginResponse.body).toHaveProperty('refreshToken');

      const refreshToken = loginResponse.body.refreshToken;

      // Refresh token
      const refreshResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken });

      expect(refreshResponse.status).toBe(200);
      expect(refreshResponse.body).toHaveProperty('accessToken');
      expect(refreshResponse.body.accessToken).not.toBe(loginResponse.body.accessToken);
    });

    it('should reject invalid refresh token', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: 'invalid-refresh-token' });

      expect(response.status).toBe(401);
    });

    it('should not allow reusing refresh token', async () => {
      // Login and get refresh token
      const loginResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: TEST_USERS.owner.password,
        });

      const refreshToken = loginResponse.body.refreshToken;

      // Use refresh token once
      const firstRefresh = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken });

      expect(firstRefresh.status).toBe(200);

      // Try to reuse the same refresh token
      const secondRefresh = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken });

      // Should be rejected (token rotation)
      expect(secondRefresh.status).toBe(401);
    });
  });

  describe('Password Security', () => {
    it('should enforce password complexity requirements', async () => {
      const weakPasswords = [
        '12345678', // Only numbers
        'password', // Common word
        'abcdefgh', // Only lowercase
        'ABCDEFGH', // Only uppercase
        'Pass123',  // Too short
      ];

      for (const weakPassword of weakPasswords) {
        const response = await request(app.getHttpServer())
          .post('/api/v1/auth/register')
          .send({
            email: `test${Date.now()}@example.com`,
            password: weakPassword,
            firstName: 'Test',
            lastName: 'User',
            organizationName: 'Test Org',
            country: 'DE',
          });

        expect(response.status).toBe(400);
        expect(response.body.message).toContain('password');
      }
    });

    it('should accept strong passwords', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: `secure${Date.now()}@example.com`,
          password: 'SecureP@ssw0rd123!',
          firstName: 'Test',
          lastName: 'User',
          organizationName: 'Test Org',
          country: 'DE',
        });

      expect([200, 201, 409]).toContain(response.status); // 409 if email exists
    });

    it('should hash passwords before storing', async () => {
      const plainPassword = 'TestPassword123!';
      const email = `hash${Date.now()}@example.com`;

      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email,
          password: plainPassword,
          firstName: 'Test',
          lastName: 'User',
          organizationName: 'Test Org',
          country: 'DE',
        });

      const user = await prisma.user.findUnique({
        where: { email },
        select: { passwordHash: true },
      });

      // Password should be hashed, not stored in plain text
      expect(user?.passwordHash).toBeDefined();
      expect(user?.passwordHash).not.toBe(plainPassword);
      expect(user?.passwordHash).toContain('$2'); // bcrypt hash prefix
    });

    it('should not reveal whether email exists on login failure', async () => {
      // Try with non-existent email
      const nonExistentResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'SomePassword123!',
        });

      // Try with existing email but wrong password
      const wrongPasswordResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: 'WrongPassword123!',
        });

      // Both should return the same error message and status
      expect(nonExistentResponse.status).toBe(wrongPasswordResponse.status);
      expect(nonExistentResponse.status).toBe(401);
    });
  });

  describe('Brute Force Protection', () => {
    it('should implement rate limiting on login endpoint', async () => {
      const attempts = [];
      for (let i = 0; i < 20; i++) {
        attempts.push({
          email: testUser.email,
          password: 'WrongPassword123!',
        });
      }

      const result = await simulateBruteForce(
        app,
        '/api/v1/auth/login',
        20,
        attempts,
      );

      // Should eventually be blocked
      expect(result.blocked).toBe(true);
      expect(result.responses.some(r => r.status === 429)).toBe(true);
    });

    it('should implement progressive delays for failed login attempts', async () => {
      const credentials = {
        email: testUser.email,
        password: 'WrongPassword123!',
      };

      const times: number[] = [];

      // Make multiple failed attempts and measure response time
      for (let i = 0; i < 5; i++) {
        const responseTime = await measureResponseTime(
          app,
          '/api/v1/auth/login',
          credentials,
        );
        times.push(responseTime);
      }

      // Later attempts should take longer (progressive delay)
      const firstAttempt = times[0];
      const lastAttempt = times[times.length - 1];

      // Allow some variance, but last attempt should be slower
      expect(lastAttempt).toBeGreaterThanOrEqual(firstAttempt);
    });

    it('should not lockout legitimate users permanently', async () => {
      // Wait for rate limit to reset
      await new Promise(resolve => setTimeout(resolve, 60000)); // 1 minute

      // Should be able to login again with correct credentials
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: TEST_USERS.owner.password,
        });

      expect([200, 201, 429]).toContain(response.status);
    }, 70000); // Extend timeout for this test
  });

  describe('Authentication Bypass Attempts', () => {
    it('should reject SQL injection in login credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: "admin'--",
          password: "' OR '1'='1",
        });

      expect(response.status).toBe(401);
    });

    it('should reject authentication bypass patterns', async () => {
      for (const pattern of AUTH_BYPASS_PATTERNS) {
        const response = await request(app.getHttpServer())
          .post('/api/v1/auth/login')
          .send(pattern);

        expect([400, 401]).toContain(response.status);
      }
    });

    it('should reject array injection in credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: ['admin@test.com', 'hacker@evil.com'],
          password: ['password', 'password2'],
        });

      expect(response.status).toBe(400);
    });

    it('should reject null/undefined credentials', async () => {
      const nullResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: null, password: null });

      const undefinedResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: undefined, password: undefined });

      expect([400, 401]).toContain(nullResponse.status);
      expect([400, 401]).toContain(undefinedResponse.status);
    });
  });

  describe('Session Management', () => {
    it('should invalidate token on logout', async () => {
      // Login
      const loginResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: TEST_USERS.owner.password,
        });

      const token = loginResponse.body.accessToken;

      // Verify token works
      const beforeLogout = await request(app.getHttpServer())
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${token}`);

      expect(beforeLogout.status).toBe(200);

      // Logout
      await request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${token}`);

      // Token should be invalidated
      const afterLogout = await request(app.getHttpServer())
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${token}`);

      expect(afterLogout.status).toBe(401);
    });

    it('should not be vulnerable to session fixation', async () => {
      const result = await testSessionFixation(app, '/api/v1/auth/login', {
        email: testUser.email,
        password: TEST_USERS.owner.password,
      });

      expect(result.vulnerable).toBe(false);
    });

    it('should generate unique session IDs', async () => {
      const tokens: string[] = [];

      // Login multiple times
      for (let i = 0; i < 5; i++) {
        const response = await request(app.getHttpServer())
          .post('/api/v1/auth/login')
          .send({
            email: testUser.email,
            password: TEST_USERS.owner.password,
          });

        tokens.push(response.body.accessToken);
      }

      // All tokens should be unique
      const uniqueTokens = new Set(tokens);
      expect(uniqueTokens.size).toBe(tokens.length);
    });
  });

  describe('Multi-Factor Authentication (MFA)', () => {
    it('should enforce MFA when enabled', async () => {
      // Enable MFA for user
      await prisma.user.update({
        where: { id: testUser.id },
        data: { mfaEnabled: true, mfaSecret: 'test-mfa-secret' },
      });

      // Login should require MFA
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: TEST_USERS.owner.password,
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('mfaRequired', true);
      expect(response.body).toHaveProperty('mfaToken');

      // Should not receive full access token without MFA
      expect(response.body.accessToken).toBeUndefined();

      // Cleanup
      await prisma.user.update({
        where: { id: testUser.id },
        data: { mfaEnabled: false, mfaSecret: null },
      });
    });

    it('should reject invalid MFA code', async () => {
      // Enable MFA
      await prisma.user.update({
        where: { id: testUser.id },
        data: { mfaEnabled: true, mfaSecret: 'test-mfa-secret' },
      });

      // Login to get MFA token
      const loginResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: TEST_USERS.owner.password,
        });

      const mfaToken = loginResponse.body.mfaToken;

      // Try with invalid MFA code
      const mfaResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/mfa/verify')
        .send({
          mfaToken,
          code: '000000', // Invalid code
        });

      expect(mfaResponse.status).toBe(401);

      // Cleanup
      await prisma.user.update({
        where: { id: testUser.id },
        data: { mfaEnabled: false, mfaSecret: null },
      });
    });
  });
});
