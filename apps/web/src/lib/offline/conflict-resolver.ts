/**
 * Conflict Resolution Strategy
 * Handles conflicts when syncing offline changes with server
 */

export type ConflictResolutionStrategy =
  | 'server-wins'      // Server data always takes precedence
  | 'client-wins'      // Client data always takes precedence
  | 'last-write-wins'  // Most recent update wins (by timestamp)
  | 'merge'            // Attempt to merge non-conflicting fields
  | 'manual';          // Require manual resolution

export interface ConflictData<T = any> {
  entityType: string;
  entityId: string;
  localVersion: T;
  serverVersion: T;
  localUpdatedAt: string;
  serverUpdatedAt: string;
}

export interface ConflictResolution<T = any> {
  resolved: boolean;
  strategy: ConflictResolutionStrategy;
  result?: T;
  requiresManual?: boolean;
  conflicts?: Array<{
    field: string;
    localValue: any;
    serverValue: any;
  }>;
}

/**
 * Detect if there's a conflict between local and server versions
 */
export function hasConflict<T extends { updatedAt: string; _localVersion?: number }>(
  localData: T,
  serverData: T
): boolean {
  // No conflict if local version matches or is newer than server
  const localTime = new Date(localData.updatedAt).getTime();
  const serverTime = new Date(serverData.updatedAt).getTime();

  // If local and server timestamps are the same, no conflict
  if (localTime === serverTime) {
    return false;
  }

  // If local has a version number and it's been synced before
  if (localData._localVersion && localData._localVersion > 0) {
    // Check if server version is newer than our last known version
    return serverTime > localTime;
  }

  // By default, consider it a conflict if timestamps differ
  return true;
}

/**
 * Resolve conflict using the specified strategy
 */
export function resolveConflict<T>(
  conflict: ConflictData<T>,
  strategy: ConflictResolutionStrategy = 'server-wins'
): ConflictResolution<T> {
  switch (strategy) {
    case 'server-wins':
      return resolveServerWins(conflict);

    case 'client-wins':
      return resolveClientWins(conflict);

    case 'last-write-wins':
      return resolveLastWriteWins(conflict);

    case 'merge':
      return resolveMerge(conflict);

    case 'manual':
      return resolveManual(conflict);

    default:
      return resolveServerWins(conflict);
  }
}

/**
 * Server wins strategy - always use server data
 */
function resolveServerWins<T>(conflict: ConflictData<T>): ConflictResolution<T> {
  return {
    resolved: true,
    strategy: 'server-wins',
    result: conflict.serverVersion,
  };
}

/**
 * Client wins strategy - always use client data
 */
function resolveClientWins<T>(conflict: ConflictData<T>): ConflictResolution<T> {
  return {
    resolved: true,
    strategy: 'client-wins',
    result: conflict.localVersion,
  };
}

/**
 * Last write wins - use the most recently updated version
 */
function resolveLastWriteWins<T>(conflict: ConflictData<T>): ConflictResolution<T> {
  const localTime = new Date(conflict.localUpdatedAt).getTime();
  const serverTime = new Date(conflict.serverUpdatedAt).getTime();

  return {
    resolved: true,
    strategy: 'last-write-wins',
    result: serverTime > localTime ? conflict.serverVersion : conflict.localVersion,
  };
}

/**
 * Merge strategy - attempt to merge non-conflicting fields
 */
function resolveMerge<T>(conflict: ConflictData<T>): ConflictResolution<T> {
  const { localVersion, serverVersion } = conflict;

  // Can only merge objects
  if (
    typeof localVersion !== 'object' ||
    typeof serverVersion !== 'object' ||
    localVersion === null ||
    serverVersion === null
  ) {
    return resolveLastWriteWins(conflict);
  }

  const merged: any = { ...serverVersion };
  const conflicts: Array<{ field: string; localValue: any; serverValue: any }> = [];

  // Iterate through local fields
  for (const key in localVersion) {
    if (Object.prototype.hasOwnProperty.call(localVersion, key)) {
      const localValue = (localVersion as any)[key];
      const serverValue = (serverVersion as any)[key];

      // Skip metadata fields
      if (key.startsWith('_')) {
        continue;
      }

      // If values are different, record conflict
      if (JSON.stringify(localValue) !== JSON.stringify(serverValue)) {
        conflicts.push({
          field: key,
          localValue,
          serverValue,
        });

        // For simple merge, prefer non-empty/non-null values
        if (localValue != null && serverValue == null) {
          merged[key] = localValue;
        } else if (serverValue != null && localValue == null) {
          merged[key] = serverValue;
        }
        // Otherwise keep server value (server-wins for conflicts)
      }
    }
  }

  return {
    resolved: conflicts.length === 0,
    strategy: 'merge',
    result: merged as T,
    requiresManual: conflicts.length > 0,
    conflicts,
  };
}

/**
 * Manual resolution - flag for user intervention
 */
function resolveManual<T>(conflict: ConflictData<T>): ConflictResolution<T> {
  const localVersion = conflict.localVersion as any;
  const serverVersion = conflict.serverVersion as any;
  const conflicts: Array<{ field: string; localValue: any; serverValue: any }> = [];

  // Find all differing fields
  const allKeys = new Set([
    ...Object.keys(localVersion || {}),
    ...Object.keys(serverVersion || {}),
  ]);

  for (const key of allKeys) {
    if (key.startsWith('_')) continue;

    const localValue = localVersion?.[key];
    const serverValue = serverVersion?.[key];

    if (JSON.stringify(localValue) !== JSON.stringify(serverValue)) {
      conflicts.push({
        field: key,
        localValue,
        serverValue,
      });
    }
  }

  return {
    resolved: false,
    strategy: 'manual',
    requiresManual: true,
    conflicts,
  };
}

/**
 * Apply a manual resolution
 */
export function applyManualResolution<T>(
  conflict: ConflictData<T>,
  resolutions: Record<string, 'local' | 'server' | any>
): T {
  const result: any = { ...conflict.serverVersion };

  for (const [field, choice] of Object.entries(resolutions)) {
    if (choice === 'local') {
      result[field] = (conflict.localVersion as any)[field];
    } else if (choice === 'server') {
      result[field] = (conflict.serverVersion as any)[field];
    } else {
      result[field] = choice;
    }
  }

  return result as T;
}

/**
 * Get default resolution strategy based on entity type
 */
export function getDefaultStrategy(entityType: string): ConflictResolutionStrategy {
  // For financial data, prefer server wins to maintain consistency
  if (entityType === 'invoices' || entityType === 'expenses') {
    return 'server-wins';
  }

  // For contacts, try to merge
  if (entityType === 'contacts') {
    return 'merge';
  }

  // Default to server wins
  return 'server-wins';
}

/**
 * Check if a conflict can be auto-resolved
 */
export function canAutoResolve(
  resolution: ConflictResolution,
  strategy: ConflictResolutionStrategy
): boolean {
  if (strategy === 'manual') {
    return false;
  }

  if (strategy === 'merge' && resolution.requiresManual) {
    return false;
  }

  return resolution.resolved;
}
