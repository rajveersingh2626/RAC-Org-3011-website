import type { Persister } from '@tanstack/query-persist-client-core';

const STORAGE_KEY = 'rac3011.queryCache';

export function createLocalStoragePersister(storage: Storage = window.localStorage): Persister {
  return {
    persistClient: (client) => {
      try {
        storage.setItem(STORAGE_KEY, JSON.stringify(client));
      } catch {
        // storage full or unavailable (private browsing) - cache simply isn't persisted
      }
    },
    restoreClient: () => {
      const raw = storage.getItem(STORAGE_KEY);
      if (!raw) return undefined;
      try {
        return JSON.parse(raw);
      } catch {
        return undefined;
      }
    },
    removeClient: () => {
      storage.removeItem(STORAGE_KEY);
    },
  };
}
