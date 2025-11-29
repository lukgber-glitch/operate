/**
 * Row-Level Security (RLS) Helper Functions
 *
 * Utilities for managing PostgreSQL Row-Level Security context
 * in multi-tenant applications. These functions control which
 * organization's data is accessible in database queries.
 *
 * @module rls
 */

import { PrismaClient } from '@prisma/client';

/**
 * Sets the current organization context for Row-Level Security.
 *
 * All subsequent queries in the same database transaction will be
 * automatically filtered to only access data belonging to this organization.
 *
 * @param prisma - Prisma client instance
 * @param orgId - Organization UUID to set as current context
 *
 * @example
 * ```typescript
 * await setTenantContext(prisma, 'org-uuid-123');
 * // Now all queries will only see data for org-uuid-123
 * const memberships = await prisma.membership.findMany();
 * ```
 */
export async function setTenantContext(
  prisma: PrismaClient,
  orgId: string
): Promise<void> {
  await prisma.$executeRawUnsafe(
    `SELECT set_config('app.current_org_id', $1, true)`,
    orgId
  );
}

/**
 * Clears the current organization context.
 *
 * After calling this, queries will not have a tenant context set,
 * and RLS policies will block access to tenant-scoped tables
 * (unless bypass is enabled).
 *
 * @param prisma - Prisma client instance
 *
 * @example
 * ```typescript
 * await clearTenantContext(prisma);
 * // Queries will now be blocked by RLS policies
 * ```
 */
export async function clearTenantContext(
  prisma: PrismaClient
): Promise<void> {
  await prisma.$executeRawUnsafe(
    `SELECT set_config('app.current_org_id', NULL, true)`
  );
}

/**
 * Gets the current organization context.
 *
 * Returns the UUID of the currently set organization, or null if no context is set.
 *
 * @param prisma - Prisma client instance
 * @returns Organization UUID or null
 *
 * @example
 * ```typescript
 * const currentOrg = await getTenantContext(prisma);
 * console.log('Current org:', currentOrg); // 'org-uuid-123' or null
 * ```
 */
export async function getTenantContext(
  prisma: PrismaClient
): Promise<string | null> {
  const result = await prisma.$queryRawUnsafe<[{ current_setting: string | null }]>(
    `SELECT current_setting('app.current_org_id', true) as current_setting`
  );
  return result[0]?.current_setting || null;
}

/**
 * Enables RLS bypass mode for system operations.
 *
 * When bypass is enabled, RLS policies will not filter queries,
 * allowing access to all data across all organizations. This should
 * ONLY be used for administrative/system operations.
 *
 * WARNING: Use this with extreme caution. Bypass mode gives unrestricted
 * access to all tenant data. Always disable bypass after system operations.
 *
 * @param prisma - Prisma client instance
 *
 * @example
 * ```typescript
 * await enableRlsBypass(prisma);
 * // Can now query across all organizations
 * const allMemberships = await prisma.membership.findMany();
 * await disableRlsBypass(prisma); // Always disable after use!
 * ```
 */
export async function enableRlsBypass(
  prisma: PrismaClient
): Promise<void> {
  await prisma.$executeRawUnsafe(
    `SELECT set_config('app.bypass_rls', 'true', true)`
  );
}

/**
 * Disables RLS bypass mode, re-enabling tenant isolation.
 *
 * After calling this, RLS policies will resume filtering queries
 * based on the current tenant context.
 *
 * @param prisma - Prisma client instance
 *
 * @example
 * ```typescript
 * await disableRlsBypass(prisma);
 * // RLS policies are now active again
 * ```
 */
export async function disableRlsBypass(
  prisma: PrismaClient
): Promise<void> {
  await prisma.$executeRawUnsafe(
    `SELECT set_config('app.bypass_rls', 'false', true)`
  );
}

/**
 * Checks if RLS bypass is currently enabled.
 *
 * @param prisma - Prisma client instance
 * @returns true if bypass is enabled, false otherwise
 *
 * @example
 * ```typescript
 * const isBypassed = await isRlsBypassed(prisma);
 * if (isBypassed) {
 *   console.warn('RLS bypass is active!');
 * }
 * ```
 */
export async function isRlsBypassed(
  prisma: PrismaClient
): Promise<boolean> {
  const result = await prisma.$queryRawUnsafe<[{ current_setting: string | null }]>(
    `SELECT current_setting('app.bypass_rls', true) as current_setting`
  );
  return result[0]?.current_setting === 'true';
}

/**
 * Executes a callback function with a specific tenant context.
 *
 * Sets the tenant context, executes the callback, then restores
 * the previous context. Useful for performing operations on behalf
 * of a specific organization.
 *
 * @param prisma - Prisma client instance
 * @param orgId - Organization UUID to use for the operation
 * @param callback - Async function to execute with the tenant context
 * @returns Result of the callback function
 *
 * @example
 * ```typescript
 * const result = await withTenantContext(prisma, 'org-uuid-123', async () => {
 *   return await prisma.membership.count();
 * });
 * console.log('Memberships for org-uuid-123:', result);
 * ```
 */
export async function withTenantContext<T>(
  prisma: PrismaClient,
  orgId: string,
  callback: () => Promise<T>
): Promise<T> {
  const previousContext = await getTenantContext(prisma);

  try {
    await setTenantContext(prisma, orgId);
    return await callback();
  } finally {
    // Restore previous context
    if (previousContext) {
      await setTenantContext(prisma, previousContext);
    } else {
      await clearTenantContext(prisma);
    }
  }
}

/**
 * Executes a callback function with RLS bypass enabled.
 *
 * Enables RLS bypass, executes the callback, then restores the
 * previous bypass state. Useful for administrative operations that
 * need to access data across all tenants.
 *
 * WARNING: Use this with extreme caution. This grants unrestricted
 * access to all tenant data during the callback execution.
 *
 * @param prisma - Prisma client instance
 * @param callback - Async function to execute with bypass enabled
 * @returns Result of the callback function
 *
 * @example
 * ```typescript
 * const allOrgs = await withRlsBypass(prisma, async () => {
 *   return await prisma.organisation.findMany();
 * });
 * console.log('Total organizations:', allOrgs.length);
 * ```
 */
export async function withRlsBypass<T>(
  prisma: PrismaClient,
  callback: () => Promise<T>
): Promise<T> {
  const wasBypassed = await isRlsBypassed(prisma);

  try {
    await enableRlsBypass(prisma);
    return await callback();
  } finally {
    // Restore previous bypass state
    if (!wasBypassed) {
      await disableRlsBypass(prisma);
    }
  }
}

/**
 * RLS context management utilities namespace.
 *
 * Provides a convenient object grouping all RLS helper functions.
 */
export const RLS = {
  setTenantContext,
  clearTenantContext,
  getTenantContext,
  enableRlsBypass,
  disableRlsBypass,
  isRlsBypassed,
  withTenantContext,
  withRlsBypass,
} as const;
