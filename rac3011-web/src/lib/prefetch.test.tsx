import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { useIdlePrefetch, useNavPrefetch } from './prefetch';

function wrapper(client: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

describe('useNavPrefetch', () => {
  it('prefetches the matching query for a known nav destination', () => {
    const client = new QueryClient();
    const spy = vi.spyOn(client, 'prefetchQuery').mockResolvedValue(undefined);
    const { result } = renderHook(() => useNavPrefetch(), { wrapper: wrapper(client) });
    result.current('/map');
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ queryKey: ['public', 'clubs'] }));
  });

  it('is a no-op for a destination with no registered prefetch entry', () => {
    const client = new QueryClient();
    const spy = vi.spyOn(client, 'prefetchQuery').mockResolvedValue(undefined);
    const { result } = renderHook(() => useNavPrefetch(), { wrapper: wrapper(client) });
    result.current('/portal/login');
    expect(spy).not.toHaveBeenCalled();
  });
});

describe('useIdlePrefetch', () => {
  it('prefetches clubs and projects once ready, using the setTimeout fallback', async () => {
    const client = new QueryClient();
    const spy = vi.spyOn(client, 'prefetchQuery').mockResolvedValue(undefined);
    renderHook(() => useIdlePrefetch(true), { wrapper: wrapper(client) });
    await waitFor(() => expect(spy).toHaveBeenCalled());
    const keys = spy.mock.calls.map((call) => call[0]?.queryKey);
    expect(keys).toContainEqual(['public', 'clubs']);
    expect(keys.some((k) => Array.isArray(k) && k[0] === 'public' && k[1] === 'projects')).toBe(true);
  });

  it('does not prefetch while not ready', async () => {
    const client = new QueryClient();
    const spy = vi.spyOn(client, 'prefetchQuery').mockResolvedValue(undefined);
    renderHook(() => useIdlePrefetch(false), { wrapper: wrapper(client) });
    await new Promise((r) => setTimeout(r, 250));
    expect(spy).not.toHaveBeenCalled();
  });
});
