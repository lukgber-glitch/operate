/**
 * RBAC Module - Main Exports
 * Convenient barrel export for all RBAC components
 *
 * @example
 * import { RbacModule, RbacService, Permission, Role } from '@/modules/auth/rbac';
 */

// Module and Service
export { RbacModule } from './rbac.module';
export { RbacService, RbacUser } from './rbac.service';
export { RbacGuard } from './rbac.guard';

// Permissions
export {
  Permission,
  PermissionMetadata,
  getPermissionsByCategory,
  isPermissionInCategory,
} from './permissions';

// Roles
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
