/**
 * Unit Test: Health Controller
 * Tests for the health check controller endpoints
 *
 * @see RULES.md Section 6 - Testing Standards
 * @see RULES.md Section 6.3 - Test Naming Convention
 */

import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from '../health.controller';
import { HealthService } from '../health.service';

/**
 * Mock HealthService
 */
const mockHealthService = {
  getBasicHealth: jest.fn(),
  getDetailedHealth: jest.fn(),
  getReadiness: jest.fn(),
  getLiveness: jest.fn(),
  getMetrics: jest.fn(),
};

/**
 * Health Controller Test Suite
 */
describe('HealthController', () => {
  let controller: HealthController;
  let service: HealthService;

  /**
   * Setup before each test
   */
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HealthService,
          useValue: mockHealthService,
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    service = module.get<HealthService>(HealthService);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  /**
   * Controller initialization
   */
  describe('Controller Initialization', () => {
    it('should be defined', () => {
      expect(controller).toBeDefined();
    });

    it('should have HealthService injected', () => {
      expect(service).toBeDefined();
    });
  });

  /**
   * GET /health - Basic health check
   */
  describe('getHealth', () => {
    it('should return status ok when system is healthy', async () => {
      const mockResponse = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: {
          name: 'operate-api',
          version: '1.0.0',
        },
      };

      mockHealthService.getBasicHealth.mockResolvedValue(mockResponse);

      const result = await controller.getHealth();

      expect(result).toEqual(mockResponse);
      expect(result.status).toBe('ok');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('service');
      expect(service.getBasicHealth).toHaveBeenCalledTimes(1);
    });

    it('should include service name and version', async () => {
      const mockResponse = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: {
          name: 'operate-api',
          version: '1.0.0',
        },
      };

      mockHealthService.getBasicHealth.mockResolvedValue(mockResponse);

      const result = await controller.getHealth();

      expect(result.service.name).toBe('operate-api');
      expect(result.service.version).toMatch(/\d+\.\d+\.\d+/);
    });

    it('should return valid ISO timestamp', async () => {
      const mockResponse = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: {
          name: 'operate-api',
          version: '1.0.0',
        },
      };

      mockHealthService.getBasicHealth.mockResolvedValue(mockResponse);

      const result = await controller.getHealth();

      expect(result.timestamp).toBeISODate();
    });
  });

  /**
   * GET /health/detailed - Detailed health check
   */
  describe('getDetailedHealth', () => {
    it('should return detailed status with all service checks', async () => {
      const mockResponse = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        checks: {
          database: {
            status: 'ok',
            responseTime: 15,
          },
          redis: {
            status: 'ok',
            responseTime: 3,
          },
        },
      };

      mockHealthService.getDetailedHealth.mockResolvedValue(mockResponse);

      const result = await controller.getDetailedHealth();

      expect(result).toEqual(mockResponse);
      expect(result.status).toBe('ok');
      expect(result.checks).toHaveProperty('database');
      expect(result.checks).toHaveProperty('redis');
      expect(service.getDetailedHealth).toHaveBeenCalledTimes(1);
    });

    it('should return error status when database is down', async () => {
      const mockResponse = {
        status: 'error',
        timestamp: new Date().toISOString(),
        checks: {
          database: {
            status: 'error',
            responseTime: 5000,
            error: 'Connection timeout',
          },
          redis: {
            status: 'ok',
            responseTime: 3,
          },
        },
      };

      mockHealthService.getDetailedHealth.mockResolvedValue(mockResponse);

      const result = await controller.getDetailedHealth();

      expect(result.status).toBe('error');
      expect(result.checks.database.status).toBe('error');
      expect(result.checks.database).toHaveProperty('error');
    });

    it('should include response time for each check', async () => {
      const mockResponse = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        checks: {
          database: {
            status: 'ok',
            responseTime: 15,
          },
          redis: {
            status: 'ok',
            responseTime: 3,
          },
        },
      };

      mockHealthService.getDetailedHealth.mockResolvedValue(mockResponse);

      const result = await controller.getDetailedHealth();

      Object.values(result.checks).forEach((check: any) => {
        expect(check).toHaveProperty('responseTime');
        expect(typeof check.responseTime).toBe('number');
        expect(check.responseTime).toBeGreaterThanOrEqual(0);
      });
    });

    it('should return degraded status when non-critical service is down', async () => {
      const mockResponse = {
        status: 'degraded',
        timestamp: new Date().toISOString(),
        checks: {
          database: {
            status: 'ok',
            responseTime: 15,
          },
          redis: {
            status: 'error',
            responseTime: 5000,
            error: 'Connection refused',
          },
        },
      };

      mockHealthService.getDetailedHealth.mockResolvedValue(mockResponse);

      const result = await controller.getDetailedHealth();

      expect(result.status).toBe('degraded');
    });
  });

  /**
   * GET /health/ready - Readiness check
   */
  describe('getReadiness', () => {
    it('should return ready true when all critical services are available', async () => {
      const mockResponse = {
        ready: true,
        timestamp: new Date().toISOString(),
        services: {
          database: true,
          redis: true,
        },
      };

      mockHealthService.getReadiness.mockResolvedValue(mockResponse);

      const result = await controller.getReadiness();

      expect(result.ready).toBe(true);
      expect(result.services.database).toBe(true);
      expect(result.services.redis).toBe(true);
      expect(service.getReadiness).toHaveBeenCalledTimes(1);
    });

    it('should return ready false when critical service is unavailable', async () => {
      const mockResponse = {
        ready: false,
        timestamp: new Date().toISOString(),
        services: {
          database: false,
          redis: true,
        },
      };

      mockHealthService.getReadiness.mockResolvedValue(mockResponse);

      const result = await controller.getReadiness();

      expect(result.ready).toBe(false);
      expect(result.services.database).toBe(false);
    });
  });

  /**
   * GET /health/live - Liveness check
   */
  describe('getLiveness', () => {
    it('should return alive true when application is running', async () => {
      const mockResponse = {
        alive: true,
        timestamp: new Date().toISOString(),
      };

      mockHealthService.getLiveness.mockResolvedValue(mockResponse);

      const result = await controller.getLiveness();

      expect(result.alive).toBe(true);
      expect(result).toHaveProperty('timestamp');
      expect(service.getLiveness).toHaveBeenCalledTimes(1);
    });

    it('should complete within 100ms', async () => {
      const mockResponse = {
        alive: true,
        timestamp: new Date().toISOString(),
      };

      mockHealthService.getLiveness.mockResolvedValue(mockResponse);

      const startTime = Date.now();
      await controller.getLiveness();
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(100);
    });
  });

  /**
   * GET /health/metrics - Application metrics
   */
  describe('getMetrics', () => {
    it('should return application metrics', async () => {
      const mockResponse = {
        uptime: 3600,
        memory: {
          total: 1024 * 1024 * 1024,
          used: 512 * 1024 * 1024,
          free: 512 * 1024 * 1024,
        },
        cpu: {
          usage: 25.5,
        },
        requests: {
          total: 1000,
          success: 950,
          errors: 50,
        },
      };

      mockHealthService.getMetrics.mockResolvedValue(mockResponse);

      const result = await controller.getMetrics();

      expect(result).toHaveProperty('uptime');
      expect(result).toHaveProperty('memory');
      expect(result).toHaveProperty('cpu');
      expect(result).toHaveProperty('requests');
      expect(service.getMetrics).toHaveBeenCalledTimes(1);
    });

    it('should return uptime in seconds', async () => {
      const mockResponse = {
        uptime: 3600,
        memory: { total: 0, used: 0, free: 0 },
        cpu: { usage: 0 },
        requests: { total: 0, success: 0, errors: 0 },
      };

      mockHealthService.getMetrics.mockResolvedValue(mockResponse);

      const result = await controller.getMetrics();

      expect(typeof result.uptime).toBe('number');
      expect(result.uptime).toBeGreaterThanOrEqual(0);
    });

    it('should return memory usage statistics', async () => {
      const mockResponse = {
        uptime: 3600,
        memory: {
          total: 1024 * 1024 * 1024,
          used: 512 * 1024 * 1024,
          free: 512 * 1024 * 1024,
        },
        cpu: { usage: 0 },
        requests: { total: 0, success: 0, errors: 0 },
      };

      mockHealthService.getMetrics.mockResolvedValue(mockResponse);

      const result = await controller.getMetrics();

      expect(result.memory).toHaveProperty('total');
      expect(result.memory).toHaveProperty('used');
      expect(result.memory).toHaveProperty('free');
      expect(typeof result.memory.total).toBe('number');
      expect(typeof result.memory.used).toBe('number');
      expect(typeof result.memory.free).toBe('number');
    });

    it('should return request statistics', async () => {
      const mockResponse = {
        uptime: 3600,
        memory: { total: 0, used: 0, free: 0 },
        cpu: { usage: 0 },
        requests: {
          total: 1000,
          success: 950,
          errors: 50,
        },
      };

      mockHealthService.getMetrics.mockResolvedValue(mockResponse);

      const result = await controller.getMetrics();

      expect(result.requests).toHaveProperty('total');
      expect(result.requests).toHaveProperty('success');
      expect(result.requests).toHaveProperty('errors');
      expect(result.requests.total).toBe(result.requests.success + result.requests.errors);
    });
  });
});
