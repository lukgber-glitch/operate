/**
 * Re-export role configuration from roles.ts for convenience
 * This file provides backward compatibility and a simplified import path
 *
 * @example
 * import { Role, RolePermissions } from './roles.config';
 * // or
 * import { Role, RolePermissions } from './roles';
 */

export {
  Role,
  ROLE_HIERARCHY,
  RolePermissions,
  getPermissionsForRole,
  roleHasPermission,
  isRoleHigherOrEqual,
  getRoleLevel,
  RoleMetadata,
} from './roles';
