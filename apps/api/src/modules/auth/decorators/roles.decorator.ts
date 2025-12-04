import { SetMetadata } from '@nestjs/common';

/**
 * Metadata key for roles
 */
export const ROLES_KEY = 'roles';

/**
 * Roles Decorator
 * Specifies which roles are allowed to access a route
 *
 * @example
 * @Roles('ADMIN', 'OWNER')
 * @Get()
 * async getProtectedResource() {
 *   // Only ADMIN and OWNER can access
 * }
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
