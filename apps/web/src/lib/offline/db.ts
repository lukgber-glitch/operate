/**
 * IndexedDB Database Layer
 * Provides offline-first storage for critical entities
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';

// Database version - increment when schema changes
const DB_VERSION = 1;
const DB_NAME = 'operate-offline-db';

// Define our database schema
export interface OperateDB extends DBSchema {
  // Invoices store
  invoices: {
    key: string;
    value: {
      id: string;
      number: string;
      customerId?: string;
      customerName: string;
      customerEmail?: string;
      customerAddress?: {
        street?: string;
        city?: string;
        postalCode?: string;
        countryCode: string;
      };
      status: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED';
      issueDate: string;
      dueDate: string;
      subtotal: number;
      taxAmount: number;
      totalAmount: number;
      currency: string;
      notes?: string;
      items?: Array<{
        id: string;
        description: string;
        quantity: number;
        unitPrice: number;
        taxRate: number;
        amount: number;
      }>;
      createdAt: string;
      updatedAt: string;
      // Offline metadata
      _localVersion?: number;
      _lastSyncedAt?: string;
      _syncStatus?: 'synced' | 'pending' | 'failed';
    };
    indexes: {
      'by-status': string;
      'by-customer': string;
      'by-sync-status': string;
      'by-updated': string;
    };
  };

  // Expenses store
  expenses: {
    key: string;
    value: {
      id: string;
      number: string;
      categoryId?: string;
      category?: {
        id: string;
        name: string;
        color?: string;
      };
      vendorName: string;
      vendorEmail?: string;
      description: string;
      amount: number;
      taxAmount: number;
      totalAmount: number;
      currency: string;
      expenseDate: string;
      status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'PAID';
      receiptUrl?: string;
      approvedBy?: string;
      approvedAt?: string;
      rejectionReason?: string;
      createdAt: string;
      updatedAt: string;
      // Offline metadata
      _localVersion?: number;
      _lastSyncedAt?: string;
      _syncStatus?: 'synced' | 'pending' | 'failed';
    };
    indexes: {
      'by-status': string;
      'by-category': string;
      'by-sync-status': string;
      'by-updated': string;
    };
  };

  // Contacts/Clients store
  contacts: {
    key: string;
    value: {
      id: string;
      name: string;
      email?: string;
      phone?: string;
      type: 'CUSTOMER' | 'VENDOR' | 'BOTH';
      address?: {
        street?: string;
        city?: string;
        postalCode?: string;
        countryCode: string;
      };
      taxId?: string;
      notes?: string;
      createdAt: string;
      updatedAt: string;
      // Offline metadata
      _localVersion?: number;
      _lastSyncedAt?: string;
      _syncStatus?: 'synced' | 'pending' | 'failed';
    };
    indexes: {
      'by-type': string;
      'by-name': string;
      'by-sync-status': string;
      'by-updated': string;
    };
  };

  // Sync queue for mutations
  syncQueue: {
    key: string;
    value: {
      id: string;
      entityType: 'invoices' | 'expenses' | 'contacts';
      entityId: string;
      operation: 'create' | 'update' | 'delete';
      data?: any;
      timestamp: string;
      retryCount: number;
      lastError?: string;
      status: 'pending' | 'processing' | 'failed' | 'completed';
    };
    indexes: {
      'by-status': string;
      'by-timestamp': string;
      'by-entity': string;
    };
  };

  // Metadata store for sync tracking
  metadata: {
    key: string;
    value: {
      key: string;
      value: any;
      updatedAt: string;
    };
  };
}

// Singleton database instance
let dbInstance: IDBPDatabase<OperateDB> | null = null;

/**
 * Initialize and return the IndexedDB database
 */
export async function getDB(): Promise<IDBPDatabase<OperateDB>> {
  if (dbInstance) {
    return dbInstance;
  }

  dbInstance = await openDB<OperateDB>(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion, newVersion, transaction) {
      console.log(`Upgrading DB from version ${oldVersion} to ${newVersion}`);

      // Create invoices store
      if (!db.objectStoreNames.contains('invoices')) {
        const invoiceStore = db.createObjectStore('invoices', { keyPath: 'id' });
        invoiceStore.createIndex('by-status', 'status');
        invoiceStore.createIndex('by-customer', 'customerId');
        invoiceStore.createIndex('by-sync-status', '_syncStatus');
        invoiceStore.createIndex('by-updated', 'updatedAt');
      }

      // Create expenses store
      if (!db.objectStoreNames.contains('expenses')) {
        const expenseStore = db.createObjectStore('expenses', { keyPath: 'id' });
        expenseStore.createIndex('by-status', 'status');
        expenseStore.createIndex('by-category', 'categoryId');
        expenseStore.createIndex('by-sync-status', '_syncStatus');
        expenseStore.createIndex('by-updated', 'updatedAt');
      }

      // Create contacts store
      if (!db.objectStoreNames.contains('contacts')) {
        const contactStore = db.createObjectStore('contacts', { keyPath: 'id' });
        contactStore.createIndex('by-type', 'type');
        contactStore.createIndex('by-name', 'name');
        contactStore.createIndex('by-sync-status', '_syncStatus');
        contactStore.createIndex('by-updated', 'updatedAt');
      }

      // Create sync queue store
      if (!db.objectStoreNames.contains('syncQueue')) {
        const queueStore = db.createObjectStore('syncQueue', { keyPath: 'id' });
        queueStore.createIndex('by-status', 'status');
        queueStore.createIndex('by-timestamp', 'timestamp');
        queueStore.createIndex('by-entity', 'entityType');
      }

      // Create metadata store
      if (!db.objectStoreNames.contains('metadata')) {
        db.createObjectStore('metadata', { keyPath: 'key' });
      }
    },
  });

  return dbInstance;
}

/**
 * Close the database connection
 */
export function closeDB() {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}

/**
 * Clear all data from the database (use with caution!)
 */
export async function clearAllData() {
  const db = await getDB();
  const stores: Array<keyof OperateDB> = ['invoices', 'expenses', 'contacts', 'syncQueue', 'metadata'];

  const tx = db.transaction(stores, 'readwrite');
  await Promise.all([
    ...stores.map(store => tx.objectStore(store).clear()),
    tx.done,
  ]);
}

/**
 * Get database statistics
 */
export async function getDBStats() {
  const db = await getDB();

  const stats = {
    invoices: await db.count('invoices'),
    expenses: await db.count('expenses'),
    contacts: await db.count('contacts'),
    syncQueue: await db.count('syncQueue'),
    pendingSyncs: 0,
  };

  // Count pending sync items
  const queueItems = await db.getAllFromIndex('syncQueue', 'by-status', 'pending');
  stats.pendingSyncs = queueItems.length;

  return stats;
}

/**
 * Get last sync timestamp for an entity type
 */
export async function getLastSyncTime(entityType: string): Promise<Date | null> {
  const db = await getDB();
  const metadata = await db.get('metadata', `lastSync:${entityType}`);
  return metadata?.value ? new Date(metadata.value) : null;
}

/**
 * Set last sync timestamp for an entity type
 */
export async function setLastSyncTime(entityType: string, timestamp: Date) {
  const db = await getDB();
  await db.put('metadata', {
    key: `lastSync:${entityType}`,
    value: timestamp.toISOString(),
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Check if database is supported
 */
export function isIndexedDBSupported(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  return 'indexedDB' in window;
}
