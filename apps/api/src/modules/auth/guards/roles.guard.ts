import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { Role } from '@operate/database';

/**
 * Roles Guard
 * Enforces role-based access control (RBAC)
 * Works in conjunction with @Roles() decorator
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Get required roles from decorator
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no roles are required, allow access
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // Get user from request
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Check if user exists and has a role
    if (!user || !user.role) {
      return false;
    }

    // Check if user's role is in the required roles list
    // Also handle special cases like 'ACCOUNTANT' which might not be in the Role enum
    return requiredRoles.some((role) => {
      // Direct role match
      if (user.role === role) {
        return true;
      }

      // Allow OWNER and ADMIN to access most resources
      if (user.role === Role.OWNER || user.role === Role.ADMIN) {
        return true;
      }

      return false;
    });
  }
}
