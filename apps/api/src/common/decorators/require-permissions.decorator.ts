import { SetMetadata } from '@nestjs/common';
import { Permission } from '../../modules/auth/rbac/permissions';

export const REQUIRE_PERMISSIONS_KEY = 'requirePermissions';
export const REQUIRE_ALL_PERMISSIONS_KEY = 'requireAllPermissions';

/**
 * Decorator to require specific permissions for a route
 * By default, requires ANY of the specified permissions (OR logic)
 * Set requireAll: true to require ALL permissions (AND logic)
 *
 * Must be used with RbacGuard
 *
 * @param permissions - One or more permissions required
 * @param options - Configuration options
 *
 * @example
 * // Require ANY permission (OR logic - default)
 * @RequirePermissions(Permission.INVOICES_CREATE, Permission.INVOICES_UPDATE)
 * @Post('invoices')
 * createInvoice() {}
 *
 * @example
 * // Require ALL permissions (AND logic)
 * @RequirePermissions(
 *   Permission.INVOICES_CREATE,
 *   Permission.FINANCE_APPROVE,
 *   { requireAll: true }
 * )
 * @Post('invoices/approved')
 * createApprovedInvoice() {}
 *
 * @example
 * // Single permission
 * @RequirePermissions(Permission.FINANCE_CREATE)
 * @Post('invoices')
 * create() {}
 */
export const RequirePermissions = (
  ...args: (Permission | { requireAll?: boolean })[]
) => {
  // Parse arguments to separate permissions from options
  const lastArg = args[args.length - 1];
  const hasOptions =
    typeof lastArg === 'object' &&
    lastArg !== null &&
    'requireAll' in lastArg;

  const permissions = hasOptions
    ? (args.slice(0, -1) as Permission[])
    : (args as Permission[]);

  const options = hasOptions ? (lastArg as { requireAll?: boolean }) : {};
  const requireAll = options.requireAll ?? false;

  // Return decorator that sets metadata
  return (target: any, propertyKey?: string | symbol, descriptor?: PropertyDescriptor) => {
    if (propertyKey) {
      SetMetadata(REQUIRE_PERMISSIONS_KEY, permissions)(
        target,
        propertyKey,
        descriptor!,
      );
      SetMetadata(REQUIRE_ALL_PERMISSIONS_KEY, requireAll)(
        target,
        propertyKey,
        descriptor!,
      );
    } else {
      // Class-level decorator
      SetMetadata(REQUIRE_PERMISSIONS_KEY, permissions)(target);
      SetMetadata(REQUIRE_ALL_PERMISSIONS_KEY, requireAll)(target);
    }
  };
};

/**
 * Decorator to require ALL specified permissions (AND logic)
 * Convenience wrapper around RequirePermissions with requireAll: true
 *
 * @param permissions - All permissions required
 *
 * @example
 * @RequireAllPermissions(
 *   Permission.INVOICES_CREATE,
 *   Permission.FINANCE_APPROVE
 * )
 * @Post('invoices/approved')
 * createApprovedInvoice() {}
 */
export const RequireAllPermissions = (...permissions: Permission[]) => {
  return RequirePermissions(...permissions, { requireAll: true });
};

/**
 * Decorator to require ANY of the specified permissions (OR logic)
 * Alias for RequirePermissions for clarity
 *
 * @param permissions - Any permission required
 *
 * @example
 * @RequireAnyPermission(
 *   Permission.INVOICES_READ,
 *   Permission.EXPENSES_READ
 * )
 * @Get('financial-summary')
 * getSummary() {}
 */
export const RequireAnyPermission = (...permissions: Permission[]) => {
  return RequirePermissions(...permissions);
};
