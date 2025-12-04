import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { AtoAuthService } from '../ato-auth.service';
import { AtoAuthCredentials } from '../ato.types';
import * as crypto from 'crypto';

describe('AtoAuthService', () => {
  let service: AtoAuthService;
  let configService: ConfigService;

  const mockCredentials: AtoAuthCredentials = {
    clientId: 'test-client-id',
    clientSecret: 'test-client-secret',
    redirectUri: 'https://app.example.com/callback',
    scope: ['bas', 'stp', 'tpar'],
    abn: '12345678901',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AtoAuthService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config = {
                ATO_ENCRYPTION_SECRET: 'test-secret-key-for-encryption',
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    service = module.get<AtoAuthService>(AtoAuthService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateAuthUrl', () => {
    it('should generate valid authorization URL', () => {
      const result = service.generateAuthUrl(mockCredentials);

      expect(result.url).toContain('response_type=code');
      expect(result.url).toContain('client_id=test-client-id');
      expect(result.url).toContain('redirect_uri=https');
      expect(result.url).toContain('scope=bas');
      expect(result.url).toContain('code_challenge=');
      expect(result.url).toContain('code_challenge_method=S256');
      expect(result.codeVerifier).toBeTruthy();
      expect(result.state).toBeTruthy();
    });

    it('should generate unique state for each request', () => {
      const result1 = service.generateAuthUrl(mockCredentials);
      const result2 = service.generateAuthUrl(mockCredentials);

      expect(result1.state).not.toBe(result2.state);
    });

    it('should generate unique code verifier for each request', () => {
      const result1 = service.generateAuthUrl(mockCredentials);
      const result2 = service.generateAuthUrl(mockCredentials);

      expect(result1.codeVerifier).not.toBe(result2.codeVerifier);
    });

    it('should use custom state if provided', () => {
      const customState = 'custom-state-123';
      const result = service.generateAuthUrl(mockCredentials, customState);

      expect(result.state).toBe(customState);
      expect(result.url).toContain(`state=${customState}`);
    });

    it('should properly encode redirect URI', () => {
      const credentials = {
        ...mockCredentials,
        redirectUri: 'https://app.example.com/callback?param=value',
      };

      const result = service.generateAuthUrl(credentials);

      expect(result.url).toContain(
        encodeURIComponent('https://app.example.com/callback?param=value'),
      );
    });
  });

  describe('PKCE Code Generation', () => {
    it('should generate code verifier of correct length', () => {
      const verifier = service['generateCodeVerifier']();

      // Code verifier should be 128 characters (base64url encoded 96 bytes)
      expect(verifier.length).toBe(128);
    });

    it('should generate valid base64url encoded verifier', () => {
      const verifier = service['generateCodeVerifier']();

      // base64url should only contain alphanumeric, -, and _
      expect(verifier).toMatch(/^[A-Za-z0-9\-_]+$/);
    });

    it('should generate valid SHA256 code challenge', () => {
      const verifier = 'test-verifier-123';
      const challenge = service['generateCodeChallenge'](verifier);

      // Manually compute expected challenge
      const expectedChallenge = crypto
        .createHash('sha256')
        .update(verifier)
        .digest('base64url');

      expect(challenge).toBe(expectedChallenge);
    });
  });

  describe('Token Cache', () => {
    it('should cache token by ABN', () => {
      const token = {
        accessToken: 'test-token',
        refreshToken: 'test-refresh',
        tokenType: 'Bearer',
        expiresIn: 3600,
        scope: 'bas stp',
        issuedAt: new Date(),
      };

      // Simulate caching (normally done in exchangeCodeForToken)
      service['tokenCache'].set(mockCredentials.abn, token);

      const cachedToken = service.getCachedToken(mockCredentials.abn);

      expect(cachedToken).toEqual(token);
    });

    it('should return null for non-existent cached token', () => {
      const cachedToken = service.getCachedToken('non-existent-abn');

      expect(cachedToken).toBeNull();
    });

    it('should clear token cache for specific ABN', () => {
      const token = {
        accessToken: 'test-token',
        refreshToken: 'test-refresh',
        tokenType: 'Bearer',
        expiresIn: 3600,
        scope: 'bas stp',
        issuedAt: new Date(),
      };

      service['tokenCache'].set(mockCredentials.abn, token);
      expect(service.getCachedToken(mockCredentials.abn)).not.toBeNull();

      service.clearTokenCache(mockCredentials.abn);
      expect(service.getCachedToken(mockCredentials.abn)).toBeNull();
    });
  });

  describe('Token Encryption', () => {
    it('should encrypt and decrypt token correctly', () => {
      const originalToken = 'test-access-token-12345';

      const encrypted = service.encryptToken(originalToken, mockCredentials.abn);

      expect(encrypted.encrypted).toBeTruthy();
      expect(encrypted.iv).toBeTruthy();
      expect(encrypted.tag).toBeTruthy();

      const decrypted = service.decryptToken(
        encrypted.encrypted,
        encrypted.iv,
        encrypted.tag,
        mockCredentials.abn,
      );

      expect(decrypted).toBe(originalToken);
    });

    it('should generate different IV for each encryption', () => {
      const token = 'test-token';

      const encrypted1 = service.encryptToken(token, mockCredentials.abn);
      const encrypted2 = service.encryptToken(token, mockCredentials.abn);

      // Different IVs should produce different ciphertext
      expect(encrypted1.iv).not.toBe(encrypted2.iv);
      expect(encrypted1.encrypted).not.toBe(encrypted2.encrypted);
    });

    it('should fail decryption with wrong IV', () => {
      const token = 'test-token';
      const encrypted = service.encryptToken(token, mockCredentials.abn);

      const wrongIv = crypto.randomBytes(16).toString('hex');

      expect(() => {
        service.decryptToken(
          encrypted.encrypted,
          wrongIv,
          encrypted.tag,
          mockCredentials.abn,
        );
      }).toThrow();
    });

    it('should fail decryption with wrong tag', () => {
      const token = 'test-token';
      const encrypted = service.encryptToken(token, mockCredentials.abn);

      const wrongTag = crypto.randomBytes(16).toString('hex');

      expect(() => {
        service.decryptToken(
          encrypted.encrypted,
          encrypted.iv,
          wrongTag,
          mockCredentials.abn,
        );
      }).toThrow();
    });

    it('should use different keys for different ABNs', () => {
      const token = 'test-token';
      const abn1 = '12345678901';
      const abn2 = '98765432109';

      const encrypted1 = service.encryptToken(token, abn1);

      // Should fail to decrypt with different ABN
      expect(() => {
        service.decryptToken(
          encrypted1.encrypted,
          encrypted1.iv,
          encrypted1.tag,
          abn2,
        );
      }).toThrow();
    });
  });

  describe('validateAndRefreshToken', () => {
    it('should return current token if not expired', async () => {
      const credentials = mockCredentials;
      const futureDate = new Date(Date.now() + 7200000); // 2 hours in future
      const currentToken = {
        accessToken: 'test-token',
        refreshToken: 'test-refresh',
        tokenType: 'Bearer',
        expiresIn: 7200, // 2 hours
        scope: 'bas stp',
        issuedAt: new Date(),
      };

      const result = await service.validateAndRefreshToken(
        credentials,
        currentToken,
      );

      expect(result).toEqual(currentToken);
    });

    it('should identify expired token', () => {
      const expiredToken = {
        accessToken: 'test-token',
        refreshToken: 'test-refresh',
        tokenType: 'Bearer',
        expiresIn: 3600,
        scope: 'bas stp',
        issuedAt: new Date(Date.now() - 7200000), // 2 hours ago
      };

      const expiryTime = new Date(
        expiredToken.issuedAt.getTime() + expiredToken.expiresIn * 1000,
      );
      const now = new Date();

      expect(expiryTime.getTime()).toBeLessThan(now.getTime());
    });
  });

  describe('State Generation', () => {
    it('should generate cryptographically random state', () => {
      const state = service['generateState']();

      expect(state).toBeTruthy();
      expect(state.length).toBeGreaterThan(20);
      expect(state).toMatch(/^[A-Za-z0-9\-_]+$/);
    });

    it('should generate unique states', () => {
      const states = new Set();

      for (let i = 0; i < 100; i++) {
        states.add(service['generateState']());
      }

      // All states should be unique
      expect(states.size).toBe(100);
    });
  });
});
