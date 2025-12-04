import { registerAs } from '@nestjs/config';

/**
 * SDI Integration Configuration
 */
export default registerAs('sdi', () => ({
  // SDI Endpoint
  endpoint: process.env.SDI_ENDPOINT || 'https://sdi.fatturapa.gov.it/SdI',

  // Transmitter Code (7 characters)
  transmitterCode: process.env.SDI_TRANSMITTER_CODE || '',

  // Digital Signature Certificate
  certificatePath: process.env.SDI_CERTIFICATE_PATH || '',
  privateKeyPath: process.env.SDI_PRIVATE_KEY_PATH || '',
  certificatePassword: process.env.SDI_CERTIFICATE_PASSWORD || '',

  // Client Certificate for TLS (optional)
  clientCertificate: process.env.SDI_CLIENT_CERTIFICATE || '',
  clientPrivateKey: process.env.SDI_CLIENT_PRIVATE_KEY || '',

  // Environment
  environment: process.env.SDI_ENVIRONMENT || 'test', // 'production' or 'test'

  // Mock Mode (for testing)
  mockMode: process.env.SDI_MOCK_MODE === 'true',

  // Use Peppol as transport channel
  usePeppol: process.env.SDI_USE_PEPPOL === 'true',

  // Security Settings
  tlsMinVersion: 'TLSv1.2',
  signatureType: process.env.SDI_SIGNATURE_TYPE || 'CAdES-BES', // 'CAdES-BES' or 'XAdES-BES'

  // Webhook Settings
  webhookSecret: process.env.SDI_WEBHOOK_SECRET || '',

  // Retry Policy
  retryPolicy: {
    maxAttempts: parseInt(process.env.SDI_RETRY_MAX_ATTEMPTS || '3'),
    initialDelay: parseInt(process.env.SDI_RETRY_INITIAL_DELAY || '5000'), // ms
    maxDelay: parseInt(process.env.SDI_RETRY_MAX_DELAY || '60000'), // ms
    backoffMultiplier: parseFloat(process.env.SDI_RETRY_BACKOFF || '2'),
  },

  // Timeout Settings
  timeout: {
    submission: parseInt(process.env.SDI_SUBMISSION_TIMEOUT || '30000'), // ms
    notification: parseInt(process.env.SDI_NOTIFICATION_TIMEOUT || '10000'), // ms
  },
}));
