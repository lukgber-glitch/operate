/**
 * Tenant Context Middleware for Prisma
 *
 * Automatically sets the PostgreSQL tenant context before each database
 * query to enforce Row-Level Security (RLS) policies. This ensures that
 * all queries are automatically scoped to the current organization.
 *
 * @module middleware/tenant-context
 */

import { Prisma, PrismaClient } from '@prisma/client';

import { setTenantContext } from '../rls';

/**
 * Configuration options for tenant context middleware.
 */
export interface TenantContextOptions {
  /**
   * Function that returns the current organization ID.
   * This can be synchronous or asynchronous.
   *
   * Common implementations:
   * - Read from AsyncLocalStorage (recommended for Node.js)
   * - Read from request context in Express/Fastify
   * - Read from thread-local storage
   *
   * @returns Organization UUID or null if no tenant context
   *
   * @example
   * ```typescript
   * // Using AsyncLocalStorage
   * const storage = new AsyncLocalStorage<{ orgId: string }>();
   * const getTenantId = () => storage.getStore()?.orgId || null;
   * ```
   */
  getTenantId: () => string | null | Promise<string | null>;

  /**
   * Whether to skip setting tenant context for certain operations.
   * Return true to skip setting context for this query.
   *
   * Useful for:
   * - System queries that need bypass
   * - Queries on non-tenant tables (User, Session, Organisation)
   * - Background jobs
   *
   * @param params - Prisma middleware parameters
   * @returns true to skip setting context, false to set it
   *
   * @example
   * ```typescript
   * // Skip for non-tenant tables
   * const shouldSkip = (params) => {
   *   return ['User', 'Session', 'Organisation'].includes(params.model || '');
   * };
   * ```
   */
  shouldSkip?: (params: Prisma.MiddlewareParams) => boolean | Promise<boolean>;

  /**
   * Whether to log tenant context operations.
   * Useful for debugging in development.
   *
   * @default false
   */
  debug?: boolean;
}

/**
 * Table names that are NOT tenant-scoped and don't require RLS context.
 * These tables don't have an orgId column and their access should be
 * controlled at the application layer.
 */
const NON_TENANT_TABLES = new Set([
  'User',
  'Session',
  'Organisation',
]);

/**
 * Creates a Prisma middleware that automatically sets tenant context
 * before each database query.
 *
 * This middleware should be registered on your Prisma client instance
 * using `prisma.$use()`. It will automatically call `setTenantContext`
 * before each query based on the current tenant ID provided by the
 * `getTenantId` function.
 *
 * @param options - Configuration options
 * @returns Prisma middleware function
 *
 * @example
 * ```typescript
 * // Using with AsyncLocalStorage
 * import { AsyncLocalStorage } from 'async_hooks';
 *
 * const tenantStorage = new AsyncLocalStorage<{ orgId: string }>();
 *
 * const middleware = createTenantContextMiddleware({
 *   getTenantId: () => tenantStorage.getStore()?.orgId || null,
 *   debug: process.env.NODE_ENV === 'development',
 * });
 *
 * prisma.$use(middleware);
 *
 * // In your route handler
 * app.get('/api/memberships', (req, res) => {
 *   tenantStorage.run({ orgId: req.user.currentOrgId }, async () => {
 *     const memberships = await prisma.membership.findMany();
 *     res.json(memberships); // Automatically filtered by RLS
 *   });
 * });
 * ```
 *
 * @example
 * ```typescript
 * // Using with Express middleware
 * const middleware = createTenantContextMiddleware({
 *   getTenantId: () => {
 *     // Assuming you store orgId in request context
 *     const store = asyncLocalStorage.getStore() as any;
 *     return store?.req?.user?.currentOrgId || null;
 *   },
 *   shouldSkip: (params) => {
 *     // Skip for non-tenant tables
 *     return NON_TENANT_TABLES.has(params.model || '');
 *   },
 * });
 *
 * prisma.$use(middleware);
 * ```
 */
export function createTenantContextMiddleware(
  options: TenantContextOptions,
  prisma: PrismaClient
): Prisma.Middleware {
  const { getTenantId, shouldSkip, debug = false } = options;

  return async (params: Prisma.MiddlewareParams, next) => {
    // Check if we should skip setting context for this query
    if (shouldSkip && await shouldSkip(params)) {
      if (debug) {
        console.log(`[RLS] Skipping tenant context for ${params.model}.${params.action}`);
      }
      return next(params);
    }

    // Skip setting context for non-tenant tables by default
    if (params.model && NON_TENANT_TABLES.has(params.model)) {
      if (debug) {
        console.log(`[RLS] Skipping non-tenant table: ${params.model}`);
      }
      return next(params);
    }

    // Get current tenant ID
    const tenantId = await getTenantId();

    // If no tenant ID, proceed without setting context
    // RLS policies will block access to tenant-scoped tables
    if (!tenantId) {
      if (debug) {
        console.warn(`[RLS] No tenant context for ${params.model}.${params.action}`);
      }
      return next(params);
    }

    // Set tenant context before query
    try {
      await setTenantContext(prisma, tenantId);

      if (debug) {
        console.log(`[RLS] Set tenant context: ${tenantId} for ${params.model}.${params.action}`);
      }

      return await next(params);
    } catch (error) {
      console.error('[RLS] Error setting tenant context:', error);
      throw error;
    }
  };
}

/**
 * Default tenant context middleware with sensible defaults.
 *
 * This middleware:
 * - Automatically skips non-tenant tables (User, Session, Organisation)
 * - Logs in development mode only
 * - Requires only a getTenantId function
 *
 * @param getTenantId - Function that returns current organization ID
 * @returns Configured Prisma middleware
 *
 * @example
 * ```typescript
 * import { AsyncLocalStorage } from 'async_hooks';
 *
 * const tenantStorage = new AsyncLocalStorage<{ orgId: string }>();
 *
 * prisma.$use(
 *   tenantContextMiddleware(() => tenantStorage.getStore()?.orgId || null)
 * );
 * ```
 */
export function tenantContextMiddleware(
  getTenantId: () => string | null | Promise<string | null>,
  prisma: PrismaClient
): Prisma.Middleware {
  return createTenantContextMiddleware({
    getTenantId,
    debug: process.env.NODE_ENV === 'development',
  }, prisma);
}

/**
 * Type guard to check if a Prisma model is tenant-scoped.
 *
 * @param modelName - Name of the Prisma model
 * @returns true if the model is tenant-scoped, false otherwise
 *
 * @example
 * ```typescript
 * if (isTenantScopedModel('Membership')) {
 *   console.log('This model requires tenant context');
 * }
 * ```
 */
export function isTenantScopedModel(modelName: string): boolean {
  return !NON_TENANT_TABLES.has(modelName);
}

/**
 * Exported constants for convenience.
 */
export { NON_TENANT_TABLES };
