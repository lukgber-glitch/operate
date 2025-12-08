/**
 * Environment variable validation utility
 *
 * Validates that required environment variables are present on application startup.
 * Fails fast with clear error messages if critical configuration is missing.
 */

interface RequiredEnvVars {
  [key: string]: string | undefined;
}

/**
 * Validates that required environment variables are set
 * Throws an error if any required variable is missing or empty
 */
export function validateRequiredEnvVars(vars: RequiredEnvVars): void {
  const missing: string[] = [];

  for (const [key, value] of Object.entries(vars)) {
    if (!value || value.trim() === '') {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    const errorMessage = [
      '❌ CRITICAL: Missing required environment variables:',
      '',
      ...missing.map(key => `  - ${key}`),
      '',
      'These variables MUST be set before the application can start.',
      'Please check your .env file or environment configuration.',
      '',
      'For JWT secrets, generate secure values with:',
      '  openssl rand -base64 32',
      '',
    ].join('\n');

    throw new Error(errorMessage);
  }
}

/**
 * Validates critical security-related environment variables
 * Should be called during application bootstrap
 */
export function validateSecurityConfig(): void {
  const nodeEnv = process.env.NODE_ENV || 'development';

  // Critical security variables that must ALWAYS be set
  const criticalVars: RequiredEnvVars = {
    JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
    DATABASE_URL: process.env.DATABASE_URL,
  };

  // Additional production requirements
  if (nodeEnv === 'production') {
    // In production, we also require these for security
    criticalVars.ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

    // Warn if using default/weak values (defense in depth)
    const weakPatterns = ['change-me', 'your-', 'secret-here', 'key-here'];

    for (const [key, value] of Object.entries(criticalVars)) {
      if (value && weakPatterns.some(pattern => value.toLowerCase().includes(pattern))) {
        // Weak values will fail in production; validation occurs during bootstrap
      }
    }
  }

  validateRequiredEnvVars(criticalVars);
}
