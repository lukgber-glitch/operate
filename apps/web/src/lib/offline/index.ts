/**
 * Offline-First Data Layer
 * Entry point for offline functionality
 */

// Database
export {
  getDB,
  closeDB,
  clearAllData,
  getDBStats,
  getLastSyncTime,
  setLastSyncTime,
  isIndexedDBSupported,
  type OperateDB,
} from './db';

// Sync Queue
export {
  addToSyncQueue,
  getPendingSyncItems,
  getFailedSyncItems,
  markAsProcessing,
  markAsCompleted,
  markAsFailed,
  retryFailedItem,
  clearOldCompletedItems,
  getSyncQueueStats,
  processSyncQueue,
  clearSyncQueue,
  getSyncItemsForEntity,
  hasPendingSync,
  cancelPendingSync,
  type EntityType,
  type OperationType,
  type SyncStatus,
  type SyncQueueItem,
} from './sync-queue';

// Conflict Resolution
export {
  hasConflict,
  resolveConflict,
  applyManualResolution,
  getDefaultStrategy,
  canAutoResolve,
  type ConflictResolutionStrategy,
  type ConflictData,
  type ConflictResolution,
} from './conflict-resolver';
