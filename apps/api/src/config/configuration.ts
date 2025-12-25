import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Find the .env file - check multiple possible locations
const possiblePaths = [
  path.resolve(process.cwd(), '.env'),  // Current working directory
  path.resolve(__dirname, '../.env'),   // One level up from dist
  path.resolve(__dirname, '../../.env'), // Two levels up
];

for (const envPath of possiblePaths) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    break;
  }
}

import { validateSecurityConfig } from './env-validation';

// Validate critical security configuration on module load
// This ensures the app fails fast if required secrets are missing
validateSecurityConfig();

export default () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.API_PORT || process.env.PORT || '3001', 10),
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',

  database: {
    // Required - validated on startup
    url: process.env.DATABASE_URL!,
  },

  jwt: {
    // Required - validated on startup, no fallbacks for security
    accessSecret: process.env.JWT_ACCESS_SECRET!,
    refreshSecret: process.env.JWT_REFRESH_SECRET!,
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  oauth: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackUrl: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/api/v1/auth/google/callback',
    },
    microsoft: {
      clientId: process.env.MICROSOFT_CLIENT_ID,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
      callbackUrl: process.env.MICROSOFT_CALLBACK_URL || 'http://localhost:3000/api/v1/auth/microsoft/callback',
      tenant: process.env.MICROSOFT_TENANT || 'common',
    },
  },

  redis: {
    enabled: process.env.REDIS_ENABLED !== 'false', // Default to true if REDIS_HOST is set
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    username: process.env.REDIS_USERNAME,
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0', 10),
  },

  queues: {
    // Enable queue system (requires Redis)
    // Set to 'true' to enable background jobs, Bull Board dashboard, and scheduled tasks
    // Disable for development without Redis or when not needed
    enabled: process.env.ENABLE_QUEUES === 'true',
  },

  aws: {
    region: process.env.AWS_REGION || 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    s3: {
      bucket: process.env.AWS_S3_BUCKET || 'operate-documents',
    },
  },

  email: {
    provider: process.env.EMAIL_PROVIDER || 'ses',
    from: process.env.EMAIL_FROM || 'noreply@operate.app',
    ses: {
      region: process.env.SES_REGION || 'us-east-1',
    },
    smtp: {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    },
  },

  ai: {
    anthropic: {
      apiKey: process.env.ANTHROPIC_API_KEY,
      model: process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022',
    },
    openai: {
      apiKey: process.env.OPENAI_API_KEY,
      model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
    },
  },

  banking: {
    plaid: {
      clientId: process.env.PLAID_CLIENT_ID,
      secret: process.env.PLAID_SECRET,
      environment: process.env.PLAID_ENV || 'sandbox',
    },
    stripe: {
      secretKey: process.env.STRIPE_SECRET_KEY,
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    },
  },

  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
    rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW || '60000', 10),
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
    corsEnabled: process.env.CORS_ENABLED !== 'false',
    helmetEnabled: process.env.HELMET_ENABLED !== 'false',
  },

  logging: {
    level: process.env.LOG_LEVEL || 'info',
    pretty: process.env.LOG_PRETTY === 'true',
  },

  monitoring: {
    sentryDsn: process.env.SENTRY_DSN,
    sentryEnvironment: process.env.SENTRY_ENVIRONMENT || 'development',
    sentryTracesSampleRate: parseFloat(
      process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1',
    ),
  },
});
