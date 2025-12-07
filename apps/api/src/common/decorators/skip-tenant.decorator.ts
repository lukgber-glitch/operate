import { SetMetadata } from '@nestjs/common';

export const SKIP_TENANT_KEY = 'skipTenant';

/**
 * Decorator to skip tenant isolation check
 * Use this ONLY for admin routes that need to access data across organizations
 *
 * WARNING: This decorator bypasses critical security controls.
 * Only use when absolutely necessary and ensure proper authorization
 * checks are in place (e.g., RequireRole(Role.SUPER_ADMIN))
 *
 * @example
 * // Admin route that can view all organizations
 * @SkipTenant()
 * @RequireRole(Role.SUPER_ADMIN)
 * @Get('admin/organizations')
 * getAllOrganizations() {
 *   return this.organizationsService.findAll();
 * }
 *
 * @example
 * // System health check that doesn't need organization context
 * @Public()
 * @SkipTenant()
 * @Get('health')
 * healthCheck() {
 *   return { status: 'ok' };
 * }
 */
export const SkipTenant = () => SetMetadata(SKIP_TENANT_KEY, true);
