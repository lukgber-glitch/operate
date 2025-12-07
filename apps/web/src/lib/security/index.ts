/**
 * Security Module
 *
 * Provides security features for the Operate app, including:
 * - SSL certificate pinning for mobile apps
 * - Secure HTTP client with pinning support
 * - Platform detection utilities
 */

export {
  // Certificate pinning configuration
  CERTIFICATE_PINS,
  PINNING_ENABLED,

  // Platform detection
  isMobileApp,
  getPlatform,

  // Pinning utilities
  extractHostname,
  getPinsForHostname,
  shouldApplyPinning,
  getPinningConfig,
  logPinningStatus,

  // Pin validation
  isValidPinFormat,
  validatePins,
  initializeSSLPinning,
} from './ssl-pinning';

export {
  // Pinned fetch client
  pinnedFetch,
  getPinnedFetchStatus,
} from './pinned-fetch';

export {
  // Pin validation and testing
  validatePinConfiguration,
  printValidationReport,
  comparePins,
  findPinUsage,
  generateRotationReport,
  simulatePinValidation,
  runDevelopmentChecks,
} from './pin-validator';

export type { PinValidationReport } from './pin-validator';

export {
  // Secure storage service
  isSecureStorageAvailable,
  setSecureCredentials,
  getSecureCredentials,
  deleteSecureCredentials,
  setSecureToken,
  getSecureToken,
  deleteSecureToken,
} from './secure-storage.service';
