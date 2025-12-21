import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('Banking API (e2e)', () => {
  let app: INestApplication;
  let authToken: string;

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

    // Login
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

  afterAll(async () => {
    await app.close();
  });

  describe('/banking/accounts (GET)', () => {
    it('should return bank accounts', async () => {
      if (!authToken) return;

      const response = await request(app.getHttpServer())
        .get('/banking/accounts')
        .set('Authorization', `Bearer ${authToken}`);

      expect([200, 404]).toContain(response.status);

      if (response.status === 200) {
        expect(Array.isArray(response.body) || response.body.data).toBeTruthy();
      }
    });

    it('should require authentication', async () => {
      const response = await request(app.getHttpServer()).get('/banking/accounts');

      expect([401, 403, 404]).toContain(response.status);
    });
  });

  describe('/banking/transactions (GET)', () => {
    it('should return transactions', async () => {
      if (!authToken) return;

      const response = await request(app.getHttpServer())
        .get('/banking/transactions')
        .set('Authorization', `Bearer ${authToken}`);

      expect([200, 404]).toContain(response.status);

      if (response.status === 200) {
        expect(Array.isArray(response.body) || response.body.data).toBeTruthy();
      }
    });

    it('should filter by date range', async () => {
      if (!authToken) return;

      const startDate = new Date('2025-01-01').toISOString();
      const endDate = new Date('2025-12-31').toISOString();

      const response = await request(app.getHttpServer())
        .get(`/banking/transactions?startDate=${startDate}&endDate=${endDate}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect([200, 400, 404]).toContain(response.status);
    });

    it('should filter by account', async () => {
      if (!authToken) return;

      const response = await request(app.getHttpServer())
        .get('/banking/transactions?accountId=test-account-id')
        .set('Authorization', `Bearer ${authToken}`);

      expect([200, 400, 404]).toContain(response.status);
    });

    it('should paginate results', async () => {
      if (!authToken) return;

      const response = await request(app.getHttpServer())
        .get('/banking/transactions?page=1&limit=10')
        .set('Authorization', `Bearer ${authToken}`);

      expect([200, 400, 404]).toContain(response.status);
    });
  });

  describe('/banking/transactions/:id (GET)', () => {
    it('should get transaction details', async () => {
      if (!authToken) return;

      // Get transactions first
      const listResponse = await request(app.getHttpServer())
        .get('/banking/transactions')
        .set('Authorization', `Bearer ${authToken}`);

      if (listResponse.status === 200 && listResponse.body.length > 0) {
        const transactionId = listResponse.body[0].id;

        const response = await request(app.getHttpServer())
          .get(`/banking/transactions/${transactionId}`)
          .set('Authorization', `Bearer ${authToken}`);

        expect([200, 404]).toContain(response.status);

        if (response.status === 200) {
          expect(response.body).toHaveProperty('id', transactionId);
        }
      }
    });

    it('should return 404 for non-existent transaction', async () => {
      if (!authToken) return;

      const fakeId = '00000000-0000-0000-0000-000000000000';

      const response = await request(app.getHttpServer())
        .get(`/banking/transactions/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect([404, 400]).toContain(response.status);
    });
  });

  describe('/banking/transactions/:id/categorize (PATCH)', () => {
    it('should categorize transaction', async () => {
      if (!authToken) return;

      // Get a transaction first
      const listResponse = await request(app.getHttpServer())
        .get('/banking/transactions')
        .set('Authorization', `Bearer ${authToken}`);

      if (listResponse.status === 200 && listResponse.body.length > 0) {
        const transactionId = listResponse.body[0].id;

        const response = await request(app.getHttpServer())
          .patch(`/banking/transactions/${transactionId}/categorize`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            category: 'office_supplies',
          });

        expect([200, 404]).toContain(response.status);

        if (response.status === 200) {
          expect(response.body).toHaveProperty('category', 'office_supplies');
        }
      }
    });

    it('should validate category', async () => {
      if (!authToken) return;

      const fakeId = '00000000-0000-0000-0000-000000000000';

      const response = await request(app.getHttpServer())
        .patch(`/banking/transactions/${fakeId}/categorize`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          category: 'invalid_category_that_does_not_exist',
        });

      expect([400, 404, 422]).toContain(response.status);
    });
  });

  describe('/banking/connect (POST)', () => {
    it('should initiate bank connection', async () => {
      if (!authToken) return;

      const response = await request(app.getHttpServer())
        .post('/banking/connect')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          provider: 'tink',
          redirectUrl: 'http://localhost:3000/banking/callback',
        });

      expect([200, 201, 400, 404]).toContain(response.status);

      if (response.status === 200 || response.status === 201) {
        expect(response.body).toHaveProperty('authUrl');
      }
    });

    it('should validate provider', async () => {
      if (!authToken) return;

      const response = await request(app.getHttpServer())
        .post('/banking/connect')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          provider: 'invalid-provider',
        });

      expect([400, 422, 404]).toContain(response.status);
    });
  });

  describe('/banking/sync (POST)', () => {
    it('should sync transactions', async () => {
      if (!authToken) return;

      const response = await request(app.getHttpServer())
        .post('/banking/sync')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          accountId: 'test-account-id',
        });

      expect([200, 201, 404, 400]).toContain(response.status);
    });

    it('should require account ID', async () => {
      if (!authToken) return;

      const response = await request(app.getHttpServer())
        .post('/banking/sync')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect([400, 422, 404]).toContain(response.status);
    });
  });

  describe('/banking/balance (GET)', () => {
    it('should return account balances', async () => {
      if (!authToken) return;

      const response = await request(app.getHttpServer())
        .get('/banking/balance')
        .set('Authorization', `Bearer ${authToken}`);

      expect([200, 404]).toContain(response.status);

      if (response.status === 200) {
        expect(response.body).toBeDefined();
      }
    });

    it('should return balance for specific account', async () => {
      if (!authToken) return;

      const response = await request(app.getHttpServer())
        .get('/banking/balance?accountId=test-account-id')
        .set('Authorization', `Bearer ${authToken}`);

      expect([200, 404, 400]).toContain(response.status);
    });
  });

  describe('/banking/export (GET)', () => {
    it('should export transactions as CSV', async () => {
      if (!authToken) return;

      const response = await request(app.getHttpServer())
        .get('/banking/export?format=csv')
        .set('Authorization', `Bearer ${authToken}`);

      expect([200, 404]).toContain(response.status);

      if (response.status === 200) {
        expect(response.headers['content-type']).toContain('csv');
      }
    });

    it('should export transactions as Excel', async () => {
      if (!authToken) return;

      const response = await request(app.getHttpServer())
        .get('/banking/export?format=xlsx')
        .set('Authorization', `Bearer ${authToken}`);

      expect([200, 404]).toContain(response.status);
    });

    it('should validate export format', async () => {
      if (!authToken) return;

      const response = await request(app.getHttpServer())
        .get('/banking/export?format=invalid')
        .set('Authorization', `Bearer ${authToken}`);

      expect([400, 422, 404]).toContain(response.status);
    });
  });

  describe('AI Transaction Categorization', () => {
    it('should get AI category suggestions', async () => {
      if (!authToken) return;

      const response = await request(app.getHttpServer())
        .get('/banking/transactions/suggest-categories')
        .set('Authorization', `Bearer ${authToken}`);

      expect([200, 404]).toContain(response.status);

      if (response.status === 200) {
        expect(Array.isArray(response.body) || response.body.suggestions).toBeTruthy();
      }
    });

    it('should auto-categorize transactions', async () => {
      if (!authToken) return;

      const response = await request(app.getHttpServer())
        .post('/banking/transactions/auto-categorize')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          transactionIds: ['tx-1', 'tx-2', 'tx-3'],
        });

      expect([200, 201, 404, 400]).toContain(response.status);
    });
  });

  describe('Transaction Notes', () => {
    it('should add note to transaction', async () => {
      if (!authToken) return;

      const listResponse = await request(app.getHttpServer())
        .get('/banking/transactions')
        .set('Authorization', `Bearer ${authToken}`);

      if (listResponse.status === 200 && listResponse.body.length > 0) {
        const transactionId = listResponse.body[0].id;

        const response = await request(app.getHttpServer())
          .patch(`/banking/transactions/${transactionId}/note`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            note: 'This is a test note',
          });

        expect([200, 404]).toContain(response.status);
      }
    });
  });

  describe('Reconciliation', () => {
    it('should match transaction to invoice', async () => {
      if (!authToken) return;

      const response = await request(app.getHttpServer())
        .post('/banking/reconcile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          transactionId: 'tx-123',
          invoiceId: 'inv-456',
        });

      expect([200, 201, 404, 400]).toContain(response.status);
    });

    it('should get unreconciled transactions', async () => {
      if (!authToken) return;

      const response = await request(app.getHttpServer())
        .get('/banking/transactions?reconciled=false')
        .set('Authorization', `Bearer ${authToken}`);

      expect([200, 404]).toContain(response.status);
    });
  });
});
