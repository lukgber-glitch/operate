import { registerAs } from '@nestjs/config';

/**
 * Peppol Configuration
 */
export default registerAs('peppol', () => ({
  accessPointUrl: process.env.PEPPOL_ACCESS_POINT_URL || '',
  participantId: process.env.PEPPOL_PARTICIPANT_ID || '',
  certificatePath: process.env.PEPPOL_CERTIFICATE_PATH || '',
  privateKeyPath: process.env.PEPPOL_PRIVATE_KEY_PATH || '',
  certificatePassword: process.env.PEPPOL_CERTIFICATE_PASSWORD || '',
  smlDomain: process.env.PEPPOL_SML_DOMAIN || 'isml.peppol.eu',
  environment: process.env.PEPPOL_ENVIRONMENT || 'test',
  mockMode: process.env.PEPPOL_MOCK_MODE === 'true',
  tlsMinVersion: 'TLSv1.3',
  certificatePinning: process.env.PEPPOL_CERTIFICATE_PINNING !== 'false',
  pinnedCertificates: process.env.PEPPOL_PINNED_CERTIFICATES || '',
}));

/**
 * Validate Peppol configuration
 */
export function validatePeppolConfig(config: any): void {
  if (!config.mockMode) {
    if (!config.accessPointUrl) {
      throw new Error('PEPPOL_ACCESS_POINT_URL is required');
    }
    if (!config.participantId) {
      throw new Error('PEPPOL_PARTICIPANT_ID is required');
    }
    if (!config.certificatePath) {
      throw new Error('PEPPOL_CERTIFICATE_PATH is required');
    }
  }
}

/**
 * Peppol environment variables reference
 */
export const PEPPOL_ENV_VARS = {
  PEPPOL_ACCESS_POINT_URL: 'URL of the Peppol Access Point',
  PEPPOL_PARTICIPANT_ID: 'Your Peppol participant identifier (e.g., "0192:987654321")',
  PEPPOL_CERTIFICATE_PATH: 'Path to your Peppol certificate file',
  PEPPOL_PRIVATE_KEY_PATH: 'Path to your private key file',
  PEPPOL_CERTIFICATE_PASSWORD: 'Password for the certificate/private key',
  PEPPOL_SML_DOMAIN: 'SML domain (default: isml.peppol.eu)',
  PEPPOL_ENVIRONMENT: 'Environment: "production" or "test" (default: test)',
  PEPPOL_MOCK_MODE: 'Enable mock mode for development (default: false)',
  PEPPOL_CERTIFICATE_PINNING: 'Enable certificate pinning (default: true)',
  PEPPOL_PINNED_CERTIFICATES:
    'Comma-separated list of SHA-256 certificate fingerprints for pinning',
};
