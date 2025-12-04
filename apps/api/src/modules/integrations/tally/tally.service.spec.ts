/**
 * Tally Service Unit Tests
 *
 * Tests for Tally ERP integration service with mocked Tally Gateway responses.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { TallyService } from './tally.service';
import { TallyClient } from './tally.client';
import { PrismaService } from '@operate/database';
import {
  TallySyncEntity,
  TallySyncConfig,
  TallyConnectionTest,
  TallyCompany,
  TallyLedger,
  TallyVoucher,
  TallyStockItem,
} from './tally.types';

describe('TallyService', () => {
  let service: TallyService;
  let tallyClient: TallyClient;
  let prismaService: PrismaService;

  // Mock data
  const mockOrgId = 'org_123';
  const mockCompanyName = 'Test Company Ltd';

  const mockCompany: TallyCompany = {
    guid: '{GUID-001}',
    name: mockCompanyName,
    mailingName: 'Test Company',
    address: '123 Test Street',
    country: 'India',
    state: 'Maharashtra',
    pincode: '400001',
    email: 'test@company.com',
    phone: '+91-22-12345678',
    gstin: '27AAAAA0000A1Z5',
  };

  const mockLedgers: TallyLedger[] = [
    {
      guid: '{LEDGER-001}',
      name: 'Customer A',
      parent: 'Sundry Debtors',
      openingBalance: 5000,
      mailingName: 'Customer A',
      gstin: '27BBBBB0000B1Z5',
    },
    {
      guid: '{LEDGER-002}',
      name: 'Vendor B',
      parent: 'Sundry Creditors',
      openingBalance: 3000,
      mailingName: 'Vendor B',
      gstin: '27CCCCC0000C1Z5',
    },
    {
      guid: '{LEDGER-003}',
      name: 'Bank Account',
      parent: 'Bank Accounts',
      openingBalance: 10000,
    },
  ];

  const mockVouchers: TallyVoucher[] = [
    {
      guid: '{VOUCHER-001}',
      voucherType: 'Sales' as any,
      voucherNumber: 'INV-001',
      date: '20240101',
      referenceNumber: 'REF-001',
      narration: 'Sale of goods',
      partyLedgerName: 'Customer A',
      ledgerEntries: [
        {
          ledgerName: 'Customer A',
          amount: 11800,
          isDeemedPositive: true,
        },
        {
          ledgerName: 'Sales',
          amount: -10000,
          isDeemedPositive: false,
        },
        {
          ledgerName: 'CGST',
          amount: -900,
          isDeemedPositive: false,
        },
        {
          ledgerName: 'SGST',
          amount: -900,
          isDeemedPositive: false,
        },
      ],
    },
    {
      guid: '{VOUCHER-002}',
      voucherType: 'Payment' as any,
      voucherNumber: 'PAY-001',
      date: '20240102',
      narration: 'Payment to vendor',
      partyLedgerName: 'Vendor B',
      ledgerEntries: [
        {
          ledgerName: 'Vendor B',
          amount: 3000,
          isDeemedPositive: true,
        },
        {
          ledgerName: 'Bank Account',
          amount: -3000,
          isDeemedPositive: false,
        },
      ],
    },
  ];

  const mockStockItems: TallyStockItem[] = [
    {
      guid: '{STOCK-001}',
      name: 'Product A',
      parent: 'Primary',
      unit: 'Nos',
      openingBalance: 100,
      openingValue: 10000,
      openingRate: 100,
      gstHsnCode: '1234',
      gstRate: 18,
    },
    {
      guid: '{STOCK-002}',
      name: 'Product B',
      parent: 'Primary',
      unit: 'Kg',
      openingBalance: 50,
      openingValue: 5000,
      openingRate: 100,
      gstHsnCode: '5678',
      gstRate: 12,
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TallyService,
        {
          provide: TallyClient,
          useValue: {
            testConnection: jest.fn(),
            getCompanyList: jest.fn(),
            getCompany: jest.fn(),
            getLedgers: jest.fn(),
            getLedger: jest.fn(),
            getVouchers: jest.fn(),
            getVoucher: jest.fn(),
            getStockItems: jest.fn(),
            importLedger: jest.fn(),
            importVoucher: jest.fn(),
            importStockItem: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            // Mock Prisma methods as needed
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config = {
                TALLY_HOST: 'localhost',
                TALLY_PORT: 9000,
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    service = module.get<TallyService>(TallyService);
    tallyClient = module.get<TallyClient>(TallyClient);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('testConnection', () => {
    it('should test connection successfully', async () => {
      const mockConnectionResult: TallyConnectionTest = {
        success: true,
        message: 'Successfully connected to Tally Gateway. Found 1 companies.',
        availableCompanies: [mockCompanyName],
      };

      jest.spyOn(tallyClient, 'testConnection').mockResolvedValue(mockConnectionResult);

      const result = await service.testConnection(mockOrgId);

      expect(result.success).toBe(true);
      expect(result.availableCompanies).toContain(mockCompanyName);
      expect(tallyClient.testConnection).toHaveBeenCalledWith(undefined);
    });

    it('should handle connection failure', async () => {
      const mockConnectionResult: TallyConnectionTest = {
        success: false,
        message: 'Failed to connect to Tally Gateway',
        error: 'Connection refused',
      };

      jest.spyOn(tallyClient, 'testConnection').mockResolvedValue(mockConnectionResult);

      const result = await service.testConnection(mockOrgId);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('configureTallySync', () => {
    it('should configure Tally sync successfully', async () => {
      const mockConnectionResult: TallyConnectionTest = {
        success: true,
        message: 'Connected',
        availableCompanies: [mockCompanyName],
      };

      jest.spyOn(tallyClient, 'testConnection').mockResolvedValue(mockConnectionResult);

      const config: TallySyncConfig = {
        orgId: mockOrgId,
        tallyCompanyName: mockCompanyName,
        tallyHost: 'localhost',
        tallyPort: 9000,
        syncDirection: 'import',
        syncEntities: [TallySyncEntity.LEDGERS, TallySyncEntity.VOUCHERS],
        autoSync: false,
      };

      const result = await service.configureTallySync(mockOrgId, config);

      expect(result.orgId).toBe(mockOrgId);
      expect(result.tallyCompanyName).toBe(mockCompanyName);
      expect(result.lastSyncAt).toBeDefined();
    });

    it('should throw error if company not found', async () => {
      const mockConnectionResult: TallyConnectionTest = {
        success: true,
        message: 'Connected',
        availableCompanies: ['Other Company'],
      };

      jest.spyOn(tallyClient, 'testConnection').mockResolvedValue(mockConnectionResult);

      const config: TallySyncConfig = {
        orgId: mockOrgId,
        tallyCompanyName: 'Non-existent Company',
        syncDirection: 'import',
        syncEntities: [TallySyncEntity.LEDGERS],
      };

      await expect(service.configureTallySync(mockOrgId, config)).rejects.toThrow();
    });
  });

  describe('syncFromTally', () => {
    it('should sync ledgers from Tally', async () => {
      jest.spyOn(tallyClient, 'getLedgers').mockResolvedValue(mockLedgers);

      const config: TallySyncConfig = {
        orgId: mockOrgId,
        tallyCompanyName: mockCompanyName,
        syncDirection: 'import',
        syncEntities: [TallySyncEntity.LEDGERS],
      };

      const result = await service.syncFromTally(mockOrgId, config);

      expect(result.isRunning).toBe(false);
      expect(result.results).toHaveLength(1);
      expect(result.results[0].entity).toBe(TallySyncEntity.LEDGERS);
      expect(result.results[0].recordsSynced).toBe(mockLedgers.length);
      expect(result.results[0].success).toBe(true);
      expect(tallyClient.getLedgers).toHaveBeenCalledWith(mockCompanyName);
    });

    it('should sync vouchers from Tally', async () => {
      jest.spyOn(tallyClient, 'getVouchers').mockResolvedValue(mockVouchers);

      const config: TallySyncConfig = {
        orgId: mockOrgId,
        tallyCompanyName: mockCompanyName,
        syncDirection: 'import',
        syncEntities: [TallySyncEntity.VOUCHERS],
      };

      const result = await service.syncFromTally(mockOrgId, config);

      expect(result.isRunning).toBe(false);
      expect(result.results).toHaveLength(1);
      expect(result.results[0].entity).toBe(TallySyncEntity.VOUCHERS);
      expect(result.results[0].recordsSynced).toBe(mockVouchers.length);
      expect(result.results[0].success).toBe(true);
      expect(tallyClient.getVouchers).toHaveBeenCalledWith(mockCompanyName);
    });

    it('should sync stock items from Tally', async () => {
      jest.spyOn(tallyClient, 'getStockItems').mockResolvedValue(mockStockItems);

      const config: TallySyncConfig = {
        orgId: mockOrgId,
        tallyCompanyName: mockCompanyName,
        syncDirection: 'import',
        syncEntities: [TallySyncEntity.STOCK_ITEMS],
      };

      const result = await service.syncFromTally(mockOrgId, config);

      expect(result.isRunning).toBe(false);
      expect(result.results).toHaveLength(1);
      expect(result.results[0].entity).toBe(TallySyncEntity.STOCK_ITEMS);
      expect(result.results[0].recordsSynced).toBe(mockStockItems.length);
      expect(result.results[0].success).toBe(true);
      expect(tallyClient.getStockItems).toHaveBeenCalledWith(mockCompanyName);
    });

    it('should sync multiple entities', async () => {
      jest.spyOn(tallyClient, 'getCompanyList').mockResolvedValue([mockCompany]);
      jest.spyOn(tallyClient, 'getLedgers').mockResolvedValue(mockLedgers);
      jest.spyOn(tallyClient, 'getVouchers').mockResolvedValue(mockVouchers);

      const config: TallySyncConfig = {
        orgId: mockOrgId,
        tallyCompanyName: mockCompanyName,
        syncDirection: 'import',
        syncEntities: [
          TallySyncEntity.COMPANIES,
          TallySyncEntity.LEDGERS,
          TallySyncEntity.VOUCHERS,
        ],
      };

      const result = await service.syncFromTally(mockOrgId, config);

      expect(result.isRunning).toBe(false);
      expect(result.results).toHaveLength(3);
      expect(result.progress).toBe(100);
    });

    it('should handle sync errors gracefully', async () => {
      jest
        .spyOn(tallyClient, 'getLedgers')
        .mockRejectedValue(new Error('Connection failed'));

      const config: TallySyncConfig = {
        orgId: mockOrgId,
        tallyCompanyName: mockCompanyName,
        syncDirection: 'import',
        syncEntities: [TallySyncEntity.LEDGERS],
      };

      await expect(service.syncFromTally(mockOrgId, config)).rejects.toThrow();

      const status = service.getSyncStatus(mockOrgId);
      expect(status?.isRunning).toBe(false);
      expect(status?.message).toContain('failed');
    });
  });

  describe('getSyncStatus', () => {
    it('should return null if no sync is running', () => {
      const status = service.getSyncStatus('non-existent-org');
      expect(status).toBeNull();
    });

    it('should return sync status for running sync', async () => {
      jest.spyOn(tallyClient, 'getLedgers').mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve(mockLedgers), 100);
          }),
      );

      const config: TallySyncConfig = {
        orgId: mockOrgId,
        tallyCompanyName: mockCompanyName,
        syncDirection: 'import',
        syncEntities: [TallySyncEntity.LEDGERS],
      };

      // Start sync (don't await)
      service.syncFromTally(mockOrgId, config);

      // Check status immediately
      const status = service.getSyncStatus(mockOrgId);
      expect(status).toBeDefined();
      expect(status?.isRunning).toBe(true);
    });
  });

  describe('getAvailableCompanies', () => {
    it('should return list of available companies', async () => {
      jest.spyOn(tallyClient, 'getCompanyList').mockResolvedValue([mockCompany]);

      const result = await service.getAvailableCompanies();

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe(mockCompanyName);
      expect(tallyClient.getCompanyList).toHaveBeenCalled();
    });
  });

  describe('getCompanyInfo', () => {
    it('should return company information', async () => {
      jest.spyOn(tallyClient, 'getCompany').mockResolvedValue(mockCompany);

      const result = await service.getCompanyInfo(mockCompanyName);

      expect(result.name).toBe(mockCompanyName);
      expect(result.guid).toBe(mockCompany.guid);
      expect(tallyClient.getCompany).toHaveBeenCalledWith(mockCompanyName);
    });
  });

  describe('triggerSync', () => {
    it('should trigger manual sync', async () => {
      jest.spyOn(tallyClient, 'getLedgers').mockResolvedValue(mockLedgers);

      const config: TallySyncConfig = {
        orgId: mockOrgId,
        tallyCompanyName: mockCompanyName,
        syncDirection: 'import',
        syncEntities: [TallySyncEntity.LEDGERS],
      };

      const result = await service.triggerSync(mockOrgId, config);

      expect(result.isRunning).toBe(false);
      expect(result.results).toHaveLength(1);
    });

    it('should throw error if sync is already running', async () => {
      jest.spyOn(tallyClient, 'getLedgers').mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve(mockLedgers), 1000);
          }),
      );

      const config: TallySyncConfig = {
        orgId: mockOrgId,
        tallyCompanyName: mockCompanyName,
        syncDirection: 'import',
        syncEntities: [TallySyncEntity.LEDGERS],
      };

      // Start first sync (don't await)
      service.triggerSync(mockOrgId, config);

      // Try to start second sync immediately
      await expect(service.triggerSync(mockOrgId, config)).rejects.toThrow(
        'Sync is already running',
      );
    });
  });
});
