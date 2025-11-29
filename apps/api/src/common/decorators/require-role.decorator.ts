import { SetMetadata } from '@nestjs/common';
import { Role } from '../../modules/auth/rbac/roles';

export const REQUIRE_ROLE_KEY = 'requireRole';
export const REQUIRE_ANY_ROLE_KEY = 'requireAnyRole';
export const REQUIRE_MIN_ROLE_KEY = 'requireMinRole';

/**
 * Decorator to require an exact role for a route
 * User must have this specific role (no hierarchy checking)
 *
 * Must be used with RbacGuard
 *
 * @param role - Exact role required
 *
 * @example
 * @RequireRole(Role.ADMIN)
 * @Delete('organisation')
 * deleteOrganisation() {}
 */
export const RequireRole = (role: Role) => {
  return SetMetadata(REQUIRE_ROLE_KEY, role);
};

/**
 * Decorator to require ANY of the specified roles
 * User must have at least one of the specified roles
 *
 * Must be used with RbacGuard
 *
 * @param roles - Array of acceptable roles
 *
 * @example
 * @RequireAnyRole(Role.ADMIN, Role.MANAGER)
 * @Post('approve-expense')
 * approveExpense() {}
 */
export const RequireAnyRole = (...roles: Role[]) => {
  return SetMetadata(REQUIRE_ANY_ROLE_KEY, roles);
};

/**
 * Decorator to require a minimum role level (hierarchy-based)
 * User's role must be equal to or higher than the specified role
 *
 * Role hierarchy (lowest to highest):
 * VIEWER < MEMBER < MANAGER < ADMIN < OWNER
 *
 * Must be used with RbacGuard
 *
 * @param role - Minimum role required
 *
 * @example
 * // Requires MANAGER, ADMIN, or OWNER
 * @RequireMinRole(Role.MANAGER)
 * @Post('approve-leave')
 * approveLeave() {}
 *
 * @example
 * // Requires ADMIN or OWNER
 * @RequireMinRole(Role.ADMIN)
 * @Put('organisation/settings')
 * updateSettings() {}
 */
export const RequireMinRole = (role: Role) => {
  return SetMetadata(REQUIRE_MIN_ROLE_KEY, role);
};

/**
 * Decorator to require OWNER role
 * Convenience wrapper for critical operations
 *
 * @example
 * @RequireOwner()
 * @Delete('organisation')
 * deleteOrganisation() {}
 */
export const RequireOwner = () => {
  return RequireRole(Role.OWNER);
};

/**
 * Decorator to require ADMIN or higher (ADMIN or OWNER)
 * Convenience wrapper for administrative operations
 *
 * @example
 * @RequireAdmin()
 * @Post('users/invite')
 * inviteUser() {}
 */
export const RequireAdmin = () => {
  return RequireMinRole(Role.ADMIN);
};

/**
 * Decorator to require MANAGER or higher (MANAGER, ADMIN, or OWNER)
 * Convenience wrapper for management operations
 *
 * @example
 * @RequireManager()
 * @Post('expenses/approve')
 * approveExpense() {}
 */
export const RequireManager = () => {
  return RequireMinRole(Role.MANAGER);
};
