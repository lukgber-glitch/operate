import { Injectable, Logger } from '@nestjs/common';
import { Permission } from './permissions';
import { Role, getPermissionsForRole, roleHasPermission, isRoleHigherOrEqual } from './roles';

/**
 * User context for RBAC checks
 * Matches the user object from JWT strategy
 */
export interface RbacUser {
  userId: string;
  email: string;
  orgId: string;
  role: string;
}

/**
 * RBAC Service
 * Provides permission checking and authorization logic
 */
@Injectable()
export class RbacService {
  private readonly logger = new Logger(RbacService.name);

  /**
   * Check if a user has a specific permission
   * @param user - User context from JWT
   * @param permission - Permission to check
   * @returns true if user has permission
   */
  hasPermission(user: RbacUser, permission: Permission): boolean {
    if (!user || !user.role) {
      this.logger.warn('Permission check failed: Invalid user context');
      return false;
    }

    try {
      const userRole = user.role as Role;
      const hasPermission = roleHasPermission(userRole, permission);

      this.logger.debug(
        `Permission check: ${user.email} (${userRole}) ${hasPermission ? 'HAS' : 'LACKS'} ${permission}`,
      );

      return hasPermission;
    } catch (error) {
      this.logger.error(
        `Error checking permission ${permission} for user ${user.email}`,
        error,
      );
      return false;
    }
  }

  /**
   * Check if user has ANY of the specified permissions
   * @param user - User context from JWT
   * @param permissions - Array of permissions to check
   * @returns true if user has at least one permission
   */
  hasAnyPermission(user: RbacUser, permissions: Permission[]): boolean {
    if (!permissions || permissions.length === 0) {
      return true;
    }

    return permissions.some((permission) => this.hasPermission(user, permission));
  }

  /**
   * Check if user has ALL of the specified permissions
   * @param user - User context from JWT
   * @param permissions - Array of permissions to check
   * @returns true if user has all permissions
   */
  hasAllPermissions(user: RbacUser, permissions: Permission[]): boolean {
    if (!permissions || permissions.length === 0) {
      return true;
    }

    return permissions.every((permission) => this.hasPermission(user, permission));
  }

  /**
   * Check if user has a specific role
   * @param user - User context from JWT
   * @param role - Role to check
   * @returns true if user has exact role
   */
  hasRole(user: RbacUser, role: Role): boolean {
    if (!user || !user.role) {
      this.logger.warn('Role check failed: Invalid user context');
      return false;
    }

    const hasRole = user.role === role;

    this.logger.debug(
      `Role check: ${user.email} ${hasRole ? 'IS' : 'IS NOT'} ${role}`,
    );

    return hasRole;
  }

  /**
   * Check if user has ANY of the specified roles
   * @param user - User context from JWT
   * @param roles - Array of roles to check
   * @returns true if user has at least one role
   */
  hasAnyRole(user: RbacUser, roles: Role[]): boolean {
    if (!roles || roles.length === 0) {
      return true;
    }

    return roles.some((role) => this.hasRole(user, role));
  }

  /**
   * Check if user's role is higher or equal to required role in hierarchy
   * @param user - User context from JWT
   * @param requiredRole - Minimum required role
   * @returns true if user's role is higher or equal
   */
  hasMinimumRole(user: RbacUser, requiredRole: Role): boolean {
    if (!user || !user.role) {
      this.logger.warn('Minimum role check failed: Invalid user context');
      return false;
    }

    try {
      const userRole = user.role as Role;
      const hasMinRole = isRoleHigherOrEqual(userRole, requiredRole);

      this.logger.debug(
        `Minimum role check: ${user.email} (${userRole}) ${hasMinRole ? 'MEETS' : 'FAILS'} minimum ${requiredRole}`,
      );

      return hasMinRole;
    } catch (error) {
      this.logger.error(
        `Error checking minimum role ${requiredRole} for user ${user.email}`,
        error,
      );
      return false;
    }
  }

  /**
   * Get all permissions for a user based on their role
   * @param user - User context from JWT
   * @returns Array of permissions
   */
  getUserPermissions(user: RbacUser): Permission[] {
    if (!user || !user.role) {
      this.logger.warn('Get permissions failed: Invalid user context');
      return [];
    }

    try {
      const userRole = user.role as Role;
      return getPermissionsForRole(userRole);
    } catch (error) {
      this.logger.error(`Error getting permissions for user ${user.email}`, error);
      return [];
    }
  }

  /**
   * Check if user belongs to a specific organisation
   * @param user - User context from JWT
   * @param orgId - Organisation ID to check
   * @returns true if user belongs to organisation
   */
  belongsToOrganisation(user: RbacUser, orgId: string): boolean {
    if (!user || !user.orgId) {
      this.logger.warn('Organisation check failed: Invalid user context');
      return false;
    }

    const belongs = user.orgId === orgId;

    this.logger.debug(
      `Organisation check: ${user.email} ${belongs ? 'BELONGS TO' : 'DOES NOT BELONG TO'} org ${orgId}`,
    );

    return belongs;
  }

  /**
   * Check if user can access a resource
   * Combines permission check with organisation check
   * @param user - User context from JWT
   * @param permission - Required permission
   * @param resourceOrgId - Organisation ID of the resource
   * @returns true if user can access resource
   */
  canAccessResource(
    user: RbacUser,
    permission: Permission,
    resourceOrgId: string,
  ): boolean {
    // Check if user belongs to the same organisation
    if (!this.belongsToOrganisation(user, resourceOrgId)) {
      this.logger.warn(
        `Access denied: ${user.email} tried to access resource from different org`,
      );
      return false;
    }

    // Check if user has required permission
    return this.hasPermission(user, permission);
  }

  /**
   * Check if user can perform action on resource owned by another user
   * Useful for actions like "edit own resource" vs "edit any resource"
   * @param user - User context from JWT
   * @param permission - Required permission
   * @param resourceUserId - User ID who owns the resource
   * @returns true if user can access resource
   */
  canAccessUserResource(
    user: RbacUser,
    permission: Permission,
    resourceUserId: string,
  ): boolean {
    // Users can always access their own resources (if they have base permission)
    if (user.userId === resourceUserId) {
      return this.hasPermission(user, permission);
    }

    // For other users' resources, need permission
    return this.hasPermission(user, permission);
  }

  /**
   * Log authorization attempt for audit purposes
   * @param user - User context
   * @param action - Action attempted
   * @param resource - Resource accessed
   * @param granted - Whether access was granted
   */
  logAuthorizationAttempt(
    user: RbacUser,
    action: string,
    resource: string,
    granted: boolean,
  ): void {
    const logLevel = granted ? 'debug' : 'warn';
    const status = granted ? 'GRANTED' : 'DENIED';

    this.logger[logLevel](
      `Authorization ${status}: ${user.email} (${user.role}) attempted ${action} on ${resource}`,
    );
  }
}
