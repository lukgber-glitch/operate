/**
 * Classification Service Unit Tests
 * Tests for AI classification with auto-approve integration
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ClassificationService } from './classification.service';
import { AutomationService } from '../../automation/automation.service';
import { AutoApproveService } from '../../automation/auto-approve.service';
import { AutomationSettingsService } from '../../automation/automation-settings.service';
import { ReviewQueueService } from './review-queue/review-queue.service';
import { EventsGateway } from '../../../websocket/events.gateway';

describe('ClassificationService', () => {
  let service: ClassificationService;
  let autoApproveService: AutoApproveService;
  let eventsGateway: EventsGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClassificationService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'ANTHROPIC_API_KEY') return 'test-key';
              if (key === 'CLASSIFICATION_CONFIDENCE_THRESHOLD') return 0.7;
              return null;
            }),
          },
        },
        {
          provide: AutomationService,
          useValue: {
            shouldAutoApprove: jest.fn(),
            logAutomationAction: jest.fn(),
          },
        },
        {
          provide: AutoApproveService,
          useValue: {
            shouldAutoApprove: jest.fn(),
            executeAutoApproval: jest.fn(),
          },
        },
        {
          provide: AutomationSettingsService,
          useValue: {
            getSettings: jest.fn(),
            getFeatureMode: jest.fn(),
          },
        },
        {
          provide: ReviewQueueService,
          useValue: {
            addToQueue: jest.fn(),
          },
        },
        {
          provide: EventsGateway,
          useValue: {
            emitToOrganization: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ClassificationService>(ClassificationService);
    autoApproveService = module.get<AutoApproveService>(AutoApproveService);
    eventsGateway = module.get<EventsGateway>(EventsGateway);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('classifyWithAutoApproval', () => {
    it('should auto-approve transaction when confidence meets threshold', async () => {
      // Mock auto-approve decision
      jest.spyOn(autoApproveService, 'shouldAutoApprove').mockResolvedValue({
        autoApprove: true,
        reason: 'Confidence meets threshold in FULL_AUTO mode',
      });

      jest.spyOn(autoApproveService, 'executeAutoApproval').mockResolvedValue({} as any);

      // Mock classification result
      jest.spyOn(service as any, 'classifyTransaction').mockResolvedValue({
        category: 'software_subscriptions',
        confidence: 0.95,
        reasoning: 'Cloud service subscription',
        taxRelevant: true,
        suggestedDeductionCategory: 'software',
      });

      const result = await service.classifyWithAutoApproval('org-123', {
        id: 'tx-123',
        description: 'AWS Subscription',
        amount: 99.99,
        currency: 'EUR',
        date: new Date(),
      });

      expect(result.autoApproved).toBe(true);
      expect(result.addedToReviewQueue).toBe(false);
      expect(autoApproveService.executeAutoApproval).toHaveBeenCalled();
      expect(eventsGateway.emitToOrganization).toHaveBeenCalled();
    });

    it('should add to review queue when confidence is below threshold', async () => {
      // Mock auto-approve decision - should not approve
      jest.spyOn(autoApproveService, 'shouldAutoApprove').mockResolvedValue({
        autoApprove: false,
        reason: 'Confidence below threshold',
      });

      // Mock low confidence classification
      jest.spyOn(service as any, 'classifyTransaction').mockResolvedValue({
        category: 'unknown',
        confidence: 0.45,
        reasoning: 'Unable to determine category with high confidence',
        taxRelevant: false,
      });

      // Mock needs review to return true
      jest.spyOn(service, 'needsReview').mockReturnValue(true);

      const result = await service.classifyWithAutoApproval('org-123', {
        id: 'tx-456',
        description: 'UNKNOWN MERCHANT',
        amount: 150.0,
        currency: 'EUR',
        date: new Date(),
      });

      expect(result.autoApproved).toBe(false);
      expect(result.addedToReviewQueue).toBe(true);
    });

    it('should not auto-approve when amount exceeds threshold', async () => {
      // Mock auto-approve decision - rejected due to amount
      jest.spyOn(autoApproveService, 'shouldAutoApprove').mockResolvedValue({
        autoApprove: false,
        reason: 'Amount exceeds max auto-approve limit',
      });

      jest.spyOn(service as any, 'classifyTransaction').mockResolvedValue({
        category: 'equipment',
        confidence: 0.92,
        reasoning: 'High-value equipment purchase',
        taxRelevant: true,
      });

      const result = await service.classifyWithAutoApproval('org-123', {
        id: 'tx-789',
        description: 'MacBook Pro 16"',
        amount: 3500.0,
        currency: 'EUR',
        date: new Date(),
      });

      expect(result.autoApproved).toBe(false);
      expect(autoApproveService.executeAutoApproval).not.toHaveBeenCalled();
    });

    it('should emit WebSocket event for all classifications', async () => {
      jest.spyOn(autoApproveService, 'shouldAutoApprove').mockResolvedValue({
        autoApprove: false,
        reason: 'SEMI_AUTO mode',
      });

      jest.spyOn(service as any, 'classifyTransaction').mockResolvedValue({
        category: 'travel_business',
        confidence: 0.88,
        reasoning: 'Business travel expense',
        taxRelevant: true,
      });

      jest.spyOn(service, 'needsReview').mockReturnValue(false);

      await service.classifyWithAutoApproval('org-123', {
        id: 'tx-999',
        description: 'Hotel Stay',
        amount: 250.0,
        currency: 'EUR',
        date: new Date(),
      });

      // WebSocket event should always be emitted
      expect(eventsGateway.emitToOrganization).toHaveBeenCalled();
    });
  });

  describe('isHealthy', () => {
    it('should return true when classifier is initialized', () => {
      // Service is initialized in beforeEach via onModuleInit
      expect(service.isHealthy()).toBe(true);
    });
  });
});
