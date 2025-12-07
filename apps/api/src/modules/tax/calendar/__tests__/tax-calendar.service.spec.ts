import { Test, TestingModule } from '@nestjs/testing';
import { TaxCalendarService } from '../tax-calendar.service';
import { PrismaService } from '../../../database/prisma.service';

describe('TaxCalendarService', () => {
  let service: TaxCalendarService;
  let prisma: PrismaService;

  const mockPrismaService = {
    organisation: {
      findUnique: jest.fn(),
    },
    elsterFiling: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaxCalendarService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<TaxCalendarService>(TaxCalendarService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getDeadlines', () => {
    it('should return German tax deadlines for DE organization', async () => {
      mockPrismaService.organisation.findUnique.mockResolvedValue({
        id: 'org-1',
        country: 'DE',
        vatNumber: 'DE123456789',
        settings: { taxFilingFrequency: 'quarterly' },
      });

      mockPrismaService.elsterFiling.findMany.mockResolvedValue([]);

      const deadlines = await service.getDeadlines('org-1', 2024);

      expect(deadlines).toBeDefined();
      expect(deadlines.length).toBeGreaterThan(0);
      expect(deadlines.some(d => d.type === 'vat_return')).toBe(true);
      expect(deadlines.some(d => d.type === 'annual_return')).toBe(true);
      expect(deadlines.some(d => d.type === 'prepayment')).toBe(true);
    });

    it('should return Austrian tax deadlines for AT organization', async () => {
      mockPrismaService.organisation.findUnique.mockResolvedValue({
        id: 'org-2',
        country: 'AT',
        vatNumber: 'ATU12345678',
        settings: { taxFilingFrequency: 'monthly' },
      });

      mockPrismaService.elsterFiling.findMany.mockResolvedValue([]);

      const deadlines = await service.getDeadlines('org-2', 2024);

      expect(deadlines).toBeDefined();
      expect(deadlines.length).toBeGreaterThan(0);
      expect(deadlines.some(d => d.country === 'AT')).toBe(true);
      expect(deadlines.some(d => d.type === 'vat_return')).toBe(true);
    });

    it('should return quarterly VAT deadlines for quarterly filing', async () => {
      mockPrismaService.organisation.findUnique.mockResolvedValue({
        id: 'org-1',
        country: 'DE',
        vatNumber: 'DE123456789',
        settings: { taxFilingFrequency: 'quarterly' },
      });

      mockPrismaService.elsterFiling.findMany.mockResolvedValue([]);

      const deadlines = await service.getDeadlines('org-1', 2024);
      const vatDeadlines = deadlines.filter(d => d.type === 'vat_return' && d.filingType === 'quarterly');

      expect(vatDeadlines.length).toBeGreaterThan(0);
      expect(vatDeadlines.every(d => d.id.includes('Q'))).toBe(true);
    });

    it('should return monthly VAT deadlines for monthly filing', async () => {
      mockPrismaService.organisation.findUnique.mockResolvedValue({
        id: 'org-1',
        country: 'DE',
        vatNumber: 'DE123456789',
        settings: { taxFilingFrequency: 'monthly' },
      });

      mockPrismaService.elsterFiling.findMany.mockResolvedValue([]);

      const deadlines = await service.getDeadlines('org-1', 2024);
      const vatDeadlines = deadlines.filter(d => d.type === 'vat_return' && d.filingType === 'monthly');

      expect(vatDeadlines.length).toBe(12); // 12 monthly deadlines
    });

    it('should mark deadlines as completed based on ELSTER filings', async () => {
      mockPrismaService.organisation.findUnique.mockResolvedValue({
        id: 'org-1',
        country: 'DE',
        vatNumber: 'DE123456789',
        settings: { taxFilingFrequency: 'quarterly' },
      });

      mockPrismaService.elsterFiling.findMany.mockResolvedValue([
        {
          taxType: 'USt',
          taxYear: 2024,
          taxPeriod: 'Q1',
          status: 'submitted',
          submittedAt: new Date('2024-04-05'),
        },
      ]);

      const deadlines = await service.getDeadlines('org-1', 2024);
      const q1Deadline = deadlines.find(d => d.id === 'vat-2024-Q1');

      expect(q1Deadline).toBeDefined();
      expect(q1Deadline?.status).toBe('completed');
    });
  });

  describe('getUpcomingDeadlines', () => {
    it('should return deadlines within specified days', async () => {
      mockPrismaService.organisation.findUnique.mockResolvedValue({
        id: 'org-1',
        country: 'DE',
        vatNumber: 'DE123456789',
        settings: { taxFilingFrequency: 'quarterly' },
      });

      mockPrismaService.elsterFiling.findMany.mockResolvedValue([]);

      const upcoming = await service.getUpcomingDeadlines('org-1', 30);

      expect(upcoming).toBeDefined();
      expect(Array.isArray(upcoming)).toBe(true);

      // All deadlines should be in the future and within 30 days
      const now = new Date();
      const cutoff = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      upcoming.forEach(deadline => {
        expect(deadline.dueDate >= now).toBe(true);
        expect(deadline.dueDate <= cutoff).toBe(true);
        expect(deadline.status).not.toBe('completed');
      });
    });
  });

  describe('getOverdueDeadlines', () => {
    it('should return only overdue deadlines', async () => {
      mockPrismaService.organisation.findUnique.mockResolvedValue({
        id: 'org-1',
        country: 'DE',
        vatNumber: 'DE123456789',
        settings: { taxFilingFrequency: 'quarterly' },
      });

      mockPrismaService.elsterFiling.findMany.mockResolvedValue([]);

      const overdue = await service.getOverdueDeadlines('org-1');

      expect(overdue).toBeDefined();
      expect(Array.isArray(overdue)).toBe(true);

      const now = new Date();
      overdue.forEach(deadline => {
        expect(deadline.dueDate < now).toBe(true);
        expect(deadline.status).not.toBe('completed');
      });
    });
  });

  describe('getDeadlinesByFilters', () => {
    beforeEach(() => {
      mockPrismaService.organisation.findUnique.mockResolvedValue({
        id: 'org-1',
        country: 'DE',
        vatNumber: 'DE123456789',
        settings: { taxFilingFrequency: 'quarterly' },
      });

      mockPrismaService.elsterFiling.findMany.mockResolvedValue([]);
    });

    it('should filter by type', async () => {
      const deadlines = await service.getDeadlinesByFilters('org-1', {
        type: 'vat_return',
      });

      expect(deadlines.every(d => d.type === 'vat_return')).toBe(true);
    });

    it('should filter by status', async () => {
      const deadlines = await service.getDeadlinesByFilters('org-1', {
        status: 'upcoming',
      });

      expect(deadlines.every(d => d.status === 'upcoming')).toBe(true);
    });

    it('should filter by country', async () => {
      const deadlines = await service.getDeadlinesByFilters('org-1', {
        country: 'DE',
      });

      expect(deadlines.every(d => d.country === 'DE')).toBe(true);
    });

    it('should filter by year', async () => {
      const deadlines = await service.getDeadlinesByFilters('org-1', {
        year: 2024,
      });

      expect(deadlines).toBeDefined();
      // Verify all deadlines are for 2024 or early 2025 (for year-end deadlines)
      deadlines.forEach(d => {
        const year = d.dueDate.getFullYear();
        expect(year === 2024 || year === 2025).toBe(true);
      });
    });
  });
});
