import { SetMetadata } from '@nestjs/common';

/**
 * Metadata key for RequireMfa decorator
 */
export const REQUIRE_MFA_KEY = 'requireMfa';

/**
 * RequireMfa Decorator
 * Marks a route as requiring Multi-Factor Authentication
 *
 * Usage:
 * ```typescript
 * @UseGuards(JwtAuthGuard, MfaGuard)
 * @RequireMfa()
 * @Post('sensitive-operation')
 * async performSensitiveOperation() {
 *   // Only users with MFA enabled can access this
 * }
 * ```
 *
 * Security Considerations:
 * - Must be used with MfaGuard to take effect
 * - Requires JwtAuthGuard to be applied first for authentication
 * - Only allows access if user has MFA enabled in database
 *
 * Example Use Cases:
 * - Financial transactions
 * - Changing critical settings
 * - Accessing sensitive data
 * - Administrative operations
 * - User account deletion
 */
export const RequireMfa = () => SetMetadata(REQUIRE_MFA_KEY, true);
