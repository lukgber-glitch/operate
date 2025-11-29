import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RbacService, RbacUser } from './rbac.service';
import { Permission } from './permissions';
import { Role } from './roles';
import {
  REQUIRE_PERMISSIONS_KEY,
  REQUIRE_ALL_PERMISSIONS_KEY,
} from '../../../common/decorators/require-permissions.decorator';
import {
  REQUIRE_ROLE_KEY,
  REQUIRE_ANY_ROLE_KEY,
  REQUIRE_MIN_ROLE_KEY,
} from '../../../common/decorators/require-role.decorator';
import { IS_PUBLIC_KEY } from '../../../common/decorators/public.decorator';

/**
 * RBAC Guard
 * Enforces role-based access control on routes
 *
 * This guard checks:
 * 1. If route is public (skip checks)
 * 2. If user has required permissions (via @RequirePermissions)
 * 3. If user has required role (via @RequireRole)
 *
 * Order of precedence:
 * 1. Public routes bypass all checks
 * 2. Permission checks take precedence over role checks
 * 3. If neither permission nor role decorators are present, allow access
 *
 * @example
 * // In controller
 * @UseGuards(JwtAuthGuard, RbacGuard)
 * @RequirePermissions(Permission.INVOICES_CREATE)
 * @Post('invoices')
 * createInvoice() {}
 */
@Injectable()
export class RbacGuard implements CanActivate {
  private readonly logger = new Logger(RbacGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly rbacService: RbacService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if route is public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    // Get user from request (set by JWT guard)
    const request = context.switchToHttp().getRequest();
    const user: RbacUser = request.user;

    if (!user) {
      this.logger.warn('RBAC Guard: No user found in request');
      throw new ForbiddenException('User not authenticated');
    }

    // Get required permissions from decorator
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(
      REQUIRE_PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    const requireAllPermissions = this.reflector.getAllAndOverride<boolean>(
      REQUIRE_ALL_PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Check permissions if specified
    if (requiredPermissions && requiredPermissions.length > 0) {
      const hasPermission = requireAllPermissions
        ? this.rbacService.hasAllPermissions(user, requiredPermissions)
        : this.rbacService.hasAnyPermission(user, requiredPermissions);

      if (!hasPermission) {
        this.logger.warn(
          `Access denied: ${user.email} lacks required permissions [${requiredPermissions.join(', ')}]`,
        );
        throw new ForbiddenException(
          `Insufficient permissions. Required: ${requiredPermissions.join(', ')}`,
        );
      }

      this.logger.debug(
        `Access granted: ${user.email} has required permissions`,
      );
      return true;
    }

    // Get required role from decorator
    const requiredRole = this.reflector.getAllAndOverride<Role>(
      REQUIRE_ROLE_KEY,
      [context.getHandler(), context.getClass()],
    );

    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(
      REQUIRE_ANY_ROLE_KEY,
      [context.getHandler(), context.getClass()],
    );

    const minimumRole = this.reflector.getAllAndOverride<Role>(
      REQUIRE_MIN_ROLE_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Check exact role if specified
    if (requiredRole) {
      const hasRole = this.rbacService.hasRole(user, requiredRole);

      if (!hasRole) {
        this.logger.warn(
          `Access denied: ${user.email} does not have role ${requiredRole}`,
        );
        throw new ForbiddenException(
          `Insufficient role. Required: ${requiredRole}`,
        );
      }

      this.logger.debug(`Access granted: ${user.email} has required role`);
      return true;
    }

    // Check any role if specified
    if (requiredRoles && requiredRoles.length > 0) {
      const hasAnyRole = this.rbacService.hasAnyRole(user, requiredRoles);

      if (!hasAnyRole) {
        this.logger.warn(
          `Access denied: ${user.email} does not have any of roles [${requiredRoles.join(', ')}]`,
        );
        throw new ForbiddenException(
          `Insufficient role. Required one of: ${requiredRoles.join(', ')}`,
        );
      }

      this.logger.debug(`Access granted: ${user.email} has one of required roles`);
      return true;
    }

    // Check minimum role if specified
    if (minimumRole) {
      const hasMinRole = this.rbacService.hasMinimumRole(user, minimumRole);

      if (!hasMinRole) {
        this.logger.warn(
          `Access denied: ${user.email} does not meet minimum role ${minimumRole}`,
        );
        throw new ForbiddenException(
          `Insufficient role. Minimum required: ${minimumRole}`,
        );
      }

      this.logger.debug(
        `Access granted: ${user.email} meets minimum role requirement`,
      );
      return true;
    }

    // No specific authorization requirements, allow access
    // (authentication already verified by JWT guard)
    return true;
  }
}
