import type { StorageAdapter } from '../core/types';

const DB_NAME = 'pyramid-curse';
const STORE = 'saves';
const KEY = 'progress';

export class IndexedDBStorage implements StorageAdapter {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private open(): Promise<IDBDatabase> {
    if (!this.dbPromise) {
      this.dbPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1);
        request.onupgradeneeded = () => {
          if (!request.result.objectStoreNames.contains(STORE)) {
            request.result.createObjectStore(STORE);
          }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    }
    return this.dbPromise;
  }

  async load(): Promise<string | null> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const request = tx.objectStore(STORE).get(KEY);
      request.onsuccess = () => resolve((request.result as string) ?? null);
      request.onerror = () => reject(request.error);
    });
  }

  async save(data: string): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(data, KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async clear(): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).delete(KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }
}

export class LocalStorageAdapter implements StorageAdapter {
  constructor(private readonly key = 'pyramid-curse-save') {}

  async load(): Promise<string | null> {
    return localStorage.getItem(this.key);
  }

  async save(data: string): Promise<void> {
    localStorage.setItem(this.key, data);
  }

  async clear(): Promise<void> {
    localStorage.removeItem(this.key);
  }
}

export function createStorage(): StorageAdapter {
  if (typeof indexedDB !== 'undefined') {
    return new IndexedDBStorage();
  }
  return new LocalStorageAdapter();
}