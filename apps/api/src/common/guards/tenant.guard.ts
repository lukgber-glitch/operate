import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

export const SKIP_TENANT_KEY = 'skipTenant';

/**
 * Tenant Guard
 * Enforces tenant isolation by validating organizationId in requests
 *
 * This guard prevents cross-tenant data access by:
 * 1. Extracting the user's organizationId from the JWT token (set by JwtStrategy)
 * 2. Validating that any organizationId in request params/body/query matches the user's org
 * 3. Attaching orgId to the request for convenient service layer access
 *
 * CRITICAL SECURITY: This guard must be used on all authenticated routes that
 * access organization-scoped data. Failure to apply this guard could result in
 * data leakage between tenants.
 *
 * @example
 * // Apply globally in main.ts (recommended)
 * app.useGlobalGuards(new TenantGuard(reflector));
 *
 * @example
 * // Apply to specific controller
 * @UseGuards(JwtAuthGuard, TenantGuard)
 * @Controller('invoices')
 * export class InvoicesController {}
 *
 * @example
 * // Skip tenant check for admin routes
 * @SkipTenant()
 * @Get('admin/all-organizations')
 * getAllOrganizations() {}
 *
 * @example
 * // Access orgId in service
 * @Injectable()
 * export class InvoicesService {
 *   async findAll(@Request() req) {
 *     const orgId = req.orgId; // Injected by TenantGuard
 *     return this.prisma.invoice.findMany({ where: { organizationId: orgId } });
 *   }
 * }
 */
@Injectable()
export class TenantGuard implements CanActivate {
  private readonly logger = new Logger(TenantGuard.name);

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Check if route is public (skip tenant check)
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    // Check if route explicitly skips tenant check (admin routes)
    const skipTenant = this.reflector.getAllAndOverride<boolean>(
      SKIP_TENANT_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (skipTenant) {
      this.logger.debug('Skipping tenant check for admin route');
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // User must be authenticated (JwtAuthGuard should run first)
    if (!user) {
      this.logger.warn('TenantGuard: No user found in request');
      throw new ForbiddenException('Authentication required');
    }

    // User must have an organization context
    if (!user.orgId) {
      this.logger.warn(
        `TenantGuard: User ${user.email} has no organizationId in token`,
      );
      throw new ForbiddenException(
        'Organization context required. Please ensure you are logged in to an organization.',
      );
    }

    // Attach orgId to request for convenient service layer access
    request.orgId = user.orgId;

    // Validate organizationId in request matches user's organization
    const bodyOrgId = request.body?.organizationId;
    const paramsOrgId = request.params?.organizationId;
    const queryOrgId = request.query?.organizationId;

    // Check body organizationId
    if (bodyOrgId && bodyOrgId !== user.orgId) {
      this.logger.warn(
        `TenantGuard: Cross-tenant access attempt by ${user.email} - User org: ${user.orgId}, Requested org (body): ${bodyOrgId}`,
      );
      throw new ForbiddenException(
        'Cross-tenant access denied. You can only access data from your own organization.',
      );
    }

    // Check params organizationId
    if (paramsOrgId && paramsOrgId !== user.orgId) {
      this.logger.warn(
        `TenantGuard: Cross-tenant access attempt by ${user.email} - User org: ${user.orgId}, Requested org (params): ${paramsOrgId}`,
      );
      throw new ForbiddenException(
        'Cross-tenant access denied. You can only access data from your own organization.',
      );
    }

    // Check query organizationId
    if (queryOrgId && queryOrgId !== user.orgId) {
      this.logger.warn(
        `TenantGuard: Cross-tenant access attempt by ${user.email} - User org: ${user.orgId}, Requested org (query): ${queryOrgId}`,
      );
      throw new ForbiddenException(
        'Cross-tenant access denied. You can only access data from your own organization.',
      );
    }

    this.logger.debug(
      `TenantGuard: Access granted for ${user.email} to org ${user.orgId}`,
    );

    return true;
  }
}
