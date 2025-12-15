import * as crypto from 'crypto';

/**
 * SEC-017: Device Fingerprint Utility
 *
 * Creates a fingerprint from device characteristics to detect session hijacking.
 * Used to validate that the same device is using a session token.
 *
 * Components used:
 * - User-Agent: Browser/device identification
 * - Accept-Language: Browser language settings
 * - Accept-Encoding: Supported compression methods
 * - IP address prefix: Geographic consistency (first 3 octets)
 *
 * Note: This is NOT a unique device identifier but a consistency check.
 * Minor differences (IP changes on mobile) are tolerated.
 */

export interface DeviceFingerprintData {
  userAgent: string | undefined;
  acceptLanguage: string | undefined;
  acceptEncoding: string | undefined;
  ipPrefix: string | undefined;
}

/**
 * SEC-017: Extract device fingerprint data from request
 *
 * @param headers - Request headers
 * @param ip - Client IP address
 * @returns Device fingerprint data
 */
export function extractFingerprintData(
  headers: Record<string, string | string[] | undefined>,
  ip: string | undefined,
): DeviceFingerprintData {
  // Extract IP prefix (first 3 octets for IPv4, first 4 groups for IPv6)
  let ipPrefix: string | undefined;
  if (ip) {
    if (ip.includes('.')) {
      // IPv4
      const octets = ip.split('.');
      ipPrefix = octets.slice(0, 3).join('.');
    } else if (ip.includes(':')) {
      // IPv6
      const groups = ip.split(':');
      ipPrefix = groups.slice(0, 4).join(':');
    }
  }

  return {
    userAgent: headers['user-agent']?.toString(),
    acceptLanguage: headers['accept-language']?.toString(),
    acceptEncoding: headers['accept-encoding']?.toString(),
    ipPrefix,
  };
}

/**
 * SEC-017: Generate device fingerprint hash
 *
 * Creates a stable hash from device characteristics.
 * The hash is stored with the session to verify consistency.
 *
 * @param data - Device fingerprint data
 * @returns SHA-256 hash of fingerprint components
 */
export function generateFingerprint(data: DeviceFingerprintData): string {
  const components = [
    data.userAgent || '',
    data.acceptLanguage || '',
    // Note: IP prefix is NOT included in hash - too volatile for mobile users
    // Instead, we check it separately with tolerance
  ];

  const fingerprintString = components.join('|');
  return crypto.createHash('sha256').update(fingerprintString).digest('hex');
}

/**
 * SEC-017: Compare fingerprints with tolerance
 *
 * Compares current fingerprint against stored fingerprint.
 * Allows minor differences due to:
 * - IP changes (mobile networks, VPNs)
 * - Minor user-agent updates
 *
 * @param stored - Stored fingerprint from session
 * @param current - Current fingerprint from request
 * @param storedData - Stored fingerprint data
 * @param currentData - Current fingerprint data
 * @returns Object indicating match status and confidence
 */
export function compareFingerprintWithTolerance(
  stored: string,
  current: string,
  storedData?: DeviceFingerprintData,
  currentData?: DeviceFingerprintData,
): { match: boolean; confidence: 'high' | 'medium' | 'low' | 'none'; reason?: string } {
  // Exact match - high confidence
  if (stored === current) {
    // Additional IP prefix check for extra confidence
    if (storedData && currentData && storedData.ipPrefix && currentData.ipPrefix) {
      if (storedData.ipPrefix === currentData.ipPrefix) {
        return { match: true, confidence: 'high' };
      }
      // Same fingerprint but different IP - medium confidence (VPN, mobile)
      return { match: true, confidence: 'medium', reason: 'IP prefix changed' };
    }
    return { match: true, confidence: 'high' };
  }

  // Fingerprints don't match - check if it's suspicious
  if (storedData && currentData) {
    // If user-agent is completely different, it's likely a different device
    if (
      storedData.userAgent &&
      currentData.userAgent &&
      !areUserAgentsSimilar(storedData.userAgent, currentData.userAgent)
    ) {
      return {
        match: false,
        confidence: 'none',
        reason: 'User agent significantly different',
      };
    }

    // Minor changes might be browser updates - low confidence match
    return {
      match: true,
      confidence: 'low',
      reason: 'Minor fingerprint differences',
    };
  }

  // No stored data for comparison
  return { match: false, confidence: 'none', reason: 'No stored fingerprint data' };
}

/**
 * Check if two user agents are similar (same browser family)
 */
function areUserAgentsSimilar(ua1: string, ua2: string): boolean {
  // Extract browser family
  const getBrowserFamily = (ua: string): string => {
    if (ua.includes('Chrome') && !ua.includes('Edg')) return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari';
    if (ua.includes('Edg')) return 'Edge';
    if (ua.includes('Opera') || ua.includes('OPR')) return 'Opera';
    return 'Unknown';
  };

  // Extract OS family
  const getOsFamily = (ua: string): string => {
    if (ua.includes('Windows')) return 'Windows';
    if (ua.includes('Macintosh')) return 'Mac';
    if (ua.includes('Linux') && !ua.includes('Android')) return 'Linux';
    if (ua.includes('Android')) return 'Android';
    if (ua.includes('iPhone') || ua.includes('iPad')) return 'iOS';
    return 'Unknown';
  };

  return (
    getBrowserFamily(ua1) === getBrowserFamily(ua2) &&
    getOsFamily(ua1) === getOsFamily(ua2)
  );
}

/**
 * SEC-017: Validate session fingerprint
 *
 * Call this during token refresh or sensitive operations to validate
 * that the session is being used by the same device.
 *
 * @param storedFingerprint - Fingerprint hash stored with session
 * @param currentFingerprint - Current request fingerprint hash
 * @param threshold - Minimum confidence level required ('high' | 'medium' | 'low')
 * @returns True if fingerprint validation passes
 */
export function validateSessionFingerprint(
  storedFingerprint: string,
  currentFingerprint: string,
  threshold: 'high' | 'medium' | 'low' = 'low',
): boolean {
  const result = compareFingerprintWithTolerance(
    storedFingerprint,
    currentFingerprint,
  );

  if (!result.match) {
    return false;
  }

  const confidenceLevels = { high: 3, medium: 2, low: 1, none: 0 };
  return confidenceLevels[result.confidence] >= confidenceLevels[threshold];
}
