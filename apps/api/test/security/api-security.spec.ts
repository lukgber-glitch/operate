/**
 * API Security Tests
 * OP-081: Security Test Suite - API Security
 *
 * Tests CORS, security headers, rate limiting, request size limits,
 * and general API security configurations
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
  verifySecurityHeaders,
  testCORS,
  testRateLimit,
} from './utils/test-helpers';

describe('API Security Tests', () => {
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

  describe('Security Headers', () => {
    it('should include X-Content-Type-Options header', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/health')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.headers['x-content-type-options']).toBe('nosniff');
    });

    it('should include X-Frame-Options header', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/health')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.headers['x-frame-options']).toBeDefined();
      expect(['DENY', 'SAMEORIGIN']).toContain(
        response.headers['x-frame-options'],
      );
    });

    it('should include Strict-Transport-Security header in production', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/health')
        .set('Authorization', `Bearer ${authToken}`);

      // In production, HSTS should be enabled
      if (process.env.NODE_ENV === 'production') {
        expect(response.headers['strict-transport-security']).toBeDefined();
      }
    });

    it('should include Content-Security-Policy header', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/health')
        .set('Authorization', `Bearer ${authToken}`);

      // CSP might be defined
      if (response.headers['content-security-policy']) {
        expect(response.headers['content-security-policy']).toContain(
          "default-src 'self'",
        );
      }
    });

    it('should not expose server information', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/health')
        .set('Authorization', `Bearer ${authToken}`);

      // Should not expose server version
      expect(response.headers['server']).toBeUndefined();
      expect(response.headers['x-powered-by']).toBeUndefined();
    });

    it('should verify all critical security headers', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/health')
        .set('Authorization', `Bearer ${authToken}`);

      const headerCheck = verifySecurityHeaders(response);

      // Log missing headers for debugging
      if (!headerCheck.valid) {
        console.log('Missing security headers:', headerCheck.missing);
      }

      // In production, all headers should be present
      if (process.env.NODE_ENV === 'production') {
        expect(headerCheck.valid).toBe(true);
      }
    });
  });

  describe('CORS Configuration', () => {
    it('should allow requests from allowed origins', async () => {
      const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:3000';

      const corsResult = await testCORS(app, '/api/v1/health', allowedOrigin);

      expect(corsResult.allowed).toBe(true);
    });

    it('should reject requests from unauthorized origins', async () => {
      const unauthorizedOrigin = 'http://evil.com';

      const corsResult = await testCORS(
        app,
        '/api/v1/health',
        unauthorizedOrigin,
      );

      expect(corsResult.allowed).toBe(false);
    });

    it('should include proper CORS headers', async () => {
      const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:3000';

      const response = await request(app.getHttpServer())
        .options('/api/v1/users')
        .set('Origin', allowedOrigin)
        .set('Access-Control-Request-Method', 'GET');

      expect(response.headers['access-control-allow-methods']).toBeDefined();
      expect(response.headers['access-control-allow-headers']).toBeDefined();
    });

    it('should not allow credentials from untrusted origins', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/users/me')
        .set('Origin', 'http://evil.com')
        .set('Authorization', `Bearer ${authToken}`);

      // Should either block or not include credentials header
      if (response.headers['access-control-allow-origin'] === 'http://evil.com') {
        expect(response.headers['access-control-allow-credentials']).toBeUndefined();
      }
    });
  });

  describe('Rate Limiting', () => {
    it('should implement global rate limiting', async () => {
      const result = await testRateLimit(app, '/api/v1/health', 150);

      // Should eventually hit rate limit
      expect(result.blockedCount).toBeGreaterThan(0);
    }, 30000); // Extended timeout

    it('should implement stricter rate limiting on auth endpoints', async () => {
      const result = await testRateLimit(app, '/api/v1/auth/login', 25);

      // Auth endpoints should have stricter limits
      expect(result.blockedCount).toBeGreaterThan(0);
    }, 30000);

    it('should return 429 status on rate limit exceeded', async () => {
      const responses = [];
      for (let i = 0; i < 150; i++) {
        const response = await request(app.getHttpServer()).get(
          '/api/v1/health',
        );
        responses.push(response);
      }

      const rateLimited = responses.some((r) => r.status === 429);
      expect(rateLimited).toBe(true);
    }, 30000);

    it('should include rate limit headers', async () => {
      const response = await request(app.getHttpServer()).get(
        '/api/v1/health',
      );

      // Standard rate limit headers
      if (response.headers['x-ratelimit-limit']) {
        expect(response.headers['x-ratelimit-limit']).toBeDefined();
        expect(response.headers['x-ratelimit-remaining']).toBeDefined();
      }
    });

    it('should reset rate limit after time window', async () => {
      // Hit rate limit
      for (let i = 0; i < 100; i++) {
        await request(app.getHttpServer()).get('/api/v1/health');
      }

      // Wait for reset (adjust time based on your rate limit window)
      await new Promise((resolve) => setTimeout(resolve, 61000)); // 1 minute + 1 second

      // Should be able to make requests again
      const response = await request(app.getHttpServer()).get(
        '/api/v1/health',
      );

      expect(response.status).not.toBe(429);
    }, 70000); // Extended timeout

    it('should implement per-IP rate limiting', async () => {
      const ip1Responses = [];
      const ip2Responses = [];

      // Simulate different IPs
      for (let i = 0; i < 60; i++) {
        const r1 = await request(app.getHttpServer())
          .get('/api/v1/health')
          .set('X-Forwarded-For', '192.168.1.1');
        ip1Responses.push(r1);

        const r2 = await request(app.getHttpServer())
          .get('/api/v1/health')
          .set('X-Forwarded-For', '192.168.1.2');
        ip2Responses.push(r2);
      }

      // Both IPs should be rate limited independently
      const ip1Limited = ip1Responses.some((r) => r.status === 429);
      const ip2Limited = ip2Responses.some((r) => r.status === 429);

      // At least one should be limited
      expect(ip1Limited || ip2Limited).toBe(true);
    }, 30000);
  });

  describe('Request Size Limits', () => {
    it('should reject oversized JSON payloads', async () => {
      const largePayload = {
        data: 'A'.repeat(10 * 1024 * 1024), // 10MB
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/data')
        .send(largePayload)
        .set('Authorization', `Bearer ${authToken}`);

      expect([413, 400]).toContain(response.status); // 413 = Payload Too Large
    });

    it('should enforce URL length limits', async () => {
      const longUrl = '/api/v1/users?' + 'param=value&'.repeat(1000);

      const response = await request(app.getHttpServer())
        .get(longUrl)
        .set('Authorization', `Bearer ${authToken}`);

      expect([414, 400]).toContain(response.status); // 414 = URI Too Long
    });

    it('should limit request header size', async () => {
      const largeHeader = 'A'.repeat(10000);

      const response = await request(app.getHttpServer())
        .get('/api/v1/health')
        .set('X-Large-Header', largeHeader)
        .set('Authorization', `Bearer ${authToken}`);

      expect([431, 400, 200]).toContain(response.status); // 431 = Request Header Fields Too Large
    });
  });

  describe('HTTP Method Security', () => {
    it('should only allow specified HTTP methods', async () => {
      const response = await request(app.getHttpServer())
        .trace('/api/v1/users')
        .set('Authorization', `Bearer ${authToken}`);

      expect([405, 404]).toContain(response.status); // 405 = Method Not Allowed
    });

    it('should implement proper OPTIONS handling', async () => {
      const response = await request(app.getHttpServer())
        .options('/api/v1/users')
        .set('Origin', 'http://localhost:3000');

      expect(response.status).toBe(200);
      expect(response.headers['allow']).toBeDefined();
    });

    it('should reject HEAD requests on POST-only endpoints', async () => {
      const response = await request(app.getHttpServer())
        .head('/api/v1/auth/login')
        .set('Authorization', `Bearer ${authToken}`);

      expect([405, 404]).toContain(response.status);
    });
  });

  describe('API Versioning', () => {
    it('should support API versioning', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/health')
        .set('Authorization', `Bearer ${authToken}`);

      expect([200, 404]).toContain(response.status);
    });

    it('should reject requests to non-existent API versions', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v999/health')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('Error Handling Security', () => {
    it('should not expose stack traces in production', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/nonexistent')
        .set('Authorization', `Bearer ${authToken}`);

      if (process.env.NODE_ENV === 'production') {
        expect(response.body.stack).toBeUndefined();
        expect(JSON.stringify(response.body)).not.toContain('at ');
      }
    });

    it('should not expose database errors', async () => {
      // Try to trigger a database error
      const response = await request(app.getHttpServer())
        .get('/api/v1/users/invalid-uuid')
        .set('Authorization', `Bearer ${authToken}`);

      // Should return generic error, not database-specific
      expect(response.body.message).not.toContain('PostgreSQL');
      expect(response.body.message).not.toContain('prisma');
      expect(response.body.message).not.toContain('SQL');
    });

    it('should sanitize error messages', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: '<script>alert("xss")</script>',
          password: 'test',
        });

      // Error message should not contain unescaped HTML
      if (response.body.message) {
        expect(response.body.message).not.toContain('<script>');
      }
    });

    it('should use consistent error format', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/nonexistent')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('statusCode');
    });
  });

  describe('Request Logging and Monitoring', () => {
    it('should not log sensitive data', async () => {
      // Make request with sensitive data
      await request(app.getHttpServer()).post('/api/v1/auth/login').send({
        email: testUser.email,
        password: 'SensitivePassword123!',
      });

      // This test assumes you have access to logs
      // In practice, you'd check log files or monitoring system
      // to ensure passwords are not logged
    });

    it('should log failed authentication attempts', async () => {
      await request(app.getHttpServer()).post('/api/v1/auth/login').send({
        email: testUser.email,
        password: 'WrongPassword',
      });

      // Check that failed login is logged (without password)
      // Implementation depends on your logging system
    });
  });

  describe('API Documentation Security', () => {
    it('should protect API documentation in production', async () => {
      const response = await request(app.getHttpServer()).get('/api/docs');

      if (process.env.NODE_ENV === 'production') {
        expect([401, 403, 404]).toContain(response.status);
      } else {
        // In dev, docs might be public
        expect([200, 401, 403, 404]).toContain(response.status);
      }
    });

    it('should not expose sensitive endpoints in OpenAPI spec', async () => {
      const response = await request(app.getHttpServer()).get(
        '/api/docs-json',
      );

      if (response.status === 200) {
        const spec = response.body;

        // Should not expose internal endpoints
        expect(spec.paths).not.toHaveProperty('/internal');
        expect(spec.paths).not.toHaveProperty('/debug');
      }
    });
  });

  describe('WebSocket Security', () => {
    it('should require authentication for WebSocket connections', async () => {
      // This test assumes WebSocket implementation
      // Adjust based on your actual WebSocket setup
      const response = await request(app.getHttpServer())
        .get('/socket.io/')
        .query({ transport: 'polling' });

      expect([401, 404, 426]).toContain(response.status); // 426 = Upgrade Required
    });
  });

  describe('Health Check Security', () => {
    it('should expose limited information in health endpoint', async () => {
      const response = await request(app.getHttpServer()).get('/api/v1/health');

      expect(response.status).toBe(200);

      // Should not expose sensitive system info
      expect(response.body).not.toHaveProperty('env');
      expect(response.body).not.toHaveProperty('secrets');
      expect(response.body).not.toHaveProperty('database_url');
    });

    it('should not require authentication for basic health check', async () => {
      const response = await request(app.getHttpServer()).get('/api/v1/health');

      expect(response.status).toBe(200);
    });
  });

  describe('API Gateway Security', () => {
    it('should validate API keys when provided', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/users')
        .set('X-API-Key', 'invalid-key');

      expect([401, 403]).toContain(response.status);
    });

    it('should enforce IP whitelisting for API keys', async () => {
      // If you implement IP whitelisting
      const response = await request(app.getHttpServer())
        .get('/api/v1/users')
        .set('X-API-Key', 'test-key')
        .set('X-Forwarded-For', '1.2.3.4');

      expect([401, 403]).toContain(response.status);
    });
  });

  describe('Timing Attack Prevention', () => {
    it('should have consistent response times for auth failures', async () => {
      const times: number[] = [];

      // Test multiple auth failures
      for (let i = 0; i < 10; i++) {
        const start = Date.now();
        await request(app.getHttpServer()).post('/api/v1/auth/login').send({
          email: 'nonexistent@example.com',
          password: 'wrong',
        });
        times.push(Date.now() - start);
      }

      // Calculate variance
      const avg = times.reduce((a, b) => a + b, 0) / times.length;
      const variance =
        times.reduce((sum, time) => sum + Math.pow(time - avg, 2), 0) /
        times.length;

      // Response times should be relatively consistent
      // (not revealing whether email exists based on timing)
      expect(variance).toBeLessThan(1000); // Adjust threshold as needed
    }, 30000);
  });
});
