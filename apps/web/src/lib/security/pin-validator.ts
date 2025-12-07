/**
 * Certificate Pin Validator
 *
 * Utility for validating and testing SSL certificate pins.
 * Useful during development and certificate rotation.
 */

import {
  CERTIFICATE_PINS,
  PINNING_ENABLED,
  isValidPinFormat,
  validatePins,
  isMobileApp,
  getPlatform,
} from './ssl-pinning';

export interface PinValidationReport {
  valid: boolean;
  errors: string[];
  warnings: string[];
  info: {
    totalPins: number;
    hostnameCount: number;
    pinningEnabled: boolean;
    isMobile: boolean;
    platform: string;
  };
  details: Array<{
    hostname: string;
    pins: string[];
    pinCount: number;
    allValidFormat: boolean;
    invalidPins: string[];
  }>;
}

/**
 * Comprehensive validation of certificate pins configuration
 *
 * @returns Detailed validation report
 */
export function validatePinConfiguration(): PinValidationReport {
  const errors: string[] = [];
  const warnings: string[] = [];
  const details: PinValidationReport['details'] = [];

  let totalPins = 0;

  // Validate each hostname
  Object.entries(CERTIFICATE_PINS).forEach(([hostname, pins]) => {
    totalPins += pins.length;

    const invalidPins: string[] = [];
    pins.forEach((pin) => {
      if (!isValidPinFormat(pin)) {
        invalidPins.push(pin);
      }
    });

    const allValidFormat = invalidPins.length === 0;

    // Check for issues
    if (pins.length === 0) {
      errors.push(`No pins configured for ${hostname}`);
    } else if (pins.length === 1) {
      warnings.push(
        `Only 1 pin configured for ${hostname}. Recommend at least 2 for certificate rotation.`
      );
    }

    if (!allValidFormat) {
      errors.push(
        `Invalid pin format detected for ${hostname}: ${invalidPins.join(', ')}`
      );
    }

    // Check for placeholder pins
    const hasPlaceholders = pins.some(
      (pin) =>
        pin.startsWith('AAA') ||
        pin.startsWith('BBB') ||
        pin === 'PRIMARY_CERTIFICATE_PIN_HERE' ||
        pin === 'BACKUP_CERTIFICATE_PIN_HERE'
    );

    if (hasPlaceholders) {
      warnings.push(
        `Placeholder pins detected for ${hostname}. Replace with actual certificate pins.`
      );
    }

    details.push({
      hostname,
      pins,
      pinCount: pins.length,
      allValidFormat,
      invalidPins,
    });
  });

  // Global warnings
  if (!PINNING_ENABLED) {
    warnings.push('SSL pinning is currently DISABLED (not production mode or manually disabled)');
  }

  if (!isMobileApp()) {
    warnings.push('Running on web platform. SSL pinning only applies to mobile apps.');
  }

  const valid = errors.length === 0;

  return {
    valid,
    errors,
    warnings,
    info: {
      totalPins,
      hostnameCount: Object.keys(CERTIFICATE_PINS).length,
      pinningEnabled: PINNING_ENABLED,
      isMobile: isMobileApp(),
      platform: getPlatform(),
    },
    details,
  };
}

/**
 * Print validation report to console
 *
 * @param report - Validation report to print
 */
export function printValidationReport(report: PinValidationReport): void {
  console.group('🔒 SSL Certificate Pin Validation Report');

  // Info
  console.group('ℹ️  Configuration Info');
  console.table(report.info);
  console.groupEnd();

  // Details
  console.group('📋 Pin Details');
  report.details.forEach((detail) => {
    console.group(`Host: ${detail.hostname}`);
    console.log(`Pin count: ${detail.pinCount}`);
    console.log(`All valid format: ${detail.allValidFormat ? '✅' : '❌'}`);
    if (detail.invalidPins.length > 0) {
      console.log('Invalid pins:', detail.invalidPins);
    }
    console.log('Pins:', detail.pins);
    console.groupEnd();
  });
  console.groupEnd();

  // Warnings
  if (report.warnings.length > 0) {
    console.group('⚠️  Warnings');
    report.warnings.forEach((warning) => console.warn(warning));
    console.groupEnd();
  }

  // Errors
  if (report.errors.length > 0) {
    console.group('❌ Errors');
    report.errors.forEach((error) => console.error(error));
    console.groupEnd();
  }

  // Summary
  console.log(
    `\n${report.valid ? '✅ Validation PASSED' : '❌ Validation FAILED'}\n`
  );

  console.groupEnd();
}

