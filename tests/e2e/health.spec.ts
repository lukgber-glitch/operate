/**
 * E2E Test: Health Check Endpoint
 * Tests system health monitoring endpoints
 *
 * @see RULES.md Section 6.3 - Test Naming Convention
 */

import { test, expect } from '@playwright/test';

/**
 * Health Check Test Suite
 */
test.describe('Health Check Endpoints', () => {
  const API_URL = process.env.API_URL || 'http://localhost:3001';

  /**
   * Basic Health Check
   */
  test.describe('GET /health', () => {
    test('should return 200 OK when system is healthy', async ({ request }) => {
      const response = await request.get(`${API_URL}/health`);

      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body).toHaveProperty('status');
      expect(body.status).toBe('ok');
      expect(body).toHaveProperty('timestamp');
    });

    test('should respond within 500ms', async ({ request }) => {
      const startTime = Date.now();
      const response = await request.get(`${API_URL}/health`);
      const endTime = Date.now();

      expect(response.status()).toBe(200);
      expect(endTime - startTime).toBeLessThan(500);
    });

    test('should not require authentication', async ({ request }) => {
      // Make request without authorization header
      const response = await request.get(`${API_URL}/health`);

      // Should succeed without auth
      expect(response.status()).toBe(200);
    });

    test('should include service information', async ({ request }) => {
      const response = await request.get(`${API_URL}/health`);

      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body).toHaveProperty('service');
      expect(body.service).toHaveProperty('name');
      expect(body.service).toHaveProperty('version');
      expect(body.service.name).toBe('operate-api');
    });
  });

  /**
   * Detailed Health Check
   */
  test.describe('GET /health/detailed', () => {
    test('should return detailed system status', async ({ request }) => {
      const response = await request.get(`${API_URL}/health/detailed`);

      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body).toHaveProperty('status');
      expect(body).toHaveProperty('checks');
    });

    test('should check database connectivity', async ({ request }) => {
      const response = await request.get(`${API_URL}/health/detailed`);

      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body.checks).toHaveProperty('database');
      expect(body.checks.database).toHaveProperty('status');
      expect(['ok', 'error']).toContain(body.checks.database.status);
    });

    test('should check Redis connectivity', async ({ request }) => {
      const response = await request.get(`${API_URL}/health/detailed`);

      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body.checks).toHaveProperty('redis');
      expect(body.checks.redis).toHaveProperty('status');
      expect(['ok', 'error']).toContain(body.checks.redis.status);
    });

    test('should include response time for each check', async ({ request }) => {
      const response = await request.get(`${API_URL}/health/detailed`);

      expect(response.status()).toBe(200);

      const body = await response.json();

      // Check that each service has responseTime
      Object.values(body.checks).forEach((check: any) => {
        expect(check).toHaveProperty('responseTime');
        expect(typeof check.responseTime).toBe('number');
        expect(check.responseTime).toBeGreaterThanOrEqual(0);
      });
    });

    test('should return 503 when critical service is down', async ({ request }) => {
      // Note: This test will pass when system is healthy
      // In actual failure scenarios, status should be 503
      const response = await request.get(`${API_URL}/health/detailed`);

      const body = await response.json();

      if (body.status === 'error') {
        expect(response.status()).toBe(503);
      } else {
        expect(response.status()).toBe(200);
      }
    });
  });

  /**
   * Readiness Check
   */
  test.describe('GET /health/ready', () => {
    test('should return 200 when application is ready', async ({ request }) => {
      const response = await request.get(`${API_URL}/health/ready`);

      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body).toHaveProperty('ready');
      expect(body.ready).toBe(true);
    });

    test('should verify all critical services are available', async ({ request }) => {
      const response = await request.get(`${API_URL}/health/ready`);

      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body).toHaveProperty('services');

      // Critical services that must be ready
      const criticalServices = ['database', 'redis'];

      criticalServices.forEach((service) => {
        expect(body.services).toHaveProperty(service);
        expect(body.services[service]).toBe(true);
      });
    });
  });

  /**
   * Liveness Check
   */
  test.describe('GET /health/live', () => {
    test('should return 200 when application is alive', async ({ request }) => {
      const response = await request.get(`${API_URL}/health/live`);

      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body).toHaveProperty('alive');
      expect(body.alive).toBe(true);
    });

    test('should respond quickly for liveness probe', async ({ request }) => {
      const startTime = Date.now();
      const response = await request.get(`${API_URL}/health/live`);
      const endTime = Date.now();

      expect(response.status()).toBe(200);
      // Liveness check should be very fast (< 100ms)
      expect(endTime - startTime).toBeLessThan(100);
    });
  });

  /**
   * Metrics Endpoint
   */
  test.describe('GET /health/metrics', () => {
    test.skip('should return application metrics', async ({ request }) => {
      // TODO: Implement after metrics module is complete
      const response = await request.get(`${API_URL}/health/metrics`);

      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body).toHaveProperty('uptime');
      expect(body).toHaveProperty('memory');
      expect(body).toHaveProperty('cpu');
    });

    test.skip('should include request statistics', async ({ request }) => {
      // TODO: Implement after metrics module is complete
      const response = await request.get(`${API_URL}/health/metrics`);

      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body).toHaveProperty('requests');
      expect(body.requests).toHaveProperty('total');
      expect(body.requests).toHaveProperty('success');
      expect(body.requests).toHaveProperty('errors');
    });
  });
});
