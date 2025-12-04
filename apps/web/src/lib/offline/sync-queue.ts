/**
 * Sync Queue Manager
 * Handles offline mutations and syncs them when online
 */

import { getDB, OperateDB } from './db';
import { v4 as uuidv4 } from 'uuid';

export type EntityType = 'invoices' | 'expenses' | 'contacts';
export type OperationType = 'create' | 'update' | 'delete';
export type SyncStatus = 'pending' | 'processing' | 'failed' | 'completed';

export interface SyncQueueItem {
  id: string;
  entityType: EntityType;
  entityId: string;
  operation: OperationType;
  data?: any;
  timestamp: string;
  retryCount: number;
  lastError?: string;
  status: SyncStatus;
}

/**
 * Add an item to the sync queue
 */
export async function addToSyncQueue(
  entityType: EntityType,
  entityId: string,
  operation: OperationType,
  data?: any
): Promise<string> {
  const db = await getDB();

  const item: SyncQueueItem = {
    id: uuidv4(),
    entityType,
    entityId,
    operation,
    data,
    timestamp: new Date().toISOString(),
    retryCount: 0,
    status: 'pending',
  };

  await db.add('syncQueue', item);
  console.log(`Added to sync queue: ${operation} ${entityType}/${entityId}`);

  return item.id;
}

/**
 * Get all pending sync items
 */
export async function getPendingSyncItems(): Promise<SyncQueueItem[]> {
  const db = await getDB();
  return db.getAllFromIndex('syncQueue', 'by-status', 'pending');
}

/**
 * Get failed sync items
 */
export async function getFailedSyncItems(): Promise<SyncQueueItem[]> {
  const db = await getDB();
  return db.getAllFromIndex('syncQueue', 'by-status', 'failed');
}

/**
 * Mark a sync item as processing
 */
export async function markAsProcessing(itemId: string): Promise<void> {
  const db = await getDB();
  const item = await db.get('syncQueue', itemId);

  if (item) {
    item.status = 'processing';
    await db.put('syncQueue', item);
  }
}

/**
 * Mark a sync item as completed
 */
export async function markAsCompleted(itemId: string): Promise<void> {
  const db = await getDB();
  const item = await db.get('syncQueue', itemId);

  if (item) {
    item.status = 'completed';
    await db.put('syncQueue', item);
  }
}

/**
 * Mark a sync item as failed
 */
export async function markAsFailed(itemId: string, error: string): Promise<void> {
  const db = await getDB();
  const item = await db.get('syncQueue', itemId);

  if (item) {
    item.status = 'failed';
    item.lastError = error;
    item.retryCount += 1;
    await db.put('syncQueue', item);
  }
}

/**
 * Retry a failed sync item
 */
export async function retryFailedItem(itemId: string): Promise<void> {
  const db = await getDB();
  const item = await db.get('syncQueue', itemId);

  if (item && item.status === 'failed') {
    item.status = 'pending';
    item.lastError = undefined;
    await db.put('syncQueue', item);
  }
}

/**
 * Clear completed sync items older than a certain date
 */
export async function clearOldCompletedItems(olderThanDays: number = 7): Promise<number> {
  const db = await getDB();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

  const completedItems = await db.getAllFromIndex('syncQueue', 'by-status', 'completed');
  const itemsToDelete = completedItems.filter(
    item => new Date(item.timestamp) < cutoffDate
  );

  const tx = db.transaction('syncQueue', 'readwrite');
  await Promise.all([
    ...itemsToDelete.map(item => tx.store.delete(item.id)),
    tx.done,
  ]);

  return itemsToDelete.length;
}

/**
 * Get sync queue statistics
 */
export async function getSyncQueueStats() {
  const db = await getDB();

  const [pending, processing, failed, completed] = await Promise.all([
    db.getAllFromIndex('syncQueue', 'by-status', 'pending'),
    db.getAllFromIndex('syncQueue', 'by-status', 'processing'),
    db.getAllFromIndex('syncQueue', 'by-status', 'failed'),
    db.getAllFromIndex('syncQueue', 'by-status', 'completed'),
  ]);

  return {
    pending: pending.length,
    processing: processing.length,
    failed: failed.length,
    completed: completed.length,
    total: pending.length + processing.length + failed.length + completed.length,
  };
}

/**
 * Process sync queue with a callback function
 */
export async function processSyncQueue(
  syncFunction: (item: SyncQueueItem) => Promise<void>,
  options: {
    maxRetries?: number;
    batchSize?: number;
    onProgress?: (completed: number, total: number) => void;
  } = {}
): Promise<{ succeeded: number; failed: number; skipped: number }> {
  const { maxRetries = 3, batchSize = 10, onProgress } = options;

  const pendingItems = await getPendingSyncItems();
  const sortedItems = pendingItems.sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  let succeeded = 0;
  let failed = 0;
  let skipped = 0;

  // Process in batches
  for (let i = 0; i < sortedItems.length; i += batchSize) {
    const batch = sortedItems.slice(i, i + batchSize);

    await Promise.allSettled(
      batch.map(async item => {
        // Skip if already exceeded max retries
        if (item.retryCount >= maxRetries) {
          skipped++;
          return;
        }

        try {
          await markAsProcessing(item.id);
          await syncFunction(item);
          await markAsCompleted(item.id);
          succeeded++;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          await markAsFailed(item.id, errorMessage);
          failed++;
          console.error(`Sync failed for ${item.entityType}/${item.entityId}:`, errorMessage);
        }

        if (onProgress) {
          onProgress(succeeded + failed + skipped, sortedItems.length);
        }
      })
    );
  }

  return { succeeded, failed, skipped };
}

/**
 * Clear all sync queue items
 */
export async function clearSyncQueue(): Promise<void> {
  const db = await getDB();
  await db.clear('syncQueue');
}

/**
 * Get sync items for a specific entity
 */
export async function getSyncItemsForEntity(
  entityType: EntityType,
  entityId: string
): Promise<SyncQueueItem[]> {
  const db = await getDB();
  const allItems = await db.getAllFromIndex('syncQueue', 'by-entity', entityType);
  return allItems.filter(item => item.entityId === entityId);
}

/**
 * Check if an entity has pending syncs
 */
export async function hasPendingSync(entityType: EntityType, entityId: string): Promise<boolean> {
  const items = await getSyncItemsForEntity(entityType, entityId);
  return items.some(item => item.status === 'pending' || item.status === 'processing');
}

/**
 * Cancel pending sync for an entity
 */
export async function cancelPendingSync(entityType: EntityType, entityId: string): Promise<number> {
  const items = await getSyncItemsForEntity(entityType, entityId);
  const pendingItems = items.filter(item => item.status === 'pending');

  const db = await getDB();
  const tx = db.transaction('syncQueue', 'readwrite');

  await Promise.all([
    ...pendingItems.map(item => tx.store.delete(item.id)),
    tx.done,
  ]);

  return pendingItems.length;
}
