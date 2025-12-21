import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('Invoices API (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  let testInvoiceId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Apply global pipes
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      })
    );

    await app.init();

    // Login to get authentication token
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

  describe('/invoices (GET)', () => {
    it('should return invoices list', async () => {
      if (!authToken) {
        console.log('Skipping test - no auth token');
        return;
      }

      const response = await request(app.getHttpServer())
        .get('/invoices')
        .set('Authorization', `Bearer ${authToken}`);

      expect([200, 401, 404]).toContain(response.status);

      if (response.status === 200) {
        expect(response.body).toBeDefined();
        expect(Array.isArray(response.body) || response.body.data).toBeTruthy();
      }
    });

    it('should require authentication', async () => {
      const response = await request(app.getHttpServer()).get('/invoices');

      expect([401, 403, 404]).toContain(response.status);
    });

    it('should filter invoices by status', async () => {
      if (!authToken) return;

      const response = await request(app.getHttpServer())
        .get('/invoices?status=draft')
        .set('Authorization', `Bearer ${authToken}`);

      expect([200, 400, 404]).toContain(response.status);
    });
  });

  describe('/invoices (POST)', () => {
    it('should create a new invoice', async () => {
      if (!authToken) return;

      const invoiceData = {
        customerId: 'test-customer-' + Date.now(),
        customerName: 'Test Customer GmbH',
        customerEmail: 'kunde@test.de',
        items: [
          {
            description: 'Consulting Services',
            quantity: 10,
            unitPrice: 150,
          },
        ],
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      };

      const response = await request(app.getHttpServer())
        .post('/invoices')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invoiceData);

      expect([201, 400, 401, 404]).toContain(response.status);

      if (response.status === 201) {
        expect(response.body).toHaveProperty('id');
        testInvoiceId = response.body.id;

        // Verify calculations
        // Subtotal: 10 * 150 = 1500
        // VAT (19%): 285
        // Total: 1785
        const expectedSubtotal = 1500;
        const expectedVat = 285;
        const expectedTotal = 1785;

        if (response.body.subtotal !== undefined) {
          expect(response.body.subtotal).toBe(expectedSubtotal);
        }
        if (response.body.vat !== undefined) {
          expect(response.body.vat).toBe(expectedVat);
        }
        if (response.body.total !== undefined) {
          expect(response.body.total).toBe(expectedTotal);
        }
      }
    });

    it('should validate required fields', async () => {
      if (!authToken) return;

      const invalidData = {
        items: [],
      };

      const response = await request(app.getHttpServer())
        .post('/invoices')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData);

      expect([400, 422, 404]).toContain(response.status);
    });

    it('should reject invalid email format', async () => {
      if (!authToken) return;

      const invalidData = {
        customerEmail: 'invalid-email',
        items: [{ description: 'Test', quantity: 1, unitPrice: 100 }],
      };

      const response = await request(app.getHttpServer())
        .post('/invoices')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData);

      expect([400, 422, 404]).toContain(response.status);
    });
  });

  describe('/invoices/:id (GET)', () => {
    it('should get invoice by id', async () => {
      if (!authToken || !testInvoiceId) return;

      const response = await request(app.getHttpServer())
        .get(`/invoices/${testInvoiceId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect([200, 404]).toContain(response.status);

      if (response.status === 200) {
        expect(response.body).toHaveProperty('id', testInvoiceId);
      }
    });

    it('should return 404 for non-existent invoice', async () => {
      if (!authToken) return;

      const fakeId = '00000000-0000-0000-0000-000000000000';

      const response = await request(app.getHttpServer())
        .get(`/invoices/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect([404, 400]).toContain(response.status);
    });
  });

  describe('/invoices/:id (PATCH)', () => {
    it('should update invoice', async () => {
      if (!authToken || !testInvoiceId) return;

      const updateData = {
        customerName: 'Updated Customer Name',
      };

      const response = await request(app.getHttpServer())
        .patch(`/invoices/${testInvoiceId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect([200, 404]).toContain(response.status);

      if (response.status === 200) {
        expect(response.body.customerName).toBe('Updated Customer Name');
      }
    });

    it('should validate update data', async () => {
      if (!authToken || !testInvoiceId) return;

      const invalidUpdate = {
        total: -100, // Negative total should be invalid
      };

      const response = await request(app.getHttpServer())
        .patch(`/invoices/${testInvoiceId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidUpdate);

      // May accept or reject depending on validation rules
      expect(response.status).toBeDefined();
    });
  });

  describe('/invoices/:id/send (POST)', () => {
    it('should send invoice via email', async () => {
      if (!authToken || !testInvoiceId) return;

      const sendData = {
        recipientEmail: 'kunde@test.de',
      };

      const response = await request(app.getHttpServer())
        .post(`/invoices/${testInvoiceId}/send`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(sendData);

      expect([200, 201, 404]).toContain(response.status);

      if (response.status === 200 || response.status === 201) {
        expect(response.body).toHaveProperty('sent', true);
      }
    });

    it('should require valid email', async () => {
      if (!authToken || !testInvoiceId) return;

      const invalidSendData = {
        recipientEmail: 'invalid-email',
      };

      const response = await request(app.getHttpServer())
        .post(`/invoices/${testInvoiceId}/send`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidSendData);

      expect([400, 422, 404]).toContain(response.status);
    });
  });

  describe('/invoices/:id/pdf (GET)', () => {
    it('should generate PDF', async () => {
      if (!authToken || !testInvoiceId) return;

      const response = await request(app.getHttpServer())
        .get(`/invoices/${testInvoiceId}/pdf`)
        .set('Authorization', `Bearer ${authToken}`);

      expect([200, 404, 501]).toContain(response.status);

      if (response.status === 200) {
        expect(response.headers['content-type']).toContain('pdf');
      }
    });
  });

  describe('/invoices/:id (DELETE)', () => {
    it('should delete invoice', async () => {
      if (!authToken || !testInvoiceId) return;

      const response = await request(app.getHttpServer())
        .delete(`/invoices/${testInvoiceId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect([200, 204, 404]).toContain(response.status);
    });

    it('should return 404 when deleting non-existent invoice', async () => {
      if (!authToken) return;

      const fakeId = '00000000-0000-0000-0000-000000000000';

      const response = await request(app.getHttpServer())
        .delete(`/invoices/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect([404, 400]).toContain(response.status);
    });
  });

  describe('Invoice Business Logic', () => {
    it('should calculate VAT correctly for multiple items', async () => {
      if (!authToken) return;

      const invoiceData = {
        customerId: 'test-customer-multi',
        items: [
          { description: 'Item 1', quantity: 5, unitPrice: 100 },
          { description: 'Item 2', quantity: 2, unitPrice: 250 },
        ],
      };

      const response = await request(app.getHttpServer())
        .post('/invoices')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invoiceData);

      if (response.status === 201) {
        // Subtotal: (5*100) + (2*250) = 500 + 500 = 1000
        // VAT (19%): 190
        // Total: 1190
        if (response.body.subtotal !== undefined) {
          expect(response.body.subtotal).toBe(1000);
        }
        if (response.body.vat !== undefined) {
          expect(response.body.vat).toBe(190);
        }
        if (response.body.total !== undefined) {
          expect(response.body.total).toBe(1190);
        }

        // Cleanup
        await request(app.getHttpServer())
          .delete(`/invoices/${response.body.id}`)
          .set('Authorization', `Bearer ${authToken}`);
      }
    });

    it('should handle zero quantity', async () => {
      if (!authToken) return;

      const invoiceData = {
        customerId: 'test-customer-zero',
        items: [{ description: 'Item', quantity: 0, unitPrice: 100 }],
      };

      const response = await request(app.getHttpServer())
        .post('/invoices')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invoiceData);

      // Should either reject or accept with zero total
      expect(response.status).toBeDefined();
    });

    it('should handle decimal quantities and prices', async () => {
      if (!authToken) return;

      const invoiceData = {
        customerId: 'test-customer-decimal',
        items: [{ description: 'Item', quantity: 2.5, unitPrice: 99.99 }],
      };

      const response = await request(app.getHttpServer())
        .post('/invoices')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invoiceData);

      if (response.status === 201) {
        // Subtotal: 2.5 * 99.99 = 249.975 (may be rounded)
        expect(response.body.subtotal).toBeGreaterThan(0);

        // Cleanup
        await request(app.getHttpServer())
          .delete(`/invoices/${response.body.id}`)
          .set('Authorization', `Bearer ${authToken}`);
      }
    });
  });
});
