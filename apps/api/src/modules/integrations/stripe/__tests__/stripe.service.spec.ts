import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { StripeService } from '../stripe.service';

describe('StripeService', () => {
  let service: StripeService;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config: Record<string, string> = {
        STRIPE_SECRET_KEY: 'sk_test_123456789',
        STRIPE_PUBLISHABLE_KEY: 'pk_test_123456789',
        STRIPE_WEBHOOK_SECRET: 'whsec_test123',
        STRIPE_SANDBOX: 'true',
        STRIPE_PLATFORM_FEE_PERCENT: '2.5',
      };
      return config[key];
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StripeService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<StripeService>(StripeService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should initialize Stripe client', () => {
    const client = service.getClient();
    expect(client).toBeDefined();
  });

  it('should return configuration', () => {
    const config = service.getConfig();
    expect(config).toBeDefined();
    expect(config.secretKey).toBe('sk_test_123456789');
    expect(config.publishableKey).toBe('pk_test_123456789');
    expect(config.platformFeePercent).toBe(2.5);
  });

  it('should return webhook secret', () => {
    const secret = service.getWebhookSecret();
    expect(secret).toBe('whsec_test123');
  });

  it('should return publishable key', () => {
    const key = service.getPublishableKey();
    expect(key).toBe('pk_test_123456789');
  });

  it('should detect test mode', () => {
    const isTest = service.isTestMode();
    expect(isTest).toBe(true);
  });
});