/**
 * Compare two certificate pins
 *
 * @param pin1 - First pin to compare
 * @param pin2 - Second pin to compare
 * @returns true if pins match
 */
export function comparePins(pin1: string, pin2: string): boolean {
  return pin1.trim() === pin2.trim();
}

/**
 * Check if a pin exists in configuration
 *
 * @param pin - Pin to search for
 * @returns Array of hostnames that use this pin
 */
export function findPinUsage(pin: string): string[] {
  const hostnames: string[] = [];

  Object.entries(CERTIFICATE_PINS).forEach(([hostname, pins]) => {
    if (pins.some((p) => comparePins(p, pin))) {
      hostnames.push(hostname);
    }
  });

  return hostnames;
}

/**
 * Generate pin rotation report
 *
 * Helps plan certificate rotation by showing which pins need updating
 *
 * @returns Rotation planning information
 */
export function generateRotationReport(): {
  hostnames: string[];
  recommendations: string[];
  timeline: string[];
} {
  const recommendations: string[] = [];
  const timeline: string[] = [];

  Object.entries(CERTIFICATE_PINS).forEach(([hostname, pins]) => {
    if (pins.length < 2) {
      recommendations.push(
        `${hostname}: Add backup pin before certificate renewal`
      );
    }

    if (pins.length === 2) {
      recommendations.push(
        `${hostname}: Ready for rotation (2 pins configured)`
      );
      timeline.push(`1. Before renewal: Verify backup pin is correct`);
      timeline.push(`2. Deploy app update with both pins`);
      timeline.push(`3. Wait 1-2 weeks for users to update`);
      timeline.push(`4. Renew certificate on server`);
      timeline.push(`5. Monitor for pinning failures`);
      timeline.push(`6. After renewal: Remove old pin, add new backup`);
    }

    if (pins.length > 2) {
      recommendations.push(
        `${hostname}: Has ${pins.length} pins - consider cleanup`
      );
    }
  });

  return {
    hostnames: Object.keys(CERTIFICATE_PINS),
    recommendations,
    timeline,
  };
}

/**
 * Simulate certificate pinning validation
 *
 * Useful for testing pinning logic without making actual network requests
 *
 * @param pin - Pin to test
 * @param hostname - Hostname to test against
 * @returns true if pin matches any configured pin for hostname
 */
export function simulatePinValidation(pin: string, hostname: string): {
  valid: boolean;
  reason: string;
} {
  const configuredPins = CERTIFICATE_PINS[hostname];

  if (!configuredPins) {
    return {
      valid: false,
      reason: `No pins configured for hostname: ${hostname}`,
    };
  }

  if (!isValidPinFormat(pin)) {
    return {
      valid: false,
      reason: 'Invalid pin format (should be base64-encoded SHA-256)',
    };
  }

  const matches = configuredPins.some((configuredPin) =>
    comparePins(pin, configuredPin)
  );

  if (matches) {
    return {
      valid: true,
      reason: 'Pin matches configured pins',
    };
  }

  return {
    valid: false,
    reason: 'Pin does not match any configured pins (possible MITM attack)',
  };
}

/**
 * Development helper: Run all validations and print report
 */
export function runDevelopmentChecks(): void {
  if (process.env.NODE_ENV === 'development') {
    const report = validatePinConfiguration();
    printValidationReport(report);

    console.group('🔄 Certificate Rotation Planning');
    const rotation = generateRotationReport();
    console.log('Hostnames:', rotation.hostnames);
    console.log('\nRecommendations:');
    rotation.recommendations.forEach((rec) => console.log(`  - ${rec}`));
    if (rotation.timeline.length > 0) {
      console.log('\nRotation Timeline:');
      rotation.timeline.forEach((step) => console.log(`  ${step}`));
    }
    console.groupEnd();
  }
}
