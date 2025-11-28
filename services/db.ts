
const DB_NAME = 'NutriTrackDB';
const DB_VERSION = 1;

export const STORES = {
  USERS: 'users',
  LOGS: 'logs',
  WORKOUTS: 'workouts',
  BODY_CHECKS: 'body_checks',
  SAVED_FOODS: 'saved_foods',
  DAILY_STATS: 'daily_stats'
};

export const DB = {
  async getDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error("Database error:", request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onupgradeneeded = (e) => {
        const db = (e.target as IDBOpenDBRequest).result;

        const createStore = (name: string, keyPath: string, indices: string[] = []) => {
          if (!db.objectStoreNames.contains(name)) {
            const store = db.createObjectStore(name, { keyPath });
            indices.forEach(idx => store.createIndex(idx, idx, { unique: false }));
          }
        };

        // Schema Definition
        createStore(STORES.USERS, 'id');
        createStore(STORES.LOGS, 'id', ['userId', 'date']);
        createStore(STORES.WORKOUTS, 'id', ['userId', 'date']);
        createStore(STORES.BODY_CHECKS, 'id', ['userId', 'date']);
        createStore(STORES.SAVED_FOODS, 'id', ['userId']);
        createStore(STORES.DAILY_STATS, 'id', ['userId']); // ID will be userId_date
      };
    });
  },

  async getAll<T>(storeName: string, indexName?: string, indexValue?: string): Promise<T[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      
      let request;
      if (indexName && indexValue) {
        const index = store.index(indexName);
        request = index.getAll(indexValue);
      } else {
        request = store.getAll();
      }

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  async put<T>(storeName: string, data: T): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const request = store.put(data);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  async delete(storeName: string, id: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },
  
  async clear(storeName: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
};
