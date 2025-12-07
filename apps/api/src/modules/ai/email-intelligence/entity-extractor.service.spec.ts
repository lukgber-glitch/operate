/**
 * Entity Extractor Service - Unit Tests
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EntityExtractorService } from './entity-extractor.service';
import { EmailInput } from './types/extracted-entities.types';

describe('EntityExtractorService', () => {
  let service: EntityExtractorService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EntityExtractorService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'OPENAI_API_KEY') {
                return 'test-api-key';
              }
              return undefined;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<EntityExtractorService>(EntityExtractorService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('extractFromSignature', () => {
    it('should extract contact info from German signature', async () => {
      const emailBody = `
Sehr geehrte Damen und Herren,

vielen Dank für Ihre Anfrage.

Mit freundlichen Grüßen,

Max Mustermann
Geschäftsführer
ACME Solutions GmbH
Musterstraße 123
10115 Berlin

Tel: +49 30 12345678
Email: m.mustermann@acme-gmbh.de
      `;

      const signature = await service.extractFromSignature(emailBody);

      expect(signature).toBeDefined();
      // Note: Actual values depend on AI response or regex parsing
      // In production, mock the OpenAI/AI calls for testing
    });

    it('should handle email without signature', async () => {
      const emailBody = 'Just a short message without signature.';

      const signature = await service.extractFromSignature(emailBody);

      expect(signature.confidence).toBeLessThan(0.5);
    });
  });

  describe('extractEntities', () => {
    it('should extract entities from invoice email', async () => {
      const email: EmailInput = {
        subject: 'Rechnung RE-2024-001',
        from: 'billing@acme.de',
        to: 'finance@company.com',
        body: `
Rechnung RE-2024-001
Datum: 01.12.2024
Fällig: 31.12.2024
Betrag: 1.500,00 EUR

ACME Solutions GmbH
USt-IdNr: DE123456789
        `,
      };

      // Note: In actual tests, mock the AI service
      // This is just a structure example
      const entities = await service.extractEntities(email);

      expect(entities).toBeDefined();
      expect(entities.emailSubject).toBe(email.subject);
      expect(entities.extractedAt).toBeInstanceOf(Date);
    });
  });

  describe('extractBatch', () => {
    it('should process multiple emails', async () => {
      const emails: EmailInput[] = [
        {
          subject: 'Invoice #1',
          from: 'vendor1@example.com',
          to: 'company@example.com',
          body: 'Invoice for $500',
        },
        {
          subject: 'Invoice #2',
          from: 'vendor2@example.com',
          to: 'company@example.com',
          body: 'Invoice for €750',
        },
      ];

      const results = await service.extractBatch(emails);

      expect(results).toHaveLength(2);
      expect(results[0]).toBeDefined();
      expect(results[1]).toBeDefined();
    });

    it('should handle errors gracefully in batch processing', async () => {
      const emails: EmailInput[] = [
        {
          subject: 'Test',
          from: 'test@example.com',
          to: 'company@example.com',
          body: 'Test body',
        },
      ];

      // Mock to throw error
      jest.spyOn(service as any, 'callAIExtraction').mockRejectedValueOnce(
        new Error('API Error'),
      );

      const results = await service.extractBatch(emails);

      // Should return empty entities instead of throwing
      expect(results).toHaveLength(1);
      expect(results[0].overallConfidence).toBe(0);
    });
  });
});

/**
 * Integration Test Example
 * Demonstrates how to test with actual database
 */
describe('EntityExtractorService - Integration', () => {
  // These tests would require actual database and API keys
  // Skip in CI/CD, run locally for validation

  it.skip('should extract and store entities for real email', async () => {
    // Setup: Create test database, inject real services
    // Execute: Extract entities from test email
    // Verify: Check database for stored entities
    // Cleanup: Remove test data
  });
});
