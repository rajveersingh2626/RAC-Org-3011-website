import { createLocalStoragePersister } from './queryPersister';

function fakeStorage(): Storage {
  const map = new Map<string, string>();
  return {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => void map.set(key, value),
    removeItem: (key) => void map.delete(key),
    clear: () => map.clear(),
    key: () => null,
    get length() {
      return map.size;
    },
  };
}

const CLIENT = { timestamp: 1, buster: 'sha1', clientState: { queries: [], mutations: [] } };

describe('createLocalStoragePersister', () => {
  it('round-trips a persisted client through persistClient/restoreClient', async () => {
    const persister = createLocalStoragePersister(fakeStorage());
    await persister.persistClient(CLIENT);
    expect(await persister.restoreClient()).toEqual(CLIENT);
  });

  it('returns undefined when nothing has been persisted', async () => {
    const persister = createLocalStoragePersister(fakeStorage());
    expect(await persister.restoreClient()).toBeUndefined();
  });

  it('returns undefined for corrupt stored JSON instead of throwing', async () => {
    const storage = fakeStorage();
    storage.setItem('rac3011.queryCache', '{not json');
    const persister = createLocalStoragePersister(storage);
    expect(await persister.restoreClient()).toBeUndefined();
  });

  it('removeClient clears the stored entry', async () => {
    const storage = fakeStorage();
    const persister = createLocalStoragePersister(storage);
    await persister.persistClient(CLIENT);
    await persister.removeClient();
    expect(await persister.restoreClient()).toBeUndefined();
  });

  it('swallows a storage write failure instead of throwing', async () => {
    const storage = fakeStorage();
    storage.setItem = () => {
      throw new Error('quota exceeded');
    };
    const persister = createLocalStoragePersister(storage);
    expect(await persister.persistClient(CLIENT)).toBeUndefined();
  });
});
