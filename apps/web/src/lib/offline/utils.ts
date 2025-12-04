/**
 * Offline Utilities
 * Helper functions for common offline operations
 */

import { getDB } from './db';
import { addToSyncQueue, hasPendingSync } from './sync-queue';
import { EntityType } from './sync-queue';

/**
 * Check if an entity exists locally
 */
export async function entityExistsLocally(
  entityType: EntityType,
  entityId: string
): Promise<boolean> {
  try {
    const db = await getDB();
    const entity = await db.get(entityType, entityId);
    return !!entity;
  } catch (err) {
    console.error('Failed to check entity existence:', err);
    return false;
  }
}

/**
 * Get entity from local cache
 */
export async function getEntityFromCache<T>(
  entityType: EntityType,
  entityId: string
): Promise<T | null> {
  try {
    const db = await getDB();
    const entity = await db.get(entityType, entityId);
    return (entity as T) || null;
  } catch (err) {
    console.error('Failed to get entity from cache:', err);
    return null;
  }
}

/**
 * Check if entity is synced
 */
export async function isEntitySynced(
  entityType: EntityType,
  entityId: string
): Promise<boolean> {
  try {
    const entity = await getEntityFromCache<any>(entityType, entityId);
    if (!entity) return false;

    return (
      entity._syncStatus === 'synced' &&
      !(await hasPendingSync(entityType, entityId))
    );
  } catch (err) {
    console.error('Failed to check sync status:', err);
    return false;
  }
}

/**
 * Batch update entities in cache
 */
export async function batchUpdateCache<T extends { id: string }>(
  entityType: EntityType,
  entities: T[]
): Promise<void> {
  try {
    const db = await getDB();
    const tx = db.transaction(entityType, 'readwrite');

    const updates = entities.map(entity => ({
      ...entity,
      _lastSyncedAt: new Date().toISOString(),
      _syncStatus: 'synced' as const,
    }));

    await Promise.all([
      ...updates.map(entity => tx.store.put(entity)),
      tx.done,
    ]);
  } catch (err) {
    console.error('Failed to batch update cache:', err);
    throw err;
  }
}

/**
 * Remove entity from cache
 */
export async function removeFromCache(
  entityType: EntityType,
  entityId: string
): Promise<void> {
  try {
    const db = await getDB();
    await db.delete(entityType, entityId);
  } catch (err) {
    console.error('Failed to remove from cache:', err);
    throw err;
  }
}

/**
 * Get all entities with pending sync
 */
export async function getPendingEntities(
  entityType: EntityType
): Promise<any[]> {
  try {
    const db = await getDB();
    const entities = await db.getAllFromIndex(entityType, 'by-sync-status', 'pending');
    return entities;
  } catch (err) {
    console.error('Failed to get pending entities:', err);
    return [];
  }
}

/**
 * Get count of entities by status
 */
export async function getEntityCountByStatus(
  entityType: EntityType,
  status: string
): Promise<number> {
  try {
    const db = await getDB();
    const count = await db.countFromIndex(entityType, 'by-status', status);
    return count;
  } catch (err) {
    console.error('Failed to count entities:', err);
    return 0;
  }
}

/**
 * Check if any data is cached
 */
export async function hasAnyCachedData(): Promise<boolean> {
  try {
    const db = await getDB();
    const counts = await Promise.all([
      db.count('invoices'),
      db.count('expenses'),
      db.count('contacts'),
    ]);
    return counts.some(count => count > 0);
  } catch (err) {
    console.error('Failed to check cached data:', err);
    return false;
  }
}

/**
 * Get cache size estimate (in MB)
 */
export async function getCacheSizeEstimate(): Promise<number> {
  if (!('storage' in navigator && 'estimate' in navigator.storage)) {
    return 0;
  }

  try {
    const estimate = await navigator.storage.estimate();
    const usage = estimate.usage || 0;
    return Math.round((usage / 1024 / 1024) * 100) / 100; // MB
  } catch (err) {
    console.error('Failed to estimate cache size:', err);
    return 0;
  }
}

/**
 * Check if offline storage is nearly full
 */
export async function isStorageNearlyFull(threshold: number = 0.9): Promise<boolean> {
  if (!('storage' in navigator && 'estimate' in navigator.storage)) {
    return false;
  }

  try {
    const estimate = await navigator.storage.estimate();
    const usage = estimate.usage || 0;
    const quota = estimate.quota || Infinity;
    return usage / quota > threshold;
  } catch (err) {
    console.error('Failed to check storage:', err);
    return false;
  }
}

/**
 * Request persistent storage
 */
export async function requestPersistentStorage(): Promise<boolean> {
  if (!('storage' in navigator && 'persist' in navigator.storage)) {
    return false;
  }

  try {
    return await navigator.storage.persist();
  } catch (err) {
    console.error('Failed to request persistent storage:', err);
    return false;
  }
}

/**
 * Check if storage is persistent
 */
export async function isPersistentStorage(): Promise<boolean> {
  if (!('storage' in navigator && 'persisted' in navigator.storage)) {
    return false;
  }

  try {
    return await navigator.storage.persisted();
  } catch (err) {
    console.error('Failed to check persistent storage:', err);
    return false;
  }
}

/**
 * Register service worker sync
 */
export async function registerBackgroundSync(): Promise<void> {
  if (!('serviceWorker' in navigator) || !('sync' in ServiceWorkerRegistration.prototype)) {
    console.warn('Background sync not supported');
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.sync.register('sync-data');
    console.log('Background sync registered');
  } catch (err) {
    console.error('Failed to register background sync:', err);
  }
}

/**
 * Notify service worker of pending sync
 */
export async function notifyServiceWorkerOfSync(): Promise<void> {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    if (registration.active) {
      registration.active.postMessage({
        type: 'QUEUE_SYNC',
        timestamp: Date.now(),
      });
    }
  } catch (err) {
    console.error('Failed to notify service worker:', err);
  }
}

/**
 * Get offline capabilities
 */
export function getOfflineCapabilities() {
  return {
    indexedDB: 'indexedDB' in window,
    serviceWorker: 'serviceWorker' in navigator,
    backgroundSync:
      'serviceWorker' in navigator &&
      'sync' in ServiceWorkerRegistration.prototype,
    periodicSync:
      'serviceWorker' in navigator &&
      'periodicSync' in ServiceWorkerRegistration.prototype,
    persistentStorage:
      'storage' in navigator && 'persist' in navigator.storage,
  };
}

/**
 * Format sync status for display
 */
export function formatSyncStatus(
  status: 'synced' | 'pending' | 'failed' | undefined
): string {
  switch (status) {
    case 'synced':
      return 'Synced';
    case 'pending':
      return 'Pending sync';
    case 'failed':
      return 'Sync failed';
    default:
      return 'Unknown';
  }
}

/**
 * Format last synced time
 */
export function formatLastSynced(timestamp: string | undefined): string {
  if (!timestamp) return 'Never';

  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'Just now';
}
