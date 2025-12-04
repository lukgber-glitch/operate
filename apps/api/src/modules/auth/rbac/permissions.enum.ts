/**
 * Re-export permissions from permissions.ts for convenience
 * This file provides backward compatibility and a simplified import path
 *
 * @example
 * import { Permission } from './permissions.enum';
 * // or
 * import { Permission } from './permissions';
 */

export { Permission, PermissionMetadata, getPermissionsByCategory, isPermissionInCategory } from './permissions';
