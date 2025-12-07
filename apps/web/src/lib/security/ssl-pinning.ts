/**
 * SSL Certificate Pinning for Mobile Security
 * Prevents MITM attacks by verifying server certificate pins
 *
 * IMPLEMENTATION NOTES:
 * - Certificate pinning only applies to mobile apps (iOS/Android via Capacitor)
 * - Web version uses standard HTTPS validation
 * - Pins use SHA-256 hash of the certificate's public key
 * - Always maintain backup pins for certificate rotation
 *
 * HOW TO GENERATE PINS:
 * 1. Get the certificate:
 *    openssl s_client -connect operate.guru:443 -servername operate.guru < /dev/null | openssl x509 -outform PEM > operate.pem
 *
 * 2. Extract public key and hash it:
 *    openssl x509 -in operate.pem -pubkey -noout | openssl pkey -pubin -outform der | openssl dgst -sha256 -binary | openssl enc -base64
 *
 * 3. Update CERTIFICATE_PINS with the new pin
 *
 * CERTIFICATE ROTATION PROCESS:
 * 1. Before rotation: Add new certificate pin to backup pins
 * 2. Deploy app update with both old and new pins
 * 3. After rotation: Remove old pin in next app update
 * 4. Always maintain at least 2 pins (current + backup)
 */

/**
 * Certificate pins for operate.guru (SHA-256 of public key)
 *
 * Format: Base64-encoded SHA-256 hash of the certificate's public key
 *
 * IMPORTANT: These are placeholder values and must be replaced with actual pins
 * generated from the real operate.guru SSL certificate.
 */
export const CERTIFICATE_PINS: Record<string, string[]> = {
  'operate.guru': [
    // Primary certificate pin (current) - PLACEHOLDER
    // Replace with actual pin from current certificate
    'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',

    // Backup pin (for rotation) - PLACEHOLDER
    // Replace with backup certificate pin before rotation
    'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB=',
  ],
};

/**
 * Feature flag to enable/disable SSL pinning
 *
 * Pinning is only enabled in production builds to avoid issues during development.
 * Can be overridden by setting NEXT_PUBLIC_DISABLE_SSL_PINNING=true
 */
export const PINNING_ENABLED =
  process.env.NODE_ENV === 'production' &&
  process.env.NEXT_PUBLIC_DISABLE_SSL_PINNING !== 'true';

/**
 * Check if the app is running in a mobile context (Capacitor)
 *
 * @returns true if running in Capacitor (iOS/Android), false for web
 */
export function isMobileApp(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  // Check for Capacitor global
  return (window as any).Capacitor !== undefined;
}

/**
 * Get the current platform
 *
 * @returns 'ios', 'android', or 'web'
 */
export function getPlatform(): 'ios' | 'android' | 'web' {
  if (typeof window === 'undefined') {
    return 'web';
  }

  const capacitor = (window as any).Capacitor;
  if (capacitor?.getPlatform) {
    const platform = capacitor.getPlatform();
    return platform as 'ios' | 'android' | 'web';
  }

  return 'web';
}

/**
 * Extract hostname from URL
 *
 * @param url - Full URL or path
 * @returns hostname or null if invalid
 */
export function extractHostname(url: string): string | null {
  try {
    // Handle relative URLs
    if (!url.startsWith('http')) {
      // For relative URLs, use the current hostname or operate.guru
      if (typeof window !== 'undefined' && window.location) {
        return window.location.hostname;
      }
      return 'operate.guru';
    }

    const urlObject = new URL(url);
    return urlObject.hostname;
  } catch (error) {
    console.error('[SSL Pinning] Failed to extract hostname:', error);
    return null;
  }
}

/**
 * Get certificate pins for a hostname
 *
 * @param hostname - The hostname to get pins for
 * @returns Array of certificate pins, or empty array if no pins configured
 */
export function getPinsForHostname(hostname: string): string[] {
  const pins = CERTIFICATE_PINS[hostname as keyof typeof CERTIFICATE_PINS];
  return pins ? [...pins] : [];
}

/**
 * Check if SSL pinning should be applied for this request
 *
 * @param url - The request URL
 * @returns true if pinning should be applied
 */
export function shouldApplyPinning(url: string): boolean {
  // Only apply pinning if enabled
  if (!PINNING_ENABLED) {
    return false;
  }

  // Only apply pinning in mobile apps
  if (!isMobileApp()) {
    return false;
  }

  // Check if we have pins for this hostname
  const hostname = extractHostname(url);
  if (!hostname) {
    return false;
  }

  const pins = getPinsForHostname(hostname);
  return pins.length > 0;
}

/**
 * Get certificate pinning configuration for HTTP client
 *
 * This returns configuration that can be used with the HTTP client
 * to enable certificate pinning on mobile platforms.
 *
 * @param url - The request URL
 * @returns Configuration object with pins, or null if pinning not needed
 */
export function getPinningConfig(url: string): {
  hostname: string;
  pins: string[];
  platform: string;
} | null {
  if (!shouldApplyPinning(url)) {
    return null;
  }

  const hostname = extractHostname(url);
  if (!hostname) {
    return null;
  }

  const pins = getPinsForHostname(hostname);
  if (pins.length === 0) {
    return null;
  }

  return {
    hostname,
    pins,
    platform: getPlatform(),
  };
}

/**
 * Log SSL pinning status for debugging
 *
 * @param url - The request URL
 */
export function logPinningStatus(url: string): void {
  if (process.env.NODE_ENV === 'development') {
    const config = getPinningConfig(url);

    if (config) {
      console.log('[SSL Pinning] ACTIVE', {
        url,
        hostname: config.hostname,
        platform: config.platform,
        pinCount: config.pins.length,
      });
    } else {
      console.log('[SSL Pinning] DISABLED', {
        url,
        enabled: PINNING_ENABLED,
        isMobile: isMobileApp(),
        platform: getPlatform(),
      });
    }
  }
}

/**
 * Validate certificate pin format
 *
 * Pins should be base64-encoded SHA-256 hashes (44 characters)
 *
 * @param pin - Certificate pin to validate
 * @returns true if valid format
 */
export function isValidPinFormat(pin: string): boolean {
  // SHA-256 hash in base64 should be 44 characters
  // Format: [A-Za-z0-9+/]{43}=
  const pinRegex = /^[A-Za-z0-9+/]{43}=$/;
  return pinRegex.test(pin);
}

/**
 * Validate all configured pins
 *
 * @returns Array of validation errors, empty if all valid
 */
export function validatePins(): string[] {
  const errors: string[] = [];

  Object.entries(CERTIFICATE_PINS).forEach(([hostname, pins]) => {
    if (pins.length === 0) {
      errors.push(`No pins configured for ${hostname}`);
    }

    if (pins.length < 2) {
      errors.push(`Only ${pins.length} pin(s) configured for ${hostname}, recommend at least 2 for rotation`);
    }

    pins.forEach((pin, index) => {
      if (!isValidPinFormat(pin)) {
        errors.push(`Invalid pin format for ${hostname}[${index}]: ${pin}`);
      }
    });
  });

  return errors;
}

/**
 * Initialize SSL pinning
 *
 * Call this during app initialization to verify configuration
 */
export function initializeSSLPinning(): void {
  if (process.env.NODE_ENV === 'development') {
    console.log('[SSL Pinning] Initializing...', {
      enabled: PINNING_ENABLED,
      isMobile: isMobileApp(),
      platform: getPlatform(),
    });

    const errors = validatePins();
    if (errors.length > 0) {
      console.warn('[SSL Pinning] Configuration warnings:', errors);
    }
  }
}
