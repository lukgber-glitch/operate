import { Test, TestingModule } from '@nestjs/testing';
import { ZatcaCsrService } from '../zatca-csr.service';
import * as crypto from 'crypto';

describe('ZatcaCsrService', () => {
  let service: ZatcaCsrService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ZatcaCsrService],
    }).compile();

    service = module.get<ZatcaCsrService>(ZatcaCsrService);
  });

  describe('generateKeyPair', () => {
    it('should generate ECDSA secp256k1 key pair', () => {
      const keyPair = service.generateKeyPair();

      expect(keyPair.privateKey).toContain('BEGIN PRIVATE KEY');
      expect(keyPair.publicKey).toContain('BEGIN PUBLIC KEY');

      // Verify it's a valid EC key
      const privateKeyObject = crypto.createPrivateKey(keyPair.privateKey);
      expect(privateKeyObject.asymmetricKeyType).toBe('ec');
    });

    it('should generate unique key pairs', () => {
      const keyPair1 = service.generateKeyPair();
      const keyPair2 = service.generateKeyPair();

      expect(keyPair1.privateKey).not.toBe(keyPair2.privateKey);
      expect(keyPair1.publicKey).not.toBe(keyPair2.publicKey);
    });
  });

  describe('generateCSR', () => {
    it('should generate CSR with valid config', async () => {
      const keyPair = service.generateKeyPair();
      const config = {
        commonName: 'Test Company',
        organizationName: 'Test Company LLC',
        organizationUnit: '300000000000003',
        country: 'SA',
        invoiceType: '0100',
      };

      const result = await service.generateCSR(config, keyPair.privateKey);

      expect(result.csr).toBeDefined();
      expect(result.subject).toContain('C=SA');
      expect(result.subject).toContain('O=Test Company LLC');
      expect(result.subject).toContain('OU=300000000000003');
      expect(result.subject).toContain('CN=Test Company');
    });

    it('should include optional fields in CSR', async () => {
      const keyPair = service.generateKeyPair();
      const config = {
        commonName: 'Test Company',
        organizationName: 'Test Company LLC',
        organizationUnit: '300000000000003',
        country: 'SA',
        invoiceType: '0100',
        solutionName: 'Operate ERP',
        registeredAddress: 'Riyadh, Saudi Arabia',
      };

      const result = await service.generateCSR(config, keyPair.privateKey);

      expect(result.subject).toContain('UID=Operate ERP');
    });

    it('should reject invalid TRN', async () => {
      const keyPair = service.generateKeyPair();
      const config = {
        commonName: 'Test Company',
        organizationName: 'Test Company LLC',
        organizationUnit: '12345', // Invalid - not 15 digits
        country: 'SA',
        invoiceType: '0100',
      };

      await expect(
        service.generateCSR(config, keyPair.privateKey),
      ).rejects.toThrow('Invalid Tax Registration Number');
    });

    it('should reject invalid country', async () => {
      const keyPair = service.generateKeyPair();
      const config = {
        commonName: 'Test Company',
        organizationName: 'Test Company LLC',
        organizationUnit: '300000000000003',
        country: 'US', // Invalid - must be SA
        invoiceType: '0100',
      };

      await expect(
        service.generateCSR(config, keyPair.privateKey),
      ).rejects.toThrow('Country must be SA');
    });

    it('should reject invalid invoice type', async () => {
      const keyPair = service.generateKeyPair();
      const config = {
        commonName: 'Test Company',
        organizationName: 'Test Company LLC',
        organizationUnit: '300000000000003',
        country: 'SA',
        invoiceType: '9999', // Invalid
      };

      await expect(
        service.generateCSR(config, keyPair.privateKey),
      ).rejects.toThrow('Invalid invoice type');
    });
  });

  describe('extractPublicKey', () => {
    it('should extract public key from private key', () => {
      const keyPair = service.generateKeyPair();
      const extractedPublicKey = service.extractPublicKey(keyPair.privateKey);

      expect(extractedPublicKey).toContain('BEGIN PUBLIC KEY');

      // Verify the extracted key matches
      const publicKeyObject1 = crypto.createPublicKey(keyPair.publicKey);
      const publicKeyObject2 = crypto.createPublicKey(extractedPublicKey);

      const export1 = publicKeyObject1.export({ format: 'pem', type: 'spki' });
      const export2 = publicKeyObject2.export({ format: 'pem', type: 'spki' });

      expect(export1).toBe(export2);
    });
  });

  describe('getCsrFingerprint', () => {
    it('should generate consistent fingerprint for same CSR', async () => {
      const keyPair = service.generateKeyPair();
      const config = {
        commonName: 'Test Company',
        organizationName: 'Test Company LLC',
        organizationUnit: '300000000000003',
        country: 'SA',
        invoiceType: '0100',
      };

      const result = await service.generateCSR(config, keyPair.privateKey);
      const fingerprint1 = service.getCsrFingerprint(result.csr);
      const fingerprint2 = service.getCsrFingerprint(result.csr);

      expect(fingerprint1).toBe(fingerprint2);
      expect(fingerprint1).toMatch(/^[a-f0-9]{64}$/); // SHA-256 hex
    });

    it('should generate different fingerprints for different CSRs', async () => {
      const keyPair1 = service.generateKeyPair();
      const keyPair2 = service.generateKeyPair();
      const config = {
        commonName: 'Test Company',
        organizationName: 'Test Company LLC',
        organizationUnit: '300000000000003',
        country: 'SA',
        invoiceType: '0100',
      };

      const result1 = await service.generateCSR(config, keyPair1.privateKey);
      const result2 = await service.generateCSR(config, keyPair2.privateKey);

      const fingerprint1 = service.getCsrFingerprint(result1.csr);
      const fingerprint2 = service.getCsrFingerprint(result2.csr);

      expect(fingerprint1).not.toBe(fingerprint2);
    });
  });
});
