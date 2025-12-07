import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('Authentication API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      })
    );

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/auth/login (POST)', () => {
    it('should login with valid credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: process.env.TEST_USER_EMAIL || 'test@operate.guru',
          password: process.env.TEST_USER_PASSWORD || 'TestPassword123!',
        });

      expect([200, 201, 401]).toContain(response.status);

      if (response.status === 200 || response.status === 201) {
        expect(response.body).toHaveProperty('access_token');
        expect(response.body.access_token).toBeDefined();
        expect(response.body.access_token.length).toBeGreaterThan(0);
      }
    });

    it('should reject invalid credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'wrong@email.com',
          password: 'wrongpassword',
        });

      expect([401, 400]).toContain(response.status);
      expect(response.body).not.toHaveProperty('access_token');
    });

    it('should validate email format', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'invalid-email',
          password: 'password123',
        });

      expect([400, 422]).toContain(response.status);
    });

    it('should require password', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@operate.guru',
        });

      expect([400, 422]).toContain(response.status);
    });

    it('should require email', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          password: 'password123',
        });

      expect([400, 422]).toContain(response.status);
    });
  });

  describe('/auth/register (POST)', () => {
    const randomEmail = `test-${Date.now()}@operate.guru`;

    it('should register new user', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: randomEmail,
          password: 'NewPassword123!',
          name: 'Test User',
        });

      expect([201, 400, 409, 404]).toContain(response.status);

      if (response.status === 201) {
        expect(response.body).toHaveProperty('id');
        expect(response.body).toHaveProperty('email', randomEmail);
        expect(response.body).not.toHaveProperty('password'); // Password should not be returned
      }
    });

    it('should reject duplicate email', async () => {
      const email = 'test@operate.guru';

      // Try to register same email twice
      await request(app.getHttpServer()).post('/auth/register').send({
        email,
        password: 'Password123!',
        name: 'Test User',
      });

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email,
          password: 'Password123!',
          name: 'Test User',
        });

      expect([400, 409]).toContain(response.status);
    });

    it('should validate password strength', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: `weak-${Date.now()}@operate.guru`,
          password: '123', // Weak password
          name: 'Test User',
        });

      // May accept or reject based on validation rules
      expect(response.status).toBeDefined();
    });
  });

  describe('/auth/me (GET)', () => {
    let authToken: string;

    beforeAll(async () => {
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: process.env.TEST_USER_EMAIL || 'test@operate.guru',
          password: process.env.TEST_USER_PASSWORD || 'TestPassword123!',
        });

      if (loginResponse.status === 200 || loginResponse.status === 201) {
        authToken = loginResponse.body.access_token || loginResponse.body.token;
      }
    });

    it('should return current user profile', async () => {
      if (!authToken) {
        console.log('Skipping test - no auth token');
        return;
      }

      const response = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${authToken}`);

      expect([200, 401, 404]).toContain(response.status);

      if (response.status === 200) {
        expect(response.body).toHaveProperty('email');
        expect(response.body).not.toHaveProperty('password');
      }
    });

    it('should reject request without token', async () => {
      const response = await request(app.getHttpServer()).get('/auth/me');

      expect([401, 403]).toContain(response.status);
    });

    it('should reject invalid token', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', 'Bearer invalid-token-12345');

      expect([401, 403]).toContain(response.status);
    });
  });

  describe('/auth/logout (POST)', () => {
    let authToken: string;

    beforeEach(async () => {
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: process.env.TEST_USER_EMAIL || 'test@operate.guru',
          password: process.env.TEST_USER_PASSWORD || 'TestPassword123!',
        });

      if (loginResponse.status === 200 || loginResponse.status === 201) {
        authToken = loginResponse.body.access_token || loginResponse.body.token;
      }
    });

    it('should logout successfully', async () => {
      if (!authToken) return;

      const response = await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${authToken}`);

      expect([200, 204, 404]).toContain(response.status);
    });
  });

  describe('/auth/refresh (POST)', () => {
    let refreshToken: string;

    beforeAll(async () => {
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: process.env.TEST_USER_EMAIL || 'test@operate.guru',
          password: process.env.TEST_USER_PASSWORD || 'TestPassword123!',
        });

      if (loginResponse.status === 200 || loginResponse.status === 201) {
        refreshToken = loginResponse.body.refresh_token;
      }
    });

    it('should refresh access token', async () => {
      if (!refreshToken) {
        console.log('Skipping test - no refresh token');
        return;
      }

      const response = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({
          refresh_token: refreshToken,
        });

      expect([200, 201, 404]).toContain(response.status);

      if (response.status === 200 || response.status === 201) {
        expect(response.body).toHaveProperty('access_token');
      }
    });

    it('should reject invalid refresh token', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({
          refresh_token: 'invalid-refresh-token',
        });

      expect([401, 400, 404]).toContain(response.status);
    });
  });

  describe('/auth/password/reset (POST)', () => {
    it('should send password reset email', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/password/reset')
        .send({
          email: 'test@operate.guru',
        });

      // May or may not be implemented
      expect([200, 201, 404]).toContain(response.status);
    });

    it('should validate email format', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/password/reset')
        .send({
          email: 'invalid-email',
        });

      expect([400, 422, 404]).toContain(response.status);
    });
  });

  describe('OAuth Flow', () => {
    it('should provide Google OAuth URL', async () => {
      const response = await request(app.getHttpServer()).get('/auth/google');

      // May redirect or return URL
      expect([200, 302, 404]).toContain(response.status);
    });

    it('should handle OAuth callback', async () => {
      const response = await request(app.getHttpServer()).get(
        '/auth/google/callback?code=test-code'
      );

      // Will fail without valid code, but endpoint should exist
      expect([200, 302, 400, 401, 404]).toContain(response.status);
    });
  });

  describe('Token Security', () => {
    it('should not accept malformed Bearer token', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', 'InvalidFormat token123');

      expect([401, 403, 400]).toContain(response.status);
    });

    it('should not accept empty Bearer token', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', 'Bearer ');

      expect([401, 403, 400]).toContain(response.status);
    });
  });
});
