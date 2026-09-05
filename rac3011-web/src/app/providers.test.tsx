import { QueryClient, type Query } from '@tanstack/react-query';
import { createQueryClient, shouldPersistQuery } from './providers';

function fakeQuery(queryKey: unknown[], status: 'success' | 'error' | 'pending' = 'success'): Query {
  return { queryKey, state: { status } } as unknown as Query;
}

describe('createQueryClient', () => {
  it('applies the §14.6 defaults', () => {
    const client = createQueryClient();
    const defaults = client.getDefaultOptions().queries;
    expect(defaults?.staleTime).toBe(5 * 60_000);
    expect(defaults?.gcTime).toBe(24 * 60 * 60_000);
    expect(defaults?.refetchOnWindowFocus).toBe(false);
    expect(defaults?.retry).toBe(1);
  });

  it('returns a usable QueryClient instance', () => {
    expect(createQueryClient()).toBeInstanceOf(QueryClient);
  });
});

describe('shouldPersistQuery', () => {
  it('persists successful public queries', () => {
    expect(shouldPersistQuery(fakeQuery(['public', 'clubs']))).toBe(true);
  });

  it('never persists the live-visits poll', () => {
    expect(shouldPersistQuery(fakeQuery(['public', 'live']))).toBe(false);
  });

  it('never persists authenticated (non-public) queries', () => {
    expect(shouldPersistQuery(fakeQuery(['me']))).toBe(false);
    expect(shouldPersistQuery(fakeQuery(['reports', 'club-1']))).toBe(false);
  });

  it('never persists a query that has not succeeded', () => {
    expect(shouldPersistQuery(fakeQuery(['public', 'clubs'], 'pending'))).toBe(false);
    expect(shouldPersistQuery(fakeQuery(['public', 'clubs'], 'error'))).toBe(false);
  });
});
