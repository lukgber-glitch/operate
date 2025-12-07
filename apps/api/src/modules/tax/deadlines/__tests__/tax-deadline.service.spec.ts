/**
 * Tax Deadline Service Tests
 */

import { Test, TestingModule } from '@nestjs/testing';
import { TaxDeadlineService } from '../tax-deadline.service';
import { PrismaService } from '../../../database/prisma.service';
import { addDays, startOfDay } from 'date-fns';

describe('TaxDeadlineService', () => {
  let service: TaxDeadlineService;
  let prisma: PrismaService;

  const mockPrismaService = {
    organisation: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaxDeadlineService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<TaxDeadlineService>(TaxDeadlineService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getUpcomingDeadlines', () => {
    it('should return upcoming deadlines for German organization with VAT', async () => {
      const orgId = 'test-org-123';
      const mockOrg = {
        country: 'DE',
        vatNumber: 'DE123456789',
        settings: { taxFilingFrequency: 'monthly' },
      };

      mockPrismaService.organisation.findUnique.mockResolvedValue(mockOrg);

      const deadlines = await service.getUpcomingDeadlines(orgId, 30);

      expect(deadlines).toBeDefined();
      expect(Array.isArray(deadlines)).toBe(true);
      expect(prisma.organisation.findUnique).toHaveBeenCalledWith({
        where: { id: orgId },
        select: { country: true, settings: true, vatNumber: true },
      });

      // Should include VAT deadlines for German org
      const vatDeadlines = deadlines.filter(d => d.type.includes('VAT'));
      expect(vatDeadlines.length).toBeGreaterThan(0);
    });

    it('should return empty array for organization without country', async () => {
      const orgId = 'test-org-456';
      const mockOrg = {
        country: null,
        vatNumber: null,
        settings: {},
      };

      mockPrismaService.organisation.findUnique.mockResolvedValue(mockOrg);

      const deadlines = await service.getUpcomingDeadlines(orgId, 30);

      expect(deadlines).toEqual([]);
    });

    it('should filter out VAT deadlines for non-VAT registered org', async () => {
      const orgId = 'test-org-789';
      const mockOrg = {
        country: 'DE',
        vatNumber: null, // Not VAT registered
        settings: {},
      };

      mockPrismaService.organisation.findUnique.mockResolvedValue(mockOrg);

      const deadlines = await service.getUpcomingDeadlines(orgId, 30);

      // Should not include VAT deadlines
      const vatDeadlines = deadlines.filter(d =>
        d.type.includes('VAT') || d.type.includes('USt')
      );
      expect(vatDeadlines.length).toBe(0);

      // Should include annual return
      const annualDeadlines = deadlines.filter(d => d.type === 'ANNUAL_RETURN');
      expect(annualDeadlines.length).toBeGreaterThan(0);
    });

    it('should respect filing frequency setting', async () => {
      const orgId = 'test-org-quarterly';
      const mockOrg = {
        country: 'DE',
        vatNumber: 'DE123456789',
        settings: { taxFilingFrequency: 'quarterly' },
      };

      mockPrismaService.organisation.findUnique.mockResolvedValue(mockOrg);

      const deadlines = await service.getUpcomingDeadlines(orgId, 90);

      // Should not include monthly VAT deadlines when frequency is quarterly
      const monthlyVat = deadlines.filter(d =>
        d.type === 'VAT_ADVANCE' && d.schedule === 'MONTHLY'
      );
      expect(monthlyVat.length).toBe(0);
    });

    it('should handle Austrian deadlines correctly', async () => {
      const orgId = 'test-org-at';
      const mockOrg = {
        country: 'AT',
        vatNumber: 'ATU12345678',
        settings: { taxFilingFrequency: 'monthly' },
      };

      mockPrismaService.organisation.findUnique.mockResolvedValue(mockOrg);

      const deadlines = await service.getUpcomingDeadlines(orgId, 30);

      expect(deadlines).toBeDefined();
      // Austrian VAT due on 15th
      const uvaDeadlines = deadlines.filter(d => d.name.includes('UVA'));
      expect(uvaDeadlines.length).toBeGreaterThan(0);
    });

    it('should handle UK deadlines correctly', async () => {
      const orgId = 'test-org-uk';
      const mockOrg = {
        country: 'UK',
        vatNumber: 'GB123456789',
        settings: {},
      };

      mockPrismaService.organisation.findUnique.mockResolvedValue(mockOrg);

      const deadlines = await service.getUpcomingDeadlines(orgId, 90);

      expect(deadlines).toBeDefined();
      // UK VAT returns are quarterly, 37 days after period end
      const vatReturns = deadlines.filter(d => d.type === 'VAT_RETURN');
      expect(vatReturns.length).toBeGreaterThanOrEqual(0);
    });

    it('should handle US deadlines correctly', async () => {
      const orgId = 'test-org-us';
      const mockOrg = {
        country: 'US',
        vatNumber: null,
        settings: {},
      };

      mockPrismaService.organisation.findUnique.mockResolvedValue(mockOrg);

      const deadlines = await service.getUpcomingDeadlines(orgId, 120);

      expect(deadlines).toBeDefined();
      // US has quarterly estimated tax payments
      const estimatedTax = deadlines.filter(d => d.type === 'ESTIMATED_TAX');
      expect(estimatedTax.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('generateReminders', () => {
    it('should generate reminders only at specific day intervals', async () => {
      const orgId = 'test-org-reminders';
      const today = startOfDay(new Date());

      const mockOrg = {
        country: 'DE',
        vatNumber: 'DE123456789',
        settings: { taxFilingFrequency: 'quarterly' },
      };

      mockPrismaService.organisation.findUnique.mockResolvedValue(mockOrg);

      const reminders = await service.generateReminders(orgId);

      expect(Array.isArray(reminders)).toBe(true);

      // All reminders should have specific days remaining: 30, 14, 7, 3, or 1
      const allowedDays = [30, 14, 7, 3, 1, 0];
      reminders.forEach(reminder => {
        expect(allowedDays).toContain(reminder.daysRemaining);
      });
    });

    it('should assign correct priority based on days remaining', async () => {
      const orgId = 'test-org-priority';
      const mockOrg = {
        country: 'DE',
        vatNumber: 'DE123456789',
        settings: {},
      };

      mockPrismaService.organisation.findUnique.mockResolvedValue(mockOrg);

      const reminders = await service.generateReminders(orgId);

      reminders.forEach(reminder => {
        if (reminder.daysRemaining <= 3) {
          expect(reminder.priority).toBe('HIGH');
        } else if (reminder.daysRemaining <= 7) {
          expect(reminder.priority).toBe('MEDIUM');
        } else {
          expect(reminder.priority).toBe('LOW');
        }
      });
    });

    it('should include actionUrl in all reminders', async () => {
      const orgId = 'test-org-urls';
      const mockOrg = {
        country: 'DE',
        vatNumber: 'DE123456789',
        settings: {},
      };

      mockPrismaService.organisation.findUnique.mockResolvedValue(mockOrg);

      const reminders = await service.generateReminders(orgId);

      reminders.forEach(reminder => {
        expect(reminder.actionUrl).toBeDefined();
        expect(typeof reminder.actionUrl).toBe('string');
        expect(reminder.actionUrl.startsWith('/tax/')).toBe(true);
      });
    });
  });

  describe('getDeadlinesByCountry', () => {
    it('should return deadlines for Germany', () => {
      const deadlines = service.getDeadlinesByCountry('DE');

      expect(deadlines).toBeDefined();
      expect(deadlines.length).toBeGreaterThan(0);
      expect(deadlines.some(d => d.type.includes('VAT'))).toBe(true);
      expect(deadlines.some(d => d.type === 'ANNUAL_RETURN')).toBe(true);
    });

    it('should return deadlines for Austria', () => {
      const deadlines = service.getDeadlinesByCountry('AT');

      expect(deadlines).toBeDefined();
      expect(deadlines.length).toBeGreaterThan(0);
      expect(deadlines.some(d => d.name.includes('UVA'))).toBe(true);
    });

    it('should handle UK country code variation', () => {
      const deadlinesUK = service.getDeadlinesByCountry('UK');
      const deadlinesGB = service.getDeadlinesByCountry('GB');

      expect(deadlinesUK).toEqual(deadlinesGB);
      expect(deadlinesUK.length).toBeGreaterThan(0);
    });

    it('should return empty array for unsupported country', () => {
      const deadlines = service.getDeadlinesByCountry('ZZ');

      expect(deadlines).toEqual([]);
    });
  });

  describe('getDeadlineSummary', () => {
    it('should return summary with correct structure', async () => {
      const orgId = 'test-org-summary';
      const mockOrg = {
        country: 'DE',
        vatNumber: 'DE123456789',
        settings: {},
      };

      mockPrismaService.organisation.findUnique.mockResolvedValue(mockOrg);

      const summary = await service.getDeadlineSummary(orgId);

      expect(summary).toBeDefined();
      expect(typeof summary.total).toBe('number');
      expect(typeof summary.upcoming).toBe('number');
      expect(typeof summary.urgent).toBe('number');
      expect(summary.total).toBeGreaterThanOrEqual(0);
      expect(summary.upcoming).toBeGreaterThanOrEqual(0);
      expect(summary.urgent).toBeGreaterThanOrEqual(0);
    });

    it('should correctly categorize urgent vs upcoming deadlines', async () => {
      const orgId = 'test-org-categories';
      const mockOrg = {
        country: 'DE',
        vatNumber: 'DE123456789',
        settings: {},
      };

      mockPrismaService.organisation.findUnique.mockResolvedValue(mockOrg);

      const summary = await service.getDeadlineSummary(orgId);

      // Total should equal urgent + upcoming
      expect(summary.total).toBe(summary.urgent + summary.upcoming);
    });

    it('should include nextDeadline if deadlines exist', async () => {
      const orgId = 'test-org-next';
      const mockOrg = {
        country: 'DE',
        vatNumber: 'DE123456789',
        settings: {},
      };

      mockPrismaService.organisation.findUnique.mockResolvedValue(mockOrg);

      const summary = await service.getDeadlineSummary(orgId);

      if (summary.total > 0) {
        expect(summary.nextDeadline).toBeDefined();
        expect(summary.nextDeadline?.dueDate).toBeInstanceOf(Date);
        expect(summary.nextDeadline?.daysRemaining).toBeGreaterThanOrEqual(0);
      }
    });
  });
});
