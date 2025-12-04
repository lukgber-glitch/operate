/**
 * Input Validation Security Tests
 * OP-081: Security Test Suite - Input Validation
 *
 * Tests SQL injection, XSS, command injection, path traversal,
 * and other input validation security measures
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
  TEST_USERS,
  verifyDatabaseIntegrity,
  hasUnsafeHTML,
} from './utils/test-helpers';
import {
  SQL_INJECTION_PAYLOADS,
  XSS_PAYLOADS,
  COMMAND_INJECTION_PAYLOADS,
  PATH_TRAVERSAL_PAYLOADS,
  NOSQL_INJECTION_PAYLOADS,
  XXE_PAYLOADS,
  HEADER_INJECTION_PAYLOADS,
  BUFFER_OVERFLOW_PATTERNS,
  SSRF_PAYLOADS,
} from './utils/payloads';

describe('Input Validation Security Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;
  let testOrg: any;
  let testUser: any;
  let authToken: string;

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
    authToken = generateTestToken(
      jwtService,
      testUser.id,
      testUser.email,
      testUser.role,
      testOrg.id,
    );
  });

  afterAll(async () => {
    await prisma.user.deleteMany();
    await prisma.organization.deleteMany();
    await app.close();
  });

  describe('SQL Injection Prevention', () => {
    it('should reject SQL injection in search parameter', async () => {
      for (const payload of SQL_INJECTION_PAYLOADS) {
        const response = await request(app.getHttpServer())
          .get('/api/v1/users')
          .query({ search: payload })
          .set('Authorization', `Bearer ${authToken}`);

        // Should not result in server error
        expect(response.status).not.toBe(500);
        expect([200, 400, 422]).toContain(response.status);
      }

      // Database should still be intact
      const dbIntact = await verifyDatabaseIntegrity(prisma);
      expect(dbIntact).toBe(true);
    });

    it('should sanitize SQL injection in email field', async () => {
      for (const payload of SQL_INJECTION_PAYLOADS.slice(0, 5)) {
        const response = await request(app.getHttpServer())
          .post('/api/v1/auth/login')
          .send({
            email: payload,
            password: 'test123',
          });

        expect([400, 401, 422]).toContain(response.status);
      }

      // Database should still be intact
      const dbIntact = await verifyDatabaseIntegrity(prisma);
      expect(dbIntact).toBe(true);
    });

    it('should prevent SQL injection in filter parameters', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/users')
        .query({
          filter: "'; DROP TABLE users; --",
          role: "' OR '1'='1",
        })
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).not.toBe(500);

      // Verify database integrity
      const users = await prisma.user.findMany();
      expect(users).toBeDefined();
    });

    it('should use parameterized queries', async () => {
      // This test verifies that raw SQL is not executed directly
      const maliciousName = "'; DELETE FROM users WHERE '1'='1";

      const response = await request(app.getHttpServer())
        .post('/api/v1/organizations')
        .send({
          name: maliciousName,
          country: 'DE',
          taxId: 'DE123456789',
        })
        .set('Authorization', `Bearer ${authToken}`);

      // Should either accept as string or reject for validation
      expect([200, 201, 400, 422]).toContain(response.status);

      // All users should still exist
      const userCount = await prisma.user.count();
      expect(userCount).toBeGreaterThan(0);
    });
  });

  describe('XSS Prevention', () => {
    it('should sanitize script tags in input', async () => {
      for (const payload of XSS_PAYLOADS) {
        const response = await request(app.getHttpServer())
          .patch('/api/v1/users/me')
          .send({ firstName: payload })
          .set('Authorization', `Bearer ${authToken}`);

        expect([200, 400, 422]).toContain(response.status);

        if (response.status === 200) {
          // If accepted, should be sanitized
          expect(hasUnsafeHTML(response.body.firstName)).toBe(false);
        }
      }
    });

    it('should prevent stored XSS in user profile', async () => {
      const xssPayload = '<script>alert("XSS")</script>';

      const response = await request(app.getHttpServer())
        .patch('/api/v1/users/me')
        .send({
          firstName: xssPayload,
          lastName: '<img src=x onerror=alert("XSS")>',
        })
        .set('Authorization', `Bearer ${authToken}`);

      if (response.status === 200) {
        // Verify stored data is sanitized
        const user = await prisma.user.findUnique({
          where: { id: testUser.id },
          select: { firstName: true, lastName: true },
        });

        expect(hasUnsafeHTML(user?.firstName || '')).toBe(false);
        expect(hasUnsafeHTML(user?.lastName || '')).toBe(false);
      }
    });

    it('should prevent reflected XSS in error messages', async () => {
      const xssPayload = '<script>alert("XSS")</script>';

      const response = await request(app.getHttpServer())
        .get(`/api/v1/users/${xssPayload}`)
        .set('Authorization', `Bearer ${authToken}`);

      // Error message should not contain unsanitized input
      if (response.body.message) {
        expect(hasUnsafeHTML(response.body.message)).toBe(false);
      }
    });

    it('should encode special characters in output', async () => {
      const specialChars = '< > " \' & ';

      const response = await request(app.getHttpServer())
        .patch('/api/v1/users/me')
        .send({ firstName: specialChars })
        .set('Authorization', `Bearer ${authToken}`);

      if (response.status === 200) {
        // Special chars should be handled safely
        expect(response.body.firstName).toBeDefined();
      }
    });

    it('should prevent DOM-based XSS', async () => {
      const domXssPayload = '<img src=x onerror="eval(atob(\'YWxlcnQoXCdYU1NcJyk=\'))">';

      const response = await request(app.getHttpServer())
        .patch('/api/v1/users/me')
        .send({ firstName: domXssPayload })
        .set('Authorization', `Bearer ${authToken}`);

      if (response.status === 200) {
        expect(hasUnsafeHTML(response.body.firstName)).toBe(false);
      }
    });
  });

  describe('Command Injection Prevention', () => {
    it('should reject command injection in system calls', async () => {
      for (const payload of COMMAND_INJECTION_PAYLOADS) {
        const response = await request(app.getHttpServer())
          .post('/api/v1/exports')
          .send({
            format: 'pdf',
            filename: payload,
          })
          .set('Authorization', `Bearer ${authToken}`);

        expect([200, 400, 422]).toContain(response.status);
      }
    });

    it('should sanitize file names', async () => {
      const dangerousFilenames = [
        '../../etc/passwd',
        'file.pdf; rm -rf /',
        'file`whoami`.pdf',
      ];

      for (const filename of dangerousFilenames) {
        const response = await request(app.getHttpServer())
          .post('/api/v1/exports')
          .send({
            format: 'pdf',
            filename,
          })
          .set('Authorization', `Bearer ${authToken}`);

        expect([400, 422]).toContain(response.status);
      }
    });
  });

  describe('Path Traversal Prevention', () => {
    it('should reject path traversal in file paths', async () => {
      for (const payload of PATH_TRAVERSAL_PAYLOADS) {
        const response = await request(app.getHttpServer())
          .get(`/api/v1/files/${encodeURIComponent(payload)}`)
          .set('Authorization', `Bearer ${authToken}`);

        expect([400, 403, 404, 422]).toContain(response.status);
      }
    });

    it('should validate file paths are within allowed directories', async () => {
      const maliciousPaths = [
        '../../../etc/passwd',
        '..\\..\\..\\windows\\system32\\config\\sam',
        '/etc/shadow',
        'C:\\Windows\\System32\\config\\SAM',
      ];

      for (const path of maliciousPaths) {
        const response = await request(app.getHttpServer())
          .get(`/api/v1/files/${encodeURIComponent(path)}`)
          .set('Authorization', `Bearer ${authToken}`);

        expect([400, 403, 404]).toContain(response.status);
      }
    });

    it('should handle encoded path traversal attempts', async () => {
      const encodedPayloads = [
        '..%2F..%2F..%2Fetc%2Fpasswd',
        '..%5c..%5c..%5cwindows%5csystem32',
      ];

      for (const payload of encodedPayloads) {
        const response = await request(app.getHttpServer())
          .get(`/api/v1/files/${payload}`)
          .set('Authorization', `Bearer ${authToken}`);

        expect([400, 403, 404]).toContain(response.status);
      }
    });
  });

  describe('NoSQL Injection Prevention', () => {
    it('should prevent NoSQL injection in queries', async () => {
      for (const payload of NOSQL_INJECTION_PAYLOADS) {
        const response = await request(app.getHttpServer())
          .get('/api/v1/users')
          .query({ email: payload })
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).not.toBe(500);
      }
    });

    it('should reject object injection in query parameters', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/users')
        .query({ email: { $ne: null } })
        .set('Authorization', `Bearer ${authToken}`);

      expect([400, 422]).toContain(response.status);
    });
  });

  describe('File Upload Validation', () => {
    it('should reject dangerous file extensions', async () => {
      const dangerousFiles = [
        { filename: 'malware.exe', content: 'binary data' },
        { filename: 'shell.php', content: '<?php system($_GET["cmd"]); ?>' },
        { filename: 'script.js', content: 'alert("XSS")' },
      ];

      for (const file of dangerousFiles) {
        const response = await request(app.getHttpServer())
          .post('/api/v1/uploads')
          .attach('file', Buffer.from(file.content), file.filename)
          .set('Authorization', `Bearer ${authToken}`);

        expect([400, 415, 422]).toContain(response.status);
      }
    });

    it('should validate file MIME types', async () => {
      // Attempt to upload executable with image MIME type
      const response = await request(app.getHttpServer())
        .post('/api/v1/uploads')
        .attach('file', Buffer.from('MZ'), {
          filename: 'fake-image.jpg',
          contentType: 'image/jpeg',
        })
        .set('Authorization', `Bearer ${authToken}`);

      expect([400, 415, 422]).toContain(response.status);
    });

    it('should enforce file size limits', async () => {
      // Try to upload oversized file (simulate with large buffer)
      const largeBuffer = Buffer.alloc(100 * 1024 * 1024); // 100MB

      const response = await request(app.getHttpServer())
        .post('/api/v1/uploads')
        .attach('file', largeBuffer, 'large.pdf')
        .set('Authorization', `Bearer ${authToken}`);

      expect([400, 413, 422]).toContain(response.status); // 413 = Payload Too Large
    });

    it('should prevent double extension attacks', async () => {
      const doubleExtFiles = [
        'image.jpg.php',
        'document.pdf.exe',
        'script.txt.js',
      ];

      for (const filename of doubleExtFiles) {
        const response = await request(app.getHttpServer())
          .post('/api/v1/uploads')
          .attach('file', Buffer.from('test'), filename)
          .set('Authorization', `Bearer ${authToken}`);

        expect([400, 415, 422]).toContain(response.status);
      }
    });
  });

  describe('XXE (XML External Entity) Prevention', () => {
    it('should reject XXE payloads in XML input', async () => {
      for (const payload of XXE_PAYLOADS) {
        const response = await request(app.getHttpServer())
          .post('/api/v1/imports/xml')
          .set('Content-Type', 'application/xml')
          .set('Authorization', `Bearer ${authToken}`)
          .send(payload);

        expect([400, 415, 422]).toContain(response.status);
      }
    });
  });

  describe('Header Injection Prevention', () => {
    it('should sanitize HTTP headers', async () => {
      for (const payload of HEADER_INJECTION_PAYLOADS) {
        const response = await request(app.getHttpServer())
          .get('/api/v1/users/me')
          .set('X-Custom-Header', payload)
          .set('Authorization', `Bearer ${authToken}`);

        // Should not result in header injection
        expect(response.headers['x-injected-header']).toBeUndefined();
      }
    });

    it('should prevent CRLF injection in redirects', async () => {
      const crlfPayload = 'http://example.com\r\nX-Injected: true';

      const response = await request(app.getHttpServer())
        .get('/api/v1/redirect')
        .query({ url: crlfPayload })
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.headers['x-injected']).toBeUndefined();
    });
  });

  describe('Buffer Overflow Prevention', () => {
    it('should handle extremely long strings', async () => {
      const response = await request(app.getHttpServer())
        .patch('/api/v1/users/me')
        .send({ firstName: BUFFER_OVERFLOW_PATTERNS.longString })
        .set('Authorization', `Bearer ${authToken}`);

      expect([400, 413, 422]).toContain(response.status);
    });

    it('should reject oversized JSON payloads', async () => {
      const hugeObject: any = {};
      for (let i = 0; i < 10000; i++) {
        hugeObject[`field${i}`] = 'A'.repeat(1000);
      }

      const response = await request(app.getHttpServer())
        .post('/api/v1/data')
        .send(hugeObject)
        .set('Authorization', `Bearer ${authToken}`);

      expect([400, 413, 422]).toContain(response.status);
    });
  });

  describe('SSRF (Server-Side Request Forgery) Prevention', () => {
    it('should reject internal network URLs', async () => {
      for (const payload of SSRF_PAYLOADS) {
        const response = await request(app.getHttpServer())
          .post('/api/v1/webhooks/test')
          .send({ url: payload })
          .set('Authorization', `Bearer ${authToken}`);

        expect([400, 403, 422]).toContain(response.status);
      }
    });

    it('should validate callback URLs', async () => {
      const maliciousUrls = [
        'http://127.0.0.1',
        'http://localhost:3306',
        'http://169.254.169.254', // AWS metadata
        'file:///etc/passwd',
      ];

      for (const url of maliciousUrls) {
        const response = await request(app.getHttpServer())
          .post('/api/v1/integrations/callback')
          .send({ callbackUrl: url })
          .set('Authorization', `Bearer ${authToken}`);

        expect([400, 403, 422]).toContain(response.status);
      }
    });
  });

  describe('Email Validation', () => {
    it('should validate email format', async () => {
      const invalidEmails = [
        'not-an-email',
        '@example.com',
        'user@',
        'user@.com',
        'user@domain',
        '<script>alert("xss")</script>@example.com',
      ];

      for (const email of invalidEmails) {
        const response = await request(app.getHttpServer())
          .post('/api/v1/auth/register')
          .send({
            email,
            password: 'ValidPass123!',
            firstName: 'Test',
            lastName: 'User',
            organizationName: 'Test Org',
            country: 'DE',
          });

        expect(response.status).toBe(400);
      }
    });

    it('should prevent email header injection', async () => {
      const maliciousEmail = 'user@example.com\nBcc: attacker@evil.com';

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: maliciousEmail,
          password: 'ValidPass123!',
          firstName: 'Test',
          lastName: 'User',
          organizationName: 'Test Org',
          country: 'DE',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('Numeric Input Validation', () => {
    it('should validate numeric ranges', async () => {
      const invalidNumbers = [
        -1,
        Number.MAX_SAFE_INTEGER + 1,
        Number.POSITIVE_INFINITY,
        Number.NEGATIVE_INFINITY,
        NaN,
      ];

      for (const num of invalidNumbers) {
        const response = await request(app.getHttpServer())
          .get('/api/v1/users')
          .query({ page: num })
          .set('Authorization', `Bearer ${authToken}`);

        expect([400, 422]).toContain(response.status);
      }
    });

    it('should reject type coercion attacks', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/users')
        .query({ page: '1; DROP TABLE users;' })
        .set('Authorization', `Bearer ${authToken}`);

      expect([400, 422]).toContain(response.status);
    });
  });

  describe('JSON Input Validation', () => {
    it('should reject malformed JSON', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/users/invite')
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${authToken}`)
        .send('{ invalid json }');

      expect(response.status).toBe(400);
    });

    it('should validate JSON schema', async () => {
      const invalidPayload = {
        email: 123, // Should be string
        role: 'INVALID_ROLE',
        extraField: 'not allowed',
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/users/invite')
        .send(invalidPayload)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(400);
    });
  });

  describe('Internationalization Input Validation', () => {
    it('should handle Unicode characters safely', async () => {
      const unicodeStrings = [
        '测试用户', // Chinese
        'مستخدم اختبار', // Arabic
        '🚀🔥💯', // Emojis
        '\u0000', // Null byte
      ];

      for (const str of unicodeStrings) {
        const response = await request(app.getHttpServer())
          .patch('/api/v1/users/me')
          .send({ firstName: str })
          .set('Authorization', `Bearer ${authToken}`);

        // Should either accept or reject cleanly
        expect([200, 400, 422]).toContain(response.status);
      }
    });

    it('should prevent homograph attacks in domains', async () => {
      // Using Cyrillic 'а' instead of Latin 'a'
      const homographEmail = 'user@exаmple.com';

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: homographEmail,
          password: 'ValidPass123!',
          firstName: 'Test',
          lastName: 'User',
          organizationName: 'Test Org',
          country: 'DE',
        });

      expect([400, 422]).toContain(response.status);
    });
  });
});
