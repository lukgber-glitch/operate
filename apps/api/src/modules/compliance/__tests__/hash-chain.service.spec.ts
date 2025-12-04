/**
 * Hash Chain Service Tests
 * Tests for GoBD-compliant hash chain audit logging
 */

import { Test, TestingModule } from '@nestjs/testing';
import { HashChainService } from '../services/hash-chain.service';
import { PrismaService } from '../../database/prisma.service';
import { AuditEntityType, AuditAction, AuditActorType } from '@prisma/client';

describe('HashChainService', () => {
  let service: HashChainService;
  let prisma: PrismaService;

  const mockPrismaService = {
    auditLog: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
    },
    auditLogSequence: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
      deleteMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HashChainService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<HashChainService>(HashChainService);
    prisma = module.get<PrismaService>(PrismaService);

    // Reset mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateHash', () => {
    it('should generate a consistent SHA-256 hash', () => {
      const payload = {
        tenantId: 'tenant-1',
        entityType: AuditEntityType.INVOICE,
        entityId: 'invoice-1',
        action: AuditAction.CREATE,
        previousState: undefined,
        newState: { amount: 100 },
        timestamp: new Date('2025-01-01T00:00:00Z'),
        previousHash: null,
        actorType: AuditActorType.USER,
        actorId: 'user-1',
      };

      const hash1 = service.generateHash(payload);
      const hash2 = service.generateHash(payload);

      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64); // SHA-256 produces 64 hex characters
    });

    it('should generate different hashes for different payloads', () => {
      const payload1 = {
        tenantId: 'tenant-1',
        entityType: AuditEntityType.INVOICE,
        entityId: 'invoice-1',
        action: AuditAction.CREATE,
        timestamp: new Date('2025-01-01T00:00:00Z'),
        previousHash: null,
        actorType: AuditActorType.USER,
      };

      const payload2 = {
        ...payload1,
        entityId: 'invoice-2', // Different entity ID
      };

      const hash1 = service.generateHash(payload1);
      const hash2 = service.generateHash(payload2);

      expect(hash1).not.toBe(hash2);
    });

    it('should include previousHash in hash calculation', () => {
      const payload1 = {
        tenantId: 'tenant-1',
        entityType: AuditEntityType.INVOICE,
        entityId: 'invoice-1',
        action: AuditAction.CREATE,
        timestamp: new Date('2025-01-01T00:00:00Z'),
        previousHash: null,
        actorType: AuditActorType.USER,
      };

      const payload2 = {
        ...payload1,
        previousHash: 'abc123',
      };

      const hash1 = service.generateHash(payload1);
      const hash2 = service.generateHash(payload2);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('createEntry', () => {
    it('should create audit entry with hash chain', async () => {
      const mockAuditLog = {
        id: 'audit-1',
        tenantId: 'tenant-1',
        hash: 'hash123',
        previousHash: null,
      };

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          auditLogSequence: {
            findUnique: jest.fn().mockResolvedValue(null),
            upsert: jest.fn(),
          },
          auditLog: {
            create: jest.fn().mockResolvedValue(mockAuditLog),
          },
        };

        return callback(mockTx);
      });

      const result = await service.createEntry({
        tenantId: 'tenant-1',
        entityType: AuditEntityType.INVOICE,
        entityId: 'invoice-1',
        action: AuditAction.CREATE,
        actorType: AuditActorType.USER,
        actorId: 'user-1',
      });

      expect(result).toBeDefined();
      expect(mockPrismaService.$transaction).toHaveBeenCalled();
    });

    it('should chain to previous entry', async () => {
      const previousHash = 'previous-hash-123';
      const mockAuditLog = {
        id: 'audit-2',
        tenantId: 'tenant-1',
        hash: 'hash456',
        previousHash,
      };

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          auditLogSequence: {
            findUnique: jest.fn().mockResolvedValue({ lastHash: previousHash }),
            upsert: jest.fn(),
          },
          auditLog: {
            create: jest.fn().mockResolvedValue(mockAuditLog),
          },
        };

        return callback(mockTx);
      });

      const result = await service.createEntry({
        tenantId: 'tenant-1',
        entityType: AuditEntityType.INVOICE,
        entityId: 'invoice-1',
        action: AuditAction.UPDATE,
        actorType: AuditActorType.USER,
      });

      expect(result.previousHash).toBe(previousHash);
    });
  });

  describe('verifyChainIntegrity', () => {
    it('should verify valid chain', async () => {
      const entries = [
        {
          id: 'audit-1',
          tenantId: 'tenant-1',
          entityType: AuditEntityType.INVOICE,
          entityId: 'invoice-1',
          action: AuditAction.CREATE,
          previousState: null,
          newState: { amount: 100 },
          timestamp: new Date('2025-01-01T00:00:00Z'),
          previousHash: null,
          hash: '', // Will be set below
          actorType: AuditActorType.USER,
          actorId: 'user-1',
        },
      ];

      // Generate correct hash
      entries[0].hash = service.generateHash(entries[0]);

      mockPrismaService.auditLog.findMany.mockResolvedValue(entries);

      const result = await service.verifyChainIntegrity('tenant-1');

      expect(result.valid).toBe(true);
      expect(result.totalEntries).toBe(1);
      expect(result.verifiedEntries).toBe(1);
    });

    it('should detect hash mismatch', async () => {
      const entries = [
        {
          id: 'audit-1',
          tenantId: 'tenant-1',
          entityType: AuditEntityType.INVOICE,
          entityId: 'invoice-1',
          action: AuditAction.CREATE,
          previousState: null,
          newState: { amount: 100 },
          timestamp: new Date('2025-01-01T00:00:00Z'),
          previousHash: null,
          hash: 'invalid-hash', // Wrong hash
          actorType: AuditActorType.USER,
          actorId: 'user-1',
        },
      ];

      mockPrismaService.auditLog.findMany.mockResolvedValue(entries);

      const result = await service.verifyChainIntegrity('tenant-1');

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Hash mismatch');
      expect(result.firstInvalidEntryId).toBe('audit-1');
    });

    it('should detect chain break', async () => {
      const entry1 = {
        id: 'audit-1',
        tenantId: 'tenant-1',
        entityType: AuditEntityType.INVOICE,
        entityId: 'invoice-1',
        action: AuditAction.CREATE,
        previousState: null,
        newState: { amount: 100 },
        timestamp: new Date('2025-01-01T00:00:00Z'),
        previousHash: null,
        hash: '',
        actorType: AuditActorType.USER,
        actorId: 'user-1',
      };
      entry1.hash = service.generateHash(entry1);

      const entry2 = {
        id: 'audit-2',
        tenantId: 'tenant-1',
        entityType: AuditEntityType.INVOICE,
        entityId: 'invoice-1',
        action: AuditAction.UPDATE,
        previousState: { amount: 100 },
        newState: { amount: 200 },
        timestamp: new Date('2025-01-01T01:00:00Z'),
        previousHash: 'wrong-hash', // Should be entry1.hash
        hash: '',
        actorType: AuditActorType.USER,
        actorId: 'user-1',
      };
      entry2.hash = service.generateHash(entry2);

      mockPrismaService.auditLog.findMany.mockResolvedValue([entry1, entry2]);

      const result = await service.verifyChainIntegrity('tenant-1');

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Previous hash mismatch');
      expect(result.firstInvalidEntryId).toBe('audit-2');
    });

    it('should handle empty chain', async () => {
      mockPrismaService.auditLog.findMany.mockResolvedValue([]);

      const result = await service.verifyChainIntegrity('tenant-1');

      expect(result.valid).toBe(true);
      expect(result.totalEntries).toBe(0);
      expect(result.verifiedEntries).toBe(0);
    });
  });

  describe('getLastHash', () => {
    it('should return last hash for tenant', async () => {
      const lastHash = 'last-hash-123';
      mockPrismaService.auditLogSequence.findUnique.mockResolvedValue({
        lastHash,
      });

      const result = await service.getLastHash('tenant-1');

      expect(result).toBe(lastHash);
    });

    it('should return null for empty chain', async () => {
      mockPrismaService.auditLogSequence.findUnique.mockResolvedValue(null);

      const result = await service.getLastHash('tenant-1');

      expect(result).toBeNull();
    });
  });

  describe('rebuildChainSequence', () => {
    it('should rebuild sequence from existing entries', async () => {
      const lastEntry = {
        id: 'audit-10',
        hash: 'hash-10',
      };

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          auditLog: {
            findFirst: jest.fn().mockResolvedValue(lastEntry),
            count: jest.fn().mockResolvedValue(10),
          },
          auditLogSequence: {
            upsert: jest.fn(),
          },
        };

        return callback(mockTx);
      });

      await service.rebuildChainSequence('tenant-1');

      expect(mockPrismaService.$transaction).toHaveBeenCalled();
    });

    it('should handle empty chain during rebuild', async () => {
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          auditLog: {
            findFirst: jest.fn().mockResolvedValue(null),
          },
          auditLogSequence: {
            deleteMany: jest.fn(),
          },
        };

        return callback(mockTx);
      });

      await service.rebuildChainSequence('tenant-1');

      expect(mockPrismaService.$transaction).toHaveBeenCalled();
    });
  });

  describe('getChainStats', () => {
    it('should return chain statistics', async () => {
      const mockSequence = {
        entryCount: BigInt(100),
        lastEntryId: 'audit-100',
        lastHash: 'hash-100',
        updatedAt: new Date(),
      };

      mockPrismaService.auditLogSequence.findUnique.mockResolvedValue(
        mockSequence
      );

      const result = await service.getChainStats('tenant-1');

      expect(result.entryCount).toBe(100);
      expect(result.lastEntryId).toBe('audit-100');
      expect(result.lastHash).toBe('hash-100');
    });

    it('should handle empty chain stats', async () => {
      mockPrismaService.auditLogSequence.findUnique.mockResolvedValue(null);

      const result = await service.getChainStats('tenant-1');

      expect(result.entryCount).toBe(0);
      expect(result.lastEntryId).toBeNull();
      expect(result.lastHash).toBeNull();
    });
  });
});
