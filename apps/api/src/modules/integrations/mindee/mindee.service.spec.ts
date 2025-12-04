import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';
import { MindeeService } from './mindee.service';

describe('MindeeService', () => {
  let service: MindeeService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MindeeService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'MINDEE_API_KEY') return undefined;
              return undefined;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<MindeeService>(MindeeService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Mock Mode', () => {
    it('should run in mock mode when API key is not configured', () => {
      expect(service['mockMode']).toBe(true);
    });

    it('should return mock data in mock mode', async () => {
      const mockFile = Buffer.from('fake-image-data');
      const result = await service.parseReceipt(mockFile, 'image/jpeg');

      expect(result.success).toBe(true);
      expect(result.merchant.name).toBe('Mock Coffee Shop');
      expect(result.totals.amount).toBe(15.5);
      expect(result.totals.currency).toBe('EUR');
      expect(result.lineItems).toHaveLength(3);
    });

    it('should return mock job ID for async parsing', async () => {
      const mockFile = Buffer.from('fake-image-data');
      const jobId = await service.parseReceiptAsync(mockFile, 'image/jpeg');

      expect(jobId).toMatch(/^mock_/);
    });

    it('should return mock data for async job result', async () => {
      const result = await service.getParseResult('mock_12345');

      expect(result.success).toBe(true);
      expect(result.merchant.name).toBeDefined();
    });
  });

  describe('File Validation', () => {
    it('should reject empty file', async () => {
      const emptyFile = Buffer.from('');

      await expect(
        service.parseReceipt(emptyFile, 'image/jpeg'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject file that is too large', async () => {
      const largeFile = Buffer.alloc(15 * 1024 * 1024); // 15MB

      await expect(
        service.parseReceipt(largeFile, 'image/jpeg'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject unsupported file type', async () => {
      const file = Buffer.from('fake-data');

      await expect(
        service.parseReceipt(file, 'application/zip'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should accept supported MIME types', async () => {
      const file = Buffer.from('fake-image-data');
      const supportedTypes = [
        'image/jpeg',
        'image/png',
        'image/webp',
        'application/pdf',
      ];

      for (const mimeType of supportedTypes) {
        const result = await service.parseReceipt(file, mimeType);
        expect(result.success).toBe(true);
      }
    });
  });

  describe('Health Check', () => {
    it('should return mock mode status', async () => {
      const health = await service.checkConnection();

      expect(health.mockMode).toBe(true);
      expect(health.available).toBe(true);
    });
  });

  describe('Mock Data Structure', () => {
    it('should return complete receipt structure', async () => {
      const file = Buffer.from('fake-image-data');
      const result = await service.parseReceipt(file, 'image/jpeg');

      // Verify structure
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('merchant');
      expect(result).toHaveProperty('date');
      expect(result).toHaveProperty('totals');
      expect(result).toHaveProperty('lineItems');

      // Verify merchant
      expect(result.merchant).toHaveProperty('name');
      expect(result.merchant).toHaveProperty('confidence');

      // Verify date
      expect(result.date).toHaveProperty('value');
      expect(result.date).toHaveProperty('confidence');

      // Verify totals
      expect(result.totals).toHaveProperty('amount');
      expect(result.totals).toHaveProperty('tax');
      expect(result.totals).toHaveProperty('currency');
      expect(result.totals).toHaveProperty('confidence');

      // Verify line items
      expect(Array.isArray(result.lineItems)).toBe(true);
      if (result.lineItems.length > 0) {
        expect(result.lineItems[0]).toHaveProperty('description');
        expect(result.lineItems[0]).toHaveProperty('confidence');
      }
    });

    it('should have confidence scores between 0 and 1', async () => {
      const file = Buffer.from('fake-image-data');
      const result = await service.parseReceipt(file, 'image/jpeg');

      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
      expect(result.merchant.confidence).toBeGreaterThanOrEqual(0);
      expect(result.merchant.confidence).toBeLessThanOrEqual(1);
      expect(result.date.confidence).toBeGreaterThanOrEqual(0);
      expect(result.date.confidence).toBeLessThanOrEqual(1);
      expect(result.totals.confidence).toBeGreaterThanOrEqual(0);
      expect(result.totals.confidence).toBeLessThanOrEqual(1);

      result.lineItems.forEach((item) => {
        expect(item.confidence).toBeGreaterThanOrEqual(0);
        expect(item.confidence).toBeLessThanOrEqual(1);
      });
    });

    it('should include raw response in mock mode', async () => {
      const file = Buffer.from('fake-image-data');
      const result = await service.parseReceipt(file, 'image/jpeg');

      expect(result.rawResponse).toBeDefined();
      expect(result.rawResponse.mock).toBe(true);
    });
  });
});
