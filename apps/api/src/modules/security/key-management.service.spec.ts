import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { KeyManagementService } from './key-management.service';

describe('KeyManagementService', () => {
  let service: KeyManagementService;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KeyManagementService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<KeyManagementService>(KeyManagementService);
    configService = module.get<ConfigService>(ConfigService);
  });

  describe('encryption/decryption', () => {
    it('should encrypt and decrypt data correctly', () => {
      const originalData = 'sensitive data';
      const keyId = service.generateKeyId();

      const encrypted = service.encrypt(originalData, keyId);

      expect(encrypted.encryptedData).toBeDefined();
      expect(encrypted.iv).toBeDefined();
      expect(encrypted.authTag).toBeDefined();

      const decrypted = service.decrypt(
        encrypted.encryptedData,
        encrypted.iv,
        encrypted.authTag,
        keyId,
      );

      expect(decrypted.toString('utf8')).toBe(originalData);
    });

    it('should encrypt Buffer data', () => {
      const originalData = Buffer.from('binary data');
      const keyId = service.generateKeyId();

      const encrypted = service.encrypt(originalData, keyId);
      const decrypted = service.decrypt(
        encrypted.encryptedData,
        encrypted.iv,
        encrypted.authTag,
        keyId,
      );

      expect(decrypted).toEqual(originalData);
    });

    it('should fail decryption with wrong key ID', () => {
      const originalData = 'sensitive data';
      const keyId1 = service.generateKeyId();
      const keyId2 = service.generateKeyId();

      const encrypted = service.encrypt(originalData, keyId1);

      expect(() => {
        service.decrypt(
          encrypted.encryptedData,
          encrypted.iv,
          encrypted.authTag,
          keyId2, // Wrong key ID
        );
      }).toThrow();
    });

    it('should fail decryption with tampered data', () => {
      const originalData = 'sensitive data';
      const keyId = service.generateKeyId();

      const encrypted = service.encrypt(originalData, keyId);

      // Tamper with encrypted data
      encrypted.encryptedData[0] = encrypted.encryptedData[0] ^ 0xff;

      expect(() => {
        service.decrypt(
          encrypted.encryptedData,
          encrypted.iv,
          encrypted.authTag,
          keyId,
        );
      }).toThrow();
    });

    it('should fail decryption with wrong auth tag', () => {
      const originalData = 'sensitive data';
      const keyId = service.generateKeyId();

      const encrypted = service.encrypt(originalData, keyId);

      // Wrong auth tag
      const wrongAuthTag = Buffer.from(encrypted.authTag);
      wrongAuthTag[0] = wrongAuthTag[0] ^ 0xff;

      expect(() => {
        service.decrypt(
          encrypted.encryptedData,
          encrypted.iv,
          wrongAuthTag,
          keyId,
        );
      }).toThrow();
    });
  });

  describe('generateKeyId', () => {
    it('should generate valid key IDs', () => {
      const keyId = service.generateKeyId();

      expect(keyId).toMatch(/^key_[0-9]+_[a-f0-9]{16}$/);
    });

    it('should generate unique key IDs', () => {
      const keyId1 = service.generateKeyId();
      const keyId2 = service.generateKeyId();

      expect(keyId1).not.toBe(keyId2);
    });

    it('should validate key ID format', () => {
      const validKeyId = service.generateKeyId();
      const invalidKeyId = 'invalid-key-id';

      expect(service.validateKeyId(validKeyId)).toBe(true);
      expect(service.validateKeyId(invalidKeyId)).toBe(false);
    });
  });

  describe('clearKeyCache', () => {
    it('should clear the key cache', () => {
      const keyId = service.generateKeyId();
      const data = 'test data';

      // First encryption creates cache entry
      service.encrypt(data, keyId);

      // Clear cache
      service.clearKeyCache();

      // Second encryption should still work (creates new cache entry)
      const encrypted = service.encrypt(data, keyId);
      const decrypted = service.decrypt(
        encrypted.encryptedData,
        encrypted.iv,
        encrypted.authTag,
        keyId,
      );

      expect(decrypted.toString('utf8')).toBe(data);
    });
  });

  describe('large data encryption', () => {
    it('should handle large data encryption/decryption', () => {
      const largeData = Buffer.alloc(1024 * 1024); // 1MB
      largeData.fill('test');

      const keyId = service.generateKeyId();

      const encrypted = service.encrypt(largeData, keyId);
      const decrypted = service.decrypt(
        encrypted.encryptedData,
        encrypted.iv,
        encrypted.authTag,
        keyId,
      );

      expect(decrypted).toEqual(largeData);
    });
  });

  describe('private key encryption', () => {
    it('should encrypt and decrypt ECDSA private key', () => {
      const mockPrivateKey = `-----BEGIN PRIVATE KEY-----
MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQg1234567890abcdef
1234567890abcdef1234567890abcdef1234567890abcdef==
-----END PRIVATE KEY-----`;

      const keyId = service.generateKeyId();

      const encrypted = service.encrypt(mockPrivateKey, keyId);
      const decrypted = service.decrypt(
        encrypted.encryptedData,
        encrypted.iv,
        encrypted.authTag,
        keyId,
      );

      expect(decrypted.toString('utf8')).toBe(mockPrivateKey);
    });
  });
});
